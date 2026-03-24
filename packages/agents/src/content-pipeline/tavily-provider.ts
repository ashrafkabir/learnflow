/**
 * Tavily Search Provider
 * https://docs.tavily.com/
 *
 * SECURITY:
 * - Never log API keys.
 * - Key is provided via env or injected by caller.
 */

import { tavily as tavilySdk } from '@tavily/core';

export type TavilyConfig = {
  apiKey?: string;
  maxResults?: number;
};

export type FirecrawlSearchResult = {
  url: string;
  title: string;
  description: string;
  source: string;
};

function sanitizeText(s: unknown): string {
  if (!s) return '';
  return String(s).replace(/\s+/g, ' ').trim();
}

/**
 * Search Tavily and map results into our FirecrawlSearchResult shape.
 */
export async function tavilySearch(
  query: string,
  config: TavilyConfig = {},
): Promise<FirecrawlSearchResult[]> {
  const apiKey = config.apiKey || process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  const maxResults = Math.max(1, Math.min(10, config.maxResults ?? 5));

  try {
    const tvly = tavilySdk({ apiKey });
    const resp: any = await tvly.search(query, {
      max_results: maxResults,
      include_answer: false,
      include_raw_content: false,
      include_images: false,
    });

    const results = Array.isArray(resp?.results) ? resp.results : [];
    return results
      .filter((r: any) => r && typeof r.url === 'string' && r.url.startsWith('http'))
      .map((r: any) => ({
        url: r.url,
        title: sanitizeText(r.title) || r.url,
        description: sanitizeText(r.content),
        source: 'tavily',
      }));
  } catch {
    // best-effort: do not throw; keep pipeline resilient
    return [];
  }
}
