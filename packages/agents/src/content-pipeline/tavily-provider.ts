/**
 * Tavily Search Provider
 * https://docs.tavily.com/
 *
 * SECURITY:
 * - Never log API keys.
 * - Key is provided via env or injected by caller.
 */

export type TavilySearchResult = {
  title: string;
  url: string;
  content?: string;
  score?: number;
  raw_content?: string | null;
};

export type TavilySearchResponse = {
  query: string;
  follow_up_questions?: string[];
  answer?: string;
  images?: string[];
  results: TavilySearchResult[];
};

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

  const resp = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Tavily uses bearer token auth.
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      max_results: maxResults,
      include_answer: false,
      include_raw_content: false,
    }),
  });

  if (!resp.ok) {
    // best-effort: do not throw; keep pipeline resilient
    return [];
  }

  const data = (await resp.json()) as TavilySearchResponse;
  const results = Array.isArray(data?.results) ? data.results : [];

  return results
    .filter((r) => r && typeof r.url === 'string' && r.url.startsWith('http'))
    .map((r) => ({
      url: r.url,
      title: sanitizeText(r.title) || r.url,
      description: sanitizeText(r.content),
      source: 'tavily',
    }));
}
