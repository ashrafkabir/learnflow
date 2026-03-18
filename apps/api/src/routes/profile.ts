import { Router, Request, Response } from 'express';
import { db, dbProgress } from '../db.js';

const router = Router();

// GET /api/v1/profile/context - Get full Student Context Object
router.get('/context', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const role = req.user!.role;
  const tier = req.user!.tier;

  const user = db.findUserById(userId);
  const stats = dbProgress.getUserStats(userId);

  res.status(200).json({
    userId,
    goals: user?.goals || [],
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

export const profileRouter = router;
