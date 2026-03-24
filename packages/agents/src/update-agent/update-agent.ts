/**
 * Update Agent (S10) — Detects new content for subscribed topics
 * and generates proactive notification content for Pro users.
 */

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  publishDate: string;
  relevanceScore: number;
  /** optional: computed by real providers (MVP) */
  credibilityScore?: number;
  recencyScore?: number;
  overallScore?: number;
}

export interface UpdateNotification {
  id: string;
  topicId: string;
  title: string;
  summary: string;
  sources: WebSearchResult[];
  createdAt: string;
  type: 'new_content' | 'trend_update' | 'course_update';
}

export interface WebSearchProvider {
  search(query: string, options?: { recency?: string }): Promise<WebSearchResult[]>;
}

function sleep(ms: number) {
  // Keep tests fast and deterministic.
  if (process.env.NODE_ENV === 'test' || !!process.env.VITEST) return Promise.resolve();
  return new Promise((r) => setTimeout(r, ms));
}

function withTimeout<T>(p: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  const ms = Math.max(50, timeoutMs);
  return Promise.race([
    p,
    new Promise<T>((_resolve, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

function extractYearish(s: string): string | null {
  const m = String(s || '').match(/\b(20\d{2}|19\d{2})\b/);
  if (!m) return null;
  const y = Number(m[1]);
  if (!Number.isFinite(y)) return null;
  if (y < 1990 || y > new Date().getFullYear() + 1) return null;
  // We only need a parseable date for the recency heuristic.
  return `${y}-01-01`;
}

export type UpdateAgentSearchConfig = {
  timeoutMs?: number;
  maxResults?: number;
  minOverallScore?: number;
};

/**
 * Real provider for UpdateAgent.
 * Uses the content-pipeline web-search provider (multi-source search) when not in test mode.
 */
export class RealWebSearchProvider implements WebSearchProvider {
  private cfg: Required<UpdateAgentSearchConfig>;

  constructor(config: UpdateAgentSearchConfig = {}) {
    this.cfg = {
      timeoutMs: Math.max(500, Math.min(15_000, config.timeoutMs ?? 6_000)),
      maxResults: Math.max(1, Math.min(12, config.maxResults ?? 8)),
      minOverallScore: Math.max(0, Math.min(1, config.minOverallScore ?? 0.55)),
    };
  }

  async search(query: string): Promise<WebSearchResult[]> {
    // Tests must be deterministic and offline.
    if (process.env.NODE_ENV === 'test' || !!process.env.VITEST) {
      const topic = query.trim();
      return [
        {
          title: `${topic} — Wikipedia`,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/\s+/g, '_'))}`,
          snippet: `Background and references for ${topic}.`,
          publishDate: new Date().toISOString(),
          relevanceScore: 0.75,
        },
        {
          title: `${topic} — arXiv search`,
          url: `https://arxiv.org/search/?query=${encodeURIComponent(topic)}&searchtype=all&source=header`,
          snippet: `Recent papers and preprints related to ${topic}.`,
          publishDate: new Date().toISOString(),
          relevanceScore: 0.7,
        },
      ].slice(0, this.cfg.maxResults);
    }

    const { searchSources, scoreCredibility, scoreRelevance, scoreRecency } =
      await import('../content-pipeline/web-search-provider.js');

    const raw = await withTimeout(
      searchSources(query, {
        perQueryLimit: 6,
        maxSourcesPerLesson: this.cfg.maxResults,
      } as any),
      this.cfg.timeoutMs,
      'UpdateAgent.search',
    );

    const nowIso = new Date().toISOString();

    const mapped: WebSearchResult[] = raw.map((r: any) => {
      const title = String(r.title || '').trim();
      const url = String(r.url || '').trim();
      const snippet = String(r.description || r.markdown || '').trim();
      const publishDate = extractYearish(`${title} ${snippet} ${url}`) || nowIso;
      const credibilityScore = scoreCredibility(url);
      const relevanceScore = scoreRelevance(`${title}\n${snippet}`, query);
      const recencyScore = scoreRecency(publishDate);
      const overallScore = relevanceScore * 0.55 + credibilityScore * 0.3 + recencyScore * 0.15;
      return {
        title,
        url,
        snippet,
        publishDate,
        relevanceScore,
        credibilityScore,
        recencyScore,
        overallScore,
      };
    });

    // Dedupe by URL and sort by overall score.
    const seen = new Set<string>();
    const unique = mapped.filter((m) => {
      if (!m.url) return false;
      if (seen.has(m.url)) return false;
      seen.add(m.url);
      return true;
    });

    unique.sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0));

    // Apply MVP credibility+relevance filter.
    const filtered = unique.filter(
      (r) => (r.overallScore ?? r.relevanceScore) >= this.cfg.minOverallScore,
    );

    // Small jitter to avoid hammering providers when this is called in loops.
    await sleep(80);
    return filtered.slice(0, this.cfg.maxResults);
  }
}

