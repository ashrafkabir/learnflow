export type LessonQualityTelemetry = {
  lessonId: string;
  courseId: string;
  generationAttemptCount: number;
  finalStatus: 'pass' | 'fail';
  reasons: string[];
  wordCount?: number;
  createdAt: string;
};

export function buildLessonQualityTelemetry(params: {
  lessonId: string;
  courseId: string;
  generationAttemptCount: number;
  ok: boolean;
  reasons: string[];
  wordCount?: number;
}): LessonQualityTelemetry {
  return {
    lessonId: params.lessonId,
    courseId: params.courseId,
    generationAttemptCount: Math.max(1, params.generationAttemptCount || 1),
    finalStatus: params.ok ? 'pass' : 'fail',
    reasons: (params.reasons || []).map(String),
    wordCount: params.wordCount,
    createdAt: new Date().toISOString(),
  };
}
