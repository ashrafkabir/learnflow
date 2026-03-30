import { describe, it, expect } from 'vitest';
import { parseLessonplanRecommendedSources } from '../lessonplanParser.js';

describe('parseLessonplanRecommendedSources', () => {
  it('extracts urls per lesson from a loose lessonplan format', () => {
    const md = `# Lesson Plan

### Module 1: Intro

#### Lesson 1.1: What is X?

- Objectives:
  - A

Recommended sources:
- https://example.com/a
- https://example.com/b

#### Lesson 1.2: Why X?

Recommended sources:
- https://example.com/c

### Module 2: Advanced

#### Lesson 2.1: Deep dive

Recommended sources:
- https://example.com/d
`;

    const out = parseLessonplanRecommendedSources(md);
    expect(out).toEqual([
      {
        moduleIndex: 0,
        lessonIndex: 0,
        lessonTitle: 'What is X?',
        urls: ['https://example.com/a', 'https://example.com/b'],
      },
      {
        moduleIndex: 0,
        lessonIndex: 1,
        lessonTitle: 'Why X?',
        urls: ['https://example.com/c'],
      },
      {
        moduleIndex: 1,
        lessonIndex: 0,
        lessonTitle: 'Deep dive',
        urls: ['https://example.com/d'],
      },
    ]);
  });
});
