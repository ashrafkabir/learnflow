import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tavilySearch } from '../tavily-provider.js';

describe('tavilySearch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('maps Tavily results into FirecrawlSearchResult shape', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        query: 'test',
        results: [
          { title: 'Result A', url: 'https://example.com/a', content: 'Snippet A' },
          { title: 'Result B', url: 'https://example.com/b', content: 'Snippet B' },
        ],
      }),
    } as any);

    const res = await tavilySearch('kubernetes', { apiKey: 'redacted', maxResults: 2 });

    expect(mockFetch).toHaveBeenCalled();
    expect(res).toEqual([
      {
        url: 'https://example.com/a',
        title: 'Result A',
        description: 'Snippet A',
        source: 'tavily',
      },
      {
        url: 'https://example.com/b',
        title: 'Result B',
        description: 'Snippet B',
        source: 'tavily',
      },
    ]);
  });

  it('returns [] when no key is available', async () => {
    vi.spyOn(globalThis, 'fetch' as any);
    const res = await tavilySearch('kubernetes', { apiKey: '' });
    expect(res).toEqual([]);
  });
});
