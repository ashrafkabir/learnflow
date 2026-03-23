export const REQUIRED_LESSON_HEADINGS = [
  '## Learning Objectives',
  '## Estimated Time',
  '## Core Concepts',
  '## Worked Example',
  '## Recap',
  '## Quick Check',
  '## Sources',
  '## Next Steps',
] as const;

export function normalizeHeading(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function lessonHasRequiredStructure(markdown: string): {
  ok: boolean;
  missing: string[];
} {
  const hay = markdown || '';
  const normalized = normalizeHeading(hay);

  const missing = REQUIRED_LESSON_HEADINGS.filter((h) => {
    const needle = normalizeHeading(h);
    return !normalized.includes(needle);
  });

  return { ok: missing.length === 0, missing };
}
