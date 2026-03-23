import type { FirecrawlSource } from '@learnflow/agents';

export type StructuredLessonSource = {
  url: string;
  title: string;
  author?: string;
  publication?: string;
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

  return 'unknown';
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
      const year = x.publishDate ? new Date(x.publishDate).getFullYear() : undefined;
      const publication = x.source || x.domain;
      return {
        url: x.url,
        title: x.title || x.url,
        author: x.author || undefined,
        publication: publication || undefined,
        year,
        license: resolveLicenseForSource({ url: x.url, domain: x.domain, publication }),
        accessedAt,
      } satisfies StructuredLessonSource;
    });
}
