import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db, dbProgress, dbBookmarks, dbEvents } from '../db.js';
import { isAdmin } from '../lib/admin.js';
import { validateBody } from '../validation.js';

const router = Router();

// GET /api/v1/profile/context - Get full Student Context Object
router.get('/context', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const tier = req.user!.tier;

  // Server-driven admin role (do not rely on client localStorage)
  const role = isAdmin(req) ? 'admin' : req.user!.role;

  const user = db.findUserById(userId);
  const stats = dbProgress.getUserStats(userId);

  // Iter123: hydrate minimal persistent context arrays.
  // Keep this small + safe; we only expose last N and only for user origin.
  const bookmarkRows = dbBookmarks.list(userId, 200) as Array<{
    courseId: string;
    lessonId: string;
    createdAt: string;
  }>;
  const bookmarkedContent = bookmarkRows.map((b) => ({
    kind: 'lesson' as const,
    courseId: b.courseId,
    lessonId: b.lessonId,
    createdAt: b.createdAt,
  }));

  const events = dbEvents.list(userId, 500) as Array<{
    type: string;
    courseId?: string;
    lessonId?: string;
    meta?: string;
    createdAt: string;
  }>;

  const searchQueries: Array<{ query: string; createdAt: string }> = [];
  const browseHistory: Array<{
    kind: 'lesson';
    courseId?: string;
    lessonId?: string;
    createdAt: string;
  }> = [];

  for (const e of events) {
    if (e.type === 'search.query') {
      try {
        const meta = JSON.parse((e as any).meta || '{}') as any;
        const q = String(meta?.query || '').trim();
        if (q) searchQueries.push({ query: q, createdAt: e.createdAt });
      } catch {
        // ignore
      }
    }

    if (e.type === 'lesson.view_start') {
      browseHistory.push({
        kind: 'lesson',
        courseId: (e as any).courseId,
        lessonId: (e as any).lessonId,
        createdAt: e.createdAt,
      });
    }
  }

  res.status(200).json({
    userId,
    goals: user?.goals || [],
    topics: (user as any)?.topics || [],
    experience: (user as any)?.experience || 'beginner',
    onboardingCompletedAt: (user as any)?.onboardingCompletedAt
      ? (user as any).onboardingCompletedAt.toISOString?.() || (user as any).onboardingCompletedAt
      : null,
    strengths: [],
    weaknesses: [],
    learningStyle: 'reading',
    quizScores: {},
    studyStreak: stats.currentStreak,
    totalStudyMinutes: stats.totalStudyMinutes,
    subscriptionTier: tier || user?.tier || 'free',
    role: role || user?.role || 'student',
    lastActiveAt: new Date().toISOString(),
    progress: {
      coursesCompleted: stats.totalCoursesEnrolled,
      lessonsCompleted: stats.totalLessonsCompleted,
      currentCourse: null,
    },
    // New: persisted context slices
    bookmarkedContent,
    searchQueries: searchQueries.slice(0, 50),
    browseHistory: browseHistory.slice(0, 50),
    preferences: {
      notifications: true,
      darkMode: false,
      language: user?.preferredLanguage || 'en',
      telemetryEnabled: user?.telemetryEnabled !== false,
      settingsVersion: 1,
    },
  });
});

const saveGoalsSchema = z.object({
  goals: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
});

const privacySchema = z.object({
  telemetryEnabled: z.boolean(),
});

// POST /api/v1/profile/goals - Save learning goals
router.post('/goals', validateBody(saveGoalsSchema), (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { goals, topics } = req.body;
  const user = db.findUserById(userId);
  if (user) {
    if (Array.isArray(goals)) user.goals = goals;
    if (Array.isArray(topics)) (user as any).topics = topics;
    user.updatedAt = new Date();
    db.updateUser(user);
  }
  res.status(200).json({ success: true, goals: user?.goals || goals || [], topics: topics || [] });
});

const completeOnboardingSchema = z.object({});

// POST /api/v1/profile/onboarding/complete - Durable onboarding completion flag
router.post(
  '/onboarding/complete',
  validateBody(completeOnboardingSchema),
  (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const user = db.findUserById(userId);
    if (user) {
      (user as any).onboardingCompletedAt = new Date();
      user.updatedAt = new Date();
      db.updateUser(user);
    }
    res.status(200).json({
      success: true,
      onboardingCompletedAt: (user as any)?.onboardingCompletedAt
        ? (user as any).onboardingCompletedAt.toISOString?.() || (user as any).onboardingCompletedAt
        : new Date().toISOString(),
    });
  },
);

// POST /api/v1/profile/privacy - Save privacy/consent settings
router.post('/privacy', validateBody(privacySchema), (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const user = db.findUserById(userId);
  if (!user) {
    res.status(404).json({ error: { code: 'not_found', message: 'User not found' } });
    return;
  }

  (user as any).telemetryEnabled = req.body.telemetryEnabled;
  user.updatedAt = new Date();
  db.updateUser(user);

  res.status(200).json({ ok: true, telemetryEnabled: Boolean((user as any).telemetryEnabled) });
});

// GET /api/v1/profile/data-summary
// Returns a minimal, user-auditable summary of what the server stores.
router.get('/data-summary', (req: Request, res: Response) => {
  const userId = req.user!.sub;

  const includeNonUserOrigins = String(req.query.includeNonUserOrigins || '') === '1';
  const summary = includeNonUserOrigins
    ? db.getDataSummaryIncludingOrigins(userId)
    : db.getDataSummary(userId);
  res.status(200).json(summary);
});

export const profileRouter = router;
