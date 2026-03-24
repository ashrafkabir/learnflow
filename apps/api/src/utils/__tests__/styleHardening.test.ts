import { describe, it, expect } from 'vitest';
import { hardenLessonStyle } from '../styleHardening.js';

describe('Iter73 P2.11: hardenLessonStyle', () => {
  it('rewrites banned phrases', () => {
    const input = `# Title\n\nIn today’s world, we leverage robust systems and follow best practices.`;
    const res = hardenLessonStyle(input);
    expect(res.changed).toBe(true);
    expect(res.updated).not.toMatch(/in today['’]s world/i);
    expect(res.updated).not.toMatch(/\bleverage\b/i);
    expect(res.updated).not.toMatch(/\brobust\b/i);
    expect(res.updated).not.toMatch(/best practices/i);
    expect(res.reasons.length).toBeGreaterThan(0);
  });

  it('keeps "it depends on" but rewrites bare "it depends"', () => {
    const a = hardenLessonStyle('It depends on your constraints.');
    expect(a.updated).toContain('It depends on');

    const b = hardenLessonStyle('It depends.');
    expect(b.updated).toMatch(/the answer changes based on/i);
  });
});
