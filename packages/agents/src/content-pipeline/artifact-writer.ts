/**
 * Artifact Writer
 *
 * Persists research bundles (sources + extracted markdown + image manifests)
 * onto disk so later pipeline stages can operate without re-scraping.
 */

import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export type ResearchImageArtifact = {
  url: string;
  alt?: string;
  credit?: string;
  license?: string;
  sourceUrl: string;
};

export type ResearchSourceArtifact = {
  url: string;
  title?: string;
  publisher?: string;
  accessedAt: string;
  snippet?: string;
  extractedText?: string;
  images?: ResearchImageArtifact[];
};

export type ResearchBundle = {
  topic: string;
  sources: ResearchSourceArtifact[];
  sourcesMissingReason?: string;
  /** optional trace/debug fields */
  topics?: string[];
  queries?: string[];
  parsedResultsCount?: number;
  rawCount?: number;
};

function sanitizeId(id: string): string {
  return String(id).replace(/[^a-zA-Z0-9_-]+/g, '-');
}

function safeSlugFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const base = `${u.hostname}${u.pathname}`.replace(/\/+$/g, '');
    const slug = base
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 120);
    return slug || sanitizeId(u.hostname);
  } catch {
    return sanitizeId(url).slice(0, 120);
  }
}

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

async function writeJson(path: string, obj: unknown): Promise<void> {
  await ensureDir(dirname(path));
  await writeFile(path, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

async function writeText(path: string, text: string): Promise<void> {
  await ensureDir(dirname(path));
  await writeFile(path, text, 'utf8');
}

export function courseArtifactsRoot(courseId: string): string {
  // Deterministic default under repo root, but allow tests/dev harnesses to override.
  const base = process.env.LEARNFLOW_ARTIFACTS_ROOT || join(process.cwd(), 'learnflow');
  return join(base, 'course-artifacts', sanitizeId(courseId));
}

export async function writeCourseResearch(
  courseId: string,
  bundle: ResearchBundle,
): Promise<string> {
  const root = join(courseArtifactsRoot(courseId), 'research', 'course');
  const extractedDir = join(root, 'extracted');

  // sources.json (normalized)
  await writeJson(join(root, 'sources.json'), {
    topic: bundle.topic,
    sourcesMissingReason: bundle.sourcesMissingReason || null,
    topics: bundle.topics || null,
    queries: bundle.queries || null,
    parsedResultsCount:
      typeof bundle.parsedResultsCount === 'number' ? bundle.parsedResultsCount : null,
    rawCount: typeof bundle.rawCount === 'number' ? bundle.rawCount : null,
    sources: bundle.sources.map((s) => ({
      url: s.url,
      title: s.title,
      publisher: s.publisher,
      accessedAt: s.accessedAt,
      snippet: s.snippet,
      // Keep a bounded copy of extracted text in JSON so the lesson generator can
      // rehydrate without depending on filename mapping for extracted/*.md.
      extractedText: (s.extractedText || '').slice(0, 50_000),
    })),
  });

  // images.json (flattened w/ attribution)
  const allImages = (bundle.sources || []).flatMap((s) =>
    (s.images || []).map((img) => ({ ...img, sourceUrl: s.url })),
  );
  await writeJson(join(root, 'images.json'), { images: allImages });

  // extracted markdown per source
  for (const s of bundle.sources || []) {
    const name = safeSlugFromUrl(s.url);
    const md =
      `# ${s.title || s.url}\n\n` +
      `URL: ${s.url}\n\n` +
      (s.publisher ? `Publisher: ${s.publisher}\n\n` : '') +
      `AccessedAt: ${s.accessedAt}\n\n` +
      (s.snippet ? `Snippet: ${s.snippet}\n\n` : '') +
      `---\n\n` +
      `${(s.extractedText || '').trim()}\n`;
    await writeText(join(extractedDir, `${name}.md`), md);
  }

  return root;
}

export async function writeLessonResearch(
  courseId: string,
  lessonId: string,
  bundle: ResearchBundle,
): Promise<string> {
  const root = join(courseArtifactsRoot(courseId), 'research', 'lessons', sanitizeId(lessonId));
  const extractedDir = join(root, 'extracted');

  await writeJson(join(root, 'sources.json'), {
    topic: bundle.topic,
    lessonId,
    sourcesMissingReason: bundle.sourcesMissingReason || null,
    sources: bundle.sources.map((s) => ({
      url: s.url,
      title: s.title,
      publisher: s.publisher,
      accessedAt: s.accessedAt,
      snippet: s.snippet,
      extractedText: (s.extractedText || '').slice(0, 50_000),
    })),
  });

  const allImages = (bundle.sources || []).flatMap((s) =>
    (s.images || []).map((img) => ({ ...img, sourceUrl: s.url })),
  );
  await writeJson(join(root, 'images.json'), { images: allImages });

  for (const s of bundle.sources || []) {
    const name = safeSlugFromUrl(s.url);
    const md =
      `# ${s.title || s.url}\n\n` +
      `URL: ${s.url}\n\n` +
      (s.publisher ? `Publisher: ${s.publisher}\n\n` : '') +
      `AccessedAt: ${s.accessedAt}\n\n` +
      (s.snippet ? `Snippet: ${s.snippet}\n\n` : '') +
      `---\n\n` +
      `${(s.extractedText || '').trim()}\n`;
    await writeText(join(extractedDir, `${name}.md`), md);
  }

  return root;
}

export async function writeLessonPlan(courseId: string, plan: unknown): Promise<string> {
  const root = courseArtifactsRoot(courseId);
  const outPath = join(root, 'lesson-plan.json');
  await writeJson(outPath, plan);
  return outPath;
}

function formatMdTableRow(cols: string[]): string {
  const esc = (s: string) =>
    String(s || '')
      .replace(/\|/g, '\\|')
      .replace(/\r?\n/g, ' ')
      .trim();
  return `| ${cols.map(esc).join(' | ')} |`;
}

function boundText(input: string, maxChars: number): string {
  const s = String(input || '').trim();
  if (!s) return '';
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars).trimEnd() + '\n\n…(truncated)…\n';
}

export async function writeCourseResearchMarkdown(courseId: string): Promise<string> {
  const root = courseArtifactsRoot(courseId);
  const courseRoot = join(root, 'research', 'course');

  const sourcesRaw = await readFile(join(courseRoot, 'sources.json'), 'utf8');
  const sourcesJson = JSON.parse(sourcesRaw);
  const topic = String(sourcesJson?.topic || '');
  const sources = Array.isArray(sourcesJson?.sources) ? sourcesJson.sources : [];
  const topics = Array.isArray(sourcesJson?.topics) ? sourcesJson.topics : [];
  const queries = Array.isArray(sourcesJson?.queries) ? sourcesJson.queries : [];

  let images: any[] = [];
  try {
    const imagesRaw = await readFile(join(courseRoot, 'images.json'), 'utf8');
    const imagesJson = JSON.parse(imagesRaw);
    images = Array.isArray(imagesJson?.images) ? imagesJson.images : [];
  } catch {
    images = [];
  }

  // Best-effort read extracted markdown (already has bounded extractedText too)
  let extractedIndex: Record<string, string> = {};
  try {
    const extractedDir = join(courseRoot, 'extracted');
    const files = (await readdir(extractedDir)).filter((n) => n.endsWith('.md')).slice(0, 120);
    for (const f of files) {
      try {
        extractedIndex[f] = await readFile(join(extractedDir, f), 'utf8');
      } catch {
        // ignore
      }
    }
  } catch {
    extractedIndex = {};
  }

  const generatedAt = new Date().toISOString();

  let md = '';
  md += `# Course Research\n\n`;
  md += `- **Topic:** ${topic || '(unknown)'}\n`;
  md += `- **courseId:** ${courseId}\n`;
  md += `- **generatedAt:** ${generatedAt}\n\n`;

  if (topics.length || queries.length) {
    md += `## Discovery details\n\n`;
    if (topics.length) {
      md += `**Topics/Subtopics used**\n\n`;
      md +=
        topics
          .slice(0, 40)
          .map((t: any) => `- ${String(t)}`)
          .join('\n') + '\n\n';
    }
    if (queries.length) {
      md += `**Queries executed**\n\n`;
      md +=
        queries
          .slice(0, 40)
          .map((q: any) => `- ${String(q)}`)
          .join('\n') + '\n\n';
    }
  }

  md += `## Sources index\n\n`;
  md += formatMdTableRow(['#', 'Title', 'URL', 'Publisher', 'AccessedAt']) + '\n';
  md += formatMdTableRow(['---', '---', '---', '---', '---']) + '\n';
  sources.forEach((s: any, i: number) => {
    md +=
      formatMdTableRow([
        String(i + 1),
        String(s?.title || ''),
        String(s?.url || ''),
        String(s?.publisher || ''),
        String(s?.accessedAt || ''),
      ]) + '\n';
  });
  md += '\n';

  md += `## Per-source extracts\n\n`;

  sources.forEach((s: any, i: number) => {
    const url = String(s?.url || '');
    const title = String(s?.title || url);
    const publisher = s?.publisher ? String(s.publisher) : '';
    const accessedAt = s?.accessedAt ? String(s.accessedAt) : '';
    const snippet = s?.snippet ? String(s.snippet) : '';

    md += `### [${i + 1}] ${title}\n\n`;
    md += `- **URL:** ${url}\n`;
    if (publisher) md += `- **Publisher:** ${publisher}\n`;
    if (accessedAt) md += `- **AccessedAt:** ${accessedAt}\n`;
    md += '\n';

    if (snippet) {
      md += `**Snippet**\n\n`;
      md += `> ${boundText(snippet, 800).replace(/\n/g, '\n> ')}\n\n`;
    }

    const extractedFromJson = s?.extractedText ? String(s.extractedText) : '';
    const extracted = boundText(extractedFromJson, 12_000);

    md += `**Extracted text (bounded)**\n\n`;
    md += extracted ? extracted + '\n\n' : '(no extracted text)\n\n';

    // List related extracted/*.md files as traceability (not guaranteed 1:1 mapping)
    const extractedFiles = Object.keys(extractedIndex);
    if (extractedFiles.length) {
      md += `**Extracted files present**\n\n`;
      md += extractedFiles
        .slice(0, 20)
        .map((f) => `- research/course/extracted/${f}`)
        .join('\n');
      md += '\n\n';
    }

    const imgs = images.filter((img: any) => String(img?.sourceUrl || '') === url);
    if (imgs.length) {
      md += `**Images (license/attribution)**\n\n`;
      for (const img of imgs.slice(0, 12)) {
        md += `- ${String(img?.url || '')}`;
        const parts = [
          img?.alt ? `alt: ${String(img.alt)}` : null,
          img?.credit ? `credit: ${String(img.credit)}` : null,
          img?.license ? `license: ${String(img.license)}` : null,
        ].filter(Boolean);
        if (parts.length) md += ` (${parts.join(' | ')})`;
        md += '\n';
      }
      md += '\n';
    }

    md += `---\n\n`;
  });

  const outPath = join(root, 'course-research.md');
  await writeText(outPath, md);
  return outPath;
}

export async function writeLessonPlanMarkdown(
  courseId: string,
  lessonPlanMd: string,
): Promise<string> {
  const root = courseArtifactsRoot(courseId);
  const outPath = join(root, 'lessonplan.md');
  await writeText(outPath, String(lessonPlanMd || '').trim() + '\n');
  return outPath;
}

export async function readCourseResearch(courseId: string): Promise<ResearchBundle | null> {
  try {
    const root = join(courseArtifactsRoot(courseId), 'research', 'course');
    const raw = await readFile(join(root, 'sources.json'), 'utf8');
    const parsed = JSON.parse(raw);
    return {
      topic: String(parsed?.topic || ''),
      sourcesMissingReason: parsed?.sourcesMissingReason || undefined,
      sources: Array.isArray(parsed?.sources)
        ? parsed.sources
            .map((s: any) => ({
              url: String(s?.url || ''),
              title: s?.title ? String(s.title) : undefined,
              publisher: s?.publisher ? String(s.publisher) : undefined,
              accessedAt: String(s?.accessedAt || ''),
              snippet: s?.snippet ? String(s.snippet) : undefined,
              extractedText: s?.extractedText ? String(s.extractedText) : undefined,
            }))
            .filter((s: any) => !!s.url)
        : [],
    };
  } catch {
    return null;
  }
}

export async function readLessonResearch(
  courseId: string,
  lessonId: string,
): Promise<ResearchBundle | null> {
  try {
    const root = join(courseArtifactsRoot(courseId), 'research', 'lessons', sanitizeId(lessonId));
    const raw = await readFile(join(root, 'sources.json'), 'utf8');
    const parsed = JSON.parse(raw);
    return {
      topic: String(parsed?.topic || ''),
      sourcesMissingReason: parsed?.sourcesMissingReason || undefined,
      sources: Array.isArray(parsed?.sources)
        ? parsed.sources
            .map((s: any) => ({
              url: String(s?.url || ''),
              title: s?.title ? String(s.title) : undefined,
              publisher: s?.publisher ? String(s.publisher) : undefined,
              accessedAt: String(s?.accessedAt || ''),
              snippet: s?.snippet ? String(s.snippet) : undefined,
              extractedText: s?.extractedText ? String(s.extractedText) : undefined,
            }))
            .filter((s: any) => !!s.url)
        : [],
    };
  } catch {
    return null;
  }
}

export async function listLessonResearchBundles(courseId: string): Promise<string[]> {
  try {
    const dir = join(courseArtifactsRoot(courseId), 'research', 'lessons');
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}
