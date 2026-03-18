/**
 * Scraper rate limiter — enforces 1 req/sec per domain.
 */
export class ScraperRateLimiter {
  lastRequestTime = new Map();
  minIntervalMs;
  constructor(minIntervalMs = 1000) {
    this.minIntervalMs = minIntervalMs;
  }
  /**
   * Wait if necessary to respect rate limit for a domain.
   * Returns the wait time in ms (0 if no wait needed).
   */
  async waitForDomain(domain) {
    const now = Date.now();
    const lastTime = this.lastRequestTime.get(domain);
    if (lastTime) {
      const elapsed = now - lastTime;
      if (elapsed < this.minIntervalMs) {
        const waitTime = this.minIntervalMs - elapsed;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        this.lastRequestTime.set(domain, Date.now());
        return waitTime;
      }
    }
    this.lastRequestTime.set(domain, now);
    return 0;
  }
  /**
   * Check if a request can be made now without waiting.
   */
  canRequestNow(domain) {
    const lastTime = this.lastRequestTime.get(domain);
    if (!lastTime) return true;
    return Date.now() - lastTime >= this.minIntervalMs;
  }
}
//# sourceMappingURL=rate-limiter.js.map
