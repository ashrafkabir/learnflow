// Neutral source type for API pipeline surfaces.
// Avoid leaking legacy provider names (e.g., Firecrawl) into MVP implementation.

export type PipelineSourceDoc = {
  url: string;
  /** Human-readable title (fall back to url when unknown). */
  title: string;
  author: string;
  domain: string;
  publishDate: string | null;
  /**
   * Origin identifier for compatibility with shared helpers.
   * This is a generic string (often a domain or provider id), NOT the legacy provider name.
   */
  source: string;
  /** Provider id such as openai_web_search, wikipedia, mdn, etc. */
  provider?: string;
  /** Extracted text (or snippet) used for downstream generation. */
  content: string;
  wordCount: number;
  credibilityScore: number;
  recencyScore: number;
  relevanceScore: number;
};
