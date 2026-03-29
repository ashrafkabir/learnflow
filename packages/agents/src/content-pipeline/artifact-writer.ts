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
