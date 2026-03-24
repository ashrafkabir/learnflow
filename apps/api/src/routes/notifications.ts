import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { validateBody, validateQuery } from '../validation.js';
import { fetchWithBackoff } from '../utils/updateAgent/fetchWithBackoff.js';
import { parseFeed } from '../utils/updateAgent/rss.js';
import { buildDeterministicExplanation } from '../utils/updateAgent/explanation.js';
import { defaultSourcesForTopic } from '../utils/updateAgent/defaultSources.js';
import { getDomain, normalizeUrl } from '../utils/updateAgent/url.js';

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
      return res.status(409).json({ error: 'run already in progress' });
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

  const failures: Array<{ url: string; error: string }> = [];
  let created = 0;

  for (const src of sources.slice(0, 6)) {
    const srcUrl = src.url;
    const now = new Date();
    try {
      const normalizedSourceUrl = normalizeUrl(srcUrl);
      const resp = await fetchWithBackoff(normalizedSourceUrl, { timeoutMs: 12_000 });
      const body = await resp.text();
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const items = parseFeed(body).slice(0, 8);
      // Find the first item we haven't notified for.
      const next = items.find((it) => !db.hasNotificationUrl(userId, normalizeUrl(it.url)));
      if (!next) {
        // still record source check
        if (src.id) {
          db.updateUpdateAgentSourceStatus({
            userId,
            id: src.id,
            lastCheckedAt: now,
            lastSuccessAt: now,
            lastError: '',
            lastErrorAt: null,
            lastItemUrlSeen: items[0]?.url ? normalizeUrl(items[0].url) : '',
            lastItemPublishedAt: items[0]?.publishedAt || null,

            nextEligibleAt: null,
            failureCount: 0,
          });
        }
        continue;
      }

      const itemUrl = normalizeUrl(next.url);
      const title = next.title;
      const summary = next.summary || '';
      const explanation = buildDeterministicExplanation({ topic, title, summary });

      db.addNotification({
        id: `notif-${uuidv4()}`,
        userId,
        type: 'update',
        title,
        body: summary,
        createdAt: checkedAt,
        readAt: null,
        topic,
        sourceUrl: normalizedSourceUrl,
        sourceDomain: getDomain(normalizedSourceUrl),
        checkedAt,
        explanation,
        url: itemUrl,
        origin: 'update_agent',
      });
      created += 1;

      if (src.id) {
        db.updateUpdateAgentSourceStatus({
          userId,
          id: src.id,
          lastCheckedAt: now,
          lastSuccessAt: now,
          lastError: '',
          lastErrorAt: null,
          lastItemUrlSeen: itemUrl,
          lastItemPublishedAt: next.publishedAt || null,
          nextEligibleAt: null,
          failureCount: 0,
        });
      }
    } catch (e: any) {
      failures.push({ url: srcUrl, error: e?.message || String(e) });
      if (src.id) {
        // backoff: 30s * 2^n, capped at 1h
        let prevFailureCount = 0;
        try {
          const allTopics = db.listUpdateAgentTopics(userId);
          for (const t of allTopics) {
            const rows = db.listUpdateAgentSources(userId, t.id);
            const match = rows.find((r: any) => r.id === src.id);
            if (match) {
              prevFailureCount = Number(match.failureCount || 0);
              break;
            }
          }
        } catch {
          // ignore
        }
        const nextFailureCount = Math.max(0, prevFailureCount) + 1;
        const delayMs = Math.min(
          60 * 60 * 1000,
          30 * 1000 * Math.pow(2, Math.min(10, nextFailureCount - 1)),
        );
        db.updateUpdateAgentSourceStatus({
          userId,
          id: src.id,
          lastCheckedAt: now,
          lastSuccessAt: null,
          lastError: e?.message || String(e),
          lastErrorAt: now,
          nextEligibleAt: new Date(Date.now() + delayMs),
          failureCount: nextFailureCount,
        });
      }
      continue;
    }
  }

  // Iter84: release lock + persist last run status
  try {
    const lock = (req as any)._uaLock as { topicId: string; lockId: string } | undefined;
    if (lock) {
      db.updateUpdateAgentTopicRunResult({
        userId,
        topicId: lock.topicId,
        lastRunAt: new Date(),
        ok: failures.length === 0,
        error: failures[0]?.error || '',
      });
      db.releaseUpdateAgentTopicRunLock({ userId, topicId: lock.topicId, lockId: lock.lockId });
    }
  } catch {
    // ignore
  }

  res.status(201).json({ created, failures });
});

const markAllReadSchema = z.object({});

// POST /api/v1/notifications/read-all
router.post('/read-all', validateBody(markAllReadSchema), (req: Request, res: Response) => {
  const userId = req.user!.sub;
  db.markAllNotificationsRead(userId);
  res.status(200).json({ ok: true });
});

export const notificationsRouter = router;
