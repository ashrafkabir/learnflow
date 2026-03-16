import express from 'express';
import { authRouter } from './auth.js';
import { keysRouter } from './keys.js';
import { authMiddleware, requireTier, tokenUsageMiddleware } from './middleware.js';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(tokenUsageMiddleware);

  // Public auth routes
  app.use('/api/v1/auth', authRouter);

  // Protected key management routes
  app.use('/api/v1/keys', keysRouter);

  // Example Pro-only endpoint for RBAC testing
  app.get('/api/v1/pro/features', authMiddleware, requireTier('pro'), (_req, res) => {
    res
      .status(200)
      .json({ features: ['proactive-updates', 'unlimited-mindmap', 'priority-agents'] });
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  return app;
}
