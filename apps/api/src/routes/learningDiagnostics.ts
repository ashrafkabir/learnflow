import { Router, Request, Response } from 'express';
import { dbCourses, dbProgress, dbMastery } from '../db.js';

export const learningDiagnosticsRouter = Router();

// Dev-only learning loop diagnostics.
// Guard: only available when app.locals.devMode is true.
// Must never reveal secrets.
learningDiagnosticsRouter.get('/', (req: Request, res: Response) => {
  const devMode = Boolean((req.app as any)?.locals?.devMode);
  if (!devMode) {
    res.status(404).json({ error: 'not_found' });
    return;
  }

  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  // Today's Lessons breakdown (best-effort, local heuristic mirroring routes/daily.ts)
  const limit = 10;
  const nowIso = new Date().toISOString();

  const persisted = dbCourses.getAll?.() as any[];
  const allCourses = Array.isArray(persisted) ? persisted : [];

  const completedByCourse = new Map<string, Set<string>>();
  for (const c of allCourses) {
    const completed = dbProgress.getCompletedLessons(userId, c.id);
    completedByCourse.set(c.id, new Set(completed));
  }

  const lessons: Array<{
    reasonTag: string;
    courseId: string;
    lessonId: string;
    nextReviewAt?: string | null;
  }> = [];
  const seen = new Set<string>();

  function push(tag: string, courseId: string, lessonId: string, nextReviewAt?: string | null) {
    const key = `${courseId}:${lessonId}`;
    if (seen.has(key)) return;
    seen.add(key);
    lessons.push({ reasonTag: tag, courseId, lessonId, nextReviewAt: nextReviewAt || null });
  }

  // reviews due
  try {
    const due = dbMastery.listDue(userId, nowIso, limit);
    for (const row of due) {
      const courseId = String(row.courseId || '');
      const lessonId = String(row.lessonId || '');
      if (!courseId || !lessonId) continue;
      const completedSet = completedByCourse.get(courseId) || new Set<string>();
      if (completedSet.has(lessonId)) continue;
      push('review', courseId, lessonId, row.nextReviewAt || null);
      if (lessons.length >= limit) break;
    }
  } catch {
    // ignore
  }

  // continue
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
    if (next) push('continue', c.id, String(next.id), null);
    if (lessons.length >= limit) break;
  }

  const reasonCounts = lessons.reduce((acc: Record<string, number>, l) => {
    acc[l.reasonTag] = (acc[l.reasonTag] || 0) + 1;
    return acc;
  }, {});

  // Mastery summary counts
  let masteryRows: any[] = [];
  try {
    masteryRows = dbMastery.getByUser(userId);
  } catch {
    masteryRows = [];
  }

  const masteryCounts = { new: 0, learning: 0, solid: 0, mastered: 0 };
  for (const r of masteryRows) {
    const m = Number(r.masteryLevel || 0);
    if (m >= 0.85) masteryCounts.mastered++;
    else if (m >= 0.6) masteryCounts.solid++;
    else if (m > 0) masteryCounts.learning++;
    else masteryCounts.new++;
  }

  // Soonest nextReviewAt
  const soonestNextReviews = masteryRows
    .map((r) => ({
      courseId: String(r.courseId || ''),
      lessonId: String(r.lessonId || ''),
      nextReviewAt: r.nextReviewAt ? String(r.nextReviewAt) : null,
    }))
    .filter((r) => r.nextReviewAt)
    .sort((a, b) => Date.parse(String(a.nextReviewAt)) - Date.parse(String(b.nextReviewAt)))
    .slice(0, 3);

  res.status(200).json({
    userId,
    today: {
      limit,
      reasonCounts,
    },
    mastery: {
      counts: masteryCounts,
      soonestNextReviews,
    },
  });
});
