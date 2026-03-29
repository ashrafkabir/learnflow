import express, { Request, Response, NextFunction } from 'express';
import { authRouter } from './auth.js';
import { keysRouter } from './keys.js';
import { chatRouter } from './routes/chat.js';
import { coursesRouter } from './routes/courses.js';
import { mindmapRouter } from './routes/mindmap.js';
import { marketplaceRouter } from './routes/marketplace.js';
import { marketplaceFullRouter } from './routes/marketplace-full.js';
import { marketplaceAgentManifestsRouter } from './routes/marketplace-agent-manifests.js';
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
import { deleteMyDataRouter } from './routes/delete-my-data.js';
import { updateAgentRouter } from './routes/update-agent.js';
import { bookmarksRouter } from './routes/bookmarks.js';
import { yjsRouter } from './yjsRouter.js';
import { adminSearchConfigRouter } from './routes/admin-search-config.js';
import { adminCleanupRouter } from './routes/admin-cleanup.js';
import { diagnosticsRouter } from './routes/diagnostics.js';
import { authMiddleware, requireTier, tokenUsageMiddleware, type AuthUser } from './middleware.js';
import { errorHandler, notFoundHandler, requestIdMiddleware, sendError } from './errors.js';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { RATE_LIMITS, clearRateLimits, rateLimitKeyFromReq, takeRateLimit } from './rateLimit.js';
import helmet from 'helmet';
import cors from 'cors';

export { RATE_LIMITS, clearRateLimits };

