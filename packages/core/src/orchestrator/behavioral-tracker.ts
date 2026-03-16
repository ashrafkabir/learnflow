import type { StudentContextObject } from '../context/student-context.js';

export interface LearningEvent {
  type: 'quiz_complete' | 'lesson_complete' | 'course_start' | 'session_start';
  data: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Updates StudentContextObject based on learning events.
 */
export function updateContextFromEvent(
  context: StudentContextObject,
  event: LearningEvent,
): StudentContextObject {
  const updated = { ...context };

  switch (event.type) {
    case 'quiz_complete': {
      const quizId = event.data.quizId as string;
      const score = event.data.score as number;
      updated.quizScores = { ...updated.quizScores, [quizId]: score };

      // Update strengths/weaknesses based on scores
      const topic = event.data.topic as string | undefined;
      if (topic) {
        if (score >= 0.9) {
          if (!updated.strengths.includes(topic)) {
            updated.strengths = [...updated.strengths, topic];
          }
          updated.weaknesses = updated.weaknesses.filter((w) => w !== topic);
        } else if (score < 0.6) {
          if (!updated.weaknesses.includes(topic)) {
            updated.weaknesses = [...updated.weaknesses, topic];
          }
          updated.strengths = updated.strengths.filter((s) => s !== topic);
        }
      }
      break;
    }

    case 'lesson_complete': {
      const lessonId = event.data.lessonId as string;
      if (!updated.completedLessonIds.includes(lessonId)) {
        updated.completedLessonIds = [...updated.completedLessonIds, lessonId];
      }
      updated.totalStudyMinutes += (event.data.minutesSpent as number) || 0;
      updated.lastActiveAt = event.timestamp;
      break;
    }

    case 'session_start': {
      updated.studyStreak = (updated.studyStreak || 0) + 1;
      updated.lastActiveAt = event.timestamp;
      break;
    }

    case 'course_start': {
      const courseId = event.data.courseId as string;
      if (!updated.enrolledCourseIds.includes(courseId)) {
        updated.enrolledCourseIds = [...updated.enrolledCourseIds, courseId];
      }
      break;
    }
  }

  return updated;
}
