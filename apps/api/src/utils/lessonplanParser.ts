export type LessonplanLessonSources = {
  moduleIndex: number;
  lessonIndex: number;
  lessonTitle: string;
  urls: string[];
};

function normalizeUrl(u: string): string {
  return String(u || '').trim();
}

function isHttpUrl(u: string): boolean {
  return /^https?:\/\//i.test(String(u || '').trim());
}

/**
 * Parse recommended source URLs from lessonplan.md.
 *
 * Expected loose structure (best-effort):
 * - Lesson headings: "#### Lesson 1.2: Title" OR "#### Lesson 1: Title"
 * - A subsection or bullets containing URLs under a "Recommended sources" label.
 *
 * We do NOT attempt full markdown parsing; this is intentionally tolerant.
 */
export function parseLessonplanRecommendedSources(md: string): LessonplanLessonSources[] {
  const text = String(md || '');
  const lines = text.split(/\r?\n/);

  const out: LessonplanLessonSources[] = [];

  let curModuleIndex = -1;
  let curLessonIndex = -1;
  let curLessonTitle = '';
  let curUrls: string[] = [];
  let inRecommended = false;

  const flush = () => {
    if (curModuleIndex >= 0 && curLessonIndex >= 0) {
      const uniq = Array.from(new Set(curUrls.map(normalizeUrl).filter(isHttpUrl)));
      out.push({
        moduleIndex: curModuleIndex,
        lessonIndex: curLessonIndex,
        lessonTitle: curLessonTitle,
        urls: uniq,
      });
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    const modMatch = line.match(/^###\s+Module\s+(\d+)/i);
    if (modMatch) {
      // starting a new module flushes any prior lesson
      flush();
      curLessonIndex = -1;
      curLessonTitle = '';
      curUrls = [];
      inRecommended = false;
      curModuleIndex = Math.max(0, Number(modMatch[1]) - 1);
      continue;
    }

    const lessonMatch = line.match(/^####\s+Lesson\s+(\d+)(?:\.(\d+))?\s*:\s*(.+)$/i);
    if (lessonMatch) {
      flush();
      const a = Number(lessonMatch[1]);
      const b = lessonMatch[2] != null ? Number(lessonMatch[2]) : null;

      if (b != null && !Number.isNaN(b)) {
        curModuleIndex = Math.max(0, a - 1);
        curLessonIndex = Math.max(0, b - 1);
      } else {
        // If format is "Lesson 3: ..." we can only treat it as lessonIndex within current module.
        curLessonIndex = Math.max(0, a - 1);
      }
      curLessonTitle = String(lessonMatch[3] || '').trim();
      curUrls = [];
      inRecommended = false;
      continue;
    }

    if (/^[-*]\s*Recommended\s+sources\s*:?\s*$/i.test(line) || /^Recommended\s+sources\s*:?$/i.test(line)) {
      inRecommended = true;
      continue;
    }

    // Stop recommended section when we hit a new heading.
    if (inRecommended && /^#{2,6}\s+/.test(line)) {
      inRecommended = false;
    }

    if (!inRecommended) continue;

    // Bullet url or raw url
    const urlMatch = line.match(/https?:\/\/[^\s)\]]+/i);
    if (urlMatch) {
      curUrls.push(normalizeUrl(urlMatch[0]));
    }
  }

  flush();

  return out;
}
