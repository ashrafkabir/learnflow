import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateBody } from '../validation.js';
import { dbBookmarks } from '../db.js';

const router = Router();

// GET /api/v1/bookmarks?limit=200
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const limit = Math.max(1, Math.min(500, parseInt(String(req.query.limit || '200'), 10) || 200));

  const rows = dbBookmarks.list(userId, limit) as Array<{
    userId: string;
    courseId: string;
    lessonId: string;
    createdAt: string;
  }>;

  res.status(200).json({ bookmarks: rows });
});

const createSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
});

// POST /api/v1/bookmarks
router.post('/', validateBody(createSchema), (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { courseId, lessonId } = req.body;

  dbBookmarks.add(userId, courseId, lessonId);
  res.status(201).json({ ok: true });
});

// DELETE /api/v1/bookmarks/:lessonId
router.delete('/:lessonId', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const lessonId = String(req.params.lessonId || '').trim();
  if (!lessonId) {
    res.status(400).json({ error: { code: 'bad_request', message: 'lessonId is required' } });
    return;
  }

  dbBookmarks.remove(userId, lessonId);
  res.status(204).send();
});

export const bookmarksRouter = router;
