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

  // Event-based weekly progress.
  // Prefer explicit time-on-lesson durations when present; fall back to completion estimates.
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
    const k = dayKey(new Date(e.createdAt));
    if (e.type === 'lesson.view_end') {
      try {
        const meta = JSON.parse(e.meta || '{}') as any;
        const ms = Number(meta?.durationMs || 0);
        if (Number.isFinite(ms) && ms > 0) {
          const minutes = Math.max(1, Math.round(ms / 60000));
          weeklyProgress.set(k, (weeklyProgress.get(k) || 0) + minutes);
          continue;
        }
      } catch {
        // ignore meta parse
      }
    }
    if (e.type === 'lesson.completed') {
      weeklyProgress.set(k, (weeklyProgress.get(k) || 0) + 5);
    }
  }

  // Quiz average (best-effort) from quiz.submitted events
  const quizScores: number[] = [];
  for (const e of events) {
    if (e.type !== 'quiz.submitted') continue;
    try {
      const meta = JSON.parse((e.meta as any) || '{}') as any;
      const score = Number(meta?.score);
      if (Number.isFinite(score)) quizScores.push(Math.max(0, Math.min(100, score)));
    } catch {
      // ignore
    }
  }
  const quizAverage =
    quizScores.length > 0
      ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
      : 0;

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
    quizAverage,
  });
});

export const analyticsRouter = router;
