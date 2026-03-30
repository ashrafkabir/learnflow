/**
 * Iter141: Canonical concept tag normalization.
 *
 * Goals:
 * - Stable across runs (same input => same output)
 * - Human-readable and URL-safe-ish
 * - Works with existing quiz-gap heuristic (titleNorm includes tag)
 */

export function canonicalizeConceptTag(input: string): string {
  const raw = String(input || '')
    .trim()
    .toLowerCase();
  if (!raw) return '';

  // Keep letters/numbers/spaces/_-/.
  // Convert punctuation to spaces, collapse whitespace.
  const cleaned = raw
    .replace(/[^a-z0-9\s_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  // Prefer dash-separated single tag (UI-friendly) while preserving underscores.
  // Convert spaces to dashes.
  return cleaned.replace(/\s+/g, '-');
}

export function extractConceptTagsFromLesson(params: {
  lessonTitle?: string;
  moduleTitle?: string;
  courseTopic?: string;
}): string[] {
  // Deterministic heuristic: base tag from lesson title, plus optional module/topic tags.
  const tags: string[] = [];

  const primary = canonicalizeConceptTag(params.lessonTitle || '');
  if (primary) tags.push(primary);

  const mod = canonicalizeConceptTag(params.moduleTitle || '');
  if (mod && mod !== primary) tags.push(mod);

  const topic = canonicalizeConceptTag(params.courseTopic || '');
  if (topic && topic !== primary && topic !== mod) tags.push(topic);

  // Keep small (avoid blowing up payloads). First 3 deterministic.
  return tags.slice(0, 3);
}
