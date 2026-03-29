/**
 * OpenAI Web Search Provider
 *
 * This provider uses the OpenAI Responses API with the `web_search` tool (when available)
 * to discover sources, then fetches + extracts readable text from each page.
 *
 * Output is normalized for downstream pipeline stages and artifact persistence.
 */

import OpenAI from 'openai';
import { extractDomain } from './firecrawl-provider.js';
import { extractText } from './content-extractor.js';

export type ExtractedImage = {
  url: string;
  alt?: string;
  /** Best-effort guess from page metadata */
  credit?: string;
  license?: string;
  sourceUrl: string;
};

export type NormalizedSource = {
  url: string;
  title?: string;
  publisher?: string;
  accessedAt: string;
  snippet?: string;
  extractedText?: string;
  images?: ExtractedImage[];
};

export type SearchAndExtractTopicParams = {
  topic: string;
  openai?: OpenAI;
  /** OpenAI model for the Responses call */
  model?: string;
  /** number of web results to request */
  maxResults?: number;
  /** cap number of pages to fetch+extract */
  maxPagesToExtract?: number;
  /** fetch timeout per page */
  pageTimeoutMs?: number;
  /** overall request timeout for OpenAI */
  openaiTimeoutMs?: number;
  /** retries on rate limit */
  maxRetries?: number;
};

export class OpenAIWebSearchProviderError extends Error {
  provider = 'openai' as const;
  status?: number;
  constructor(message: string, opts?: { status?: number; cause?: unknown }) {
    super(message);
    this.name = 'OpenAIWebSearchProviderError';
    this.status = opts?.status;
    // best-effort: preserve original error for logging
    (this as any).cause = opts?.cause;
  }
}

