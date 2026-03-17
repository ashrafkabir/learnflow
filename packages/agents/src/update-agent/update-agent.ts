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
    // Filter to relevant results
    const relevant = results.filter((r) => r.relevanceScore >= 0.5);

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
