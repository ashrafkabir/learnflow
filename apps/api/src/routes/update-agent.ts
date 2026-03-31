import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { sendError } from '../errors.js';
import { requireTier } from '../middleware.js';
import { validateBody, validateQuery, validateParams } from '../validation.js';
import { normalizeUrl } from '../utils/updateAgent/url.js';
import { runUpdateAgentForTopic } from '../utils/updateAgent/runTopic.js';

const router = Router();

const inFlightTicksByUser = new Map<string, number>();
// In-process guard window.
// DB lock is the real cross-process lock; this guard avoids rapid double-submits
// and makes concurrency tests deterministic.
const INFLIGHT_TTL_MS = 1000;

function tryAcquireInProcessTick(userId: string): boolean {
  const now = Date.now();
  const prev = inFlightTicksByUser.get(userId);
  if (prev && now - prev < INFLIGHT_TTL_MS) return false;
  inFlightTicksByUser.set(userId, now);
  return true;
}

function releaseInProcessTick(userId: string): void {
  inFlightTicksByUser.delete(userId);
}

// ── Runs (Iter96)

type RunSummary = {
  id: string;
  startedAt: string;
  finishedAt: string;
  status: 'success' | 'partial_failure' | 'failure';
  topicsChecked: number;
  sourcesChecked: number;
  notificationsCreated: number;
  failures: Array<{ topic: string; url: string; error: string }>;
};

// POST /api/v1/update-agent/tick (Pro only)
// Canonical scheduler entrypoint: global per-user lock, iterate enabled topics/sources.
router.post('/tick', requireTier('pro'), async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const startedAt = new Date();

  // Prevent concurrent ticks from the same user (in-process + DB lock).
  // Acquire the in-process guard first so tests that fire 2 requests in the same tick
  // deterministically see the second request rejected.
  const memLockOk = tryAcquireInProcessTick(userId);
  if (!memLockOk) {
    sendError(res, req, {
      status: 409,
      code: 'conflict',
      message: 'Update Agent tick already in progress',
    });
    return;
  }

  const lockId = `lock-${uuidv4()}`;
  // Primary: DB-backed lock (multi-process safe). Fallback: in-process guard for tests.
  const acquiredOk = db.acquireUpdateAgentGlobalRunLockStrict({
    userId,
    lockId,
    lockedAt: new Date(),
    staleBefore: new Date(Date.now() - 10 * 60 * 1000),
  });

  if (!acquiredOk) {
    // If we can't get the DB lock, release the in-process guard.
    releaseInProcessTick(userId);

    sendError(res, req, {
      status: 409,
      code: 'conflict',
      message: 'Update Agent tick already in progress',
    });
    return;
  }

  const runId = `uar-${uuidv4()}`;
  db.insertUpdateAgentRun({
    id: runId,
    userId,
    startedAt,
    finishedAt: null,
    status: 'running',
    topicsChecked: 0,
    sourcesChecked: 0,
    notificationsCreated: 0,
    failuresJson: '[]',
  });

  let topicsChecked = 0;
  let sourcesChecked = 0;
  let notificationsCreated = 0;
  const failures: Array<{ topic: string; url: string; error: string }> = [];

  try {
    const topics = db.listUpdateAgentTopics(userId).filter((t) => t.enabled !== false);

    for (const t of topics) {
      topicsChecked += 1;
      const sources = db
        .listUpdateAgentSources(userId, t.id)
        .filter((s) => s.enabled !== false)
        .filter((s) => {
          if (!s.nextEligibleAt) return true;
          const nextEligible = new Date(String(s.nextEligibleAt));
          if (!Number.isFinite(nextEligible.getTime())) return true;
          return nextEligible.getTime() <= Date.now();
        })
        .map((s) => ({ id: s.id, url: String(s.url) }));

      const topicResult = await runUpdateAgentForTopic({
        userId,
        topic: String(t.topic),
        topicId: t.id,
        sources,
        checkedAt: startedAt,
      });

      sourcesChecked += topicResult.sourcesChecked;
      notificationsCreated += topicResult.notificationsCreated;
      for (const f of topicResult.failures) {
        failures.push({ topic: t.topic, url: f.url, error: f.error });
      }

      // Update per-topic last run state for UI continuity.
      db.updateUpdateAgentTopicRunResult({
        userId,
        topicId: t.id,
        lastRunAt: new Date(),
        ok: topicResult.failures.length === 0,
        error: topicResult.failures[0]?.error || '',
      });
    }

    const finishedAt = new Date();
    const finalStatus =
      failures.length === 0 ? 'success' : topicsChecked > 0 ? 'partial_failure' : 'failure';

    db.finishUpdateAgentRun({
      id: runId,
      userId,
      finishedAt,
      status: finalStatus,
      topicsChecked,
      sourcesChecked,
      notificationsCreated,
      failuresJson: JSON.stringify(failures),
    });

    const out: RunSummary = {
      id: runId,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      status: finalStatus as any,
      topicsChecked,
      sourcesChecked,
      notificationsCreated,
      failures,
    };

    res.status(200).json({ run: out });
  } catch (e: any) {
    const finishedAt = new Date();
    failures.push({ topic: '', url: '', error: e?.message || String(e) });

    db.finishUpdateAgentRun({
      id: runId,
      userId,
      finishedAt,
      status: 'failure',
      topicsChecked,
      sourcesChecked,
      notificationsCreated,
      failuresJson: JSON.stringify(failures),
    });

    sendError(res, req, {
      status: 500,
      code: 'update_agent_tick_failed',
      message: 'Update Agent tick failed',
      details: { error: e?.message || String(e) },
    });
  } finally {
    db.releaseUpdateAgentGlobalRunLock({ userId, lockId });
    releaseInProcessTick(userId);
  }
});

