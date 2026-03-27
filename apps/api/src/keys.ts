import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { encrypt } from './crypto.js';
import { validateKeyWithProvider } from './llm/key-validation.js';
import { db, DbApiKey } from './db.js';
import { sendError } from './errors.js';
import { validateBody, validateParams } from './validation.js';

const router = Router();

const PROVIDERS = ['openai', 'anthropic', 'google', 'mistral', 'groq', 'ollama', 'tavily'] as const;

const addKeySchema = z.object({
  provider: z.enum(PROVIDERS),
  apiKey: z.string().min(1),
  label: z.string().optional(),
  validate: z.boolean().optional(),
  // Iter97: If true, this key becomes the sole active key for the provider.
  activate: z.boolean().optional(),
});

const validateKeySchema = z.object({
  provider: z.enum(PROVIDERS),
  apiKey: z.string().min(1),
});

const deleteKeySchema = z.object({
  provider: z.enum(PROVIDERS),
});

/** POST /api/v1/keys — store an encrypted API key */
router.post('/', validateBody(addKeySchema), async (req: Request, res: Response) => {
  const { provider, apiKey, label, validate, activate } = req.body;
  const userId = req.user!.sub;

  const { encrypted, iv, tag, encVersion } = encrypt(apiKey);
  const lastFour = apiKey.slice(-4);

  let validationStatus: 'unknown' | 'valid' | 'invalid' = 'unknown';
  let validatedAt: Date | undefined = undefined;

  // Iter85: validate-on-save for OpenAI + Anthropic (best-effort).
  // Keep validation permissive; never block saves on network failures.
  if (validate && (provider === 'openai' || provider === 'anthropic')) {
    try {
      const ok = await validateKeyWithProvider({ provider, apiKey });
      validationStatus = ok ? 'valid' : 'invalid';
      validatedAt = new Date();
    } catch {
      validationStatus = 'unknown';
      validatedAt = undefined;
    }
  }

  // Active-per-provider semantics: if activate=true, deactivate all other keys for this provider.
  if (activate) {
    db.deactivateKeysForProviderByUser(userId, provider);
  }

  const keyRecord: DbApiKey = {
    id: uuidv4(),
    userId,
    provider,
    encryptedKey: encrypted,
    iv,
    tag,
    encVersion,
    label: label || `${provider} key`,
    lastFour,
    active: true,
    validationStatus,
    validatedAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  db.addApiKey(keyRecord);

  const maskedPrefix =
    provider === 'anthropic'
      ? 'sk-ant-...'
      : provider === 'groq'
        ? 'gsk_...'
        : provider === 'google'
          ? 'AI...'
          : provider === 'tavily'
            ? 'tvly_...'
            : 'sk-...';

  res.status(201).json({
    id: keyRecord.id,
    provider: keyRecord.provider,
    label: keyRecord.label,
    maskedKey: `${maskedPrefix}${lastFour}`,
    active: keyRecord.active,
    validationStatus: keyRecord.validationStatus,
    validatedAt: keyRecord.validatedAt ? keyRecord.validatedAt.toISOString() : undefined,
    createdAt: keyRecord.createdAt,
  });
});

/** GET /api/v1/keys — list keys with masked values */
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const keys = db.getKeysByUserId(userId);

  // Iter97: Enforce active-per-provider semantics at read-time for legacy rows.
  // If multiple actives exist for a provider, keep most recently updated active.
  const byProvider: Record<string, DbApiKey[]> = {};
  for (const k of keys) {
    byProvider[k.provider] ||= [];
    byProvider[k.provider].push(k);
  }

  for (const provider of Object.keys(byProvider)) {
    const list = byProvider[provider];
    const actives = list.filter((k) => k.active);
    if (actives.length > 1) {
      const sorted = [...actives].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      const keep = sorted[0];
      for (const k of sorted.slice(1)) db.setApiKeyActive(k.id, false);
      // Update local copies so response matches DB update.
      for (const k of list) k.active = k.id === keep.id;
    }
  }

  const sinceMonth = new Date();
  sinceMonth.setDate(1);
  sinceMonth.setHours(0, 0, 0, 0);

  const usageCounts = db.getUsageCountByProviderSince(userId, sinceMonth);
  const lastUsedByProvider = db.getLastUsedByProvider(userId);

  const masked = keys.map((k) => {
    const maskedPrefix =
      k.provider === 'anthropic'
        ? 'sk-ant-...'
        : k.provider === 'groq'
          ? 'gsk_...'
          : k.provider === 'google'
            ? 'AI...'
            : k.provider === 'tavily'
              ? 'tvly_...'
              : 'sk-...';

    const usageCount = usageCounts.find((r) => r.provider === k.provider)?.count || 0;
    const lastUsed = lastUsedByProvider.find((r) => r.provider === k.provider)?.lastUsed;

    return {
      id: k.id,
      provider: k.provider,
      label: k.label,
      maskedKey: `${maskedPrefix}${k.lastFour}`,
      active: k.active,
      validationStatus: (k as any).validationStatus || 'unknown',
      validatedAt: (k as any).validatedAt ? (k as any).validatedAt.toISOString() : undefined,
      createdAt: k.createdAt,
      usageCount,
      lastUsed: lastUsed ? lastUsed.toISOString() : undefined,
    };
  });

  res.status(200).json({ keys: masked });
});

