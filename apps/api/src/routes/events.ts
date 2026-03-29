import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { dbEvents, dbMastery, db } from '../db.js';
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

  // Iter86: never persist events from non-user/harness origins.
  const origin = String(
    (req as any).origin || (req.headers['x-learnflow-origin'] as any) || 'user',
  );
  if (origin !== 'user') {
    res.status(201).json({ ok: true, skipped: true });
    return;
  }

  try {
    const user = db.findUserById(userId);
    if (user && user.telemetryEnabled === false) {
      res.status(201).json({ ok: true, skipped: true, reason: 'telemetry_disabled' });
      return;
    }

    const { type, courseId, lessonId, meta } = req.body;

    // Persist raw event (best-effort)
    dbEvents.add(userId, { type, courseId, lessonId, meta: meta || {}, origin });

    // Iter138: derive mastery updates from certain events.
    // Mastery is a first-class store; event log remains a best-effort audit trail.
    try {
      if (type === 'lesson.completed' && courseId && lessonId) {
        dbMastery.applyLessonCompleted(userId, courseId, lessonId);
      }
      if (type === 'quiz.submitted' && courseId && lessonId) {
        const scoreRaw = (meta as any)?.score;
        const score = Number.isFinite(Number(scoreRaw)) ? Number(scoreRaw) : null;
        const gaps = Array.isArray((meta as any)?.gaps)
          ? ((meta as any).gaps as any[]).map((g) => String(g)).filter(Boolean)
          : [];
        dbMastery.applyQuizSubmitted(userId, courseId, lessonId, score, gaps);
      }
    } catch {
      // best-effort
    }
  } catch {
    // best-effort
  }

  res.status(201).json({ ok: true });
});

export const eventsRouter = router;
