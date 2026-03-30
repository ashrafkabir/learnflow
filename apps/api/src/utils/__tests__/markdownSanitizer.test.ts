import { describe, it, expect } from 'vitest';
import { unwrapFencedMarkdown } from '../markdownSanitizer.js';

describe('unwrapFencedMarkdown', () => {
  it('unwraps ```markdown fenced blocks', () => {
    const input = '```markdown\n# Lesson Plan\n\nHello\n```';
    expect(unwrapFencedMarkdown(input)).toBe('# Lesson Plan\n\nHello\n');
  });

  it('unwraps plain fenced blocks', () => {
    const input = '```\n# Title\n```';
    expect(unwrapFencedMarkdown(input)).toBe('# Title\n');
  });

  it('leaves non-fenced content as-is', () => {
    const input = '# Already markdown\n';
    expect(unwrapFencedMarkdown(input)).toBe(input);
  });

  it('does not unwrap when fence is not balanced', () => {
    const input = '```markdown\n# Title\n';
    expect(unwrapFencedMarkdown(input)).toBe(input);
  });
});
