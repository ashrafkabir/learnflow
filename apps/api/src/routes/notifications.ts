import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { sendError } from '../errors.js';
import { validateBody, validateQuery } from '../validation.js';
import { defaultSourcesForTopic } from '../utils/updateAgent/defaultSources.js';

import { runUpdateAgentForTopic } from '../utils/updateAgent/runTopic.js';

const router = Router();

const listSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// GET /api/v1/notifications?limit=50
router.get('/', validateQuery(listSchema), (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const rows = db.listNotifications(userId, (req.query as any).limit);
  res.json({ notifications: rows });
});

const markReadSchema = z.object({
  id: z.string().min(1),
});

// POST /api/v1/notifications/read { id }
router.post('/read', validateBody(markReadSchema), (req: Request, res: Response) => {
  const userId = req.user!.sub;
  db.markNotificationRead(userId, req.body.id);
  res.status(200).json({ ok: true });
});

const generateSchema = z.object({
  topic: z.string().min(1).max(120),
});

// POST /api/v1/notifications/generate { topic }
// Cron-friendly: checks configured sources for the topic (RSS/Atom first) and stores deduped notifications.
router.post('/generate', validateBody(generateSchema), async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const topic = req.body.topic.trim();
  const checkedAt = new Date();

  // If user configured topic + sources, use them. Otherwise fall back to safe defaults.
  const topics = db.listUpdateAgentTopics(userId);
  const matching = topics.find((t) => t.topic.toLowerCase() === topic.toLowerCase());
  const topicId = matching?.id || null;

  // Iter84: prevent overlapping runs per user/topic
  if (topicId) {
    const lockId = `lock-${uuidv4()}`;
    const acquired = db.acquireUpdateAgentTopicRunLock({
      userId,
      topicId,
      lockId,
      lockedAt: new Date(),
      staleBefore: new Date(Date.now() - 3 * 60 * 1000),
    });
    if (!acquired || acquired.lockId !== lockId) {
      sendError(res, req, {
        status: 409,
        code: 'conflict',
        message: 'Run already in progress',
      });
      return;
    }
    (req as any)._uaLock = { topicId, lockId };
  }

  const sources: Array<{ id?: string; url: string }> = [];
  if (matching) {
    const rows = db.listUpdateAgentSources(userId, matching.id);
    for (const r of rows) {
      if (r.enabled === false) continue;
      if (r.nextEligibleAt) {
        const nextEligible = new Date(String(r.nextEligibleAt));
        if (Number.isFinite(nextEligible.getTime()) && nextEligible.getTime() > Date.now())
          continue;
      }
      sources.push({ id: r.id, url: String(r.url) });
    }
  }

  if (sources.length === 0) {
    for (const u of defaultSourcesForTopic(topic)) sources.push({ url: u });
  }

  const result = await runUpdateAgentForTopic({
    userId,
    topic,
    topicId,
    sources,
    checkedAt,
  });

  // Iter84: release lock + persist last run status
  try {
    const lock = (req as any)._uaLock as { topicId: string; lockId: string } | undefined;
    if (lock) {
      db.updateUpdateAgentTopicRunResult({
        userId,
        topicId: lock.topicId,
        lastRunAt: new Date(),
        ok: result.failures.length === 0,
        error: result.failures[0]?.error || '',
      });
      db.releaseUpdateAgentTopicRunLock({ userId, topicId: lock.topicId, lockId: lock.lockId });
    }
  } catch {
    // ignore
  }

  res.status(201).json({
    created: result.notificationsCreated,
    failures: result.failures,
  });
});

const markAllReadSchema = z.object({});

// POST /api/v1/notifications/read-all
router.post('/read-all', validateBody(markAllReadSchema), (req: Request, res: Response) => {
  const userId = req.user!.sub;
  db.markAllNotificationsRead(userId);
  res.status(200).json({ ok: true });
});

export const notificationsRouter = router;
