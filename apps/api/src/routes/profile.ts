import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/v1/profile/context - Get full Student Context Object
router.get('/context', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const role = req.user!.role;
  const tier = req.user!.tier;

  res.status(200).json({
    userId,
    goals: ['Career Growth', 'Learn AI'],
    strengths: ['programming', 'math'],
    weaknesses: ['statistics'],
    learningStyle: 'reading',
    quizScores: {},
    studyStreak: 5,
    totalStudyMinutes: 320,
    subscriptionTier: tier || 'free',
    role: role || 'student',
    lastActiveAt: new Date().toISOString(),
    progress: {
      coursesCompleted: 2,
      lessonsCompleted: 15,
      currentCourse: 'quantum-101',
    },
    preferences: {
      notifications: true,
      darkMode: false,
      language: 'en',
      settingsVersion: 1,
    },
  });
});

export const profileRouter = router;
