import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware.js';

const router = Router();

// GET /api/v1/profile/context - Get full Student Context Object
router.get('/context', authMiddleware, (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const role = req.user!.role;
  const tier = req.user!.tier;

  res.status(200).json({
    userId,
    goals: [],
    strengths: [],
    weaknesses: [],
    learningStyle: 'reading',
    quizScores: {},
    studyStreak: 0,
    totalStudyMinutes: 0,
    subscriptionTier: tier || 'free',
    role: role || 'student',
    lastActiveAt: new Date().toISOString(),
  });
});

export const profileRouter = router;
