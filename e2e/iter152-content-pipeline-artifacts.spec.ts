import { test, expect } from '@playwright/test';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Iter152 Task 13
 * Validate that pipeline/course runs produce expected on-disk artifacts.
 * This is a pragmatic E2E: we don't re-run the full pipeline (slow + depends on external keys).
 * Instead, assert that at least one course-artifacts folder contains:
 * - course-research.md
 * - lessonplan.md
 * - research/course/sources.json
 */

test('Iter152: content pipeline artifacts exist on disk', async () => {
  const artifactsRoot = join(process.cwd(), 'apps', 'api', 'learnflow', 'course-artifacts');

  const entries = await readdir(artifactsRoot).catch(() => []);
  expect(entries.length).toBeGreaterThan(0);

  // Find the newest course directory (by mtime)
  const dirsWithTime: Array<{ name: string; mtimeMs: number }> = [];
  for (const name of entries) {
    if (!name.startsWith('course-')) continue;
    const p = join(artifactsRoot, name);
    try {
      const st = await stat(p);
      if (st.isDirectory()) dirsWithTime.push({ name, mtimeMs: st.mtimeMs });
    } catch {
      // ignore
    }
  }

  dirsWithTime.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const courseDir = dirsWithTime[0];
  expect(courseDir).toBeTruthy();

  const root = join(artifactsRoot, courseDir.name);
  const required = [
    join(root, 'course-research.md'),
    join(root, 'lessonplan.md'),
    join(root, 'research', 'course', 'sources.json'),
  ];

  for (const f of required) {
    const st = await stat(f);
    expect(st.isFile()).toBeTruthy();
    expect(st.size).toBeGreaterThan(10);
  }
});
