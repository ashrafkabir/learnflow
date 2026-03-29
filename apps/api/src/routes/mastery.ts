import { Router, Request, Response } from 'express';
import { dbMastery } from '../db.js';

function parseGaps(gapsJson: string | null | undefined): string[] {
  try {
    const arr = JSON.parse(String(gapsJson || '[]'));
    if (!Array.isArray(arr)) return [];
    // Iter140: gaps may be stored as either string[] or {tag,...}[]
    return arr
      .map((x) => {
        if (typeof x === 'string') return String(x);
        if (x && typeof x === 'object' && (x as any).tag) return String((x as any).tag);
        return '';
      })
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function normalizeRow(r: any) {
  return {
    courseId: r.courseId,
    lessonId: r.lessonId,
    masteryLevel: Number(r.masteryLevel || 0),
    lastStudiedAt: r.lastStudiedAt || null,
    nextReviewAt: r.nextReviewAt || null,
    lastQuizScore:
      r.lastQuizScore === null || r.lastQuizScore === undefined ? null : Number(r.lastQuizScore),
    lastQuizAt: r.lastQuizAt || null,
    gaps: parseGaps(r.gapsJson),
    updatedAt: r.updatedAt,
  };
}

// GET /api/v1/courses/:id/mastery
export const masteryCourseRouter = Router({ mergeParams: true });
masteryCourseRouter.get('/', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const courseId = String(req.params.id);

  const rows = dbMastery.getByCourse(userId, courseId);
  res.status(200).json({ courseId, mastery: rows.map(normalizeRow) });
});

// GET /api/v1/courses/:id/lessons/:lessonId/mastery
export const masteryLessonRouter = Router({ mergeParams: true });
masteryLessonRouter.get('/', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const courseId = String(req.params.id);
  const lessonId = String(req.params.lessonId);

  const row = dbMastery.getByLesson(userId, courseId, lessonId);
  res.status(200).json({
    courseId,
    lessonId,
    mastery: row ? normalizeRow(row) : null,
  });
});
