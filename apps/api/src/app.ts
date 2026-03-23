import express, { Request, Response, NextFunction } from 'express';
import { authRouter } from './auth.js';
import { keysRouter } from './keys.js';
import { chatRouter } from './routes/chat.js';
import { coursesRouter } from './routes/courses.js';
import { mindmapRouter } from './routes/mindmap.js';
import { marketplaceRouter } from './routes/marketplace.js';
import { marketplaceFullRouter } from './routes/marketplace-full.js';
import { profileRouter } from './routes/profile.js';
import { subscriptionRouter } from './routes/subscription.js';
import { analyticsRouter } from './routes/analytics.js';
import { collaborationRouter } from './routes/collaboration.js';
import { dailyRouter } from './routes/daily.js';
import { eventsRouter } from './routes/events.js';
import { pipelineRouter } from './routes/pipeline.js';
import { searchRouter } from './routes/search.js';
import { exportRouter } from './routes/export.js';
import { usageRouter } from './routes/usage.js';
import { notificationsRouter } from './routes/notifications.js';
import { yjsRouter } from './yjsRouter.js';
import { adminSearchConfigRouter } from './routes/admin-search-config.js';
import { authMiddleware, requireTier, tokenUsageMiddleware, type AuthUser } from './middleware.js';
import { errorHandler, notFoundHandler, requestIdMiddleware, sendError } from './errors.js';
import jwt from 'jsonwebtoken';
import { config } from './config.js';

// Simple in-memory rate limiter
// Spec §11.1/WS-07 (MVP): tiered limits by user tier.
// NOTE: these are best-effort in-memory limits (per-process).
export const RATE_LIMITS = {
  free: { perMinute: 100 },
  pro: { perMinute: 500 },
  // devMode keeps rate limiting enabled but raises limits to avoid flaky local/E2E runs
  dev: { freePerMinute: 2000, proPerMinute: 5000 },
} as const;

const rateLimitStore: Map<string, { count: number; resetAt: number }> = new Map();

export function clearRateLimits(): void {
  rateLimitStore.clear();
}

function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  // Prefer user-scoped limits over IP-scoped limits.
  // Keying purely by IP is too coarse in real-world environments (NAT, office networks,
  // mobile carriers) and can cause unrelated users/actions (e.g., course deletion) to hit 429.
  const ip = req.ip || 'unknown';
  const userKey = req.user?.sub || ip;
  const tier = req.user?.tier || 'free';

  // In local dev mode we keep rate limiting enabled (so we still exercise the behavior)
  // but raise limits to avoid flaky E2E runs that legitimately generate a lot of API traffic.
  const devMode = Boolean((req.app as any)?.locals?.devMode);
  const limit = devMode
    ? tier === 'pro'
      ? RATE_LIMITS.dev.proPerMinute
      : RATE_LIMITS.dev.freePerMinute
    : tier === 'pro'
      ? RATE_LIMITS.pro.perMinute
      : RATE_LIMITS.free.perMinute;
  const windowMs = 60_000;

  const now = Date.now();
  const key = `${userKey}:${tier}`;
  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    rateLimitStore.set(key, entry);
  }

  entry.count++;

  if (entry.count > limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    sendError(res, req, {
      status: 429,
      code: 'rate_limit_exceeded',
      message: `Rate limit of ${limit} requests per minute exceeded for ${tier} tier. Try again in ~${retryAfterSeconds}s.`,
      details: {
        tier,
        limitPerMinute: limit,
        retryAfterSeconds,
      },
    });
    return;
  }

  next();
}

export function createApp(options?: { devMode?: boolean }) {
  const app = express();
  app.locals.devMode = Boolean(options?.devMode);

  app.use(requestIdMiddleware);
  app.use(express.json());
  app.use(tokenUsageMiddleware);

  // Public auth routes
  app.use('/api/v1/auth', authRouter);

  // Dev-mode middleware — allows unauthenticated access with a default user
  function devAuth(req: Request, _res: Response, next: NextFunction): void {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const token = header.slice(7);
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;
        req.user = decoded;
      } catch {
        /* ignore invalid token */
      }
    }
    if (!req.user) {
      // Default dev user.
      // NOTE: keep this FREE by default so devMode more closely matches the product posture.
      // Tests that require pro features can still set a valid JWT with tier=pro.
      req.user = {
        sub: 'test-user-1',
        email: 'test@learnflow.dev',
        role: 'student' as const,
        tier: 'free' as const,
      };
    }
    next();
  }

  // Use real auth in test/production, dev auth only when explicitly enabled.
  const protectedAuth = options?.devMode ? devAuth : authMiddleware;
  if (options?.devMode) {
    console.warn(
      '[LearnFlow][DEV_AUTH] Dev auth bypass is ENABLED. Set LEARNFLOW_DEV_AUTH=0 to disable. Never enable in production.',
    );
  }

  // Routes
  app.use('/api/v1/keys', protectedAuth, rateLimiter, keysRouter);
  app.use('/api/v1/chat', protectedAuth, rateLimiter, chatRouter);
  app.use('/api/v1/courses', protectedAuth, rateLimiter, coursesRouter);
  app.use('/api/v1/mindmap', protectedAuth, rateLimiter, mindmapRouter);
  app.use('/api/v1/collaboration', protectedAuth, rateLimiter, collaborationRouter);
  // Marketplace
  // Keep public browse endpoints accessible without auth; protect creator/checkout flows.
  // - marketplaceRouter provides public browse endpoints
  // - marketplaceFullRouter provides creator/publish/checkout flows (and agent activation)
  app.use('/api/v1/marketplace', rateLimiter, marketplaceRouter);
  app.use('/api/v1/marketplace', protectedAuth, rateLimiter, marketplaceFullRouter);
  app.use('/api/v1/profile', protectedAuth, rateLimiter, profileRouter);
  app.use('/api/v1/subscription', protectedAuth, rateLimiter, subscriptionRouter);
  app.use('/api/v1/analytics', protectedAuth, rateLimiter, analyticsRouter);
  app.use('/api/v1/usage', protectedAuth, rateLimiter, usageRouter);
  app.use('/api/v1/notifications', protectedAuth, rateLimiter, notificationsRouter);
  app.use('/api/v1/daily', protectedAuth, rateLimiter, dailyRouter);
  app.use('/api/v1/events', protectedAuth, rateLimiter, eventsRouter);
  app.use('/api/v1/pipeline', protectedAuth, rateLimiter, pipelineRouter);
  app.use('/api/v1/search', protectedAuth, rateLimiter, searchRouter);
  app.use('/api/v1/export', protectedAuth, rateLimiter, exportRouter);
  app.use('/api/v1/yjs', protectedAuth, rateLimiter, yjsRouter);
  app.use('/api/v1/admin', protectedAuth, rateLimiter, adminSearchConfigRouter);

  // Pro-only endpoint for RBAC testing
  app.get('/api/v1/pro/features', authMiddleware, requireTier('pro'), (_req, res) => {
    res
      .status(200)
      .json({ features: ['proactive-updates', 'unlimited-mindmap', 'priority-agents'] });
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // 404 + error handler — standard envelope
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
