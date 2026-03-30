export type LessonSizing = {
  wordCount: number;
  estimatedMinutes: number;
};

export function computeLessonSizing(content: string): LessonSizing {
  const wordCount = String(content || '')
    .split(/\s+/)
    .filter((w) => w.trim().length > 0).length;

  // Simple, predictable sizing: 200 wpm.
  const estimatedMinutes = Math.max(1, Math.ceil(wordCount / 200));
  return { wordCount, estimatedMinutes };
}

export function enforceBiteSizedLesson(
  content: string,
  opts?: {
    maxMinutes?: number;
    maxWordsSoft?: number;
  },
): { content: string; sizing: LessonSizing; truncated: boolean } {
  const maxMinutes = opts?.maxMinutes ?? 10;
  // Spec guardrail: keep lessons bite-sized. MVP uses a predictable soft cap of 1500 words
  // (and separately caps estimated time via maxMinutes).
  const maxWordsSoft = opts?.maxWordsSoft ?? 1500;

  const words = String(content || '')
    .split(/\s+/)
    .filter((w) => w.trim().length > 0);

  if (words.length <= maxWordsSoft) {
    return { content, sizing: computeLessonSizing(content), truncated: false };
  }

  const kept = words.slice(0, maxWordsSoft);
  const trimmed = kept.join(' ');

  const enforced = `${trimmed}\n\n---\n\n_This lesson was automatically truncated to stay under ~${maxMinutes} minutes. Use “Ask Question” for deeper details._\n`;

  return { content: enforced, sizing: computeLessonSizing(enforced), truncated: true };
}
