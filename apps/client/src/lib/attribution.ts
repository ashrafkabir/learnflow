import type { AttributionSource } from '../components/AttributionDrawer.js';

// Normalize various source shapes (lesson sources, conversation sources, legacy citation sources)
// into the AttributionDrawer's display contract.
export function normalizeAttributionSources(input: any): AttributionSource[] {
  const arr = Array.isArray(input) ? input : [];

  return arr.map((s: any, idx: number) => {
    const id = s?.id ?? idx + 1;
    const url = s?.url;

    // Prefer best-effort title
    const title = s?.title || s?.name || (typeof url === 'string' ? url : undefined);

    return {
      id,
      title,
      url,
      sourceType: s?.sourceType || s?.type,
      summary: s?.summary,
      whyThisMatters: s?.whyThisMatters,
      author: s?.author,
      publication: s?.publication,
      year: s?.year,
      license: s?.license,
      accessedAt: s?.accessedAt,
    };
  });
}