/** Mock web search for testing */
export class MockWebSearchProvider implements WebSearchProvider {
  private results: Map<string, WebSearchResult[]> = new Map();

  addResults(query: string, results: WebSearchResult[]): void {
    this.results.set(query.toLowerCase(), results);
  }

  async search(query: string): Promise<WebSearchResult[]> {
    const key = query.toLowerCase();
    for (const [k, v] of this.results) {
      if (key.includes(k) || k.includes(key)) return v;
    }
    return [
      {
        title: `New developments in ${query}`,
        url: `https://example.com/${query.replace(/\s+/g, '-')}`,
        snippet: `Recent advances and updates related to ${query}.`,
        publishDate: new Date().toISOString(),
        relevanceScore: 0.8,
      },
    ];
  }
}

export class UpdateAgent {
  private searchProvider: WebSearchProvider;
  private subscribedTopics: Map<string, { userId: string; topic: string; lastChecked: string }> =
    new Map();

  constructor(searchProvider: WebSearchProvider) {
    this.searchProvider = searchProvider;
  }

  initialize(): void {
    // ready
  }

  cleanup(): void {
    this.subscribedTopics.clear();
  }

  /** Subscribe a user to topic updates */
  subscribe(userId: string, topicId: string, topic: string): void {
    this.subscribedTopics.set(`${userId}:${topicId}`, {
      userId,
      topic,
      lastChecked: new Date().toISOString(),
    });
  }

  /** Detect new content for a subscribed topic */
  async detectUpdates(userId: string, topicId: string): Promise<WebSearchResult[]> {
    const sub = this.subscribedTopics.get(`${userId}:${topicId}`);
    if (!sub) return [];

    const results = await this.searchProvider.search(sub.topic);

    // Filter to relevant results (relevance or overall score when present)
    const relevant = results.filter((r) => (r.overallScore ?? r.relevanceScore) >= 0.5);

    // Update last checked
    sub.lastChecked = new Date().toISOString();

    return relevant;
  }

  /** Generate a proactive notification from detected updates */
  async generateNotification(userId: string, topicId: string): Promise<UpdateNotification | null> {
    const updates = await this.detectUpdates(userId, topicId);
    if (updates.length === 0) return null;

    const sub = this.subscribedTopics.get(`${userId}:${topicId}`);
    const topicName = sub?.topic || 'Unknown';

    return {
      id: `notif-${Date.now()}`,
      topicId,
      title: `New content available for "${topicName}"`,
      summary: `Found ${updates.length} new resource${updates.length > 1 ? 's' : ''} related to ${topicName}. ${updates[0].snippet}`,
      sources: updates,
      createdAt: new Date().toISOString(),
      type: 'new_content',
    };
  }

  /** Process method matching AgentInterface pattern */
  async process(input: {
    action: 'detect' | 'notify';
    userId: string;
    topicId: string;
  }): Promise<WebSearchResult[] | UpdateNotification | null> {
    if (input.action === 'detect') {
      return this.detectUpdates(input.userId, input.topicId);
    }
    return this.generateNotification(input.userId, input.topicId);
  }
}
