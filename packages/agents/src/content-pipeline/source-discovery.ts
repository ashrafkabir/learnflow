/**
 * Source Discovery — queries multiple APIs and returns ranked results.
 */

export interface SourceResult {
  url: string;
  title: string;
  snippet: string;
  domain: string;
  relevanceScore: number;
  source: 'google' | 'bing' | 'semantic_scholar' | 'arxiv';
}

export interface SearchApi {
  name: string;
  search(query: string): Promise<SourceResult[]>;
}

/**
 * Query multiple search APIs and return ranked, deduplicated results.
 */
export async function discoverSources(query: string, apis: SearchApi[]): Promise<SourceResult[]> {
  const allResults: SourceResult[] = [];

  const apiResults = await Promise.allSettled(apis.map((api) => api.search(query)));

  for (const result of apiResults) {
    if (result.status === 'fulfilled') {
      allResults.push(...result.value);
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = allResults.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  // Sort by relevance score descending
  unique.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return unique;
}
