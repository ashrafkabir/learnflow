/**
 * Neutral research types.
 * MVP spec uses OpenAI web_search, but we keep these generic for future providers.
 */

// MVP guardrail: do not include paid/third-party crawl providers in the public provider union.
// Keep IDs limited to implementations we ship + allow in MVP.
export type ResearchProviderId = 'openai_web_search' | 'legacy_multi_source';

export interface SearchResult {
  url: string;
  title: string;
  snippet?: string;
  score?: number;
  source?: string;
}

export interface SourceRecord {
  url: string;
  title?: string;
  content?: string;
  extractedAt?: string;
  provider?: ResearchProviderId | string;
  metadata?: Record<string, unknown>;
}
