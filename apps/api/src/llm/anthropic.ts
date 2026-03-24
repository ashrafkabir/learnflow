import { getApiKeyForProvider, type ProviderClientResult } from './providers.js';

export type AnthropicMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type AnthropicCreateMessageParams = {
  model: string;
  max_tokens: number;
  temperature?: number;
  messages: AnthropicMessage[];
};

export type AnthropicCreateMessageResponse = {
  id: string;
  type: 'message';
  role: 'assistant';
  model: string;
  content: Array<{ type: 'text'; text: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
};

export class AnthropicClient {
  constructor(private apiKey: string) {}

  async messagesCreate(
    params: AnthropicCreateMessageParams,
  ): Promise<AnthropicCreateMessageResponse> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      const err = new Error(`anthropic_error_${res.status}${txt ? `: ${txt}` : ''}`);
      (err as any).status = res.status;
      throw err;
    }

    return (await res.json()) as AnthropicCreateMessageResponse;
  }
}

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
    client: apiKey ? new AnthropicClient(apiKey) : null,
  };
}

export function anthropicTextFromResponse(resp: AnthropicCreateMessageResponse): string {
  const parts = resp.content || [];
  return parts
    .filter((p) => p && p.type === 'text')
    .map((p) => p.text)
    .join('')
    .trim();
}
