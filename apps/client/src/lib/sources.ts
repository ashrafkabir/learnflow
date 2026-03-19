import type { Source } from '../components/CitationTooltip.js';

/**
 * Parse source references from lesson markdown content.
 *
 * Supports a few formats because the API can emit either bracketed references
 * or numbered lists inside a trailing Sources/References section.
 */
export function parseSources(content?: string): Source[] {
  if (!content) return [];
  const sources: Source[] = [];
  const seen = new Set<number>();

  // [1] Author. "Title" Publication, 2025. https://...
  const fmt1 = /\[(\d+)\]\s*(.*?)\.\s*"(.*?)"\s*(.*?),?\s*(\d{4})\.\s*(https?:\/\/\S+)/gm;
  let m;
  while ((m = fmt1.exec(content)) !== null) {
    const id = parseInt(m[1]);
    if (!seen.has(id)) {
      seen.add(id);
      sources.push({
        id,
        author: m[2],
        title: m[3],
        publication: m[4].replace(/,\s*$/, ''),
        year: parseInt(m[5]),
        url: m[6],
      });
    }
  }

  const refSection =
    content.match(/## (?:References|Sources|Further Reading)[\s\S]*$/im)?.[0] || '';

  // If the content contains an "## Examples" section after references, cut it off.
  // Regression guard: references must never be coerced into examples.
  const exampleIdx = refSection.search(/\n##\s+Examples\b/i);
  const refOnly = exampleIdx >= 0 ? refSection.slice(0, exampleIdx) : refSection;

  // 1. Author. "Title" ... , 2024. https://...
  const fmt2 = /^(\d+)\.\s*(.*?)\.\s*"(.*?)"(?:.*?,\s*(\d{4}))?\.\s*(https?:\/\/\S+)/gm;
  while ((m = fmt2.exec(refOnly)) !== null) {
    const id = parseInt(m[1]);
    if (!seen.has(id)) {
      seen.add(id);
      sources.push({
        id,
        author: m[2],
        title: m[3],
        publication: '',
        year: parseInt(m[4] || '2024'),
        url: m[5],
      });
    }
  }

  // [1](https://...)
  const fmt3 = /\[(\d+)\]\((https?:\/\/[^\s)]+)\)/gm;
  while ((m = fmt3.exec(content)) !== null) {
    const id = parseInt(m[1]);
    if (!seen.has(id)) {
      seen.add(id);
      sources.push({
        id,
        author: 'Source',
        title: `Reference ${id}`,
        publication: '',
        year: 2024,
        url: m[2],
      });
    }
  }

  // Best-effort URL extraction from the trailing references section.
  const urlRegex = /(?:^[-•*]\s*|^\d+\.\s*)(?:\[.*?\]\s*)?.*?(https?:\/\/\S+)/gm;
  while ((m = urlRegex.exec(refOnly)) !== null) {
    const nextId = sources.length + 1;
    const url = m[1].replace(/[).,;]+$/, '');
    if (!sources.find((s) => s.url === url)) {
      sources.push({
        id: nextId,
        author: 'Source',
        title: url.split('/').slice(2, 4).join('/'),
        publication: '',
        year: 2024,
        url,
      });
    }
  }

  return sources;
}

export function mergeUniqueSources(all: Source[]): Source[] {
  const byUrl = new Map<string, Source>();
  for (const s of all) {
    const url = String(s.url || '').trim();
    if (!url) continue;
    if (!byUrl.has(url)) byUrl.set(url, s);
  }
  return Array.from(byUrl.values()).sort((a, b) => a.id - b.id);
}
