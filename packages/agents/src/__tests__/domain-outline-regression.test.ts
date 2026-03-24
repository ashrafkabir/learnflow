import { describe, it, expect } from 'vitest';
import { classifyTopicDomain, buildCourseOutline } from '../course-builder/domain-outline.js';

function getModuleTitles(topic: string): string[] {
  return buildCourseOutline(topic).modules.map((m) => m.title);
}

// Iter73 P0.1 regression:
// across multiple topics, module titles should be diverse and domain-appropriate (not generic)
// and domain classifier should route to the right outline templates.
describe('Iter73: domain-specific outline regression', () => {
  it('produces topic-specific, domain-appropriate module titles across 6 topics', () => {
    const cases: Array<{ topic: string; expectDomain: string; mustInclude: string[] }> = [
      {
        topic: 'Rust ownership and borrowing',
        expectDomain: 'programming',
        mustInclude: ['Tooling', 'Testing'],
      },
      {
        topic: 'Linear algebra: eigenvalues and eigenvectors',
        expectDomain: 'math',
        mustInclude: ['Definitions', 'Worked'],
      },
      {
        topic: 'Cap-and-trade carbon markets',
        expectDomain: 'policy_business',
        mustInclude: ['Stakeholders', 'Trade-offs'],
      },
      {
        topic: 'Italian pasta and sauces',
        expectDomain: 'cooking',
        mustInclude: ['Techniques', 'Ingredients'],
      },
      {
        topic: 'Prompt injection defenses for LLM apps',
        expectDomain: 'ai_prompting',
        mustInclude: ['Prompt', 'Safety'],
      },
      {
        topic: 'Quantum computing with Qiskit',
        expectDomain: 'quantum_computing',
        mustInclude: [''],
      },
    ];

    const allTitles = new Set<string>();

    for (const c of cases) {
      const domain = classifyTopicDomain(c.topic);
      expect(domain).toBe(c.expectDomain);

      if (domain === 'quantum_computing') {
        // buildCourseOutline intentionally returns [] for quantum; enforced structure is in quantum profile.
        continue;
      }

      const titles = getModuleTitles(c.topic);
      // Topic-specificity: at least one module title must include a meaningful token from the topic.
      // (Prevents generic templates like "Core Concepts" without anchoring.)
      const topicTokens = c.topic
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .filter((w) => w.length >= 4);
      const titlesLower = titles.join(' ').toLowerCase();
      expect(topicTokens.some((w) => titlesLower.includes(w))).toBe(true);

      expect(titles.length).toBeGreaterThanOrEqual(4);

      for (const inc of c.mustInclude) {
        if (!inc) continue;
        expect(titles.join(' | ')).toContain(inc);
      }

      // Ensure titles aren't all generic across topics.
      titles.forEach((t) => allTitles.add(t));

      // Avoid obvious generic headings.
      const joined = titles.join(' ');
      expect(joined).not.toMatch(/Orientation and Goals|Core Concepts|Best Practices/);
    }

    // Across 5 non-quantum topics, we should see lots of distinct module titles.
    expect(allTitles.size).toBeGreaterThanOrEqual(16);
  });
});
