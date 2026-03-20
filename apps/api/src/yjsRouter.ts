import { Router, Request, Response } from 'express';
import { z } from 'zod';

import { dbMindmaps } from './db.js';

const router = Router();

const getSchema = z.object({
  courseId: z.string().min(1),
});

/**
 * GET /api/v1/yjs/mindmap?courseId=...
 * Returns snapshot for initial hydration.
 */
router.get('/mindmap', (req: Request, res: Response) => {
  const parse = getSchema.safeParse(req.query);
  if (!parse.success) {
    res.status(400).json({ error: 'validation_error', message: parse.error.message, code: 400 });
    return;
  }
  const room = `mindmap:${parse.data.courseId}`;
  const row = dbMindmaps.get(room);
  res.json({ room, yjsState: row.yjsState || null, updatedAt: row.updatedAt || null });
});

export const yjsRouter = router;
