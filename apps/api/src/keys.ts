import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { encrypt } from './crypto.js';
import { db, DbApiKey } from './db.js';

const router = Router();

const addKeySchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'mistral', 'groq', 'ollama']),
  apiKey: z.string().min(1),
  label: z.string().optional(),
});

/** POST /api/v1/keys — store an encrypted API key */
router.post('/', (req: Request, res: Response) => {
  const parse = addKeySchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'validation_error', message: parse.error.message, code: 400 });
    return;
  }

  const { provider, apiKey, label } = parse.data;
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

  res.status(201).json({
    id: keyRecord.id,
    provider: keyRecord.provider,
    label: keyRecord.label,
    maskedKey: `sk-...${lastFour}`,
    active: keyRecord.active,
    createdAt: keyRecord.createdAt,
  });
});

/** GET /api/v1/keys — list keys with masked values */
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const keys = db.getKeysByUserId(userId);

  const masked = keys.map((k) => ({
    id: k.id,
    provider: k.provider,
    label: k.label,
    maskedKey: `sk-...${k.lastFour}`,
    active: k.active,
    createdAt: k.createdAt,
  }));

  res.status(200).json({ keys: masked });
});

/** POST /api/v1/keys/validate — validate an API key format */
router.post('/validate', (req: Request, res: Response) => {
  const { provider, apiKey } = req.body;

  if (!provider || !apiKey) {
    res
      .status(400)
      .json({ error: 'validation_error', message: 'provider and apiKey required', code: 400 });
    return;
  }

  // Basic format validation per provider
  const patterns: Record<string, RegExp> = {
    openai: /^sk-[a-zA-Z0-9_-]{20,}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9_-]{20,}$/,
    google: /^AI[a-zA-Z0-9_-]{20,}$/,
    mistral: /^[a-zA-Z0-9]{20,}$/,
    groq: /^gsk_[a-zA-Z0-9]{20,}$/,
  };

  const pattern = patterns[provider];
  if (pattern && !pattern.test(apiKey)) {
    res
      .status(400)
      .json({ error: 'invalid_key', message: `Invalid ${provider} API key format`, code: 400 });
    return;
  }

  res.status(200).json({ valid: true });
});

export const keysRouter = router;
