import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CitationTooltip } from '../components/CitationTooltip.js';

describe('CitationTooltip', () => {
  it('opens popover on keyboard Enter when source is present', () => {
    render(
      <CitationTooltip
        num={1}
        source={{ id: 1, title: 'Example Source', url: 'https://example.com' }}
      />,
    );

    const btn = screen.getByRole('button', { name: /citation 1/i });
    btn.focus();

    fireEvent.keyDown(btn, { key: 'Enter' });

    // Tooltip uses aria-label including the source title.
    expect(screen.getByRole('dialog', { name: /citation\s+1/i })).toBeInTheDocument();
    expect(screen.getByText('Example Source')).toBeInTheDocument();
  });

  it('opens popover on keyboard Space when source is present', () => {
    render(
      <CitationTooltip
        num={2}
        source={{ id: 2, title: 'Space Source', url: 'https://example.com/2' }}
      />,
    );

    const btn = screen.getByRole('button', { name: /citation 2/i });
    btn.focus();

    fireEvent.keyDown(btn, { key: ' ' });

    expect(screen.getByRole('dialog', { name: /citation\s+2/i })).toBeInTheDocument();
  });

  it('toggles popover on click (mobile/tap behavior)', () => {
    render(
      <CitationTooltip
        num={3}
        source={{ id: 3, title: 'Tap Source', url: 'https://example.com/3' }}
      />,
    );

    const btn = screen.getByRole('button', { name: /citation 3/i });

    fireEvent.click(btn);
    expect(screen.getByRole('dialog', { name: /citation 3/i })).toBeInTheDocument();

    fireEvent.click(btn);
    expect(screen.queryByRole('dialog', { name: /citation 3/i })).toBeNull();
  });

  it('does not open when source url is missing', () => {
    render(<CitationTooltip num={4} source={{ id: 4, title: 'No URL', url: '' }} />);

    const btn = screen.getByRole('button', { name: /citation 4/i });
    fireEvent.click(btn);

    expect(screen.queryByRole('dialog', { name: /citation 4/i })).toBeNull();
  });
});
