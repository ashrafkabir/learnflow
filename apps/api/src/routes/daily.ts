import { Router, Request, Response } from 'express';
import { courses } from './courses.js';
import { dbCourses, dbProgress, dbMastery } from '../db.js';

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

  // IMPORTANT: do not rely only on the in-memory `courses` map.
  // In tests and during background generation, the runtime cache may be empty or stale.
  // Use SQLite as the source of truth and fall back to the runtime cache.
  const persisted = dbCourses.getAll?.() as any[];
  const allCourses =
    Array.isArray(persisted) && persisted.length > 0 ? persisted : Array.from(courses.values());

  // Strategy (Iter138 MVP scheduler):
  // 1) Include due review lessons from mastery store (nextReviewAt <= now)
  // 2) Include next uncompleted lesson per course ("continue")
  // 3) Never recommend a completed lesson.
  const limitRaw = Number(req.query.limit || 3);
  const limit = Math.max(1, Math.min(10, Number.isFinite(limitRaw) ? Math.round(limitRaw) : 3));

  const out: Array<{
    courseId: string;
    courseTitle: string;
    lessonId: string;
    lessonTitle: string;
    estimatedTime: number;
    reasonTag: 'continue' | 'review' | 'new' | 'quiz_gap' | 'other';
    reason: string;
  }> = [];

  // Completed lessons by course
  const completedByCourse = new Map<string, Set<string>>();
  for (const c of allCourses) {
    const completed = dbProgress.getCompletedLessons(userId, c.id);
    completedByCourse.set(c.id, new Set(completed));
  }

  const seen = new Set<string>();

  function findLessonMeta(courseId: string, lessonId: string): { course: any; lesson: any } | null {
    const course = allCourses.find((c: any) => c.id === courseId);
    if (!course) return null;
    for (const m of course.modules || []) {
      for (const l of m.lessons || []) {
        if (l.id === lessonId) return { course, lesson: l };
      }
    }
    return null;
  }

  // 0) Reviews due (spaced repetition)
  try {
    const due = dbMastery.listDue(userId, new Date().toISOString(), limit);
    for (const row of due) {
      const courseId = String(row.courseId || '');
      const lessonId = String(row.lessonId || '');
      if (!courseId || !lessonId) continue;

      const completedSet = completedByCourse.get(courseId) || new Set<string>();
      if (completedSet.has(lessonId)) continue;

      const meta = findLessonMeta(courseId, lessonId);
      if (!meta) continue;

      const key = `${courseId}:${lessonId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      out.push({
        courseId,
        courseTitle: meta.course.title,
        lessonId,
        lessonTitle: meta.lesson.title,
        estimatedTime: minutesFromEstimatedTime(meta.lesson.estimatedTime),
        reasonTag: 'review',
        reason: 'Review: scheduled by spaced repetition',
      });
      if (out.length >= limit) break;
    }
  } catch {
    // best effort
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
      const key = `${c.id}:${next.id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      out.push({
        courseId: c.id,
        courseTitle: c.title,
        lessonId: next.id,
        lessonTitle: next.title,
        estimatedTime: minutesFromEstimatedTime(next.estimatedTime),
        reasonTag: 'continue',
        reason: 'Continue: next uncompleted lesson',
      });
    }
    if (out.length >= limit) break;
  }

  res.status(200).json({
    date: new Date().toISOString().slice(0, 10),
    limit,
    lessons: out.slice(0, limit),
  });
});

export const dailyRouter = router;
