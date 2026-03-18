import type { FirecrawlSearchResult, FirecrawlSource } from './firecrawl-provider.js';
export declare function wikipediaSearch(
  query: string,
  limit?: number,
): Promise<FirecrawlSearchResult[]>;
export declare function wikipediaSummary(titleOrTopic: string): Promise<{
  title: string;
  extract: string;
  url: string;
} | null>;
export declare function arxivSearch(
  query: string,
  maxResults?: number,
): Promise<FirecrawlSearchResult[]>;
export declare function githubRepoSearch(
  query: string,
  maxResults?: number,
): Promise<FirecrawlSearchResult[]>;
export declare function scrapeWithReadability(url: string): Promise<{
  content: string;
  title: string;
}>;
export declare function fetchAndScoreSources(
  urls: {
    url: string;
    title: string;
  }[],
  topic: string,
  maxSources?: number,
): Promise<FirecrawlSource[]>;
export declare function clearScrapeCache(): void;
export declare function getScrapeCacheSize(): number;
export declare function redditSearch(
  query: string,
  limit?: number,
): Promise<FirecrawlSearchResult[]>;
export declare function devtoSearch(
  query: string,
  limit?: number,
): Promise<FirecrawlSearchResult[]>;
export declare function hackerNewsSearch(
  query: string,
  limit?: number,
): Promise<FirecrawlSearchResult[]>;
export declare function mediumSearch(
  query: string,
  limit?: number,
): Promise<FirecrawlSearchResult[]>;
export declare function substackSearch(
  query: string,
  limit?: number,
): Promise<FirecrawlSearchResult[]>;
export declare function quoraSearch(
  query: string,
  limit?: number,
): Promise<FirecrawlSearchResult[]>;
export declare function theNewStackSearch(
  query: string,
  limit?: number,
): Promise<FirecrawlSearchResult[]>;
export declare function stackOverflowSearch(
  query: string,
  limit?: number,
): Promise<FirecrawlSearchResult[]>;
export declare function freeCodeCampSearch(
  query: string,
  limit?: number,
): Promise<FirecrawlSearchResult[]>;
export declare function towardsDataScienceSearch(
  query: string,
  limit?: number,
): Promise<FirecrawlSearchResult[]>;
export declare function digitalOceanSearch(
  query: string,
  limit?: number,
): Promise<FirecrawlSearchResult[]>;
export declare function mdnSearch(query: string, limit?: number): Promise<FirecrawlSearchResult[]>;
export declare function smashingMagSearch(
  query: string,
  limit?: number,
): Promise<FirecrawlSearchResult[]>;
export declare function courseraSearch(
  query: string,
  limit?: number,
): Promise<FirecrawlSearchResult[]>;
export declare function baiduScholarSearch(
  query: string,
  limit?: number,
): Promise<FirecrawlSearchResult[]>;
//# sourceMappingURL=source-fetchers.d.ts.map