/** POST /api/v1/keys/validate — validate an API key format */
router.post('/validate', validateBody(validateKeySchema), (req: Request, res: Response) => {
  const { provider, apiKey } = req.body;

  // Format-only validation (no network call). Keep rules permissive to avoid rejecting valid keys.
  // If a provider changes key formats, this endpoint should err on "accept" and let real API calls fail.
  const patterns: Record<(typeof PROVIDERS)[number], RegExp | null> = {
    openai: /^sk-[A-Za-z0-9_-]{20,}$/,
    anthropic: /^sk-ant-[A-Za-z0-9_-]{20,}$/,
    google: /^(AI|AIza)[A-Za-z0-9_-]{20,}$/,
    // Mistral keys are typically long random strings; accept common token chars with reasonable length.
    mistral: /^[A-Za-z0-9_-]{20,}$/,
    groq: /^gsk_[A-Za-z0-9_-]{20,}$/,
    // Ollama is local; accept any non-empty string as "key" (often unused).
    ollama: null,
    // Tavily keys are opaque; accept any non-empty string.
    tavily: null,
  };

  const pattern = patterns[provider as (typeof PROVIDERS)[number]];
  if (pattern && !pattern.test(apiKey)) {
    sendError(res, req, {
      status: 400,
      code: 'invalid_key',
      message: `Invalid ${provider} API key format`,
      details: { reason: 'format' },
    });
    return;
  }

  res.status(200).json({ valid: true });
});

/** DELETE /api/v1/keys/:provider — delete a provider key */
router.delete('/:provider', validateParams(deleteKeySchema), (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const provider = req.params.provider as (typeof PROVIDERS)[number];

  const keys = db.getKeysByUserId(userId);
  const matches = keys.filter((k) => k.provider === provider);
  if (matches.length === 0) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Key not found' });
    return;
  }

  for (const k of matches) db.deleteApiKey(k.id);
  res.status(204).send();
});

/** POST /api/v1/keys/:id/activate — activate a specific key for its provider */
router.post(
  '/:id/activate',
  validateParams(z.object({ id: z.string().min(1) })),
  (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const id = String((req.params as any).id);

    const key = db.findApiKeyById(id);
    if (!key || key.userId !== userId) {
      sendError(res, req, { status: 404, code: 'not_found', message: 'Key not found' });
      return;
    }

    db.deactivateKeysForProviderByUser(userId, key.provider);
    db.setApiKeyActive(key.id, true);

    res.status(200).json({ id: key.id, provider: key.provider, active: true });
  },
);

export const keysRouter = router;
