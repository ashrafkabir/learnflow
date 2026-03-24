import { describe, it, expect } from 'vitest';
import { TOPIC_PACKS } from '../fixtures/topic-packs.js';
import { extractTopicSubtopics } from '../course-builder/topic-subtopics.js';

// Iter73 P2.12: ensure topic packs make subtopic extraction deterministic and domain-specific.

describe('Iter73 P2.12: offline topic packs', () => {
  it('extracts 8-15 subtopics deterministically from offline packs', () => {
    for (const pack of TOPIC_PACKS) {
      const subs1 = extractTopicSubtopics(pack.topic, pack.sources, { min: 8, max: 15 });
      const subs2 = extractTopicSubtopics(pack.topic, pack.sources, { min: 8, max: 15 });
      expect(subs1).toEqual(subs2);
      expect(subs1.length).toBeGreaterThanOrEqual(8);
      expect(subs1.length).toBeLessThanOrEqual(15);
    }
  });
});
