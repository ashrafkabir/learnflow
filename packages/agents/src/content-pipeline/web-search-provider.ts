/**
 * Web Search Provider — Workflow B default.
 * - Uses OpenAI to generate a trending query set per course topic and targeted query sets per lesson.
 * - Executes multi-source search WITHOUT paid keys: Wikipedia Search API, arXiv API, GitHub repo search.
 * - Scrapes: Wikipedia summaries + Readability for HTML, arXiv abstracts (via /abs pages), GitHub README via raw.
 * - Deduplicates URLs, caches scraped pages, rate-limits per domain.
 */

// Re-export compatible types (shared across providers)
export type {
  FirecrawlSource,
  FirecrawlSearchResult,
  FirecrawlConfig,
} from './firecrawl-provider.js';

import type {
  FirecrawlSource,
  FirecrawlSearchResult,
  FirecrawlConfig,
} from './firecrawl-provider.js';

import {
  scoreCredibility,
  scoreRecency,
  scoreRelevance,
  extractDomain,
  formatCitations,
  synthesizeFromSources,
  checkDomainDiversity,
} from './firecrawl-provider.js';

export {
  scoreCredibility,
  scoreRecency,
  scoreRelevance,
  extractDomain,
  formatCitations,
  synthesizeFromSources,
  checkDomainDiversity,
};

import { createOpenAIQueryGenerator } from './trending-queries.js';
import {
  wikipediaSearch,
  wikipediaSummary,
  arxivSearch,
  githubRepoSearch,
  redditSearch,
  devtoSearch,
  hackerNewsSearch,
  mediumSearch,
  substackSearch,
  quoraSearch,
  theNewStackSearch,
  stackOverflowSearch,
  freeCodeCampSearch,
  towardsDataScienceSearch,
  digitalOceanSearch,
  mdnSearch,
  smashingMagSearch,
  courseraSearch,
  baiduScholarSearch,
  fetchAndScoreSources,
  clearScrapeCache,
  getScrapeCacheSize,
} from './source-fetchers.js';
import { tavilySearch } from './tavily-provider.js';

// Alias cache controls for existing tests/exports.
export function clearSourceCache(): void {
  clearScrapeCache();
}
export function getSourceCacheSize(): number {
  return getScrapeCacheSize();
}

function sleep(ms: number) {
  // Keep tests fast and deterministic.
  if (process.env.NODE_ENV === 'test' || !!process.env.VITEST) return Promise.resolve();
  return new Promise((r) => setTimeout(r, ms));
}

function uniqueByUrl<T extends { url: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    out.push(item);
  }
  return out;
}

function toSourcesFromSearchResults(
  results: FirecrawlSearchResult[],
  topic: string,
): FirecrawlSource[] {
  return results.map((r) => {
    const content = r.markdown || r.description || '';
    const domain = extractDomain(r.url);
    return {
      url: r.url,
      title: r.title,
      author: 'Unknown',
      publishDate: null,
      source: domain,
      content,
      credibilityScore: scoreCredibility(r.url),
      relevanceScore: scoreRelevance(`${r.title}\n${content}`, topic),
      recencyScore: 0.5,
      wordCount: content.split(/\s+/).filter(Boolean).length,
      domain,
    };
  });
}

export type WebSearchSourceId =
  | 'wikipedia'
  | 'arxiv'
  | 'github'
  | 'reddit'
  | 'medium'
  | 'substack'
  | 'quora'
  | 'thenewstack'
  | 'devto'
  | 'hackernews'
  | 'stackoverflow'
  | 'freecodecamp'
  | 'towardsdatascience'
  | 'digitalocean'
  | 'mdn'
  | 'smashingmag'
  | 'coursera'
  | 'baiduscholar'
  | 'tavily';

export type WebSearchConfig = {
  /** which providers are enabled */
  enabledSources?: Partial<Record<WebSearchSourceId, boolean>>;
  /** per-query limit cap */
  perQueryLimit?: number;
  /** stage-level caps */
  maxStage1Queries?: number;
  maxStage2Queries?: number;
  /** stage template overrides */
  stage1Templates?: string[];
  stage2Templates?: string[];
  /** cap returned sources per lesson */
  maxSourcesPerLesson?: number;
};

