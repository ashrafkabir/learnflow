// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, cleanup, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

import { ThemeProvider } from '../design-system/ThemeProvider.js';
import { AppProvider } from '../context/AppContext.js';
import { ToastProvider } from '../components/Toast.js';
import { App } from '../App.js';

beforeEach(() => {
  localStorage.setItem('learnflow-onboarding-complete', 'true');
  localStorage.setItem(
    'learnflow-token',
    'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjo5OTk5OTk5OTk5fQ.test',
  );
  (globalThis as any).__LEARNFLOW_ENV__ = { VITE_DEV_AUTH_BYPASS: '1' };

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/api/v1/profile/context')) {
      return new Response(
        JSON.stringify({ goals: [], topics: [], experience: 'beginner', subscriptionTier: 'free' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    if (url.includes('/api/v1/subscription')) {
      return new Response(JSON.stringify({ tier: 'free' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.includes('/api/v1/notifications')) {
      return new Response(JSON.stringify({ notifications: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.includes('/api/v1/collaboration')) {
      return new Response(JSON.stringify({ groups: [], matches: [], messages: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ courses: [], keys: [], currentStreak: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
});

afterEach(() => cleanup());

describe('Collaboration synthetic disclosure', () => {
  it('renders an unavoidable disclosure that partner matches are synthetic suggestions', async () => {
    render(
      <MemoryRouter initialEntries={['/collaborate']}>
        <ThemeProvider>
          <AppProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AppProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );

    // The disclosure may render before/after async data loads; assert on full page text.
    // This avoids brittle matching when the phrase is split across nested elements.
    const els = await screen.findAllByText((_, el) =>
      (el?.textContent || '').toLowerCase().includes('synthetic suggestions'),
    );
    expect(els.length).toBeGreaterThan(0);
    expect(document.body.textContent || '').toMatch(/not verified/i);
  });
});
