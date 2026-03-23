import { Router, Request, Response } from 'express';
import { z } from 'zod';

import { dbMindmaps } from './db.js';
import { sendError } from './errors.js';

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
    sendError(res, req, {
      status: 400,
      code: 'validation_error',
      message: parse.error.message,
    });
    return;
  }
  // User-owned room (matches yjsServer.ts)
  const room = `mindmap:${req.user!.sub}:${parse.data.courseId}`;
  const row = dbMindmaps.get(room);
  res.json({ room, yjsState: row.yjsState || null, updatedAt: row.updatedAt || null });
});

export const yjsRouter = router;
