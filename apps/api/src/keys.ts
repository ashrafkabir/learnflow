import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { encrypt } from './crypto.js';
import { db, DbApiKey } from './db.js';
import { sendError } from './errors.js';
import { validateBody, validateParams } from './validation.js';

const router = Router();

const PROVIDERS = ['openai', 'anthropic', 'google', 'mistral', 'groq', 'ollama', 'tavily'] as const;

const addKeySchema = z.object({
  provider: z.enum(PROVIDERS),
  apiKey: z.string().min(1),
  label: z.string().optional(),
});

const validateKeySchema = z.object({
  provider: z.enum(PROVIDERS),
  apiKey: z.string().min(1),
});

const deleteKeySchema = z.object({
  provider: z.enum(PROVIDERS),
});

/** POST /api/v1/keys — store an encrypted API key */
router.post('/', validateBody(addKeySchema), (req: Request, res: Response) => {
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

export const keysRouter = router;
