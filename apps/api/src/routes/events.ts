import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { dbEvents } from '../db.js';
import { validateBody } from '../validation.js';

const router = Router();

const createEventSchema = z.object({
  type: z.string().min(1),
  courseId: z.string().optional(),
  lessonId: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

// POST /api/v1/events - Append a learning event (client-side telemetry)
router.post('/', validateBody(createEventSchema), (req: Request, res: Response) => {
  const userId = req.user!.sub;

  try {
    const { type, courseId, lessonId, meta } = req.body;
    dbEvents.add(userId, { type, courseId, lessonId, meta: meta || {} });
  } catch {
    // best-effort
  }

  res.status(201).json({ ok: true });
});

export const eventsRouter = router;
