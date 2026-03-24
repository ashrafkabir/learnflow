import { describe, it, expect } from 'vitest';

import {
  buildStage2RetryTemplates,
  queryContainsHintTokens,
  inferMissingReasonsFromLessonContent,
} from '../utils/stage2Retry.js';

// Deterministic unit test: force a quality gate failure and ensure retry templates include hint tokens.

describe('Iter74 P0.2: per-lesson re-search retry query builder', () => {
  it('buildStage2RetryTemplates includes required hint tokens when worked example quality fails', () => {
    const badLesson = `# Test Lesson\n\n## Learning Objectives\n- A\n\n## Core Concepts\nSome content\n\n## Worked Example\nThis is too vague and has no code.\n\n## Recap\nShort.\n\n## Quick Check\n- Q1\n- A1\n`;

    const missing = inferMissingReasonsFromLessonContent({
      markdown: badLesson,
      lessonDomain: 'programming',
      includeSectionQuotaFailed: true,
    });

    const templates = buildStage2RetryTemplates({
      courseTopic: 'Test Topic',
      moduleTitle: 'Test Module',
      lessonTitle: 'Test Lesson',
      lessonDescription: 'A test description',
      missingReasons: missing,
    });

    expect(templates.length).toBeGreaterThan(0);
    // At least one template must contain one of the required hint tokens.
    expect(templates.some((t) => queryContainsHintTokens(t))).toBe(true);

    // Stronger: ensure specific tokens appear somewhere in the retry set.
    const joined = templates.join(' | ').toLowerCase();
    expect(joined).toContain('worked example');
    expect(joined).toContain('step-by-step');
    expect(joined).toContain('reference implementation');
  });
});
