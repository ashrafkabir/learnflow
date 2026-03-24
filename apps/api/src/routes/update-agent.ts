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
});

router.post('/topics', validateBody(createTopicSchema), (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const topic = req.body.topic.trim();
  const row = { id: `uat-${uuidv4()}`, userId, topic, createdAt: new Date() };
  db.upsertUpdateAgentTopic(row);
  res
    .status(201)
    .json({ topic: { id: row.id, topic: row.topic, createdAt: row.createdAt.toISOString() } });
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
    createdAt: new Date(),
  };
  db.upsertUpdateAgentSource(row);
  res.status(201).json({ source: { ...row, createdAt: row.createdAt.toISOString() } });
});

const deleteSourceSchema = z.object({ id: z.string().min(1) });
router.delete('/sources', validateBody(deleteSourceSchema), (req: Request, res: Response) => {
  const userId = req.user!.sub;
  db.deleteUpdateAgentSource(userId, req.body.id);
  res.status(200).json({ ok: true });
});

export const updateAgentRouter = router;
