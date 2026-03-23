import { getApiKeyForProvider, type ProviderClientResult } from './providers.js';

// Minimal “client” placeholder so the rest of the server can route providers end-to-end
// without adding a network dependency in this iteration.
export type AnthropicClient = { apiKey: string };

export function getAnthropicForRequest(params: {
  userId: string;
  tier: 'free' | 'pro' | string;
  apiKeyOverride?: string;
}): ProviderClientResult<AnthropicClient> {
  const { apiKey, source } = getApiKeyForProvider({
    userId: params.userId,
    tier: params.tier,
    provider: 'anthropic',
    apiKeyOverride: params.apiKeyOverride,
  });

  return {
    provider: 'anthropic',
    source,
    client: apiKey ? { apiKey } : null,
  };
}
