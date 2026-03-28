import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { searchSources } from '@learnflow/agents';
import type { FirecrawlSearchResult } from '@learnflow/agents';
import { sendError } from '../errors.js';
import { validateQueryFrom } from '../validation.js';
import { db, dbEvents } from '../db.js';

const router = Router();

const schema = z.object({
  query: z.string().min(2),
  limit: z.coerce.number().min(1).max(10).optional(),
});

// GET /api/v1/search?q=...&limit=...
// Returns top web search results with attribution.
router.get(
  '/',
  validateQueryFrom(schema, (req) => ({
    query: (req.query as any).q ?? (req.query as any).query,
    limit: (req.query as any).limit,
  })),
  async (req: Request, res: Response) => {
    const q = (req.query as any).query;
    const limit = (req.query as any).limit ?? 5;

    // Iter123: persist search queries into learning_events (origin=user only; respects telemetryEnabled)
    try {
      const userId = req.user?.sub;
      if (userId) {
        const user = db.findUserById(userId);
        if (user?.telemetryEnabled !== false) {
          dbEvents.add(userId, {
            type: 'search.query',
            meta: { query: String(q || '') },
            origin: 'user',
          });
        }
      }
    } catch {
      // best-effort
    }

    try {
      const results = (await searchSources(q)) as FirecrawlSearchResult[];
      const trimmed = (results || []).slice(0, limit).map((r) => ({
        url: r.url,
        title: r.title,
        description: r.description,
        source: new URL(r.url).hostname,
      }));
      res.status(200).json({ query: q, results: trimmed });
    } catch (err: any) {
      sendError(res, req, {
        status: 500,
        code: 'search_failed',
        message: err?.message || 'Failed',
      });
    }
  },
);

export const searchRouter = router;
