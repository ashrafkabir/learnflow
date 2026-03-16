/**
 * Lesson Formatter — chunks content to ≤1500 words per lesson.
 * Implements spec Section 6.2 lesson structure.
 */

export interface FormattedLesson {
  title: string;
  estimatedMinutes: number;
  learningObjectives: string[];
  content: string;
  keyTakeaways: string[];
  sources: Array<{ url: string; title: string }>;
  nextSteps: string[];
  quickCheck: string[];
}

const MAX_WORDS_PER_LESSON = 1500;
const WORDS_PER_MINUTE = 200; // average reading speed

/**
 * Split long content into bite-sized lessons.
 */
export function formatLessons(
  fullContent: string,
  topic: string,
  sources: Array<{ url: string; title: string }> = [],
): FormattedLesson[] {
  const words = fullContent.split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  if (totalWords === 0) return [];

  const numLessons = Math.ceil(totalWords / MAX_WORDS_PER_LESSON);
  const wordsPerLesson = Math.ceil(totalWords / numLessons);

  const lessons: FormattedLesson[] = [];

  for (let i = 0; i < numLessons; i++) {
    const start = i * wordsPerLesson;
    const end = Math.min(start + wordsPerLesson, totalWords);
    const lessonWords = words.slice(start, end);
    const lessonContent = lessonWords.join(' ');
    const wordCount = lessonWords.length;
    const estimatedMinutes = Math.ceil(wordCount / WORDS_PER_MINUTE);

    lessons.push({
      title: `${topic} — Part ${i + 1}`,
      estimatedMinutes,
      learningObjectives: [
        `Understand key concepts in section ${i + 1}`,
        `Apply knowledge from this lesson`,
      ],
      content: lessonContent,
      keyTakeaways: [`Key concept from section ${i + 1}`],
      sources,
      nextSteps:
        i < numLessons - 1 ? [`Continue to Part ${i + 2}`] : ['Review all lessons', 'Take a quiz'],
      quickCheck: [`What is the main idea of this section?`],
    });
  }

  return lessons;
}

/**
 * Calculate estimated reading time for a text.
 */
export function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(words / WORDS_PER_MINUTE);
}
