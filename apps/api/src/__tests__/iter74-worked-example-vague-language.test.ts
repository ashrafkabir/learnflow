import { describe, it, expect } from 'vitest';
import { validateWorkedExampleQuality, type LessonDomain } from '../utils/lessonQuality.js';

describe('Iter74 P0.4: Worked Example must be fully worked (no vague language)', () => {
  it('fails when Worked Example contains vague placeholders like "etc." / "and so on"', () => {
    const domain: LessonDomain = 'math_science';
    const md = `# T\n\n## Worked Example\n\n1. Pick values and compute etc.\n2. And so on.`;
    const res = validateWorkedExampleQuality(md, domain);
    expect(res.ok).toBe(false);
    expect(res.reasons).toContain('worked_example_contains_vague_language');
  });

  it('passes when Worked Example includes concrete numeric steps', () => {
    const domain: LessonDomain = 'math_science';
    const md = `# T\n\n## Worked Example\n\n1. Choose values: a = 2, b = 3.\n2. Compute: a + b = 2 + 3 = 5.`;
    const res = validateWorkedExampleQuality(md, domain);
    expect(res.ok).toBe(true);
  });
});
