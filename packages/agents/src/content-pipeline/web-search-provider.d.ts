/**
 * Web Search Provider — Workflow B default.
 * - Uses OpenAI to generate a trending query set per course topic and targeted query sets per lesson.
 * - Executes multi-source search WITHOUT paid keys: Wikipedia Search API, arXiv API, GitHub repo search.
 * - Scrapes: Wikipedia summaries + Readability for HTML, arXiv abstracts (via /abs pages), GitHub README via raw.
 * - Deduplicates URLs, caches scraped pages, rate-limits per domain.
 */
export type { FirecrawlSource, FirecrawlSearchResult, FirecrawlConfig } from './firecrawl-provider.js';
import type { FirecrawlSource, FirecrawlSearchResult, FirecrawlConfig } from './firecrawl-provider.js';
import { scoreCredibility, scoreRecency, scoreRelevance, extractDomain, formatCitations, synthesizeFromSources, checkDomainDiversity } from './firecrawl-provider.js';
export { scoreCredibility, scoreRecency, scoreRelevance, extractDomain, formatCitations, synthesizeFromSources, checkDomainDiversity, };
export declare function clearSourceCache(): void;
export declare function getSourceCacheSize(): number;
/**
 * searchSources is used by some older codepaths/tests.
 * Treat it as a lightweight multi-source search.
 */
export declare function searchSources(topic: string, _config?: Partial<FirecrawlConfig>): Promise<FirecrawlSearchResult[]>;
/**
 * Scrape a single URL into markdown-ish plain text.
 */
export declare function scrapeUrl(url: string, _config?: Partial<FirecrawlConfig>): Promise<{
    markdown: string;
    title: string;
    author: string;
    publishDate: string | null;
}>;
/**
 * crawlSourcesForTopic — fetch & scrape sources for a topic (used by tests + fallback).
 */
export declare function crawlSourcesForTopic(topic: string, _config?: Partial<FirecrawlConfig>): Promise<FirecrawlSource[]>;
/**
 * Bulk research for a topic — Stage 1.
 * Generates 6-10 trending queries via OpenAI, then searches across Wikipedia/arXiv/GitHub.
 * Returns lightweight sources (search result descriptions + Wikipedia summary) for planning.
 */
export declare function searchTopicTrending(topic: string, _config?: Partial<FirecrawlConfig>): Promise<FirecrawlSource[]>;
/**
 * Search and scrape for a specific lesson — Stage 2.
 * Uses OpenAI-generated per-lesson queries, searches across sources, then scrapes top URLs.
 */
export declare function searchForLesson(courseTopic: string, moduleTitle: string, lessonTitle: string, lessonDescription: string, _config?: Partial<FirecrawlConfig>): Promise<FirecrawlSource[]>;
//# sourceMappingURL=web-search-provider.d.ts.map