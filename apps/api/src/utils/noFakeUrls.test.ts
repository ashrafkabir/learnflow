import { describe, it, expect } from 'vitest';
import { parseLessonSources } from './sources.js';

/**
 * Iter135: Guard against fabricated URLs in lesson markdown.
 *
 * Policy: we only surface URLs that actually exist in saved bundles.
 * At the parsing layer, we must at least avoid picking up placeholder-like or non-http(s) strings.
 */

describe('parseLessonSources', () => {
  it('does not emit sources when there are no http(s) URLs', () => {
    const md = `# Test

## Sources
- Some book (no url)
- Another thing — not_a_url
`;
    const out = parseLessonSources(md);
    expect(out.length).toBe(0);
  });

  it('emits only http(s) URLs and strips trailing punctuation', () => {
    const md = `# Test

## Sources
- [Example](https://example.com/docs).
- Another — https://example.com/test);
`;
    const out = parseLessonSources(md);
    expect(out.length).toBeGreaterThan(0);
    for (const s of out) {
      expect(s.url.startsWith('http://') || s.url.startsWith('https://')).toBe(true);
      expect(/[).,;]+$/.test(s.url)).toBe(false);
    }
  });
});
