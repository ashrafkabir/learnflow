import { Router, Request, Response } from 'express';
import { z } from 'zod';

import { dbMindmaps } from './db.js';
import { validateQuery } from './validation.js';

const router = Router();

const getSchema = z.object({
  courseId: z.string().min(1),
});

/**
 * GET /api/v1/yjs/mindmap?courseId=...
 * Returns snapshot for initial hydration.
 */
router.get('/mindmap', validateQuery(getSchema), (req: Request, res: Response) => {
  // User-owned room (matches yjsServer.ts)
  const room = `mindmap:${req.user!.sub}:${req.query.courseId}`;
  const row = dbMindmaps.get(room);
  res.json({ room, yjsState: row.yjsState || null, updatedAt: row.updatedAt || null });
});

export const yjsRouter = router;
