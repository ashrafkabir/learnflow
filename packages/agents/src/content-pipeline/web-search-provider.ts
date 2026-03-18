/**
 * Web Search Provider — Workflow B default.
 * - Uses OpenAI to generate a trending query set per course topic and targeted query sets per lesson.
 * - Executes multi-source search WITHOUT paid keys: Wikipedia Search API, arXiv API, GitHub repo search.
 * - Scrapes: Wikipedia summaries + Readability for HTML, arXiv abstracts (via /abs pages), GitHub README via raw.
 * - Deduplicates URLs, caches scraped pages, rate-limits per domain.
 */

// Re-export compatible types (shared across providers)
export type { FirecrawlSource, FirecrawlSearchResult, FirecrawlConfig } from './firecrawl-provider.js';

import type { FirecrawlSource, FirecrawlSearchResult, FirecrawlConfig } from './firecrawl-provider.js';

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

// Alias cache controls for existing tests/exports.
export function clearSourceCache(): void {
  clearScrapeCache();
}
export function getSourceCacheSize(): number {
  return getScrapeCacheSize();
}

function sleep(ms: number) {
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

function toSourcesFromSearchResults(results: FirecrawlSearchResult[], topic: string): FirecrawlSource[] {
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

async function multiSourceSearch(query: string, perSourceLimit = 5): Promise<FirecrawlSearchResult[]> {
  const half = Math.max(3, Math.floor(perSourceLimit / 2));
  const results = await Promise.all([
    wikipediaSearch(query, perSourceLimit),
    arxivSearch(query, half),
    githubRepoSearch(query, half),
    redditSearch(query, 3),
    mediumSearch(query, 3),
    substackSearch(query, 3),
    quoraSearch(query, 2),
    theNewStackSearch(query, 3),
    devtoSearch(query, 3),
    hackerNewsSearch(query, 3),
    stackOverflowSearch(query, 3),
    freeCodeCampSearch(query, 3),
    towardsDataScienceSearch(query, 2),
    digitalOceanSearch(query, 2),
    mdnSearch(query, 2),
    smashingMagSearch(query, 2),
    courseraSearch(query, 2),
    baiduScholarSearch(query, 2),
  ]);

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
  const results = await multiSourceSearch(topic, 6);
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
  for (const q of queries.slice(0, 6)) {
    const batch = await multiSourceSearch(q, 4);
    results.push(...batch);
    await sleep(120);
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
  const queries = await qg.generateTrendingQueries(topic);
  console.log('[WebSearch] Generated trending queries:', queries);

  const allResults: FirecrawlSearchResult[] = [];
  const perQueryLimit = 5;

  for (const q of queries) {
    const res = await multiSourceSearch(q, perQueryLimit);
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
  const queries = await qg.generateLessonQueries({
    topic: courseTopic,
    moduleTitle,
    lessonTitle,
    lessonDescription,
  });
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
  for (const q of queries) {
    const res = await multiSourceSearch(q, 5);
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

  const scraped = await fetchAndScoreSources(urls, `${lessonTitle} ${courseTopic}`, 6);

  // Merge
  const merged = uniqueByUrl([...lessonSources, ...scraped]);

  // Sort by combined score
  merged.sort((a, b) => {
    const sa = a.relevanceScore * 0.5 + a.credibilityScore * 0.3 + a.recencyScore * 0.2;
    const sb = b.relevanceScore * 0.5 + b.credibilityScore * 0.3 + b.recencyScore * 0.2;
    return sb - sa;
  });

  console.log(`[WebSearch] Lesson "${lessonTitle}" — scraped sources: ${scraped.length}, total: ${merged.length}`);
  return merged.slice(0, 6);
}
