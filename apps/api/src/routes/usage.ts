import { Router, Request, Response } from 'express';
import { db } from '../db.js';

const router = Router();

function parseDays(v: unknown, fallback = 7): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const clamped = Math.max(1, Math.min(90, Math.round(n)));
  return clamped;
}

function providerMetaForWindow(userId: string, since: Date) {
  const byProvider = db.getUsageByProviderSince(userId, since);
  const providerCallCounts = db.getUsageCountByProviderSince(userId, since);
  const lastUsedByProvider = db.getLastUsedByProvider(userId);

  const providerMeta = byProvider
    .map((p) => {
      const count = providerCallCounts.find((c) => c.provider === p.provider)?.count || 0;
      const lastUsed = lastUsedByProvider.find((l) => l.provider === p.provider)?.lastUsed;
      return {
        provider: p.provider,
        total: p.total,
        callCount: count,
        lastUsed: lastUsed ? lastUsed.toISOString() : null,
      };
    })
    .sort((a, b) => b.total - a.total);

  return { byProvider, providerMeta };
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
  const { byProvider, providerMeta } = providerMetaForWindow(userId, since);

  res.status(200).json({
    days,
    since: since.toISOString(),
    totalTokens,
    byDay,
    topAgents,
    topProviders,
    byProvider,
    providerMeta,
  });
});

/** GET /api/v1/usage/aggregates
 * Returns stable, server-side aggregates for common windows.
 */
router.get('/aggregates', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const windows = [7, 30];
  const now = Date.now();
  const data: Record<string, any> = {};

  for (const days of windows) {
    const since = new Date(now - days * 24 * 60 * 60 * 1000);

    const totalTokens = db.getUsageTotalSince(userId, since);
    const byDay = db.getUsageByDaySince(userId, since);
    const topAgents = db.getTopAgentsSince(userId, since, 5);
    const topProviders = db.getTopProvidersSince(userId, since, 5);
    const { byProvider, providerMeta } = providerMetaForWindow(userId, since);

    data[String(days)] = {
      days,
      since: since.toISOString(),
      totalTokens,
      byDay,
      topAgents,
      topProviders,
      byProvider,
      providerMeta,
    };
  }

  res.status(200).json({
    windows,
    data,
  });
});

export const usageRouter = router;
