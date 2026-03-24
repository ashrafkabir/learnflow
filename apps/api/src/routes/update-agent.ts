import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { validateBody } from '../validation.js';
import { normalizeUrl } from '../utils/updateAgent/url.js';

const router = Router();

// Topics
router.get('/topics', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const topics = db.listUpdateAgentTopics(userId);
  res.json({ topics });
});

const createTopicSchema = z.object({
  topic: z.string().min(1).max(120),
  enabled: z.boolean().optional(),
});

router.post('/topics', validateBody(createTopicSchema), (req: Request, res: Response) => {
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
});

const updateTopicSchema = z.object({
  id: z.string().min(1),
  topic: z.string().min(1).max(120).optional(),
  enabled: z.boolean().optional(),
});

router.post('/topics/update', validateBody(updateTopicSchema), (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const existing = db.listUpdateAgentTopics(userId).find((t) => t.id === req.body.id);
  if (!existing) return res.status(404).json({ error: 'topic not found' });

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
});

router.delete('/topics/:id', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const id = String(req.params.id || '');
  if (!id) return res.status(400).json({ error: 'id required' });
  db.deleteUpdateAgentTopic(userId, id);
  res.status(200).json({ ok: true });
});

const deleteTopicSchema = z.object({ id: z.string().min(1) });
router.delete('/topics', validateBody(deleteTopicSchema), (req: Request, res: Response) => {
  const userId = req.user!.sub;
  db.deleteUpdateAgentTopic(userId, req.body.id);
  res.status(200).json({ ok: true });
});

// Sources
router.get('/sources', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const topicId = String(req.query.topicId || '');
  if (!topicId) return res.status(400).json({ error: 'topicId required' });
  const sources = db.listUpdateAgentSources(userId, topicId);
  res.json({ sources });
});

const createSourceSchema = z.object({
  topicId: z.string().min(1),
  url: z.string().min(1).max(2048),
  enabled: z.boolean().optional(),
  position: z.number().int().min(0).max(9999).optional(),
  sourceType: z.enum(['rss', 'html']).optional(),
});

router.post('/sources', validateBody(createSourceSchema), (req: Request, res: Response) => {
  const userId = req.user!.sub;
  let url: string;
  try {
    url = normalizeUrl(req.body.url);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || 'Invalid URL' });
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
});

const updateSourceSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1).max(2048).optional(),
  enabled: z.boolean().optional(),
  position: z.number().int().min(0).max(9999).optional(),
  sourceType: z.enum(['rss', 'html']).optional(),
});

router.post('/sources/update', validateBody(updateSourceSchema), (req: Request, res: Response) => {
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
  if (!found) return res.status(404).json({ error: 'source not found' });

  let nextUrl = found.url;
  if (typeof req.body.url === 'string') {
    try {
      nextUrl = normalizeUrl(req.body.url);
    } catch (e: any) {
      return res.status(400).json({ error: e?.message || 'Invalid URL' });
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
});

router.delete('/sources/:id', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const id = String(req.params.id || '');
  if (!id) return res.status(400).json({ error: 'id required' });
  db.deleteUpdateAgentSource(userId, id);
  res.status(200).json({ ok: true });
});

const deleteSourceSchema = z.object({ id: z.string().min(1) });
router.delete('/sources', validateBody(deleteSourceSchema), (req: Request, res: Response) => {
  const userId = req.user!.sub;
  db.deleteUpdateAgentSource(userId, req.body.id);
  res.status(200).json({ ok: true });
});

export const updateAgentRouter = router;
