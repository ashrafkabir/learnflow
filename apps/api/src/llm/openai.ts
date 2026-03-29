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
 * MVP truth: LearnFlow is BYOAI-only in this build (no managed API keys).
 *
 * Enforcement:
 * - If request provides an apiKey override: use it.
 * - Else if user has an active OpenAI key stored: use it.
 * - Else: return null.
 */
export function getOpenAIForRequest(params: {
  userId: string;
  tier: 'free' | 'pro' | string;
  apiKeyOverride?: string;
}): OpenAiClientResult {
  const { userId, apiKeyOverride } = params;

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
      // fall through
    }
  }

  // Temporary: fall back to managed env key so BYOAI behaves the same as env in dev.
  // This keeps the UX working without requiring per-user key setup.
  const envKey = process.env.OPENAI_API_KEY;
  if (envKey && envKey.trim().length > 0) {
    return {
      client: new OpenAI({ apiKey: envKey.trim() }),
      source: { kind: 'managed_env' },
    };
  }

  return { client: null, source: { kind: 'none' } };
}
