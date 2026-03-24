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

  const sources: Array<{ id?: string; url: string }> = [];
  if (matching) {
    const rows = db.listUpdateAgentSources(userId, matching.id);
    for (const r of rows) sources.push({ id: r.id, url: String(r.url) });
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
        });
      }
    } catch (e: any) {
      failures.push({ url: srcUrl, error: e?.message || String(e) });
      if (src.id) {
        db.updateUpdateAgentSourceStatus({
          userId,
          id: src.id,
          lastCheckedAt: now,
          lastSuccessAt: null,
          lastError: e?.message || String(e),
          lastErrorAt: now,
        });
      }
      continue;
    }
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
