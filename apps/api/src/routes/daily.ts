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

  // Strategy (Iter140 scheduler):
  // 0) Include quiz-gap-driven items (recent quiz gaps; deterministic local heuristic)
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

  function normTag(s: string): string {
    return String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s_-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function extractGapTags(raw: any): string[] {
    // Iter140: stored as either string[] or {tag,lastSeenAt,count,lastScore}[]
    try {
      const arr = JSON.parse(String(raw || '[]')) as any[];
      if (!Array.isArray(arr)) return [];
      const tags = arr
        .map((x) => {
          if (typeof x === 'string') return String(x);
          if (x && typeof x === 'object' && (x as any).tag) return String((x as any).tag);
          return '';
        })
        .map((t) => t.trim())
        .filter(Boolean);
      return Array.from(new Set(tags));
    } catch {
      return [];
    }
  }

  function gapEntryMeta(
    raw: any,
    tag: string,
  ): { lastSeenAt: string | null; count: number; lastScore: number | null } {
    try {
      const arr = JSON.parse(String(raw || '[]')) as any[];
      if (!Array.isArray(arr)) return { lastSeenAt: null, count: 0, lastScore: null };
      for (const x of arr) {
        if (x && typeof x === 'object' && String((x as any).tag || '') === tag) {
          const lastSeenAt = (x as any).lastSeenAt ? String((x as any).lastSeenAt) : null;
          const countRaw = Number((x as any).count || 0);
          const count = Number.isFinite(countRaw) ? Math.max(0, Math.round(countRaw)) : 0;
          const ls = (x as any).lastScore;
          const lastScore = ls === null || ls === undefined ? null : Number(ls);
          return {
            lastSeenAt,
            count,
            lastScore: Number.isFinite(lastScore as any) ? lastScore : null,
          };
        }
      }
      return { lastSeenAt: null, count: 0, lastScore: null };
    } catch {
      return { lastSeenAt: null, count: 0, lastScore: null };
    }
  }

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

  // 0) Quiz gaps (recent): recommend a lesson whose title matches the gap tag.
  try {
    const now = Date.now();
    const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
    const masteryRows = dbMastery.getByUser(userId) as any[];

    type GapSignal = {
      tag: string;
      courseId: string;
      lessonId: string;
      lastSeenAt: string | null;
      count: number;
      lastScore: number | null;
    };

    const signals: GapSignal[] = [];
    for (const r of masteryRows || []) {
      const courseId = String((r as any).courseId || '');
      const lessonId = String((r as any).lessonId || '');
      if (!courseId || !lessonId) continue;

      const tags = extractGapTags((r as any).gapsJson);
      for (const tag of tags) {
        const m = gapEntryMeta((r as any).gapsJson, tag);
        const ts = m.lastSeenAt ? Date.parse(m.lastSeenAt) : NaN;
        if (!Number.isFinite(ts)) continue;
        if (now - ts > MAX_AGE_MS) continue;
        signals.push({
          tag,
          courseId,
          lessonId,
          lastSeenAt: m.lastSeenAt,
          count: m.count,
          lastScore: m.lastScore,
        });
      }
    }

    // Deterministic: sort by recency desc, then count desc, then tag.
    signals.sort((a, b) => {
      const ad = Date.parse(a.lastSeenAt || '');
      const bd = Date.parse(b.lastSeenAt || '');
      if (Number.isFinite(ad) && Number.isFinite(bd) && bd !== ad) return bd - ad;
      if ((b.count || 0) !== (a.count || 0)) return (b.count || 0) - (a.count || 0);
      return String(a.tag).localeCompare(String(b.tag));
    });

    // Try to map each tag to a lesson in the same course with a title match.
    for (const s of signals) {
      if (out.length >= limit) break;

      const course = allCourses.find((c: any) => c.id === s.courseId);
      if (!course) continue;

      const completedSet = completedByCourse.get(course.id) || new Set<string>();

      const nt = normTag(s.tag);
      if (!nt) continue;

      let candidate: any | null = null;
      for (const m of course.modules || []) {
        for (const l of m.lessons || []) {
          if (completedSet.has(l.id)) continue;
          const titleNorm = normTag(l.title || '');
          if (!titleNorm) continue;
          if (titleNorm.includes(nt) || nt.includes(titleNorm)) {
            candidate = l;
            break;
          }
        }
        if (candidate) break;
      }

      if (!candidate) continue;

      const key = `${course.id}:${candidate.id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      out.push({
        courseId: course.id,
        courseTitle: course.title,
        lessonId: candidate.id,
        lessonTitle: candidate.title,
        estimatedTime: minutesFromEstimatedTime(candidate.estimatedTime),
        reasonTag: 'quiz_gap',
        reason: `Focus: ${s.tag} (from last quiz)`,
      });
    }
  } catch {
    // best effort
  }

  // 1) Reviews due (spaced repetition)
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

  // 2) Continue learning (one per course)
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
