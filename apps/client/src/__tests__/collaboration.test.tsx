// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, cleanup } from '@testing-library/react';
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
  // OnboardingGuard now requires an explicit, env-gated bypass for deterministic tests.
  // Provide it via runtime global so we don't depend on process env.
  (globalThis as any).__LEARNFLOW_ENV__ = { VITE_DEV_AUTH_BYPASS: '1' };

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/api/v1/profile/context')) {
      return new Response(
        JSON.stringify({ goals: [], topics: [], experience: 'beginner', subscriptionTier: 'free' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
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
      // groups/matches/messages endpoints
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

function renderAt(path: string) {
  cleanup();
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <AppProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AppProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe('Collaboration page', () => {
  it('renders the collaboration route', async () => {
    renderAt('/collaborate');
    await new Promise((r) => setTimeout(r, 500));
    const html = document.body.innerHTML;
    expect(html).toMatch(/collaborate|learn together|partners|learnflow/i);
  });

  it('shows interest tags for partner matching', async () => {
    renderAt('/collaborate');
    await new Promise((r) => setTimeout(r, 1200));
    const html = document.body.innerHTML;
    expect(html).toMatch(/Machine Learning|Web Development|Data Science/);
  });

  it('has tab navigation', async () => {
    renderAt('/collaborate');
    await new Promise((r) => setTimeout(r, 500));
    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('shows suggested partners section', async () => {
    renderAt('/collaborate');
    await new Promise((r) => setTimeout(r, 500));
    const html = document.body.innerHTML;
    expect(html).toMatch(/Suggested Partners|Connect/);
  });
});