// GET /api/v1/update-agent/runs?limit=20
router.get(
  '/runs',
  requireTier('pro'),
  validateQuery(z.object({ limit: z.coerce.number().int().min(1).max(50).default(20) })),
  (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const limit = (req.query as any).limit;
    const runs = db.listUpdateAgentRuns(userId, limit).map((r: any) => {
      let failures: any[] = [];
      try {
        failures = JSON.parse(String(r.failuresJson || '[]'));
      } catch {
        failures = [];
      }

      return {
        id: r.id,
        startedAt: String(r.startedAt),
        finishedAt: r.finishedAt ? String(r.finishedAt) : null,
        status: String(r.status),
        topicsChecked: Number(r.topicsChecked || 0),
        sourcesChecked: Number(r.sourcesChecked || 0),
        notificationsCreated: Number(r.notificationsCreated || 0),
        failures,
      };
    });

    res.status(200).json({ runs });
  },
);

// Topics
router.get('/topics', requireTier('pro'), (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const topics = db.listUpdateAgentTopics(userId).map((t) => {
    const run = db.getUpdateAgentTopicRunState(userId, t.id);
    return {
      ...t,
      lockId: run?.lockId || '',
      lockedAt: run?.lockedAt || null,
      lastRunAt: run?.lastRunAt || null,
      lastRunOk: typeof run?.lastRunOk === 'boolean' ? run.lastRunOk : true,
      lastRunError: run?.lastRunError || '',
    };
  });
  res.json({ topics });
});

const createTopicSchema = z.object({
  topic: z.string().min(1).max(120),
  enabled: z.boolean().optional(),
});

router.post(
  '/topics',
  requireTier('pro'),
  validateBody(createTopicSchema),
  (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const topic = req.body.topic.trim();
    const row = {
      id: `uat-${uuidv4()}`,
      userId,
      topic,
      enabled: req.body.enabled !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.upsertUpdateAgentTopic(row);
    res.status(201).json({
      topic: {
        id: row.id,
        topic: row.topic,
        enabled: row.enabled,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    });
  },
);

const updateTopicSchema = z.object({
  id: z.string().min(1),
  topic: z.string().min(1).max(120).optional(),
  enabled: z.boolean().optional(),
});

router.post(
  '/topics/update',
  requireTier('pro'),
  validateBody(updateTopicSchema),
  (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const existing = db.listUpdateAgentTopics(userId).find((t) => t.id === req.body.id);
    if (!existing) {
      sendError(res, req, { status: 404, code: 'not_found', message: 'Topic not found' });
      return;
    }

    const row = {
      id: existing.id,
      userId,
      topic: (req.body.topic ?? existing.topic).trim(),
      enabled: typeof req.body.enabled === 'boolean' ? req.body.enabled : existing.enabled,
      createdAt: new Date(existing.createdAt),
      updatedAt: new Date(),
    };
    db.upsertUpdateAgentTopic(row);
    res.status(200).json({
      topic: {
        id: row.id,
        topic: row.topic,
        enabled: row.enabled,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      },
    });
  },
);

router.delete(
  '/topics/:id',
  requireTier('pro'),
  validateParams(z.object({ id: z.string().min(1) })),
  (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const id = String(req.params.id || '');
    db.deleteUpdateAgentTopic(userId, id);
    res.status(200).json({ ok: true });
  },
);

const deleteTopicSchema = z.object({ id: z.string().min(1) });
router.delete(
  '/topics',
  requireTier('pro'),
  validateBody(deleteTopicSchema),
  (req: Request, res: Response) => {
    const userId = req.user!.sub;
    db.deleteUpdateAgentTopic(userId, req.body.id);
    res.status(200).json({ ok: true });
  },
);

// Sources
router.get(
  '/sources',
  requireTier('pro'),
  validateQuery(z.object({ topicId: z.string().min(1) })),
  (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const topicId = String((req.query as any).topicId || '');
    const sources = db.listUpdateAgentSources(userId, topicId);
    res.json({ sources });
  },
);

const createSourceSchema = z.object({
  topicId: z.string().min(1),
  url: z.string().min(1).max(2048),
  enabled: z.boolean().optional(),
  position: z.number().int().min(0).max(9999).optional(),
  sourceType: z.enum(['rss', 'html']).optional(),
});

router.post(
  '/sources',
  requireTier('pro'),
  validateBody(createSourceSchema),
  (req: Request, res: Response) => {
    const userId = req.user!.sub;
    let url: string;
    try {
      url = normalizeUrl(req.body.url);
    } catch (e: any) {
      sendError(res, req, {
        status: 400,
        code: 'validation_error',
        message: e?.message || 'Invalid URL',
      });
      return;
    }

    const row = {
      id: `uas-${uuidv4()}`,
      userId,
      topicId: String(req.body.topicId),
      url,
      enabled: req.body.enabled !== false,
      position: Number.isFinite(req.body.position) ? Number(req.body.position) : 0,
      sourceType: req.body.sourceType || 'rss',
      createdAt: new Date(),
      failureCount: 0,
      nextEligibleAt: null,
    };
    db.upsertUpdateAgentSource(row);
    res.status(201).json({
      source: {
        ...row,
        enabled: row.enabled,
        position: row.position,
        sourceType: row.sourceType,
        nextEligibleAt: row.nextEligibleAt,
        failureCount: row.failureCount,
        createdAt: row.createdAt.toISOString(),
      },
    });
  },
);

const updateSourceSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1).max(2048).optional(),
  enabled: z.boolean().optional(),
  position: z.number().int().min(0).max(9999).optional(),
  sourceType: z.enum(['rss', 'html']).optional(),
});

