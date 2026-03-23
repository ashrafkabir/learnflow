import { Router, Request, Response } from 'express';
import { courses } from './courses.js';
import { dbProgress, dbEvents } from '../db.js';

const router = Router();

function minutesFromEstimatedTime(estimatedTime?: number): number {
  const m = Number(estimatedTime || 0);
  if (!Number.isFinite(m) || m <= 0) return 5;
  return Math.max(3, Math.min(15, Math.round(m)));
}

// GET /api/v1/daily - Recommend today's lessons
// Deterministic, local-only heuristic (no network).
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const allCourses = Array.from(courses.values());

  // Strategy:
  // 1) Next uncompleted lesson per course ("continue")
  // 2) Review-due: recently completed lessons (best-effort, since no SM-2 yet)
  // 3) Fill to limit
  const limitRaw = Number(req.query.limit || 3);
  const limit = Math.max(1, Math.min(10, Number.isFinite(limitRaw) ? Math.round(limitRaw) : 3));

  const out: Array<{
    courseId: string;
    courseTitle: string;
    lessonId: string;
    lessonTitle: string;
    estimatedTime: number;
    reason: string;
  }> = [];

  // Completed lessons by course
  const completedByCourse = new Map<string, Set<string>>();
  for (const c of allCourses) {
    const completed = dbProgress.getCompletedLessons(userId, c.id);
    completedByCourse.set(c.id, new Set(completed));
  }

  // Review candidates: last 50 completion events, take unique lessons
  const events = dbEvents.list(userId, 200);
  const recentCompletedLessonIds = new Set<string>();
  for (const e of events) {
    if (e.type === 'lesson.completed' && e.lessonId) {
      recentCompletedLessonIds.add(String(e.lessonId));
      if (recentCompletedLessonIds.size >= 5) break;
    }
  }

  // 1) Continue learning (one per course)
  for (const c of allCourses) {
    const completedSet = completedByCourse.get(c.id) || new Set<string>();
    let next: any | null = null;
    for (const m of c.modules || []) {
      for (const l of m.lessons || []) {
        if (!completedSet.has(l.id)) {
          next = l;
          break;
        }
      }
      if (next) break;
    }
    if (next) {
      out.push({
        courseId: c.id,
        courseTitle: c.title,
        lessonId: next.id,
        lessonTitle: next.title,
        estimatedTime: minutesFromEstimatedTime(next.estimatedTime),
        reason: 'Continue: next uncompleted lesson',
      });
    }
    if (out.length >= limit) break;
  }

  // 2) Review queue (recently completed)
  if (out.length < limit && recentCompletedLessonIds.size > 0) {
    for (const c of allCourses) {
      for (const m of c.modules || []) {
        for (const l of m.lessons || []) {
          if (recentCompletedLessonIds.has(l.id)) {
            // Avoid duplicates
            if (!out.some((x) => x.lessonId === l.id)) {
              out.push({
                courseId: c.id,
                courseTitle: c.title,
                lessonId: l.id,
                lessonTitle: l.title,
                estimatedTime: minutesFromEstimatedTime(l.estimatedTime),
                reason: 'Review: spaced repetition (recent completion)',
              });
            }
          }
          if (out.length >= limit) break;
        }
        if (out.length >= limit) break;
      }
      if (out.length >= limit) break;
    }
  }

  res.status(200).json({
    date: new Date().toISOString().slice(0, 10),
    limit,
    lessons: out.slice(0, limit),
  });
});

export const dailyRouter = router;
