import type { FirecrawlSource } from '@learnflow/agents';

export type SourceCard = {
  title: string;
  url: string;
  provider: string;
  summary: string;
  relevance: string;
  keyConcepts: string[];
  accessedAt: string;
  sourceType?: 'docs' | 'blog' | 'paper' | 'forum';
  whyThisMatters?: string;
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

export function extractiveSummary(text: string): string {
  const cleaned = String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/\[(\d+)\]/g, '')
    .trim();

  if (!cleaned) return '';

  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);

  const pick = sentences.slice(0, 2).join(' ').trim();
  const out = (pick || cleaned).trim();

  return out.length <= 320 ? out : out.slice(0, 317).trimEnd() + '…';
}

export function inferSourceType(url: string, domain?: string): SourceCard['sourceType'] {
  const u = String(url || '').toLowerCase();
  const d = String(domain || '').toLowerCase();

  const isDocs =
    d.startsWith('docs.') ||
    u.includes('/docs') ||
    u.includes('/documentation') ||
    u.includes('readthedocs') ||
    d.startsWith('developer.') ||
    d.startsWith('api.') ||
    u.includes('/reference');
  if (isDocs) return 'docs';

  const isPaper =
    d === 'arxiv.org' ||
    d.endsWith('.ac.uk') ||
    d.endsWith('.edu') ||
    u.includes('doi.org') ||
    u.includes('acm.org') ||
    u.includes('ieee.org') ||
    u.endsWith('.pdf') ||
    u.includes('/paper') ||
    u.includes('/papers');
  if (isPaper) return 'paper';

  const isForum =
    d === 'stackoverflow.com' ||
    d.endsWith('stackexchange.com') ||
    d === 'reddit.com' ||
    d === 'news.ycombinator.com' ||
    u.includes('/forum') ||
    u.includes('/discuss') ||
    u.includes('/questions/');
  if (isForum) return 'forum';

  const isBlog =
    u.includes('/blog') ||
    u.includes('/posts') ||
    u.includes('/article') ||
    d === 'medium.com' ||
    d.endsWith('substack.com') ||
    d.endsWith('blogspot.com') ||
    d.endsWith('wordpress.com');
  if (isBlog) return 'blog';

  return 'docs';
}

export function buildWhyThisMatters(params: {
  topic: string;
  sourceType: SourceCard['sourceType'];
  provider: string;
  keyConcepts: string[];
}): string {
  const { topic, sourceType, provider, keyConcepts } = params;

  const concepts = keyConcepts.slice(0, 2).join(' and ');
  switch (sourceType) {
    case 'docs':
      return concepts
        ? `Good for authoritative definitions and API details (${provider}); clarifies ${concepts}.`
        : `Good for authoritative definitions and API details (${provider}).`;
    case 'paper':
      return concepts
        ? `Useful for evidence and evaluation (${provider}); grounds ${concepts} in measured results.`
        : `Useful for evidence and evaluation (${provider}).`;
    case 'forum':
      return concepts
        ? `Shows real-world pitfalls and edge cases (${provider}); helpful when applying ${concepts}.`
        : `Shows real-world pitfalls and edge cases (${provider}).`;
    case 'blog':
      return concepts
        ? `Often includes step-by-step examples (${provider}); helps you implement ${concepts} (verify against docs).`
        : `Often includes step-by-step examples (${provider}) (verify against docs).`;
    default:
      return `Provides practical background for ${topic}.`;
  }
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

    // Iter74 P0.3: extractive 1–2 sentence summary + separate whyThisMatters.
    const summary = extractiveSummary(raw);

    const domain = (s as any)?.domain;
    const sourceType = inferSourceType(s.url, domain);
    const whyThisMatters = buildWhyThisMatters({
      topic,
      sourceType,
      provider,
      keyConcepts,
    });

    const relevance = `Relevant for ${topic} because it covers ${keyConcepts.slice(0, 2).join(' & ') || 'core concepts'}.`;

    return {
      title: s.title || s.url,
      url: s.url,
      provider,
      summary,
      relevance,
      keyConcepts,
      accessedAt,
      sourceType,
      whyThisMatters,
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
