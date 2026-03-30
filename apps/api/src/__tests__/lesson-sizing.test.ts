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

  it('enforces bite-sized truncation at ~1500 words by default', () => {
    const input = words(2500);
    const out = enforceBiteSizedLesson(input, { maxMinutes: 10 });
    expect(out.truncated).toBe(true);
    // 1500 + footer words.
    expect(out.sizing.wordCount).toBeLessThanOrEqual(1550);
    expect(out.sizing.estimatedMinutes).toBeLessThanOrEqual(10);
  });

  it('does not modify content under cap', () => {
    const input = words(900);
    const out = enforceBiteSizedLesson(input, { maxMinutes: 10 });
    expect(out.truncated).toBe(false);
    expect(out.content).toBe(input);
  });
});
