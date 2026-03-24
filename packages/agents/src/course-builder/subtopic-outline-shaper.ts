import type { OutlineModule } from './domain-outline.js';

export type SubtopicShapingOptions = {
  /** Fraction of modules that must contain a subtopic phrase in the title. */
  minFractionWithSubtopicInTitle?: number;
};

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function normalize(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqPreserveOrder(items: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    const k = normalize(it);
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(String(it).trim());
  }
  return out;
}

function safeAppendTitle(base: string, suffix: string): string {
  const b = String(base || '').trim();
  const s = String(suffix || '').trim();
  if (!b) return s;
  if (!s) return b;

  const bn = normalize(b);
  const sn = normalize(s);
  if (bn.includes(sn)) return b;

  // Use an em dash to keep the base readable.
  return `${b} — ${s}`;
}

/**
 * Iter73 P0.2: Use extracted subtopics to force specific module titles + lesson phrasing.
 *
 * Deterministic:
 * - No randomness
 * - Subtopics used in order
 */
export function shapeOutlineWithSubtopics(
  modules: OutlineModule[],
  subtopics: string[] | undefined,
  opts: SubtopicShapingOptions = {},
): OutlineModule[] {
  const st = uniqPreserveOrder(subtopics || []).filter((s) => s.length >= 3);
  if (modules.length === 0 || st.length === 0) return modules;

  const frac = clamp01(opts.minFractionWithSubtopicInTitle ?? 0.6);
  const must = Math.max(1, Math.ceil(modules.length * frac));

  return modules.map((m, i) => {
    const subtopic = st[i % st.length];
    const shouldEnforce = i < must;

    const title = shouldEnforce ? safeAppendTitle(m.title, subtopic) : m.title;

    const lessons = (m.lessons || []).map((l, li) => {
      // If we enforce a subtopic in the module title, also anchor at least the first lesson.
      if (!shouldEnforce || !subtopic) return l;
      if (li !== 0) return l;

      const lt = safeAppendTitle(l.title, subtopic);
      const ldNorm = normalize(l.description);
      const stNorm = normalize(subtopic);
      const ld = ldNorm.includes(stNorm)
        ? l.description
        : `${String(l.description || '').trim()} (Focus: ${subtopic}.)`.trim();

      return { ...l, title: lt, description: ld };
    });

    return { ...m, title, lessons };
  });
}
