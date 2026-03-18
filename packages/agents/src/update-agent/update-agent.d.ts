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
    search(query: string, options?: {
        recency?: string;
    }): Promise<WebSearchResult[]>;
}
/** Mock web search for testing */
export declare class MockWebSearchProvider implements WebSearchProvider {
    private results;
    addResults(query: string, results: WebSearchResult[]): void;
    search(query: string): Promise<WebSearchResult[]>;
}
export declare class UpdateAgent {
    private searchProvider;
    private subscribedTopics;
    constructor(searchProvider: WebSearchProvider);
    initialize(): void;
    cleanup(): void;
    /** Subscribe a user to topic updates */
    subscribe(userId: string, topicId: string, topic: string): void;
    /** Detect new content for a subscribed topic */
    detectUpdates(userId: string, topicId: string): Promise<WebSearchResult[]>;
    /** Generate a proactive notification from detected updates */
    generateNotification(userId: string, topicId: string): Promise<UpdateNotification | null>;
    /** Process method matching AgentInterface pattern */
    process(input: {
        action: 'detect' | 'notify';
        userId: string;
        topicId: string;
    }): Promise<WebSearchResult[] | UpdateNotification | null>;
}
//# sourceMappingURL=update-agent.d.ts.map