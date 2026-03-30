import { test, expect } from '@playwright/test';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Iter153 Task 11
 * Regression: lessonplan.md should not be wrapped in fenced markdown (``` or ```markdown).
 * Like Iter152 artifact test, this is a pragmatic E2E that inspects on-disk artifacts.
 */

test('Iter153: lessonplan.md is not fenced markdown', async () => {
  const artifactsRoot = join(process.cwd(), 'apps', 'api', 'learnflow', 'course-artifacts');

  const entries = await readdir(artifactsRoot).catch(() => []);
  expect(entries.length).toBeGreaterThan(0);

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

  const lessonplanPath = join(artifactsRoot, courseDir.name, 'lessonplan.md');
  const content = await readFile(lessonplanPath, 'utf8');

  const trimmed = content.trimStart();
  expect(trimmed.startsWith('```')).toBeFalsy();
  expect(trimmed.toLowerCase().startsWith('```markdown')).toBeFalsy();
});
