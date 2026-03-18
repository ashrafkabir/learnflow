/**
 * Firecrawl Content Provider — Uses Firecrawl API for real web source crawling.
 * Implements Override #3: all content must come from crawled real sources.
 */
export interface FirecrawlSource {
    url: string;
    title: string;
    author: string;
    publishDate: string | null;
    source: string;
    content: string;
    credibilityScore: number;
    relevanceScore: number;
    recencyScore: number;
    wordCount: number;
    domain: string;
}
export interface FirecrawlSearchResult {
    url: string;
    title: string;
    description: string;
    markdown?: string;
}
export interface FirecrawlConfig {
    apiKey: string;
    baseUrl: string;
    maxSourcesPerLesson: number;
    minCredibility: number;
    cacheTtlMs: number;
}
/**
 * Score domain credibility (0-1).
 */
export declare function scoreCredibility(url: string): number;
/**
 * Score source recency (0-1). Prefers content from last 2 years.
 */
export declare function scoreRecency(dateStr: string | null): number;
/**
 * Score keyword relevance (0-1).
 */
export declare function scoreRelevance(content: string, topic: string): number;
/**
 * Extract domain from URL.
 */
export declare function extractDomain(url: string): string;
/**
 * Check if source diversity is maintained (<50% from single domain).
 */
export declare function checkDomainDiversity(sources: FirecrawlSource[]): boolean;
/**
 * Search for sources on a topic using Firecrawl API.
 * In mock mode (no API key), returns realistic mock results.
 */
export declare function searchSources(topic: string, config?: Partial<FirecrawlConfig>): Promise<FirecrawlSearchResult[]>;
/**
 * Scrape a single URL using Firecrawl API.
 * In mock mode, returns mock content.
 */
export declare function scrapeUrl(url: string, config?: Partial<FirecrawlConfig>): Promise<{
    markdown: string;
    title: string;
    author: string;
    publishDate: string | null;
}>;
/**
 * Full pipeline: search topic → scrape top sources → score → filter → return.
 * This is the main entry point for the Firecrawl content sourcing.
 */
export declare function crawlSourcesForTopic(topic: string, config?: Partial<FirecrawlConfig>): Promise<FirecrawlSource[]>;
/**
 * Format sources into inline citations and a references section.
 */
export declare function formatCitations(sources: FirecrawlSource[]): {
    inlineCitations: Map<number, string>;
    referencesSection: string;
};
/**
 * Synthesize lesson content from crawled sources.
 * Returns content with inline citations and a references section.
 *
 * Iteration 14 rewrite: use an actual LLM synthesis when an API key is present.
 * - Prefers OPENAI_API_KEY, falls back to ANTHROPIC_API_KEY.
 * - Falls back to a deterministic template if no key is configured or the LLM fails.
 */
export declare function synthesizeFromSources(topic: string, lessonTitle: string, sources: FirecrawlSource[]): Promise<{
    content: string;
    references: string;
    sourceCount: number;
}>;
/**
 * Search and scrape sources specific to a single lesson.
 * Generates lesson-specific queries, searches, scrapes top results, dedupes, scores by relevance to the lesson.
 */
export declare function searchForLesson(courseTopic: string, moduleTitle: string, lessonTitle: string, lessonDescription: string, config?: Partial<FirecrawlConfig>): Promise<FirecrawlSource[]>;
/**
 * Bulk research for a topic — Stage 1 of the pipeline.
 * Runs 5-8 search queries to find trending/authoritative content.
 * Uses search results directly (no individual scraping) for speed and reliability.
 * Individual lesson scraping happens in Stage 2.
 */
export declare function searchTopicTrending(topic: string, config?: Partial<FirecrawlConfig>): Promise<FirecrawlSource[]>;
/** Clear the source cache (for testing). */
export declare function clearSourceCache(): void;
/** Get cache size (for testing). */
export declare function getSourceCacheSize(): number;
//# sourceMappingURL=firecrawl-provider.d.ts.map