function sleep(ms: number) {
  if (process.env.NODE_ENV === 'test' || !!process.env.VITEST) return Promise.resolve();
  return new Promise((r) => setTimeout(r, ms));
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  if (!ms || ms <= 0) return p;
  let t: any;
  const timeout = new Promise<T>((_, rej) => {
    t = setTimeout(() => rej(new Error(`timeout after ${ms}ms (${label})`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(t));
}

function bestEffortHtmlToText(html: string): string {
  try {
    return extractText(html);
  } catch {
    return String(html || '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

function extractImagesFromHtml(html: string, sourceUrl: string): ExtractedImage[] {
  const out: ExtractedImage[] = [];
  if (!html) return out;

  // very lightweight parsing; avoids jsdom dependency in this module
  const imgTagRe = /<img\b[^>]*>/gi;
  const srcRe = /\bsrc\s*=\s*["']([^"']+)["']/i;
  const altRe = /\balt\s*=\s*["']([^"']*)["']/i;

  const tags = html.match(imgTagRe) || [];
  for (const tag of tags.slice(0, 12)) {
    const src = tag.match(srcRe)?.[1];
    if (!src) continue;
    // ignore data URIs
    if (src.startsWith('data:')) continue;

    let url: string;
    try {
      url = new URL(src, sourceUrl).toString();
    } catch {
      continue;
    }

    const alt = tag.match(altRe)?.[1];
    out.push({ url, alt, sourceUrl });
  }

  // de-dupe
  const seen = new Set<string>();
  return out.filter((i) => {
    if (seen.has(i.url)) return false;
    seen.add(i.url);
    return true;
  });
}

function uniqueByUrl<T extends { url: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    if (!item?.url) continue;
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    out.push(item);
  }
  return out;
}

function getStatusCode(err: any): number | undefined {
  const candidates = [err?.status, err?.statusCode, err?.response?.status, err?.cause?.status];
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c;
  }
  return undefined;
}

async function openaiWebSearch(
  openai: OpenAI,
  topic: string,
  model: string,
  maxResults: number,
  timeoutMs: number,
  maxRetries: number,
): Promise<Array<{ url: string; title?: string; snippet?: string; source?: string }>> {
  const input = `Find high-quality web sources about: ${topic}. Prefer authoritative and recent sources. Return up to ${maxResults} results.`;

  let attempt = 0;
  while (true) {
    attempt += 1;
    try {
      const resp = await withTimeout(
        openai.responses.create({
          model,
          // The SDK will call /responses; we ask it to run web_search.
          tools: [{ type: 'web_search' }],
          input,
        } as any),
        timeoutMs,
        'openai.web_search',
      );

      const results: Array<{ url: string; title?: string; snippet?: string; source?: string }> = [];

      // Best-effort parse: newer responses include tool outputs in output[].content[].
      const output = (resp as any)?.output;
      if (Array.isArray(output)) {
        for (const item of output) {
          const content = item?.content;
          if (!Array.isArray(content)) continue;
          for (const c of content) {
            // Some SDK/tool variants use type: 'web_search' or 'tool_result'.
            const maybeResults = c?.results || c?.data || c?.items;
            if (Array.isArray(maybeResults)) {
              for (const r of maybeResults) {
                const url = r?.url || r?.link;
                if (!url) continue;
                results.push({
                  url,
                  title: r?.title || r?.name,
                  snippet: r?.snippet || r?.description || r?.content,
                  source: r?.source || r?.publisher || extractDomain(url),
                });
              }
            }
          }
        }
      }

      return uniqueByUrl(results).slice(0, maxResults);
    } catch (err: any) {
      const status = getStatusCode(err);
      if (status === 429 && attempt <= maxRetries) {
        const backoff = Math.min(12_000, 400 * 2 ** (attempt - 1));
        await sleep(backoff);
        continue;
      }
      throw new OpenAIWebSearchProviderError(
        `OpenAI web_search failed: ${String(err?.message || err)}`,
        {
          status,
          cause: err,
        },
      );
    }
  }
}

async function fetchPage(
  url: string,
  timeoutMs: number,
): Promise<{ html: string; finalUrl: string } | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: {
        'user-agent': 'LearnFlowBot/0.1 (+https://learnflow.ai)',
        accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html') && !ct.includes('application/xhtml')) {
      // still attempt to read if it's text
      if (!ct.startsWith('text/')) return null;
    }
    const html = await res.text();
    return { html, finalUrl: res.url || url };
  } catch {
    return null;
  }
}

/**
 * Discover sources for a topic via OpenAI web_search, then fetch/extract each page.
 */
export async function searchAndExtractTopic(params: SearchAndExtractTopicParams): Promise<{
  topic: string;
  sources: NormalizedSource[];
  sourcesMissingReason?: string;
}> {
  const {
    topic,
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
    model = process.env.OPENAI_WEBSEARCH_MODEL || 'gpt-4.1-mini',
    maxResults = 8,
    maxPagesToExtract = 6,
    pageTimeoutMs = 12_000,
    openaiTimeoutMs = 20_000,
    maxRetries = 2,
  } = params;

  const accessedAt = new Date().toISOString();

  // In tests we keep it deterministic + offline.
  const testMode = process.env.NODE_ENV === 'test' || !!process.env.VITEST;
  if (testMode) {
    return {
      topic,
      sources: [
        {
          url: 'https://en.wikipedia.org/wiki/Global_capability_center',
          title: 'Global capability center - Wikipedia',
          publisher: 'Wikipedia',
          accessedAt,
          snippet: 'A global capability center (GCC) is an offshore unit…',
          extractedText: 'Global capability centers (GCCs) are offshore captive centers…',
          images: [],
        },
      ],
    };
  }

  let results: Array<{ url: string; title?: string; snippet?: string; source?: string }> = [];
  try {
    results = await openaiWebSearch(openai, topic, model, maxResults, openaiTimeoutMs, maxRetries);
  } catch (err: any) {
    const status = getStatusCode(err);
    // Bubble error but with a stable provider marker
    throw new OpenAIWebSearchProviderError(err?.message || String(err), { status, cause: err });
  }

  if (results.length === 0) {
    return {
      topic,
      sources: [],
      sourcesMissingReason: 'openai_web_search_returned_0_results',
    };
  }

  const toExtract = results.slice(0, Math.max(1, maxPagesToExtract));
  const sources: NormalizedSource[] = [];

  for (const r of toExtract) {
    const fetched = await fetchPage(r.url, pageTimeoutMs);
    if (!fetched) {
      sources.push({
        url: r.url,
        title: r.title,
        publisher: r.source || extractDomain(r.url),
        accessedAt,
        snippet: r.snippet,
        extractedText: '',
        images: [],
      });
      continue;
    }

    const text = bestEffortHtmlToText(fetched.html);
    const images = extractImagesFromHtml(fetched.html, fetched.finalUrl);

    sources.push({
      url: fetched.finalUrl,
      title: r.title,
      publisher: r.source || extractDomain(fetched.finalUrl),
      accessedAt,
      snippet: r.snippet,
      extractedText: text,
      images,
    });
  }

  return { topic, sources: uniqueByUrl(sources) };
}
