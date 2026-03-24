import type { FirecrawlSource } from '../content-pipeline/firecrawl-provider.js';

export type ExtractSubtopicsOptions = {
  min?: number;
  max?: number;
};

const STOPWORDS = new Set(
  [
    'the',
    'and',
    'for',
    'with',
    'from',
    'that',
    'this',
    'these',
    'those',
    'into',
    'onto',
    'over',
    'under',
    'between',
    'within',
    'without',
    'about',
    'your',
    'you',
    'our',
    'their',
    'them',
    'they',
    'what',
    'when',
    'where',
    'why',
    'how',
    'can',
    'could',
    'should',
    'would',
    'will',
    'may',
    'might',
    'not',
    'are',
    'is',
    'was',
    'were',
    'be',
    'been',
    'being',
    'a',
    'an',
    'to',
    'of',
    'in',
    'on',
    'at',
    'as',
    'by',
    'or',
    'if',
    'it',
    'we',
    'i',
  ].map((s) => s.toLowerCase()),
);

function tokenize(text: string): string[] {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => t.length >= 3)
    .filter((t) => !STOPWORDS.has(t));
}

function titleCase(phrase: string): string {
  return phrase
    .split(/\s+/)
    .map((w) => (w.length <= 2 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(' ');
}

function uniqPreserveOrder(items: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    const k = it.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

/**
 * Iter73 P0.2 — lightweight topic decomposition concept extraction (8–15 subtopics).
 *
 * Deterministic behavior:
 * - No randomness
 * - Sort/tie-breakers are lexical
 */
export function extractTopicSubtopics(
  topic: string,
  sources?: Pick<FirecrawlSource, 'title' | 'content'>[],
  opts: ExtractSubtopicsOptions = {},
): string[] {
  const min = Math.max(1, opts.min ?? 8);
  const max = Math.max(min, opts.max ?? 15);

  const topicTokens = tokenize(topic);
  const topicKey = topicTokens.slice(0, 3).join(' ');

  const corpus = (sources || []).map((s) => `${s.title || ''}\n${s.content || ''}`).join('\n\n');

  const tokens = corpus ? tokenize(corpus) : [];

  // Build unigram + bigram counts.
  const uni = new Map<string, number>();
  const bi = new Map<string, number>();

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    uni.set(t, (uni.get(t) || 0) + 1);
    if (i + 1 < tokens.length) {
      const b = `${tokens[i]} ${tokens[i + 1]}`;
      bi.set(b, (bi.get(b) || 0) + 1);
    }
  }

  const bigramCandidates = Array.from(bi.entries())
    .filter(([k, v]) => v >= 2 && k.split(' ').every((w) => w.length >= 3))
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .map(([k]) => titleCase(k));

  const unigramCandidates = Array.from(uni.entries())
    .filter(([k, v]) => v >= 3 && k.length >= 4)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .map(([k]) => titleCase(k));

  const seededFromTopic = buildTopicSeedSubtopics(topic);

  // Prefer: bigrams from sources, then unigrams, then topic seeds.
  const merged = uniqPreserveOrder([...bigramCandidates, ...unigramCandidates, ...seededFromTopic]);

  // Avoid echoing the entire topic text as a "subtopic".
  const filtered = merged.filter((s) => {
    const lower = s.toLowerCase();
    if (!lower) return false;
    if (topicKey && lower.includes(topicKey)) return false;
    return true;
  });

  const clipped = filtered.slice(0, max);

  // Guarantee minimum size using deterministic fallbacks.
  if (clipped.length >= min) return clipped;

  const padded = [...clipped];
  const fallback = buildGenericLearningSubtopics(topic);
  for (const f of fallback) {
    if (padded.length >= min) break;
    if (!padded.some((x) => x.toLowerCase() === f.toLowerCase())) padded.push(f);
  }

  return padded.slice(0, max);
}

function buildTopicSeedSubtopics(topic: string): string[] {
  const raw = String(topic || '').trim();
  const t = raw || 'the topic';

  // Pull salient tokens (e.g., "Rust", "Kubernetes").
  const toks = tokenize(raw)
    .filter((w) => !/\d+/.test(w))
    .slice(0, 6)
    .map((w) => titleCase(w));

  const seeds: string[] = [];
  for (const tk of toks) {
    seeds.push(`${tk} Basics`);
    seeds.push(`${tk} Pitfalls`);
  }

  // Add a couple of stable, topic-anchored phrases.
  seeds.push(`${t}: Key Terms`);
  seeds.push(`${t}: Worked Example`);
  seeds.push(`${t}: Troubleshooting`);

  return uniqPreserveOrder(seeds.map((s) => s.replace(/\s+/g, ' ').trim())).slice(0, 12);
}

function buildGenericLearningSubtopics(topic: string): string[] {
  const t = String(topic || '').trim() || 'the topic';
  return [
    `Definitions and vocabulary (${t})`,
    `Core mental models (${t})`,
    `Common mistakes (${t})`,
    `A step-by-step example (${t})`,
    `Checklists and self-tests (${t})`,
    `Next steps and extensions (${t})`,
  ];
}