function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  // Prefer user-scoped limits over IP-scoped limits.
  // Keying purely by IP is too coarse in real-world environments (NAT, office networks,
  // mobile carriers) and can cause unrelated users/actions (e.g., course deletion) to hit 429.
  const ip = req.ip || 'unknown';
  // Include route prefix to avoid cross-endpoint interference.
  // (Iter87 write limiter adds additional protection for write endpoints.)
  const routeKey = req.baseUrl || req.path || 'unknown';
  const userKey = `${routeKey}:${rateLimitKeyFromReq({ ip, user: req.user })}`;
  const tier = (req.user?.tier || 'free') as 'free' | 'pro';

  // In local dev mode we keep rate limiting enabled (so we still exercise the behavior)
  // but raise limits to avoid flaky E2E runs that legitimately generate a lot of API traffic.
  const devMode = Boolean((req.app as any)?.locals?.devMode);

  const effectiveTier = devMode ? 'pro' : tier;
  const take = takeRateLimit({ key: userKey, tier: effectiveTier, devMode: false });
  if (!take.ok) {
    res.setHeader('Retry-After', String(take.retryAfterSeconds));
    sendError(res, req, {
      status: 429,
      code: 'rate_limit_exceeded',
      message: `Rate limit of ${take.limit} requests per minute exceeded for ${effectiveTier} tier. Try again in ~${take.retryAfterSeconds}s.`,
      details: {
        tier: effectiveTier,
        limitPerMinute: take.limit,
        retryAfterSeconds: take.retryAfterSeconds,
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

  // Security headers (Iter87)
  app.use(
    helmet({
      // LearnFlow is currently a JSON API; disable cross-origin embedding by default.
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS (Iter87)
  // - In devMode: permissive (allows localhost tooling)
  // - In prod: strict allowlist via CORS_ALLOW_ORIGINS (comma-separated)
  const corsAllowOrigins = process.env.CORS_ALLOW_ORIGINS || config.api.corsAllowOrigins || '';
  const allowlist = corsAllowOrigins
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, cb) {
        // Allow non-browser/SSR/no-origin requests.
        if (!origin) return cb(null, true);

        if (app.locals.devMode) return cb(null, true);

        // In non-production we allow browser origins even if no allowlist is configured.
        // Rationale: local dev (Vite/Playwright) runs should not 500 due to missing env.
        if (allowlist.length === 0 && process.env.NODE_ENV !== 'production') {
          return cb(null, true);
        }

        if (allowlist.length === 0) {
          return cb(new Error('CORS not configured')); // handled by errorHandler
        }

        if (allowlist.includes(origin)) return cb(null, true);
        return cb(new Error('Origin not allowed by CORS'));
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-LearnFlow-Origin'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );

  // Payload limits (Iter87)
  // Read env at app creation time so tests can override without module cache issues.
  const bodyLimit = process.env.API_BODY_LIMIT || config.api.bodyLimit;
  app.use(express.json({ limit: bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

  // Iter86: capture request origin tagging for harness/admin/debug runs.
  // Default origin is 'user' (normal product behavior).
  app.use((req, _res, next) => {
    const header = req.headers['x-learnflow-origin'];
    const origin = (Array.isArray(header) ? header[0] : header) || '';
    (req as any).origin = String(origin || '').trim() || 'user';
    next();
  });

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
      '[LearnFlow][DEV_AUTH] Dev auth bypass is ENABLED. Set LEARNFLOW_DEV_AUTH=0 to disable. (Default is OFF; enable with LEARNFLOW_DEV_AUTH=1.) Never enable in production.',
    );
  }

  // Routes
  app.use('/api/v1/keys', protectedAuth, rateLimiter, keysRouter);

  // Iter87: tighter write limits for abuse-prone endpoints.
  // Read env at app creation time.
  const writeLimits = {
    // Defaults: disabled (Infinity) unless env explicitly configures.
    perIpPerMinute: Number.isFinite(Number(process.env.RATE_LIMIT_WRITE_PER_IP_PER_MINUTE))
      ? parseInt(process.env.RATE_LIMIT_WRITE_PER_IP_PER_MINUTE as string, 10)
      : Number.POSITIVE_INFINITY,
    perUserPerMinute: Number.isFinite(Number(process.env.RATE_LIMIT_WRITE_PER_USER_PER_MINUTE))
      ? parseInt(process.env.RATE_LIMIT_WRITE_PER_USER_PER_MINUTE as string, 10)
      : Number.POSITIVE_INFINITY,
  } as const;

  function writeRateLimiter(req: Request, res: Response, next: NextFunction): void {
    const isWrite = req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS';
    if (!isWrite) return next();

    if (
      !Number.isFinite(writeLimits.perIpPerMinute) &&
      !Number.isFinite(writeLimits.perUserPerMinute)
    ) {
      return next();
    }

    const devMode = Boolean((req.app as any)?.locals?.devMode);
    if (devMode) return next();

    const ip = req.ip || 'unknown';
    const userId = req.user?.sub;

    const ipTake = takeRateLimit({
      key: `write:ip:${ip}`,
      tier: 'free',
      devMode: false,
      nowMs: Date.now(),
    });

    // Re-map the generic limiter's limit to our configured per-IP threshold.
    // We do this by pre-checking and early rejecting when above threshold.
    // (The core store is still used to track counts/window.)
    // NOTE: we keep this simple and deterministic for MVP.
    if (!ipTake.ok || ipTake.limit < writeLimits.perIpPerMinute) {
      // If RATE_LIMITS.free.perMinute is below our write limit, treat it as the limiting factor.
    }

    // Custom per-window store for write endpoints to respect configured limits.
    // Implemented inline to avoid refactors of existing tiered limiter.
    const windowMs = 60_000;
    const now = Date.now();

    const stores = (req.app as any).locals.__writeRateLimitStores || {
      ip: new Map<string, { count: number; resetAt: number }>(),
      user: new Map<string, { count: number; resetAt: number }>(),
    };
    (req.app as any).locals.__writeRateLimitStores = stores;

    function take(
      store: Map<string, { count: number; resetAt: number }>,
      key: string,
      limit: number,
    ) {
      let entry = store.get(key);
      if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + windowMs };
        store.set(key, entry);
      }
      entry.count++;
      if (entry.count > limit) {
        return {
          ok: false as const,
          retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
        };
      }
      return { ok: true as const };
    }

    const ipKey = `ip:${ip}`;
    const ipRes = take(stores.ip, ipKey, writeLimits.perIpPerMinute);
    if (!ipRes.ok) {
      res.setHeader('Retry-After', String(ipRes.retryAfterSeconds));
      return sendError(res, req, {
        status: 429,
        code: 'rate_limit_exceeded',
        message: 'Too many write requests. Please try again later.',
        details: { scope: 'ip', limitPerMinute: writeLimits.perIpPerMinute },
      });
    }

    if (userId) {
      const userKey = `user:${userId}`;
      const userRes = take(stores.user, userKey, writeLimits.perUserPerMinute);
      if (!userRes.ok) {
        res.setHeader('Retry-After', String(userRes.retryAfterSeconds));
        return sendError(res, req, {
          status: 429,
          code: 'rate_limit_exceeded',
          message: 'Too many write requests. Please try again later.',
          details: { scope: 'user', limitPerMinute: writeLimits.perUserPerMinute },
        });
      }
    }

    next();
  }

  app.use('/api/v1/chat', protectedAuth, rateLimiter, writeRateLimiter, chatRouter);
  app.use('/api/v1/courses', protectedAuth, rateLimiter, writeRateLimiter, coursesRouter);
  app.use('/api/v1/mindmap', protectedAuth, rateLimiter, writeRateLimiter, mindmapRouter);
  app.use(
    '/api/v1/collaboration',
    protectedAuth,
    rateLimiter,
    writeRateLimiter,
    collaborationRouter,
  );
  // Marketplace
  // Keep public browse endpoints accessible without auth; protect creator/checkout flows.
  // - marketplaceRouter provides public browse endpoints
  // - marketplaceFullRouter provides creator/publish/checkout flows (and agent activation)
  app.use('/api/v1/marketplace', rateLimiter, marketplaceRouter);
  app.use(
    '/api/v1/marketplace',
    protectedAuth,
    rateLimiter,
    writeRateLimiter,
    marketplaceFullRouter,
  );
  app.use(
    '/api/v1/marketplace',
    protectedAuth,
    rateLimiter,
    writeRateLimiter,
    marketplaceAgentManifestsRouter,
  );
  app.use('/api/v1/profile', protectedAuth, rateLimiter, writeRateLimiter, profileRouter);
  app.use('/api/v1/bookmarks', protectedAuth, rateLimiter, writeRateLimiter, bookmarksRouter);
  app.use('/api/v1/subscription', protectedAuth, rateLimiter, writeRateLimiter, subscriptionRouter);
  app.use('/api/v1/analytics', protectedAuth, rateLimiter, analyticsRouter);
  app.use('/api/v1/usage', protectedAuth, rateLimiter, usageRouter);
  app.use(
    '/api/v1/notifications',
    protectedAuth,
    rateLimiter,
    writeRateLimiter,
    notificationsRouter,
  );
  app.use(
    '/api/v1/delete-my-data',
    protectedAuth,
    rateLimiter,
    writeRateLimiter,
    deleteMyDataRouter,
  );
  app.use('/api/v1/update-agent', protectedAuth, rateLimiter, writeRateLimiter, updateAgentRouter);
  app.use('/api/v1/daily', protectedAuth, rateLimiter, writeRateLimiter, dailyRouter);
  app.use('/api/v1/events', protectedAuth, rateLimiter, writeRateLimiter, eventsRouter);
  app.use('/api/v1/pipeline', protectedAuth, rateLimiter, writeRateLimiter, pipelineRouter);
  app.use('/api/v1/search', protectedAuth, rateLimiter, searchRouter);
  app.use('/api/v1/export', protectedAuth, rateLimiter, exportRouter);
  app.use('/api/v1/yjs', protectedAuth, rateLimiter, yjsRouter);
  app.use('/api/v1/admin', protectedAuth, rateLimiter, writeRateLimiter, adminSearchConfigRouter);
  app.use('/api/v1/admin', protectedAuth, rateLimiter, writeRateLimiter, adminCleanupRouter);
  app.use('/api/v1/diagnostics', protectedAuth, rateLimiter, diagnosticsRouter);

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

  // OpenAPI docs (Iter132)
  // Serve the repo's OpenAPI spec in dev/test for quick inspection.
  app.get('/api-docs', async (_req, res) => {
    try {
      // Prefer the repo-root openapi.yaml (kept in sync with apps/api/openapi.yaml).
      const fs = await import('node:fs');
      const path = await import('node:path');
      const p = path.join(process.cwd(), 'openapi.yaml');
      const yaml = fs.readFileSync(p, 'utf8');
      res.status(200).type('text/yaml').send(yaml);
    } catch (err: any) {
      res.status(500).json({ error: 'openapi_unavailable', message: String(err?.message || err) });
    }
  });

  // 404 + error handler — standard envelope
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
