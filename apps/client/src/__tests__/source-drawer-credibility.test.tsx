// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { SourceDrawer } from '../components/SourceDrawer.js';

describe('SourceDrawer credibility surface (Iter92)', () => {
  it('renders credibility label and accessedAt (with fallback) for sources', () => {
    render(
      <SourceDrawer
        open={true}
        onClose={() => void 0}
        sources={[
          {
            id: 1,
            title: 'Example source',
            url: 'https://example.com',
            author: undefined,
            publication: undefined,
            year: undefined,
            credibilityLabel: 'Medium',
            credibilityScore: 0.62,
            accessedAt: '2026-01-01T00:00:00.000Z',
            whyCredible: 'Medium credibility (heuristic).',
          },
          {
            id: 2,
            title: 'Unknown fields source',
            url: 'https://example.org',
          },
        ]}
      />,
    );

    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getAllByText(/Accessed/).length).toBeGreaterThan(0);
    // Ensure we never fake authors/publications.
    expect(screen.getAllByText('Unknown').length).toBeGreaterThan(0);
  });
});
