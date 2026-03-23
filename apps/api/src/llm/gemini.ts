import { getApiKeyForProvider, type ProviderClientResult } from './providers.js';

export type GeminiClient = { apiKey: string };

export function getGeminiForRequest(params: {
  userId: string;
  tier: 'free' | 'pro' | string;
  apiKeyOverride?: string;
}): ProviderClientResult<GeminiClient> {
  // Stored keys use provider "google" in this repo. Treat that as Gemini.
  const { apiKey, source } = getApiKeyForProvider({
    userId: params.userId,
    tier: params.tier,
    provider: 'google',
    apiKeyOverride: params.apiKeyOverride,
  });

  return {
    provider: 'google',
    source,
    client: apiKey ? { apiKey } : null,
  };
}
