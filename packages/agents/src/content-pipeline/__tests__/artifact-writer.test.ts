import { describe, it, expect } from 'vitest';
import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { writeCourseResearch, writeLessonResearch, writeLessonPlan } from '../artifact-writer.js';

describe('artifact-writer', () => {
  it('writes course research bundle to course-artifacts with extracted markdown files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'learnflow-artifacts-'));

    const prevEnv = process.env.LEARNFLOW_ARTIFACTS_ROOT;
    process.env.LEARNFLOW_ARTIFACTS_ROOT = dir;

    try {
      // This call should honor LEARNFLOW_ARTIFACTS_ROOT without relying on process.chdir.
      const root = await writeCourseResearch('course-1', {
        topic: 'Global capability centers',
        sources: [
          {
            url: 'https://example.com/a',
            title: 'Source A',
            publisher: 'Example',
            accessedAt: new Date('2026-01-01').toISOString(),
            snippet: 'Hello',
            extractedText: 'Some extracted text',
            images: [{ url: 'https://example.com/img.png', sourceUrl: 'https://example.com/a' }],
          },
        ],
      });

      const sourcesJson = JSON.parse(await readFile(join(root, 'sources.json'), 'utf8'));
      expect(sourcesJson.topic).toBe('Global capability centers');
      expect(Array.isArray(sourcesJson.sources)).toBe(true);
      expect(sourcesJson.sources[0].url).toBe('https://example.com/a');

      const extracted = await readdir(join(root, 'extracted'));
      expect(extracted.length).toBeGreaterThan(0);
      const md = await readFile(join(root, 'extracted', extracted[0]), 'utf8');
      expect(md).toContain('Some extracted text');

      const imagesJson = JSON.parse(await readFile(join(root, 'images.json'), 'utf8'));
      expect(Array.isArray(imagesJson.images)).toBe(true);
      expect(imagesJson.images[0].url).toBe('https://example.com/img.png');
    } finally {
      process.env.LEARNFLOW_ARTIFACTS_ROOT = prevEnv;
    }
  });

  it('writes lesson research bundle and lesson-plan.json', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'learnflow-artifacts-'));

    const prevEnv = process.env.LEARNFLOW_ARTIFACTS_ROOT;
    process.env.LEARNFLOW_ARTIFACTS_ROOT = dir;

    try {
      const root = await writeLessonResearch('course-2', 'lesson-9', {
        topic: 'Lesson topic',
        sources: [
          {
            url: 'https://example.com/b',
            title: 'Source B',
            publisher: 'Example',
            accessedAt: new Date('2026-01-02').toISOString(),
            snippet: 'World',
            extractedText: 'More extracted text',
            images: [],
          },
        ],
      });

      const sourcesJson = JSON.parse(await readFile(join(root, 'sources.json'), 'utf8'));
      expect(sourcesJson.lessonId).toBe('lesson-9');

      const planPath = await writeLessonPlan('course-2', { ok: true, lessons: [] });
      const planJson = JSON.parse(await readFile(planPath, 'utf8'));
      expect(planJson.ok).toBe(true);
    } finally {
      process.env.LEARNFLOW_ARTIFACTS_ROOT = prevEnv;
    }
  });
});
