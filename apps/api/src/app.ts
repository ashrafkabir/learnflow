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
import { pipelineRouter } from './routes/pipeline.js';
import { searchRouter } from './routes/search.js';
import { yjsRouter } from './yjsRouter.js';
import { authMiddleware, requireTier, tokenUsageMiddleware, type AuthUser } from './middleware.js';
import jwt from 'jsonwebtoken';
import { config } from './config.js';

// Simple in-memory rate limiter
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
  const limit = tier === 'pro' ? 500 : 100;
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
    res.status(429).json({
      error: 'rate_limit_exceeded',
      message: `Rate limit of ${limit} requests per minute exceeded. Try again in ~${retryAfterSeconds}s.`,
      code: 429,
      retryAfterSeconds,
    });
    return;
  }

  next();
}

export function createApp(options?: { devMode?: boolean }) {
  const app = express();
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

  // Use real auth in test/production, dev auth for local development
  const protectedAuth = options?.devMode ? devAuth : authMiddleware;

  // Routes
  app.use('/api/v1/keys', protectedAuth, rateLimiter, keysRouter);
  app.use('/api/v1/chat', protectedAuth, rateLimiter, chatRouter);
  app.use('/api/v1/courses', protectedAuth, rateLimiter, coursesRouter);
  app.use('/api/v1/mindmap', protectedAuth, rateLimiter, mindmapRouter);
  // Marketplace
  // Keep public browse endpoints accessible without auth; protect creator/checkout flows.
  // - marketplaceRouter provides public browse endpoints
  // - marketplaceFullRouter provides creator/publish/checkout flows (and agent activation)
  app.use('/api/v1/marketplace', rateLimiter, marketplaceRouter);
  app.use('/api/v1/marketplace', protectedAuth, rateLimiter, marketplaceFullRouter);
  app.use('/api/v1/profile', protectedAuth, rateLimiter, profileRouter);
  app.use('/api/v1/subscription', protectedAuth, rateLimiter, subscriptionRouter);
  app.use('/api/v1/analytics', protectedAuth, rateLimiter, analyticsRouter);
  app.use('/api/v1/pipeline', protectedAuth, rateLimiter, pipelineRouter);
  app.use('/api/v1/search', protectedAuth, rateLimiter, searchRouter);
  app.use('/api/v1/yjs', protectedAuth, rateLimiter, yjsRouter);

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

  // Error handler — consistent format
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({
      error: 'internal_error',
      message: err.message || 'Internal server error',
      code: 500,
    });
  });

  return app;
}
