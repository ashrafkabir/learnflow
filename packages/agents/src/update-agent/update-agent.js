/**
 * Update Agent (S10) — Detects new content for subscribed topics
 * and generates proactive notification content for Pro users.
 */
/** Mock web search for testing */
export class MockWebSearchProvider {
  results = new Map();
  addResults(query, results) {
    this.results.set(query.toLowerCase(), results);
  }
  async search(query) {
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
  searchProvider;
  subscribedTopics = new Map();
  constructor(searchProvider) {
    this.searchProvider = searchProvider;
  }
  initialize() {
    // ready
  }
  cleanup() {
    this.subscribedTopics.clear();
  }
  /** Subscribe a user to topic updates */
  subscribe(userId, topicId, topic) {
    this.subscribedTopics.set(`${userId}:${topicId}`, {
      userId,
      topic,
      lastChecked: new Date().toISOString(),
    });
  }
  /** Detect new content for a subscribed topic */
  async detectUpdates(userId, topicId) {
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
  async generateNotification(userId, topicId) {
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
  async process(input) {
    if (input.action === 'detect') {
      return this.detectUpdates(input.userId, input.topicId);
    }
    return this.generateNotification(input.userId, input.topicId);
  }
}
//# sourceMappingURL=update-agent.js.map
