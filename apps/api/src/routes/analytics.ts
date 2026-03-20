import { Router, Request, Response } from 'express';
import { dbProgress, dbEvents } from '../db.js';

const router = Router();

function dayKey(d: Date): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
}

// GET /api/v1/analytics - Get learning analytics dashboard data
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const stats = dbProgress.getUserStats(userId);
  const events = dbEvents.list(userId, 500);

  // Basic event-based weekly progress (minutes are still estimated, but now derived from events).
  const weeklyProgress = new Map<string, number>([
    ['Mon', 0],
    ['Tue', 0],
    ['Wed', 0],
    ['Thu', 0],
    ['Fri', 0],
    ['Sat', 0],
    ['Sun', 0],
  ]);

  for (const e of events) {
    if (e.type === 'lesson.completed') {
      const k = dayKey(new Date(e.createdAt));
      weeklyProgress.set(k, (weeklyProgress.get(k) || 0) + 5);
    }
  }

  res.status(200).json({
    userId,
    totalCoursesEnrolled: stats.totalCoursesEnrolled || 0,
    totalLessonsCompleted: stats.totalLessonsCompleted || 0,
    totalStudyMinutes: stats.totalStudyMinutes || 0,
    currentStreak: stats.currentStreak || 0,
    weeklyProgress: Array.from(weeklyProgress.entries()).map(([day, minutes]) => ({
      day,
      minutes,
    })),
    recentEvents: events.slice(0, 50).map((e) => ({
      id: e.id,
      type: e.type,
      courseId: e.courseId,
      lessonId: e.lessonId,
      createdAt: e.createdAt,
    })),
    topTopics: [],
    quizAverage: 0,
  });
});

export const analyticsRouter = router;
