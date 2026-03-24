import { describe, it, expect } from 'vitest';

import { extractiveSummary, inferSourceType } from '../sourceCards.js';

describe('Iter74 P0.3: source cards utilities', () => {
  it('extractiveSummary returns 1–2 sentence extractive summary (not naive truncation)', () => {
    const text =
      'Sentence one explains the core idea. Sentence two adds an important detail! Sentence three should not be included.';

    const s = extractiveSummary(text);
    expect(s).toContain('Sentence one explains the core idea.');
    expect(s).toContain('Sentence two adds an important detail!');
    expect(s).not.toContain('Sentence three should not be included');
  });

  it('inferSourceType classifies docs/blog/paper/forum via heuristics', () => {
    expect(inferSourceType('https://docs.example.com/sdk/reference/auth', 'docs.example.com')).toBe(
      'docs',
    );
    expect(inferSourceType('https://medium.com/someone/a-post', 'medium.com')).toBe('blog');
    expect(inferSourceType('https://arxiv.org/abs/1234.5678', 'arxiv.org')).toBe('paper');
    expect(
      inferSourceType('https://stackoverflow.com/questions/123/how-to-x', 'stackoverflow.com'),
    ).toBe('forum');
  });
});
