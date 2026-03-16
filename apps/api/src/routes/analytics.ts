import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware.js';

const router = Router();

// GET /api/v1/analytics - Get learning analytics dashboard data
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const userId = req.user!.sub;

  res.status(200).json({
    userId,
    totalCoursesEnrolled: 3,
    totalLessonsCompleted: 42,
    totalStudyMinutes: 1260,
    currentStreak: 7,
    weeklyProgress: [
      { day: 'Mon', minutes: 45 },
      { day: 'Tue', minutes: 30 },
      { day: 'Wed', minutes: 60 },
      { day: 'Thu', minutes: 0 },
      { day: 'Fri', minutes: 50 },
      { day: 'Sat', minutes: 25 },
      { day: 'Sun', minutes: 40 },
    ],
    topTopics: ['Machine Learning', 'Python', 'Data Science'],
    quizAverage: 0.82,
  });
});

export const analyticsRouter = router;
