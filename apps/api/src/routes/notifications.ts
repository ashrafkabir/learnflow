import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.js';

const router = Router();

const listSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// GET /api/v1/notifications?limit=50
router.get('/', (req: Request, res: Response) => {
  const parse = listSchema.safeParse(req.query);
  if (!parse.success) {
    res.status(400).json({ error: 'validation_error', message: parse.error.message, code: 400 });
    return;
  }

  const userId = req.user!.sub;
  const rows = db.listNotifications(userId, parse.data.limit);
  res.json({ notifications: rows });
});

const markReadSchema = z.object({
  id: z.string().min(1),
});

// POST /api/v1/notifications/read { id }
router.post('/read', (req: Request, res: Response) => {
  const parse = markReadSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'validation_error', message: parse.error.message, code: 400 });
    return;
  }

  const userId = req.user!.sub;
  db.markNotificationRead(userId, parse.data.id);
  res.status(200).json({ ok: true });
});

const generateSchema = z.object({
  topic: z.string().min(1).max(120),
  source: z.string().optional(),
});

// POST /api/v1/notifications/generate { topic }
// Cron-friendly: generates a few lightweight notifications. MVP (no actual web crawling).
router.post('/generate', (req: Request, res: Response) => {
  const parse = generateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'validation_error', message: parse.error.message, code: 400 });
    return;
  }

  const userId = req.user!.sub;
  const topic = parse.data.topic.trim();
  const now = new Date();

  const payloads = [
    {
      id: `notif-${userId}-${now.getTime()}-0`,
      type: 'update',
      title: `New items to review: ${topic}`,
      body: `MVP update feed generated for topic "${topic}"${parse.data.source ? ` (source: ${parse.data.source})` : ''}.`,
    },
    {
      id: `notif-${userId}-${now.getTime()}-1`,
      type: 'update',
      title: `Suggested practice: ${topic}`,
      body: `Take 10 minutes: summarize a recent development in "${topic}" and add it to your notes.`,
    },
  ];

  for (const p of payloads) {
    db.addNotification({
      id: p.id,
      userId,
      type: p.type,
      title: p.title,
      body: p.body,
      createdAt: now,
      readAt: null,
    });
  }

  res.status(201).json({ created: payloads.length });
});

export const notificationsRouter = router;
