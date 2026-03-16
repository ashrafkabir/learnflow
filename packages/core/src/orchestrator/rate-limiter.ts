/**
 * Per-tier rate limiter.
 * Free: 100 req/min, Pro: 500 req/min.
 */
export interface RateLimitConfig {
  free: number;
  pro: number;
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  free: 100,
  pro: 500,
  windowMs: 60_000,
};

interface BucketEntry {
  count: number;
  windowStart: number;
}

export class RateLimiter {
  private buckets: Map<string, BucketEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Check if a request is allowed. Returns true if allowed, false if rate limited.
   */
  check(userId: string, tier: 'free' | 'pro'): boolean {
    const now = Date.now();
    const key = `${userId}:${tier}`;
    const limit = tier === 'pro' ? this.config.pro : this.config.free;

    let bucket = this.buckets.get(key);
    if (!bucket || now - bucket.windowStart >= this.config.windowMs) {
      bucket = { count: 0, windowStart: now };
      this.buckets.set(key, bucket);
    }

    if (bucket.count >= limit) {
      return false;
    }

    bucket.count++;
    return true;
  }

  /**
   * Reset a user's rate limit bucket.
   */
  reset(userId: string, tier: 'free' | 'pro'): void {
    this.buckets.delete(`${userId}:${tier}`);
  }
}
