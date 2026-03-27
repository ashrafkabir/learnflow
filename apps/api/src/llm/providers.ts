import OpenAI from 'openai';
import { db } from '../db.js';
import { decrypt } from '../crypto.js';
import type { KnownProvider } from '../lib/provider.js';

export type LlmKeySource =
  | { kind: 'user_key'; keyId?: string }
  | { kind: 'managed_env' }
  | { kind: 'request_override' }
  | { kind: 'none' };

export type ProviderClientResult<T> = {
  client: T | null;
  provider: KnownProvider;
  source: LlmKeySource;
};

export function getApiKeyForProvider(params: {
  userId: string;
  tier: 'free' | 'pro' | string;
  provider: KnownProvider;
  apiKeyOverride?: string;
}): { apiKey?: string; source: LlmKeySource } {
  const { userId, tier, provider, apiKeyOverride } = params;

  if (apiKeyOverride && apiKeyOverride.trim().length > 0) {
    return { apiKey: apiKeyOverride.trim(), source: { kind: 'request_override' } };
  }

  const keys = db.getKeysByUserId(userId);
  const active = keys.find((k) => k.active && k.provider === provider);
  if (active) {
    try {
      const apiKey = decrypt({
        encrypted: active.encryptedKey,
        iv: active.iv,
        tag: (active as any).tag,
        encVersion: (active as any).encVersion,
      });
      return { apiKey, source: { kind: 'user_key', keyId: active.id } };
    } catch {
      // fall through
    }
  }

  const envMap: Record<KnownProvider, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    google: process.env.GOOGLE_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
    groq: process.env.GROQ_API_KEY,
    ollama: undefined,
    tavily: process.env.TAVILY_API_KEY,
  };

  const envKey = envMap[provider];
  if (tier === 'pro' && envKey) {
    return { apiKey: envKey, source: { kind: 'managed_env' } };
  }

  return { apiKey: undefined, source: { kind: 'none' } };
}

export function getOpenAIClientForProvider(params: {
  userId: string;
  tier: 'free' | 'pro' | string;
  apiKeyOverride?: string;
}): ProviderClientResult<OpenAI> {
  const key = getApiKeyForProvider({ ...params, provider: 'openai' });
  return {
    provider: 'openai',
    source: key.source,
    client: key.apiKey ? new OpenAI({ apiKey: key.apiKey }) : null,
  };
}
