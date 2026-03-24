import type { FirecrawlSource } from '@learnflow/agents';

export type SourceCard = {
  title: string;
  url: string;
  provider: string;
  summary: string;
  relevance: string;
  keyConcepts: string[];
  accessedAt: string;
};

function dedupeByUrl<T extends { url: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of arr) {
    if (!x?.url) continue;
    if (seen.has(x.url)) continue;
    seen.add(x.url);
    out.push(x);
  }
  return out;
}

function normalizeProvider(s: FirecrawlSource): string {
  const p = String((s as any)?.provider || s.source || s.domain || '').trim();
  if (!p) return 'web';
  // Prefer a simple provider id instead of full domain where possible.
  const lower = p.toLowerCase();
  if (lower.includes('wikipedia')) return 'wikipedia';
  if (lower.includes('arxiv')) return 'arxiv';
  if (lower.includes('github')) return 'github';
  if (lower.includes('reddit')) return 'reddit';
  if (lower.includes('medium')) return 'medium';
  if (lower.includes('substack')) return 'substack';
  if (lower.includes('quora')) return 'quora';
  if (lower.includes('tavily')) return 'tavily';
  return lower;
}

function toKeyConcepts(s: FirecrawlSource, topic: string): string[] {
  const bag = `${s.title || ''} ${s.content || ''}`.toLowerCase();
  const tokens = bag
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const stop = new Set([
    'the',
    'and',
    'for',
    'with',
    'from',
    'this',
    'that',
    'are',
    'was',
    'were',
    'you',
    'your',
    'into',
    'about',
    'what',
    'when',
    'how',
    'why',
    'using',
    'use',
    'used',
    'learn',
    'guide',
    'tutorial',
    'introduction',
    'overview',
    'best',
    'practices',
    ...String(topic || '')
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean),
  ]);

  const freq = new Map<string, number>();
  for (const t of tokens) {
    if (t.length < 4) continue;
    if (stop.has(t)) continue;
    freq.set(t, (freq.get(t) || 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([t]) => t);
}

export function buildSourceCards(
  sources: FirecrawlSource[] | undefined,
  topic: string,
  opts?: { limit?: number; accessedAt?: string },
): SourceCard[] {
  const accessedAt = opts?.accessedAt || new Date().toISOString();
  const limit = Math.max(1, Math.min(60, opts?.limit ?? 40));
  const safe = dedupeByUrl(sources || []);

  return safe.slice(0, limit).map((s) => {
    const provider = normalizeProvider(s);
    const keyConcepts = toKeyConcepts(s, topic);

    const raw = String(s.content || '')
      .replace(/\s+/g, ' ')
      .trim();

    // Simple, non-LLM summary: first ~2 sentences (or ~220 chars), plus a plain-English "why it matters".
    const firstTwo = raw
      .replace(/\[(\d+)\]/g, '')
      .split(/(?<=[.!?])\s+/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(' ');

    const core = (firstTwo || raw.slice(0, 220)).trim();
    const why = keyConcepts.length
      ? `Why it matters: helps you understand ${keyConcepts.slice(0, 2).join(' and ')}.`
      : `Why it matters: provides practical background for ${topic}.`;

    const punct = /[.!?]$/.test(core) ? '' : '.';
    const summary = `${core}${punct} ${why}`.slice(0, 360);

    const relevance = `Relevant for ${topic} because it covers ${keyConcepts.slice(0, 2).join(' & ') || 'core concepts'}.`;

    return {
      title: s.title || s.url,
      url: s.url,
      provider,
      summary,
      relevance,
      keyConcepts,
      accessedAt,
    };
  });
}

export function selectFurtherReadingCards(
  cards: SourceCard[] | undefined,
  opts?: { min?: number; max?: number },
): SourceCard[] {
  const min = Math.max(0, Math.min(10, opts?.min ?? 2));
  const max = Math.max(min, Math.min(10, opts?.max ?? 5));
  const safe = cards || [];

  // Prefer diversity by provider, then fall back to the next best.
  const out: SourceCard[] = [];
  const usedProviders = new Set<string>();

  for (const c of safe) {
    if (out.length >= max) break;
    if (!usedProviders.has(c.provider)) {
      out.push(c);
      usedProviders.add(c.provider);
    }
  }

  if (out.length < min) {
    for (const c of safe) {
      if (out.length >= min) break;
      if (out.find((x) => x.url === c.url)) continue;
      out.push(c);
    }
  }

  return out.slice(0, max);
}

export function formatFurtherReadingBlock(cards: SourceCard[] | undefined): string {
  const safe = (cards || []).filter((c) => c?.url);
  if (safe.length === 0) return '';

  const lines = safe.map((c) => `- [${c.title}](${c.url}) — ${c.provider}`);
  return `\n\n## Further Reading\n\n${lines.join('\n')}\n`;
}
