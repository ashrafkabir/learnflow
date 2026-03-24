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

export type TavilyProviderErrorShape = {
  provider: 'tavily';
  kind: 'auth_error' | 'http_error' | 'unknown_error';
  statusCode?: number;
  message: string;
  envVar: 'TAVILY_API_KEY';
};

export class TavilyProviderError extends Error {
  provider = 'tavily' as const;
  kind: 'auth_error' | 'http_error' | 'unknown_error';
  statusCode?: number;
  envVar = 'TAVILY_API_KEY' as const;

  constructor(args: Omit<TavilyProviderErrorShape, 'provider' | 'envVar'>) {
    super(args.message);
    this.name = 'TavilyProviderError';
    this.kind = args.kind;
    this.statusCode = args.statusCode;
  }
}

function sanitizeText(s: unknown): string {
  if (!s) return '';
  return String(s).replace(/\s+/g, ' ').trim();
}

function extractStatusCode(err: any): number | undefined {
  const candidates = [err?.status, err?.statusCode, err?.response?.status, err?.cause?.status];
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c;
  }
  return undefined;
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
  } catch (err: any) {
    // Surface authentication issues as a structured error so callers can log clearly.
    // SECURITY: never include the api key value in errors.
    let statusCode = extractStatusCode(err);
    const rawMsg = sanitizeText(err?.message || err);
    const message = rawMsg || 'Tavily request failed';

    // Some SDKs don't expose status codes; infer common auth cases from message.
    if (!statusCode) {
      const m = message.toLowerCase();
      if (
        m.includes('unauthorized') ||
        m.includes('invalid api key') ||
        m.includes('missing api key')
      ) {
        statusCode = 401;
      } else if (m.includes('forbidden')) {
        statusCode = 403;
      }
    }

    const kind: TavilyProviderErrorShape['kind'] =
      statusCode === 401 || statusCode === 403
        ? 'auth_error'
        : statusCode
          ? 'http_error'
          : 'unknown_error';

    // Throw so the pipeline can log it and continue with fallback providers.
    throw new TavilyProviderError({ kind, statusCode, message });
  }
}
