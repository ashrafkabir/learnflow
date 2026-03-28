import type { FirecrawlSource } from '@learnflow/agents';
import type { LessonSource } from './sources.js';

export type StructuredLessonSource = {
  url: string;
  title: string;
  author?: string;
  /** publication name or site name (best-effort); prefer something user-readable */
  publication?: string;
  /** URL hostname without www */
  domain?: string;
  year?: number;
  license?: string;
  accessedAt: string; // ISO string

  // Iter76: Enrich sources so the client AttributionDrawer can render SourceCard-like fields.
  // These are best-effort and may be empty when upstream content is missing.
  sourceType?: 'docs' | 'blog' | 'paper' | 'forum';
  summary?: string;
  whyThisMatters?: string;
};

export function resolveLicenseForSource(source: {
  url?: string;
  domain?: string;
  publication?: string;
}): string {
  const d = String(source.domain || source.publication || '').toLowerCase();
  const url = String(source.url || '').toLowerCase();

  if (d.includes('wikipedia.org') || url.includes('wikipedia.org')) return 'CC BY-SA 4.0';
  if (d.includes('wikimedia.org') || url.includes('wikimedia.org'))
    return 'Varies (Wikimedia Commons file license)';
  if (d.includes('khanacademy.org') || url.includes('khanacademy.org')) return 'CC BY-NC-SA 4.0';
  if (d.includes('developer.mozilla.org') || url.includes('developer.mozilla.org'))
    return 'CC BY-SA 2.5';
  if (d.includes('mit.edu') || url.includes('ocw.mit.edu')) return 'CC BY-NC-SA';

  // Common doc sites (best-effort, not legally authoritative)
  if (d.includes('react.dev') || url.includes('react.dev')) return 'CC BY 4.0 (docs, best-effort)';
  if (d.includes('kubernetes.io') || url.includes('kubernetes.io'))
    return 'CC BY 4.0 (docs, best-effort)';
  if (d.includes('developer.apple.com') || url.includes('developer.apple.com'))
    return 'All rights reserved (Apple developer docs)';

  return 'unknown';
}

function safeDomain(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const h = new URL(url).hostname;
    return h.replace(/^www\./i, '') || undefined;
  } catch {
    return undefined;
  }
}

function normalizeTitle(title: string): string {
  const t = String(title || '').trim();
  if (!t) return '';
  // Collapse whitespace + strip trailing separators.
  return t
    .replace(/\s+/g, ' ')
    .replace(/[\s\-|–—:]+$/, '')
    .trim();
}

function bestEffortPublication(x: FirecrawlSource | LessonSource): string | undefined {
  const p = String((x as any).source || '').trim();
  if (p && p !== 'unknown') return p;
  const d = String((x as any).domain || '').trim();
  if (d && d !== 'unknown') return d;
  const u = safeDomain(x.url);
  return u || undefined;
}

function bestEffortYear(x: FirecrawlSource | LessonSource): number | undefined {
  // 1) publishDate if parseable
  if ((x as any).publishDate) {
    const dt = new Date((x as any).publishDate);
    const y = dt.getFullYear();
    if (!Number.isNaN(dt.getTime()) && y >= 1900 && y <= new Date().getFullYear() + 1) return y;
  }

  // 2) attempt to infer from title/URL (e.g., "... 2024" or /2023/)
  const text = `${x.title || ''} ${x.url || ''}`;
  const m = text.match(/\b(19\d{2}|20\d{2})\b/);
  if (m) {
    const y = Number(m[1]);
    if (y >= 1900 && y <= new Date().getFullYear() + 1) return y;
  }
  return undefined;
}

export function toStructuredLessonSources(
  sources: FirecrawlSource[] | LessonSource[] | undefined,
  opts?: { limit?: number; accessedAt?: string },
): StructuredLessonSource[] {
  const limit = opts?.limit ?? 4;
  const accessedAt = opts?.accessedAt ?? new Date().toISOString();
  const s = (sources || []).slice(0, limit);

  return s
    .filter((x) => !!x?.url)
    .map((x) => {
      const domain = safeDomain(x.url) || (x as any).domain || undefined;
      const publication = bestEffortPublication(x);
      const year = bestEffortYear(x);
      const title = normalizeTitle(x.title || x.url);

      const raw = String((x as any)?.content || '')
        .replace(/\s+/g, ' ')
        .trim();

      const summary = raw ? (raw.length <= 320 ? raw : raw.slice(0, 317).trimEnd() + '…') : '';

      // Best-effort sourceType inference (mirrors apps/api/utils/sourceCards.ts)
      const u = String(x.url || '').toLowerCase();
      const d = String(domain || '').toLowerCase();
      const isDocs =
        d.startsWith('docs.') ||
        u.includes('/docs') ||
        u.includes('/documentation') ||
        u.includes('readthedocs') ||
        d.startsWith('developer.') ||
        d.startsWith('api.') ||
        u.includes('/reference');

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

      const isForum =
        d === 'stackoverflow.com' ||
        d.endsWith('stackexchange.com') ||
        d === 'reddit.com' ||
        d === 'news.ycombinator.com' ||
        u.includes('/forum') ||
        u.includes('/discuss') ||
        u.includes('/questions/');

      const isBlog =
        u.includes('/blog') ||
        u.includes('/posts') ||
        u.includes('/article') ||
        d === 'medium.com' ||
        d.endsWith('substack.com') ||
        d.endsWith('blogspot.com') ||
        d.endsWith('wordpress.com');

      const sourceType: StructuredLessonSource['sourceType'] = isDocs
        ? 'docs'
        : isPaper
          ? 'paper'
          : isForum
            ? 'forum'
            : isBlog
              ? 'blog'
              : 'docs';

      const whyThisMatters =
        sourceType === 'docs'
          ? `Good for authoritative definitions and API details (${publication || domain || 'web'}).`
          : sourceType === 'paper'
            ? `Useful for evidence and evaluation (${publication || domain || 'web'}).`
            : sourceType === 'forum'
              ? `Shows real-world pitfalls and edge cases (${publication || domain || 'web'}).`
              : `Often includes step-by-step examples (${publication || domain || 'web'}) (verify against docs).`;

      return {
        url: x.url,
        title: title || x.url,
        author: x.author || undefined,
        publication: publication || undefined,
        domain,
        year,
        license: resolveLicenseForSource({ url: x.url, domain, publication }),
        accessedAt,
        sourceType,
        summary,
        whyThisMatters,
      } satisfies StructuredLessonSource;
    });
}
