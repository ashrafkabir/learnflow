import { describe, it, expect } from 'vitest';
import { enforceBiteSizedLesson, computeLessonSizing } from '../utils/lessonSizing.js';

function words(n: number): string {
  return Array.from({ length: n })
    .map((_, i) => `w${i}`)
    .join(' ');
}

describe('lesson sizing', () => {
  it('computes minutes based on 200 wpm', () => {
    const s = computeLessonSizing(words(401));
    expect(s.wordCount).toBe(401);
    expect(s.estimatedMinutes).toBe(3);
  });

  it('enforces bite-sized truncation at ~10 minutes', () => {
    const input = words(2500);
    const out = enforceBiteSizedLesson(input, { maxMinutes: 10 });
    expect(out.truncated).toBe(true);
    expect(out.sizing.wordCount).toBeLessThanOrEqual(2050); // allow note/footer words
    expect(out.sizing.estimatedMinutes).toBeLessThanOrEqual(11);
  });

  it('does not modify content under cap', () => {
    const input = words(900);
    const out = enforceBiteSizedLesson(input, { maxMinutes: 10 });
    expect(out.truncated).toBe(false);
    expect(out.content).toBe(input);
  });
});
