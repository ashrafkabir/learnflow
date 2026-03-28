import React from 'react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';

import { AboutMvpTruth } from '../screens/AboutMvpTruth.js';

// Iter128 P2-12 — MVP truth regression tests
// Goal: prevent accidental removal of key honesty/disclosure copy.

describe('MVP truth regression', () => {
  it('renders core truth statements for marketplace agents + BYOAI', () => {
    render(
      <MemoryRouter initialEntries={['/settings/about-mvp-truth']}>
        <Routes>
          <Route path="/settings/about-mvp-truth" element={<AboutMvpTruth />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /mvp truth/i })).toBeInTheDocument();

    // Agents disclosure
    expect(
      screen.getByRole('heading', {
        name: /marketplace agents do not execute third/i,
      }),
    ).toBeInTheDocument();

    // BYOAI disclosure
    expect(screen.getByRole('heading', { name: /byoai only/i })).toBeInTheDocument();
    expect(screen.getByText(/api keys/i)).toBeInTheDocument();
    expect(screen.getByText(/does not provide managed llm keys/i)).toBeInTheDocument();
  });
});
