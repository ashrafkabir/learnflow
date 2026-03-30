import { readLessonResearch } from '@learnflow/agents';
import type { PipelineSourceDoc } from '../pipeline/source-types.js';

export class ArtifactMissingError extends Error {
  code = 'artifacts_missing' as const;
  constructor(message: string) {
    super(message);
    this.name = 'ArtifactMissingError';
  }
}

export async function readLessonImagesFromArtifacts(params: {
  courseId: string;
  lessonId: string;
}): Promise<
  Array<{
    url: string;
    alt?: string;
    credit?: string;
    license?: string;
    sourceUrl?: string;
    pageUrl?: string;
  }>
> {
  const { courseId, lessonId } = params;
  const bundle = await readLessonResearch(courseId, lessonId);
  if (!bundle) return [];

  const imgs: any[] = [];
  for (const s of (bundle?.sources || []).slice(0, 8)) {
    for (const img of (s?.images || []).slice(0, 4)) {
      if (!img?.url || !/^https?:\/\//i.test(String(img.url))) continue;
      imgs.push({
        url: img.url,
        alt: img.alt || s.title || 'Related image',
        credit: img.credit || '',
        license: img.license || '',
        sourceUrl: img.sourceUrl || img.sourceUrl || '',
        pageUrl: s.url || '',
      });
    }
  }
  return imgs;
}

/**
 * Load per-lesson research artifacts for lesson generation.
 * Spec intent: downstream generation should be derived from persisted artifacts,
 * not from hidden re-scraping or in-memory fallbacks.
 */
export async function loadLessonSourcesForGeneration(params: {
  courseId: string;
  lessonId: string;
}): Promise<PipelineSourceDoc[]> {
  const { courseId, lessonId } = params;
  const bundle = await readLessonResearch(courseId, lessonId);

  if (!bundle) {
    throw new ArtifactMissingError(
      `artifacts_missing: lesson research bundle not found (courseId=${courseId}, lessonId=${lessonId})`,
    );
  }

  const sources = (bundle.sources || [])
    .map((s: any) => {
      const content = String(s.extractedText || s.snippet || '');
      return {
        url: String(s.url || ''),
        title: String(s.title || s.url || ''),
        domain: String(s.publisher || ''),
        content,
        provider: 'artifacts',
        wordCount: content.split(/\s+/).filter(Boolean).length,
      } as unknown as PipelineSourceDoc;
    })
    .filter((s: any) => !!s.url);

  const hasAnyText = sources.some((s) => String((s as any).content || '').trim().length > 0);
  if (!sources.length || !hasAnyText) {
    throw new ArtifactMissingError(
      `artifacts_missing: lesson research bundle has no usable extractedText/snippets (courseId=${courseId}, lessonId=${lessonId})`,
    );
  }

  return sources;
}
