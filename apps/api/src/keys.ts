import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { decrypt, encrypt } from './crypto.js';
import { db, DbApiKey } from './db.js';
import { sendError } from './errors.js';
import { validateBody, validateParams } from './validation.js';

const router = Router();

const PROVIDERS = ['openai', 'anthropic', 'google', 'mistral', 'groq', 'ollama', 'tavily'] as const;

const addKeySchema = z.object({
  provider: z.enum(PROVIDERS),
  apiKey: z.string().min(1),
  label: z.string().optional(),
  // When true, deactivate other keys for this provider and make this one active.
  activate: z.boolean().optional(),
});

const validateKeySchema = z.object({
  provider: z.enum(PROVIDERS),
  apiKey: z.string().min(1),
});

const validateSavedKeySchema = z.object({
  provider: z.enum(PROVIDERS),
});

const activateKeySchema = z.object({
  id: z.string().uuid(),
});

const rotateKeySchema = z.object({
  provider: z.enum(PROVIDERS),
  apiKey: z.string().min(1),
  label: z.string().optional(),
});

const deleteKeySchema = z.object({
  provider: z.enum(PROVIDERS),
});

/** POST /api/v1/keys — store an encrypted API key */
router.post('/', validateBody(addKeySchema), (req: Request, res: Response) => {
  const { provider, apiKey, label, activate } = req.body;
  const userId = req.user!.sub;

  const { encrypted, iv } = encrypt(apiKey);
  const lastFour = apiKey.slice(-4);

  const keyRecord: DbApiKey = {
    id: uuidv4(),
    userId,
    provider,
    encryptedKey: encrypted,
    iv,
    label: label || `${provider} key`,
    lastFour,
    active: activate !== false,
    rotatedAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  db.addApiKey(keyRecord);

  // Ensure exactly one active key per provider/user.
  if (keyRecord.active) db.activateApiKey({ userId, keyId: keyRecord.id });

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
    createdAt: keyRecord.createdAt,
  });
});

/** GET /api/v1/keys — list keys with masked values */
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const keys = db.getKeysByUserId(userId);

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
      createdAt: k.createdAt,
      rotatedAt: k.rotatedAt ? k.rotatedAt.toISOString() : undefined,
      usageCount,
      lastUsed: lastUsed ? lastUsed.toISOString() : undefined,
      validatedAt: k.validatedAt ? k.validatedAt.toISOString() : undefined,
      lastValidationStatus: k.lastValidationStatus || undefined,
      lastValidationError: k.lastValidationError || undefined,
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

/** POST /api/v1/keys/validate-saved — validate the active saved key for a provider (best-effort network call) */
router.post(
  '/validate-saved',
  validateBody(validateSavedKeySchema),
  async (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const provider = req.body.provider as (typeof PROVIDERS)[number];

    const keys = db.getKeysByUserId(userId);
    const active = keys.find((k) => k.active && k.provider === provider);
    if (!active) {
      sendError(res, req, {
        status: 404,
        code: 'not_found',
        message: 'No active key for provider',
      });
      return;
    }

    // Format validation first.
    try {
      // Provider ping requires plaintext. Decrypt server-side only.
      const plaintext = decrypt(active.encryptedKey, active.iv);

      // reuse existing format patterns
      const patterns: Record<(typeof PROVIDERS)[number], RegExp | null> = {
        openai: /^sk-[A-Za-z0-9_-]{20,}$/,
        anthropic: /^sk-ant-[A-Za-z0-9_-]{20,}$/,
        google: /^(AI|AIza)[A-Za-z0-9_-]{20,}$/,
        mistral: /^[A-Za-z0-9_-]{20,}$/,
        groq: /^gsk_[A-Za-z0-9_-]{20,}$/,
        ollama: null,
        tavily: null,
      };

      const pattern = patterns[provider];
      if (pattern && !pattern.test(plaintext)) {
        db.updateApiKeyValidation({
          userId,
          keyId: active.id,
          status: 'invalid',
          error: 'Invalid key format',
        });
        sendError(res, req, {
          status: 400,
          code: 'invalid_key',
          message: `Invalid ${provider} API key format`,
          details: { reason: 'format' },
        });
        return;
      }

      // Provider-specific ping (minimal, short timeout). Keep best-effort.
      // In tests, skip network validation for determinism.
      const startedAt = Date.now();
      const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITEST;

      if (!isTest && provider === 'openai') {
        const OpenAI = (await import('openai')).default;
        const client = new OpenAI({ apiKey: plaintext, timeout: 8000 } as any);
        // A tiny call: list models (or just retrieve a known model). Some environments restrict this.
        await client.models.list();
      }

      db.updateApiKeyValidation({ userId, keyId: active.id, status: 'valid' });
      res.status(200).json({
        ok: true,
        provider,
        validatedAt: new Date().toISOString(),
        ms: Date.now() - startedAt,
        networkValidated: !isTest && provider === 'openai',
      });
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : 'Validation failed';
      db.updateApiKeyValidation({ userId, keyId: active.id, status: 'invalid', error: msg });
      sendError(res, req, {
        status: 400,
        code: 'validation_failed',
        message: 'Failed to validate key with provider',
        details: { provider, error: msg },
      });
    }
  },
);

/** POST /api/v1/keys/activate — activate a specific key ID (deactivates other keys for provider) */
router.post('/activate', validateBody(activateKeySchema), (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const keyId = req.body.id;

  const key = db.findApiKeyById(keyId);
  if (!key || key.userId !== userId) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Key not found' });
    return;
  }

  db.activateApiKey({ userId, keyId });
  res.status(200).json({ ok: true });
});

/** POST /api/v1/keys/rotate — add a new key for a provider, set it active, and deactivate old keys */
router.post('/rotate', validateBody(rotateKeySchema), (req: Request, res: Response) => {
  const { provider, apiKey, label } = req.body;
  const userId = req.user!.sub;

  const { encrypted, iv } = encrypt(apiKey);
  const lastFour = apiKey.slice(-4);

  const keyRecord: DbApiKey = {
    id: uuidv4(),
    userId,
    provider,
    encryptedKey: encrypted,
    iv,
    label: label || `${provider} key`,
    lastFour,
    active: true,
    rotatedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  db.addApiKey(keyRecord);
  db.activateApiKey({ userId, keyId: keyRecord.id });

  res.status(201).json({ ok: true, id: keyRecord.id });
});

/** DELETE /api/v1/keys/:provider — delete all keys for a provider */
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

export const keysRouter = router;