router.post(
  '/sources/update',
  requireTier('pro'),
  validateBody(updateSourceSchema),
  (req: Request, res: Response) => {
    const userId = req.user!.sub;
    // Find in user's sources (topicId not required for update; we search across topics best-effort).
    const topics = db.listUpdateAgentTopics(userId);
    let found: any = null;
    for (const t of topics) {
      const rows = db.listUpdateAgentSources(userId, t.id);
      const match = rows.find((r: any) => r.id === req.body.id);
      if (match) {
        found = match;
        break;
      }
    }
    if (!found) {
      sendError(res, req, { status: 404, code: 'not_found', message: 'Source not found' });
      return;
    }

    let nextUrl = found.url;
    if (typeof req.body.url === 'string') {
      try {
        nextUrl = normalizeUrl(req.body.url);
      } catch (e: any) {
        sendError(res, req, {
          status: 400,
          code: 'validation_error',
          message: e?.message || 'Invalid URL',
        });
        return;
      }
    }

    const row = {
      id: found.id,
      userId,
      topicId: found.topicId,
      url: nextUrl,
      enabled: typeof req.body.enabled === 'boolean' ? req.body.enabled : found.enabled,
      position: Number.isFinite(req.body.position)
        ? Number(req.body.position)
        : Number(found.position || 0),
      sourceType: req.body.sourceType || found.sourceType || 'rss',
      createdAt: new Date(found.createdAt),
      lastCheckedAt: found.lastCheckedAt ? new Date(found.lastCheckedAt) : null,
      lastSuccessAt: found.lastSuccessAt ? new Date(found.lastSuccessAt) : null,
      lastError: found.lastError || '',
      lastErrorAt: found.lastErrorAt ? new Date(found.lastErrorAt) : null,
      lastItemUrlSeen: found.lastItemUrlSeen || '',
      lastItemPublishedAt: found.lastItemPublishedAt || null,
      nextEligibleAt: found.nextEligibleAt ? new Date(found.nextEligibleAt) : null,
      failureCount: Number(found.failureCount || 0),
    };
    db.upsertUpdateAgentSource(row);
    res.status(200).json({ source: row });
  },
);

router.delete(
  '/sources/:id',
  requireTier('pro'),
  validateParams(z.object({ id: z.string().min(1) })),
  (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const id = String(req.params.id || '');
    db.deleteUpdateAgentSource(userId, id);
    res.status(200).json({ ok: true });
  },
);

const deleteSourceSchema = z.object({ id: z.string().min(1) });
router.delete(
  '/sources',
  requireTier('pro'),
  validateBody(deleteSourceSchema),
  (req: Request, res: Response) => {
    const userId = req.user!.sub;
    db.deleteUpdateAgentSource(userId, req.body.id);
    res.status(200).json({ ok: true });
  },
);

export const updateAgentRouter = router;
