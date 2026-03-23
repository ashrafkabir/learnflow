export const KNOWN_PROVIDERS = [
  'openai',
  'anthropic',
  'google',
  'mistral',
  'groq',
  'ollama',
  'tavily',
] as const;

export type KnownProvider = (typeof KNOWN_PROVIDERS)[number];

export function guessProviderFromKey(apiKey?: string): KnownProvider | 'unknown' {
  if (!apiKey) return 'unknown';
  if (apiKey.startsWith('sk-ant-')) return 'anthropic';
  if (apiKey.startsWith('gsk_')) return 'groq';
  if (apiKey.startsWith('AI') || apiKey.startsWith('AIza')) return 'google';
  if (apiKey.startsWith('sk-')) return 'openai';
  // Tavily keys do not have a stable public prefix; do not guess.
  // Others are hard to distinguish without metadata.
  return 'unknown';
}
