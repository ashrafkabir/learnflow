import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { dbEvents } from '../db.js';
import { sendError } from '../errors.js';

const router = Router();

const createEventSchema = z.object({
  type: z.string().min(1),
  courseId: z.string().optional(),
  lessonId: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

// POST /api/v1/events - Append a learning event (client-side telemetry)
router.post('/', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const parse = createEventSchema.safeParse(req.body);
  if (!parse.success) {
    sendError(res, req, {
      status: 400,
      code: 'validation_error',
      message: parse.error.message,
      details: parse.error.flatten(),
    });
    return;
  }

  try {
    const { type, courseId, lessonId, meta } = parse.data;
    dbEvents.add(userId, { type, courseId, lessonId, meta: meta || {} });
  } catch {
    // best-effort
  }

  res.status(201).json({ ok: true });
});

export const eventsRouter = router;
