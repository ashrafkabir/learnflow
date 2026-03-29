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
  courseId?: string;
  openai?: OpenAI;
  /** OpenAI model for the Responses call */
  model?: string;
  /** number of web results to request (per query, pre-aggregation) */
  maxResults?: number;
  /** cap number of pages to fetch+extract */
  maxPagesToExtract?: number;
  /** fetch timeout per page */
  pageTimeoutMs?: number;
  /** Back-compat alias used by API route */
  perPageTimeoutMs?: number;
  /** overall request timeout for OpenAI */
  openaiTimeoutMs?: number;
  /** retries on rate limit */
  maxRetries?: number;

  /** Expand topic into multiple queries/subtopics to reach higher source counts */
  maxSourcesToDiscover?: number;
  queryExpansionModel?: string;
  maxQueries?: number;

  /** Optional hook to persist full OpenAI req/resp for troubleshooting */
  onOpenAIWebSearch?: (args: { request: unknown; response: unknown }) => Promise<void> | void;
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
    const key = String(item.url).trim();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function bestEffortUrl(x: any): string | null {
  const url = x?.url || x?.link || x?.href;
  if (!url || typeof url !== 'string') return null;
  try {
    // normalize; allow relative-ish but only return if parseable
    return new URL(url).toString();
  } catch {
    try {
      // Some tool results return URLs without scheme
      return new URL(`https://${url}`).toString();
    } catch {
      return null;
    }
  }
}

