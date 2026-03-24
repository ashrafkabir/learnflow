import { describe, it, expect } from 'vitest';
import { validateQuickCheckHasAnswerKey } from '../utils/lessonQuality.js';

describe('Iter74 P0.4: Quick Check requires an Answer Key with answers', () => {
  it('fails when Quick Check has questions but no answer key', () => {
    const md = `# T\n\n## Quick Check\n\n1. What is 2+2?`;
    const res = validateQuickCheckHasAnswerKey(md);
    expect(res.ok).toBe(false);
    expect(res.reasons).toContain('quick_check_missing_answer_key_heading');
  });

  it('passes when Answer Key exists and includes at least one answer entry', () => {
    const md = `# T\n\n## Quick Check\n\n1. What is 2+2?\n\n### Answer Key\n\n1. 4`;
    const res = validateQuickCheckHasAnswerKey(md);
    expect(res.ok).toBe(true);
  });
});
