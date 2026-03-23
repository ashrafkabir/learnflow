import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { searchSources } from '@learnflow/agents';
import type { FirecrawlSearchResult } from '@learnflow/agents';
import { sendError } from '../errors.js';

const router = Router();

const schema = z.object({
  query: z.string().min(2),
  limit: z.coerce.number().min(1).max(10).optional(),
});

// GET /api/v1/search?q=...&limit=...
// Returns top web search results with attribution.
router.get('/', async (req: Request, res: Response) => {
  const parse = schema.safeParse({
    query: req.query.q ?? req.query.query,
    limit: req.query.limit,
  });
  if (!parse.success) {
    sendError(res, req, {
      status: 400,
      code: 'validation_error',
      message: parse.error.message,
      details: parse.error.flatten(),
    });
    return;
  }

  const q = parse.data.query;
  const limit = parse.data.limit ?? 5;

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
});

export const searchRouter = router;
