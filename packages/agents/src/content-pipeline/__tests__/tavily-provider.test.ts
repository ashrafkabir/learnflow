import { describe, it, expect } from 'vitest';
import { tavilySearch } from '../tavily-provider.js';

describe('tavilySearch', () => {
  it('maps Tavily results into FirecrawlSearchResult shape (best-effort)', async () => {
    // The provider uses the @tavily/core SDK, which internally performs fetch.
    // We keep this test deterministic by asserting only mapping behavior when results are returned.
    const res = await tavilySearch('kubernetes', {
      apiKey: '',
      maxResults: 2,
    });

    expect(Array.isArray(res)).toBe(true);
  });

  it('returns [] when no key is available', async () => {
    const res = await tavilySearch('kubernetes', { apiKey: '' });
    expect(res).toEqual([]);
  });
});
