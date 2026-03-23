import OpenAI from 'openai';
import { db } from '../db.js';
import { decrypt } from '../crypto.js';

export type OpenAiClientSource =
  | { kind: 'user_key'; keyId?: string }
  | { kind: 'managed_env' }
  | { kind: 'request_override' }
  | { kind: 'none' };

export type OpenAiClientResult = {
  client: OpenAI | null;
  source: OpenAiClientSource;
};

/**
 * Get an OpenAI client for this request.
 *
 * Spec (Iter48+): Free tier uses BYOAI (per-user key). Pro may use managed keys.
 * MVP enforcement:
 * - If request provides an apiKey override: use it.
 * - Else if user has an active OpenAI key stored: use it.
 * - Else if tier is pro and OPENAI_API_KEY is set: use managed env key.
 * - Else: return null.
 */
export function getOpenAIForRequest(params: {
  userId: string;
  tier: 'free' | 'pro' | string;
  apiKeyOverride?: string;
}): OpenAiClientResult {
  const { userId, tier, apiKeyOverride } = params;

  if (apiKeyOverride && apiKeyOverride.trim().length > 0) {
    return {
      client: new OpenAI({ apiKey: apiKeyOverride.trim() }),
      source: { kind: 'request_override' },
    };
  }

  const keys = db.getKeysByUserId(userId);
  const activeOpenAiKey = keys.find((k) => k.active && k.provider === 'openai');

  if (activeOpenAiKey) {
    try {
      const apiKey = decrypt(activeOpenAiKey.encryptedKey, activeOpenAiKey.iv);
      return {
        client: new OpenAI({ apiKey }),
        source: { kind: 'user_key', keyId: activeOpenAiKey.id },
      };
    } catch {
      // fall through to managed env if allowed
    }
  }

  if (tier === 'pro' && process.env.OPENAI_API_KEY) {
    return {
      client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
      source: { kind: 'managed_env' },
    };
  }

  return { client: null, source: { kind: 'none' } };
}
