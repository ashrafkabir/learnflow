import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Iter156 P0: MVP research enforcement', () => {
  const prev = process.env.LEARNFLOW_MVP_RESEARCH_ONLY;

  beforeEach(() => {
    process.env.LEARNFLOW_MVP_RESEARCH_ONLY = '1';
  });

  afterEach(() => {
    process.env.LEARNFLOW_MVP_RESEARCH_ONLY = prev;
  });

  it('forbids non-OpenAI provider ids when MVP enforcement enabled', async () => {
    const { assertMvpResearchAllowed } = await import('../mvp.js');

    expect(() => assertMvpResearchAllowed('legacy_multi_source')).toThrowError(
      /MVP research mode forbids provider/i,
    );

    expect(() => assertMvpResearchAllowed('openai_web_search')).not.toThrow();
  });
});
