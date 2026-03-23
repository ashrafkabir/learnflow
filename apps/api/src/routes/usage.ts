import { Router, Request, Response } from 'express';
import { db } from '../db.js';

const router = Router();

function parseDays(v: unknown, fallback = 7): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const clamped = Math.max(1, Math.min(90, Math.round(n)));
  return clamped;
}

/** GET /api/v1/usage/summary?days=7
 * Returns minimal usage dashboard data.
 */
router.get('/summary', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const days = parseDays(req.query.days, 7);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const totalTokens = db.getUsageTotalSince(userId, since);
  const byDay = db.getUsageByDaySince(userId, since);
  const topAgents = db.getTopAgentsSince(userId, since, 5);
  const topProviders = db.getTopProvidersSince(userId, since, 5);

  res.status(200).json({
    days,
    since: since.toISOString(),
    totalTokens,
    byDay,
    topAgents,
    topProviders,
  });
});

export const usageRouter = router;
