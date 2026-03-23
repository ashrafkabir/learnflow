import type { AuthUser } from './middleware.js';

export type RateLimitTier = 'free' | 'pro';

// Spec §11.1/WS-07 (MVP): tiered limits by user tier.
// NOTE: these are best-effort in-memory limits (per-process).
export const RATE_LIMITS = {
  free: { perMinute: 100 },
  pro: { perMinute: 500 },
  // devMode keeps rate limiting enabled but raises limits to avoid flaky local/E2E runs
  dev: { freePerMinute: 2000, proPerMinute: 5000 },
} as const;

type StoreEntry = { count: number; resetAt: number };
const rateLimitStore: Map<string, StoreEntry> = new Map();

export function clearRateLimits(): void {
  rateLimitStore.clear();
}

export function getRateLimitPerMinute(params: { tier: RateLimitTier; devMode: boolean }): number {
  const { tier, devMode } = params;
  if (devMode) return tier === 'pro' ? RATE_LIMITS.dev.proPerMinute : RATE_LIMITS.dev.freePerMinute;
  return tier === 'pro' ? RATE_LIMITS.pro.perMinute : RATE_LIMITS.free.perMinute;
}

export function takeRateLimit(params: {
  key: string;
  tier: RateLimitTier;
  devMode: boolean;
  nowMs?: number;
}): { ok: true; limit: number } | { ok: false; limit: number; retryAfterSeconds: number } {
  const now = params.nowMs ?? Date.now();
  const limit = getRateLimitPerMinute({ tier: params.tier, devMode: params.devMode });
  const windowMs = 60_000;

  const storeKey = `${params.key}:${params.tier}`;
  let entry = rateLimitStore.get(storeKey);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    rateLimitStore.set(storeKey, entry);
  }

  entry.count++;

  if (entry.count > limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return { ok: false, limit, retryAfterSeconds };
  }

  return { ok: true, limit };
}

export function rateLimitKeyFromReq(params: {
  ip: string;
  user?: Pick<AuthUser, 'sub'> | undefined;
}): string {
  return params.user?.sub || params.ip || 'unknown';
}