function isEnabled(
  id: WebSearchSourceId,
  enabledSources: Partial<Record<WebSearchSourceId, boolean>> | undefined,
): boolean {
  return enabledSources ? enabledSources[id] !== false : true;
}

async function multiSourceSearch(
  query: string,
  perSourceLimit = 5,
  enabledSources?: Partial<Record<WebSearchSourceId, boolean>>,
): Promise<FirecrawlSearchResult[]> {
  const half = Math.max(3, Math.floor(perSourceLimit / 2));
  const tasks: Array<Promise<FirecrawlSearchResult[]>> = [];

  if (isEnabled('wikipedia', enabledSources)) tasks.push(wikipediaSearch(query, perSourceLimit));
  if (isEnabled('arxiv', enabledSources)) tasks.push(arxivSearch(query, half));
  if (isEnabled('github', enabledSources)) tasks.push(githubRepoSearch(query, half));
  if (isEnabled('reddit', enabledSources)) tasks.push(redditSearch(query, 3));
  if (isEnabled('medium', enabledSources)) tasks.push(mediumSearch(query, 3));
  if (isEnabled('substack', enabledSources)) tasks.push(substackSearch(query, 3));
  if (isEnabled('quora', enabledSources)) tasks.push(quoraSearch(query, 2));
  if (isEnabled('thenewstack', enabledSources)) tasks.push(theNewStackSearch(query, 3));
  if (isEnabled('devto', enabledSources)) tasks.push(devtoSearch(query, 3));
  if (isEnabled('hackernews', enabledSources)) tasks.push(hackerNewsSearch(query, 3));
  if (isEnabled('stackoverflow', enabledSources)) tasks.push(stackOverflowSearch(query, 3));
  if (isEnabled('freecodecamp', enabledSources)) tasks.push(freeCodeCampSearch(query, 3));
  if (isEnabled('towardsdatascience', enabledSources))
    tasks.push(towardsDataScienceSearch(query, 2));
  if (isEnabled('digitalocean', enabledSources)) tasks.push(digitalOceanSearch(query, 2));
  if (isEnabled('mdn', enabledSources)) tasks.push(mdnSearch(query, 2));
  if (isEnabled('smashingmag', enabledSources)) tasks.push(smashingMagSearch(query, 2));
  if (isEnabled('coursera', enabledSources)) tasks.push(courseraSearch(query, 2));
  if (isEnabled('baiduscholar', enabledSources)) tasks.push(baiduScholarSearch(query, 2));
  if (isEnabled('tavily', enabledSources))
    tasks.push(tavilySearch(query, { maxResults: perSourceLimit }));

  const results = await Promise.all(tasks);
  return uniqueByUrl(results.flat());
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * searchSources is used by some older codepaths/tests.
 * Treat it as a lightweight multi-source search.
 */
export async function searchSources(
  topic: string,
  _config: Partial<FirecrawlConfig> = {},
): Promise<FirecrawlSearchResult[]> {
  const results = await multiSourceSearch(topic, 6, (_config as any)?.enabledSources);
  return results.slice(0, 12);
}

/**
 * Scrape a single URL into markdown-ish plain text.
 */
export async function scrapeUrl(
  url: string,
  _config: Partial<FirecrawlConfig> = {},
): Promise<{ markdown: string; title: string; author: string; publishDate: string | null }> {
  // scrapeWithReadability is used inside fetchAndScoreSources. Here we don't need metadata.
  const sources = await fetchAndScoreSources([{ url, title: url }], url, 1);
  const s = sources[0];
  return {
    markdown: s?.content || '',
    title: s?.title || '',
    author: s?.author || 'Unknown',
    publishDate: s?.publishDate || null,
  };
}

/**
 * crawlSourcesForTopic — fetch & scrape sources for a topic (used by tests + fallback).
 */
export async function crawlSourcesForTopic(
  topic: string,
  _config: Partial<FirecrawlConfig> = {},
): Promise<FirecrawlSource[]> {
  // Use a small trending query set (LLM if available; heuristic otherwise)
  const qg = createOpenAIQueryGenerator();
  const queries = await qg.generateTrendingQueries(topic);
  console.log(`[WebSearch] crawlSourcesForTopic("${topic}") queries:`, queries);

  const results: FirecrawlSearchResult[] = [];
  // Keep this bounded for API tests (avoid >60s end-to-end).
  // In production, we can increase breadth/depth.
  for (const q of queries.slice(0, 2)) {
    const batch = await multiSourceSearch(q, 4, (_config as any)?.enabledSources);
    results.push(...batch);
    await sleep(80);
  }

  const unique = uniqueByUrl(results);
  // Scrape top N URLs
  const urls = unique.slice(0, 10).map((r) => ({ url: r.url, title: r.title }));
  const scraped = await fetchAndScoreSources(urls, topic, 8);
  console.log(`[WebSearch] crawlSourcesForTopic scraped ${scraped.length} sources`);
  return scraped;
}

/**
 * Bulk research for a topic — Stage 1.
 * Generates 6-10 trending queries via OpenAI, then searches across Wikipedia/arXiv/GitHub.
 * Returns lightweight sources (search result descriptions + Wikipedia summary) for planning.
 */
export async function searchTopicTrending(
  topic: string,
  _config: Partial<FirecrawlConfig> = {},
): Promise<FirecrawlSource[]> {
  console.log(`[WebSearch] Stage 1: Bulk research for "${topic}"`);

  const qg = createOpenAIQueryGenerator();
  const cfg = _config as any as WebSearchConfig;

  const templateQueries = Array.isArray(cfg?.stage1Templates)
    ? cfg.stage1Templates
        .map((t) => String(t || '').trim())
        .filter(Boolean)
        .map((t) => t.replaceAll('{courseTopic}', topic))
    : [];

  const generated = await qg.generateTrendingQueries(topic);
  const queries = Array.from(
    new Set([...templateQueries, ...generated].map((q) => q.trim())),
  ).filter(Boolean);

  const maxStage1Queries = Math.max(1, Math.min(20, cfg?.maxStage1Queries ?? 10));
  const finalQueries = queries.slice(0, maxStage1Queries);
  console.log('[WebSearch] Generated trending queries:', finalQueries);

  const allResults: FirecrawlSearchResult[] = [];
  const perQueryLimit = Math.max(1, Math.min(10, cfg?.perQueryLimit ?? 5));

  for (const q of finalQueries) {
    const res = await multiSourceSearch(q, perQueryLimit, cfg?.enabledSources);
    console.log(`[WebSearch] Query "${q}" -> ${res.length} results`);
    allResults.push(...res);
    await sleep(150);
  }

  const uniqueResults = uniqueByUrl(allResults);
  console.log(`[WebSearch] Stage 1 unique results: ${uniqueResults.length}`);

  // Add a Wikipedia summary as a high-signal primer
  const summary = await wikipediaSummary(topic);
  const sources: FirecrawlSource[] = [];

  if (summary) {
    sources.push({
      url: summary.url,
      title: summary.title,
      author: 'Wikipedia',
      publishDate: null,
      source: 'en.wikipedia.org',
      content: summary.extract,
      credibilityScore: 0.72,
      relevanceScore: 1.0,
      recencyScore: 0.5,
      wordCount: summary.extract.split(/\s+/).filter(Boolean).length,
      domain: 'en.wikipedia.org',
    });
  }

  sources.push(...toSourcesFromSearchResults(uniqueResults, topic));

  // Sort by combined score and keep a sane cap
  sources.sort((a, b) => {
    const sa = (a.credibilityScore + a.relevanceScore + a.recencyScore) / 3;
    const sb = (b.credibilityScore + b.relevanceScore + b.recencyScore) / 3;
    return sb - sa;
  });

  const capped = uniqueByUrl(sources).slice(0, 30);
  console.log(`[WebSearch] Stage 1 returning ${capped.length} sources`);
  return capped;
}

/**
 * Search and scrape for a specific lesson — Stage 2.
 * Uses OpenAI-generated per-lesson queries, searches across sources, then scrapes top URLs.
 */
export async function searchForLesson(
  courseTopic: string,
  moduleTitle: string,
  lessonTitle: string,
  lessonDescription: string,
  _config: Partial<FirecrawlConfig> = {},
): Promise<FirecrawlSource[]> {
  console.log(`[WebSearch] Stage 2: Scraping for lesson "${lessonTitle}"`);

  const qg = createOpenAIQueryGenerator();
  const cfg = _config as any as WebSearchConfig;

  const stage2Templates = Array.isArray(cfg?.stage2Templates) ? cfg.stage2Templates : [];
  const templated = stage2Templates
    .map((t) => String(t || '').trim())
    .filter(Boolean)
    .map((t) =>
      t
        .replaceAll('{courseTopic}', courseTopic)
        .replaceAll('{moduleTitle}', moduleTitle)
        .replaceAll('{lessonTitle}', lessonTitle)
        .replaceAll('{lessonDescription}', lessonDescription),
    );

  const generated = await qg.generateLessonQueries({
    topic: courseTopic,
    moduleTitle,
    lessonTitle,
    lessonDescription,
  });

  const maxStage2Queries = Math.max(1, Math.min(20, cfg?.maxStage2Queries ?? 6));
  const queries = Array.from(new Set([...templated, ...generated].map((q) => q.trim())))
    .filter(Boolean)
    .slice(0, maxStage2Queries);

  console.log(`[WebSearch] Generated lesson queries for "${lessonTitle}":`, queries);

  // Add Wikipedia summary first if available
  const lessonSources: FirecrawlSource[] = [];
  const summary = await wikipediaSummary(lessonTitle);
  if (summary && summary.extract.length > 50) {
    lessonSources.push({
      url: summary.url,
      title: `${summary.title} - Wikipedia`,
      author: 'Wikipedia',
      publishDate: null,
      source: 'en.wikipedia.org',
      content: summary.extract,
      credibilityScore: 0.72,
      relevanceScore: scoreRelevance(summary.extract, `${lessonTitle} ${courseTopic}`),
      recencyScore: 0.5,
      wordCount: summary.extract.split(/\s+/).filter(Boolean).length,
      domain: 'en.wikipedia.org',
    });
  }

  // Search multi-source for each query
  const results: FirecrawlSearchResult[] = [];
  const perQueryLimit = Math.max(1, Math.min(10, cfg?.perQueryLimit ?? 5));
  for (const q of queries) {
    const res = await multiSourceSearch(q, perQueryLimit, cfg?.enabledSources);
    console.log(`[WebSearch] Lesson query "${q}" -> ${res.length} results`);
    results.push(...res);
    await sleep(120);
  }

  const uniqueResults = uniqueByUrl(results);

  // Scrape top URLs; bias toward non-wikipedia for diversity
  const urls = uniqueResults
    .filter((r) => !r.url.includes('wikipedia.org'))
    .slice(0, 10)
    .map((r) => ({ url: r.url, title: r.title }));

  const scraped = await fetchAndScoreSources(
    urls,
    `${lessonTitle} ${courseTopic}`,
    Math.max(1, Math.min(12, cfg?.maxSourcesPerLesson ?? 6)),
  );

  // Merge
  const merged = uniqueByUrl([...lessonSources, ...scraped]);

  // Sort by combined score
  merged.sort((a, b) => {
    const sa = a.relevanceScore * 0.5 + a.credibilityScore * 0.3 + a.recencyScore * 0.2;
    const sb = b.relevanceScore * 0.5 + b.credibilityScore * 0.3 + b.recencyScore * 0.2;
    return sb - sa;
  });

  console.log(
    `[WebSearch] Lesson "${lessonTitle}" — scraped sources: ${scraped.length}, total: ${merged.length}`,
  );
  const maxSourcesPerLesson = Math.max(1, Math.min(12, cfg?.maxSourcesPerLesson ?? 6));
  return merged.slice(0, maxSourcesPerLesson);
}
