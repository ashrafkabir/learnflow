import type { FirecrawlSource } from '@learnflow/agents';

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

function bestEffortPublication(x: FirecrawlSource): string | undefined {
  const p = String(x.source || '').trim();
  if (p && p !== 'unknown') return p;
  const d = String(x.domain || '').trim();
  if (d && d !== 'unknown') return d;
  const u = safeDomain(x.url);
  return u || undefined;
}

function bestEffortYear(x: FirecrawlSource): number | undefined {
  // 1) publishDate if parseable
  if (x.publishDate) {
    const dt = new Date(x.publishDate);
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
  sources: FirecrawlSource[] | undefined,
  opts?: { limit?: number; accessedAt?: string },
): StructuredLessonSource[] {
  const limit = opts?.limit ?? 4;
  const accessedAt = opts?.accessedAt ?? new Date().toISOString();
  const s = (sources || []).slice(0, limit);

  return s
    .filter((x) => !!x?.url)
    .map((x) => {
      const domain = safeDomain(x.url) || x.domain || undefined;
      const publication = bestEffortPublication(x);
      const year = bestEffortYear(x);
      const title = normalizeTitle(x.title || x.url);

      return {
        url: x.url,
        title: title || x.url,
        author: x.author || undefined,
        publication: publication || undefined,
        domain,
        year,
        license: resolveLicenseForSource({ url: x.url, domain, publication }),
        accessedAt,
      } satisfies StructuredLessonSource;
    });
}
