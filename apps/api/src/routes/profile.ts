import { Router, Request, Response } from 'express';
import { db, dbProgress } from '../db.js';
import { isAdmin } from '../lib/admin.js';

const router = Router();

// GET /api/v1/profile/context - Get full Student Context Object
router.get('/context', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const tier = req.user!.tier;

  // Server-driven admin role (do not rely on client localStorage)
  const role = isAdmin(req) ? 'admin' : req.user!.role;

  const user = db.findUserById(userId);
  const stats = dbProgress.getUserStats(userId);

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
    preferences: {
      notifications: true,
      darkMode: false,
      language: user?.preferredLanguage || 'en',
      settingsVersion: 1,
    },
  });
});

// POST /api/v1/profile/goals - Save learning goals
router.post('/goals', (req: Request, res: Response) => {
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

// POST /api/v1/profile/onboarding/complete - Durable onboarding completion flag
router.post('/onboarding/complete', (req: Request, res: Response) => {
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
});

export const profileRouter = router;
