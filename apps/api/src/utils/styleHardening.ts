export interface StyleHardeningResult {
  updated: string;
  changed: boolean;
  reasons: string[];
}

const BANNED_PHRASES: Array<{ re: RegExp; replacement?: string; reason: string }> = [
  {
    re: /\bin today['’]s world\b/gi,
    replacement: 'currently',
    reason: 'ban_phrase_in_todays_world',
  },
  { re: /\bever[-\s]?evolving\b/gi, replacement: 'changing', reason: 'ban_phrase_ever_evolving' },
  { re: /\brobust\b/gi, replacement: 'reliable', reason: 'ban_phrase_robust' },
  { re: /\bseamless\b/gi, replacement: 'smooth', reason: 'ban_phrase_seamless' },
  { re: /\bleverage\b/gi, replacement: 'use', reason: 'ban_phrase_leverage' },
  // "best practices" is too vague unless enumerated; we nudge wording.
  {
    re: /\bbest practices\b/gi,
    replacement: 'standard techniques',
    reason: 'ban_phrase_best_practices',
  },
];

// This is a best-effort non-LLM pass intended to reduce "AI template" phrases.
// It does NOT claim factual accuracy; it only rewrites vague wording.
export function hardenLessonStyle(md: string): StyleHardeningResult {
  let out = md;
  const reasons: string[] = [];

  for (const b of BANNED_PHRASES) {
    if (b.re.test(out)) {
      reasons.push(b.reason);
      out = out.replace(b.re, b.replacement ?? '');
    }
  }

  // "It depends" is OK only when followed by deciding variables; otherwise suggest specificity.
  // Heuristic: if line contains "it depends" but not "on" within next 20 chars, rewrite.
  out = out
    .split('\n')
    .map((line) => {
      const m = line.match(/\bit depends\b/i);
      if (!m) return line;
      const idx = m.index ?? -1;
      const tail = idx >= 0 ? line.slice(idx) : line;
      if (/\bit depends\s+on\b/i.test(tail)) return line;
      reasons.push('ban_phrase_it_depends_without_variables');
      return line.replace(/\bit depends\b/i, 'the answer changes based on');
    })
    .join('\n');

  return { updated: out, changed: out !== md, reasons };
}
