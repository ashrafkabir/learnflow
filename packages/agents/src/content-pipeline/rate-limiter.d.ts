/**
 * Scraper rate limiter — enforces 1 req/sec per domain.
 */
export declare class ScraperRateLimiter {
  private lastRequestTime;
  private minIntervalMs;
  constructor(minIntervalMs?: number);
  /**
   * Wait if necessary to respect rate limit for a domain.
   * Returns the wait time in ms (0 if no wait needed).
   */
  waitForDomain(domain: string): Promise<number>;
  /**
   * Check if a request can be made now without waiting.
   */
  canRequestNow(domain: string): boolean;
}
//# sourceMappingURL=rate-limiter.d.ts.map
