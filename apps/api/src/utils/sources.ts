export type LessonSource = {
  title: string;
  author?: string;
  publication?: string;
  year?: number;
  url: string;
};

/**
 * Best-effort server-side extraction of structured sources from lesson markdown.
 * Client still has a markdown parsing fallback.
 */
export function parseLessonSources(content?: string): LessonSource[] {
  if (!content) return [];

  const refSection =
    content.match(/## (?:References|Sources|Further Reading)[\s\S]*$/im)?.[0] || '';
  const exampleIdx = refSection.search(/\n##\s+Examples\b/i);
  const refOnly = exampleIdx >= 0 ? refSection.slice(0, exampleIdx) : refSection;

  const results: LessonSource[] = [];
  const seen = new Set<string>();

  // Format A: [1] Author. "Title" Publication, 2025. https://...
  // Also tolerates missing quotes around title.
  const fmt1 = /\[(\d+)\]\s*(.*?)\.\s*(?:"(.*?)"|(.*?))\s*(.*?),?\s*(\d{4})\.\s*(https?:\/\/\S+)/gm;

  // Format D: [1] Title — https://...
  const fmtD = /\[(\d+)\]\s*(.+?)\s+[—-]\s*(https?:\/\/\S+)/gm;
  let m: RegExpExecArray | null;
  while ((m = fmt1.exec(refOnly)) !== null) {
    const url = m[7].replace(/[).,;]+$/, '');
    if (seen.has(url)) continue;
    seen.add(url);
    const title = (m[3] || m[4] || '').trim();
    results.push({
      title: title || url.split('/').slice(2, 4).join('/'),
      author: m[2],
      publication: (m[5] || '').replace(/,\s*$/, ''),
      year: Number(m[6]),
      url,
    });
  }

  while ((m = fmtD.exec(refOnly)) !== null) {
    const url = m[3].replace(/[).,;]+$/, '');
    if (seen.has(url)) continue;
    seen.add(url);
    results.push({
      title: m[2].trim(),
      url,
    });
  }

  // Format B: - [Title](URL)
  const fmt2 = /^\s*[-•*]\s*\[(.+?)\]\((https?:\/\/[^\s)]+)\)/gm;

  // Format C: - Title — https://...
  const fmtC = /^\s*[-•*]\s*(.+?)\s+[—-]\s*(https?:\/\/[^\s)]+)\s*$/gm;

  // Format E: [1] Author (2025). Title. Publication.
  // (No URL → we cannot turn into resolvable link; intentionally skipped)
  while ((m = fmt2.exec(refOnly)) !== null) {
    const url = m[2].replace(/[).,;]+$/, '');
    if (seen.has(url)) continue;
    seen.add(url);
    results.push({ title: m[1], url });
  }

  while ((m = fmtC.exec(refOnly)) !== null) {
    const url = m[2].replace(/[).,;]+$/, '');
    if (seen.has(url)) continue;
    seen.add(url);
    results.push({ title: m[1].trim(), url });
  }

  // Fallback: any URL in references section
  const fmt3 = /https?:\/\/\S+/gm;
  while ((m = fmt3.exec(refOnly)) !== null) {
    const url = m[0].replace(/[).,;]+$/, '');
    if (seen.has(url)) continue;
    seen.add(url);
    results.push({ title: url.split('/').slice(2, 4).join('/'), url });
  }

  return results.slice(0, 12);
}
