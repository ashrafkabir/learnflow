import express, { Request, Response, NextFunction } from 'express';
import { authRouter } from './auth.js';
import { keysRouter } from './keys.js';
import { chatRouter } from './routes/chat.js';
import { coursesRouter } from './routes/courses.js';
import { mindmapRouter } from './routes/mindmap.js';
import { marketplaceRouter } from './routes/marketplace.js';
import { profileRouter } from './routes/profile.js';
import { subscriptionRouter } from './routes/subscription.js';
import { analyticsRouter } from './routes/analytics.js';
import { authMiddleware, requireTier, tokenUsageMiddleware } from './middleware.js';

// Simple in-memory rate limiter
const rateLimitStore: Map<string, { count: number; resetAt: number }> = new Map();

export function clearRateLimits(): void {
  rateLimitStore.clear();
}

function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || 'unknown';
  const tier = req.user?.tier || 'free';
  const limit = tier === 'pro' ? 500 : 100;
  const windowMs = 60_000;

  const now = Date.now();
  const key = `${ip}:${tier}`;
  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    rateLimitStore.set(key, entry);
  }

  entry.count++;

  if (entry.count > limit) {
    res.status(429).json({
      error: 'rate_limit_exceeded',
      message: `Rate limit of ${limit} requests per minute exceeded`,
      code: 429,
    });
    return;
  }

  next();
}

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(tokenUsageMiddleware);

  // Public auth routes
  app.use('/api/v1/auth', authRouter);

  // Auth + rate limiter for protected routes
  app.use('/api/v1/keys', authMiddleware, rateLimiter, keysRouter);
  app.use('/api/v1/chat', authMiddleware, rateLimiter, chatRouter);
  app.use('/api/v1/courses', authMiddleware, rateLimiter, coursesRouter);
  app.use('/api/v1/mindmap', authMiddleware, rateLimiter, mindmapRouter);
  app.use('/api/v1/marketplace', rateLimiter, marketplaceRouter);
  app.use('/api/v1/profile', authMiddleware, rateLimiter, profileRouter);
  app.use('/api/v1/subscription', authMiddleware, rateLimiter, subscriptionRouter);
  app.use('/api/v1/analytics', authMiddleware, rateLimiter, analyticsRouter);

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
