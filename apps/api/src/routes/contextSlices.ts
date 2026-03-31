import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { validateBody } from '../validation.js';

const router = Router();

const prefsSchema = z.object({
  notificationSettings: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      inApp: z.boolean().optional(),
    })
    .optional(),
  preferredLessonLength: z.number().int().min(5).max(240).optional(),
  preferredTimeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
});

// POST /api/v1/context/preferences
router.post('/preferences', validateBody(prefsSchema), (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const user = db.findUserById(userId);
  if (!user) {
    res.status(404).json({ error: { code: 'not_found', message: 'User not found' } });
    return;
  }

  const cur = (() => {
    try {
      return JSON.parse(String((user as any).preferencesJson || '{}')) || {};
    } catch {
      return {};
    }
  })();

  const next = {
    ...cur,
    ...req.body,
    notificationSettings: {
      ...(cur.notificationSettings || {}),
      ...((req.body as any).notificationSettings || {}),
    },
  };

  (user as any).preferencesJson = JSON.stringify(next);
  user.updatedAt = new Date();
  db.updateUser(user as any);

  res.status(200).json({ ok: true, preferences: next });
});

const ratingsSchema = z.object({
  kind: z.enum(['lesson', 'agent']),
  key: z.string().min(1),
  rating: z.number().min(1).max(5),
});

// POST /api/v1/context/rating
router.post('/rating', validateBody(ratingsSchema), (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const user = db.findUserById(userId);
  if (!user) {
    res.status(404).json({ error: { code: 'not_found', message: 'User not found' } });
    return;
  }

  const field = req.body.kind === 'lesson' ? 'lessonRatingsJson' : 'agentRatingsJson';
  const cur = (() => {
    try {
      return JSON.parse(String((user as any)[field] || '{}')) || {};
    } catch {
      return {};
    }
  })();

  const next = { ...cur, [req.body.key]: req.body.rating };
  (user as any)[field] = JSON.stringify(next);
  user.updatedAt = new Date();
  db.updateUser(user as any);

  res.status(200).json({ ok: true, kind: req.body.kind, ratings: next });
});

export const contextSlicesRouter = router;