function extractResultsFromResponse(
  resp: any,
): Array<{ url: string; title?: string; snippet?: string; source?: string }> {
  const results: Array<{ url: string; title?: string; snippet?: string; source?: string }> = [];

  // Responses API can emit tool calls/results in a few shapes.
  // We scan both resp.output[*].content[*] and resp.output[*] directly.
  const output = Array.isArray(resp?.output) ? resp.output : [];

  const pushResult = (r: any) => {
    const url = bestEffortUrl(r);
    if (!url) return;
    results.push({
      url,
      title: r?.title || r?.name,
      snippet: r?.snippet || r?.description || r?.content || r?.text,
      source: r?.source || r?.publisher || extractDomain(url),
    });
  };

  const scanContainer = (c: any) => {
    if (!c) return;

    // Common: { type: 'web_search', results: [...] } or { type: 'tool_result', results: [...] }
    const maybeArrays = [c?.results, c?.data, c?.items, c?.web_results, c?.webpages];
    for (const arr of maybeArrays) {
      if (Array.isArray(arr)) arr.forEach(pushResult);
    }

    // Newer Responses shapes often include citations as annotations on output_text.
    // Example: { type:'output_text', text:'...', annotations:[{type:'url_citation', title, url, ...}, ...] }
    if (Array.isArray(c?.annotations)) {
      for (const a of c.annotations) {
        if (a?.type === 'url_citation' && a?.url) {
          pushResult({ url: a.url, title: a.title, snippet: undefined, source: undefined });
        }
      }
    }

    // Sometimes nested: { result: { results: [...] } }
    if (c?.result) scanContainer(c.result);
    // Or: { results: { items: [...] } }
    if (c?.results && !Array.isArray(c.results)) scanContainer(c.results);
    // Or: { output: [...] }
    if (Array.isArray(c?.output)) c.output.forEach(scanContainer);
  };

  for (const item of output) {
    scanContainer(item);
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const c of content) scanContainer(c);
  }

  // Fallback: some SDK versions put tool outputs on resp.tool_outputs
  if (Array.isArray(resp?.tool_outputs)) {
    for (const t of resp.tool_outputs) scanContainer(t);
  }

  return uniqueByUrl(results);
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
  opts?: {
    onRequestResponse?: (args: { request: unknown; response: unknown }) => Promise<void> | void;
  },
): Promise<{
  results: Array<{ url: string; title?: string; snippet?: string; source?: string }>;
  rawCount: number;
  response: unknown;
  request: unknown;
}> {
  const input = `Find high-quality web sources about: ${topic}. Prefer authoritative and recent sources. Return up to ${maxResults} results.`;

  const request = {
    model,
    tools: [{ type: 'web_search' }],
    input,
  };

  let attempt = 0;
  while (true) {
    attempt += 1;
    try {
      const resp = await withTimeout(
        openai.responses.create(request as any),
        timeoutMs,
        'openai.web_search',
      );

      const extracted = extractResultsFromResponse(resp as any);
      const rawCount = extracted.length;
      const results = extracted.slice(0, Math.max(1, maxResults));

      if (opts?.onRequestResponse) {
        try {
          await opts.onRequestResponse({ request, response: resp });
        } catch {
          // ignore logging failures
        }
      }

      return { results, rawCount, response: resp, request };
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
  /** debugging/traceability */
  topics?: string[];
  queries?: string[];
  parsedResultsCount?: number;
  rawCount?: number;
}> {
  const {
    topic,
    courseId: _courseId,
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
    model = process.env.OPENAI_WEBSEARCH_MODEL || 'gpt-4.1-mini',
    maxResults = 8,
    maxPagesToExtract = 6,
    pageTimeoutMs: pageTimeoutMsRaw,
    perPageTimeoutMs,
    openaiTimeoutMs = 20_000,
    maxRetries = 2,
    maxSourcesToDiscover = 100,
    queryExpansionModel = 'o3',
    maxQueries = 8,
    onOpenAIWebSearch,
  } = params;

  const pageTimeoutMs = pageTimeoutMsRaw ?? perPageTimeoutMs ?? 12_000;

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
      topics: [topic],
      queries: [topic],
      parsedResultsCount: 1,
      rawCount: 1,
    };
  }

  // ── Query expansion (multi-pass) ───────────────────────────────────────────
  // Goal: discover up to maxSourcesToDiscover unique URLs (cap 100 default)
  // by expanding the topic into subtopics + queries and aggregating results.

  const topics: string[] = [];
  const queries: string[] = [];

  // Always include the base topic as a query.
  topics.push(topic);
  queries.push(topic);

  // Use model to expand into a few additional queries (best-effort).
  try {
    const expandResp = await withTimeout(
      openai.responses.create({
        model: queryExpansionModel,
        input:
          `Given the learning topic: "${topic}", generate a compact JSON object with two arrays:\n` +
          `- topics: 5-8 subtopics (short phrases)\n` +
          `- queries: 6-10 specific web search queries to find authoritative sources (include standards, vendor docs, academic/industry reports).\n` +
          `Return ONLY valid JSON.`,
      } as any),
      openaiTimeoutMs,
      'openai.query_expansion',
    );

    // crude JSON extraction from any output text
    const txt = JSON.stringify((expandResp as any)?.output ?? expandResp);
    const match = txt.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed?.topics)) {
        for (const t of parsed.topics) {
          const s = String(t || '').trim();
          if (s) topics.push(s);
        }
      }
      if (Array.isArray(parsed?.queries)) {
        for (const q of parsed.queries) {
          const s = String(q || '').trim();
          if (s) queries.push(s);
        }
      }
    }
  } catch {
    // ignore expansion errors
  }

  // de-dupe + cap queries
  const dedupedQueries = Array.from(new Set(queries.map((q) => q.trim()).filter(Boolean))).slice(
    0,
    Math.max(1, maxQueries),
  );

  let aggregated: Array<{ url: string; title?: string; snippet?: string; source?: string }> = [];
  let parsedResultsCount = 0;
  let rawCount = 0;

  for (const q of dedupedQueries) {
    try {
      const { results, rawCount: thisRaw } = await openaiWebSearch(
        openai,
        q,
        model,
        maxResults,
        openaiTimeoutMs,
        maxRetries,
        {
          onRequestResponse: onOpenAIWebSearch
            ? ({ request, response }) => onOpenAIWebSearch({ request, response })
            : undefined,
        },
      );
      rawCount += thisRaw;
      parsedResultsCount += results.length;
      aggregated = uniqueByUrl([...aggregated, ...results]);
      if (aggregated.length >= Math.min(100, maxSourcesToDiscover)) break;
    } catch {
      // keep going on individual query failures
      continue;
    }
  }

  const results = aggregated.slice(0, Math.min(100, maxSourcesToDiscover));

  if (results.length === 0) {
    return {
      topic,
      sources: [],
      sourcesMissingReason: 'openai_web_search_returned_0_results',
      topics: Array.from(new Set(topics.map((t) => t.trim()).filter(Boolean))).slice(0, 20),
      queries: dedupedQueries,
      parsedResultsCount,
      rawCount,
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

  return {
    topic,
    sources: uniqueByUrl(sources),
    topics: Array.from(new Set(topics.map((t) => t.trim()).filter(Boolean))).slice(0, 20),
    queries: dedupedQueries,
    parsedResultsCount,
    rawCount,
  };
}
