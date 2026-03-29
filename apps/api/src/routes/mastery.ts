import { Router, Request, Response } from 'express';
import { dbMastery } from '../db.js';

function parseGaps(gapsJson: string | null | undefined): string[] {
  try {
    const arr = JSON.parse(String(gapsJson || '[]'));
    return Array.isArray(arr) ? arr.map((x) => String(x)) : [];
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
