import { Router, Request, Response } from 'express';
import { z } from 'zod';

import { dbMindmaps, dbCollaboration } from './db.js';
import { validateQuery } from './validation.js';

const router = Router();

const getSchema = z.object({
  courseId: z.string().min(1),
  groupId: z.string().min(1).optional(),
});

/**
 * GET /api/v1/yjs/mindmap?courseId=...
 * Returns snapshot for initial hydration.
 */
router.get('/mindmap', validateQuery(getSchema), (req: Request, res: Response) => {
  const courseId = String(req.query.courseId);
  const groupId = req.query.groupId ? String(req.query.groupId) : null;

  // Default: user-owned room.
  let room = `mindmap:${req.user!.sub}:${courseId}`;

  // Shared: group-owned room requires membership.
  if (groupId) {
    try {
      const group = dbCollaboration.getGroupById(String(groupId));
      if (!group) {
        res
          .status(404)
          .json({ room: null, yjsState: null, updatedAt: null, error: 'Group not found' });
        return;
      }
      let memberIds: string[] = [];
      try {
        memberIds = JSON.parse((group as any).memberIds || '[]');
      } catch {
        memberIds = [];
      }
      if (!memberIds.includes(req.user!.sub)) {
        res.status(403).json({ room: null, yjsState: null, updatedAt: null, error: 'Forbidden' });
        return;
      }
    } catch {
      res
        .status(500)
        .json({ room: null, yjsState: null, updatedAt: null, error: 'ACL check failed' });
      return;
    }

    room = `mindmap:group:${String(groupId)}:${courseId}`;
  }

  const row = dbMindmaps.get(room);
  res.json({ room, yjsState: row.yjsState || null, updatedAt: row.updatedAt || null });
});

export const yjsRouter = router;
