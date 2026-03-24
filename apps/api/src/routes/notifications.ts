import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { validateBody, validateQuery } from '../validation.js';
import { RealWebSearchProvider, UpdateAgent } from '@learnflow/agents';
import crypto from 'crypto';

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
  source: z.string().optional(),
  /** optional: allow callers to provide an idempotency key */
  idempotencyKey: z.string().min(1).max(120).optional(),
});

function stableNotificationId(userId: string, topic: string, itemUrl: string): string {
  // Stable per user+topic+URL so repeated ticks don't spam duplicates.
  const h = crypto
    .createHash('sha256')
    .update(`${userId}|${topic.toLowerCase().trim()}|${itemUrl}`)
    .digest('hex')
    .slice(0, 24);
  return `notif-${h}`;
}

// POST /api/v1/notifications/generate { topic }
// Cron-friendly: generates lightweight notifications from real web discovery.
// Requirements (Iter78): strict timeouts, credibility filters, dedupe, graceful failure.
router.post('/generate', validateBody(generateSchema), async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const topic = req.body.topic.trim();

  try {
    const provider = new RealWebSearchProvider({ timeoutMs: 6_000, maxResults: 8 });
    const agent = new UpdateAgent(provider);
    agent.subscribe(userId, topic, topic);

    const results = await agent.detectUpdates(userId, topic);

    // Graceful success on empty result.
    if (!results.length) {
      console.warn(`[Notifications] No updates found for topic="${topic}" user=${userId}`);
      return res.status(200).json({ created: 0, deduped: 0 });
    }

    // Create 1 notification per result (bounded), but stable IDs make it idempotent.
    const now = new Date();
    let created = 0;
    let deduped = 0;

    const prior = db.listNotifications(userId, 200);
    const priorIds = new Set(prior.map((n: any) => String(n.id)));

    for (const r of results.slice(0, 3)) {
      const id = stableNotificationId(userId, topic, r.url);
      if (priorIds.has(id)) {
        deduped++;
        continue;
      }

      db.addNotification({
        id,
        userId,
        type: 'update',
        title: r.title || `New content for: ${topic}`,
        body: `${r.snippet || ''}\n\nSource: ${r.url}`.trim(),
        createdAt: now,
        readAt: null,
      });
      created++;
    }

    return res.status(201).json({ created, deduped });
  } catch (err: any) {
    // Per requirements: return 200 + 0 notifications when providers down.
    console.error(`[Notifications] generate failed for topic="${topic}" user=${userId}:`, err);
    return res.status(200).json({ created: 0, deduped: 0 });
  }
});

export const notificationsRouter = router;
