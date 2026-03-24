import { describe, it, expect } from 'vitest';
import { buildCourseOutline, classifyTopicDomain } from '../course-builder/domain-outline.js';

function countModulesWithAnySubtopicInTitle(moduleTitles: string[], subtopics: string[]): number {
  const titlesLower = moduleTitles.map((t) => t.toLowerCase());
  return moduleTitles.reduce((acc, _t, i) => {
    const tl = titlesLower[i];
    const hit = subtopics.some((st) => tl.includes(st.toLowerCase()));
    return acc + (hit ? 1 : 0);
  }, 0);
}

// Iter73 P0.2 regression:
// - Outline builder must use extracted subtopics to shape module titles
// - For non-quantum courses, >=60% of module titles must include a subtopic phrase
// - Module titles should differ materially (avoid repeated/near-duplicate strings)

describe('Iter73 P0.2: subtopic-shaped outlines', () => {
  it('anchors >=60% of module titles to extracted subtopics (programming)', () => {
    const topic = 'Rust ownership and borrowing';
    expect(classifyTopicDomain(topic)).toBe('programming');

    const outline = buildCourseOutline(topic);
    const titles = outline.modules.map((m) => m.title);
    const subtopics = outline.subtopics || [];

    expect(subtopics.length).toBeGreaterThanOrEqual(8);
    expect(titles.length).toBeGreaterThanOrEqual(4);

    const withSubtopic = countModulesWithAnySubtopicInTitle(titles, subtopics);
    expect(withSubtopic / titles.length).toBeGreaterThanOrEqual(0.6);

    const uniq = new Set(titles.map((t) => t.toLowerCase()));
    expect(uniq.size).toBe(titles.length);
  });

  it('anchors >=60% of module titles to extracted subtopics (cooking)', () => {
    const topic = 'Italian pasta and sauces';
    expect(classifyTopicDomain(topic)).toBe('cooking');

    const outline = buildCourseOutline(topic);
    const titles = outline.modules.map((m) => m.title);
    const subtopics = outline.subtopics || [];

    expect(subtopics.length).toBeGreaterThanOrEqual(8);
    expect(titles.length).toBeGreaterThanOrEqual(4);

    const withSubtopic = countModulesWithAnySubtopicInTitle(titles, subtopics);
    expect(withSubtopic / titles.length).toBeGreaterThanOrEqual(0.6);

    const uniq = new Set(titles.map((t) => t.toLowerCase()));
    expect(uniq.size).toBe(titles.length);
  });

  it('anchors >=60% of module titles to extracted subtopics (policy/business)', () => {
    const topic = 'Cap-and-trade carbon markets';
    expect(classifyTopicDomain(topic)).toBe('policy_business');

    const outline = buildCourseOutline(topic);
    const titles = outline.modules.map((m) => m.title);
    const subtopics = outline.subtopics || [];

    expect(subtopics.length).toBeGreaterThanOrEqual(8);
    expect(titles.length).toBeGreaterThanOrEqual(4);

    const withSubtopic = countModulesWithAnySubtopicInTitle(titles, subtopics);
    expect(withSubtopic / titles.length).toBeGreaterThanOrEqual(0.6);

    const uniq = new Set(titles.map((t) => t.toLowerCase()));
    expect(uniq.size).toBe(titles.length);
  });
});
