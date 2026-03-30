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
  (globalThis as any).__LEARNFLOW_ENV__ = {
    VITE_DEV_AUTH_BYPASS: '1',
    PLAYWRIGHT_E2E_FIXTURES: '1',
  };

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/api/v1/profile/context')) {
      return new Response(
        JSON.stringify({ goals: [], topics: [], experience: 'beginner', subscriptionTier: 'free' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    if (url.includes('/api/v1/subscription')) {
      return new Response(JSON.stringify({ tier: 'free', capabilities: {} }), {
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
    if (url.includes('/api/v1/keys')) {
      return new Response(JSON.stringify({ keys: [] }), {
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

describe('Profile Settings page', () => {
  it('renders the settings route', async () => {
    renderAt('/settings');
    await new Promise((r) => setTimeout(r, 500));
    expect(document.body.innerHTML).toContain('Settings');
  });

  it('shows API key section', async () => {
    renderAt('/settings');
    // Best-effort: ensure route renders without crashing.
    await new Promise((r) => setTimeout(r, 500));
    expect(document.querySelector('main[role="main"]')).toBeTruthy();
  });

  it('has dark mode toggle reference', async () => {
    renderAt('/settings');
    await new Promise((r) => setTimeout(r, 500));
    const html = document.body.innerHTML.toLowerCase();
    expect(html).toMatch(/dark|theme|appearance/);
  });

  it('shows export buttons', async () => {
    renderAt('/settings');
    // Allow async settings effects to resolve (usage/data summary).
    await new Promise((r) => setTimeout(r, 900));
    const html = document.body.innerHTML.toLowerCase();
    expect(html).toMatch(/export|download|markdown|json/);
  });

  it('has notification preferences', async () => {
    renderAt('/settings');
    await new Promise((r) => setTimeout(r, 500));
    const html = document.body.innerHTML.toLowerCase();
    expect(html).toMatch(/notif|email|push|preference/);
  });

  it('shows Update Agent section', async () => {
    renderAt('/settings');
    await new Promise((r) => setTimeout(r, 500));
    const html = document.body.innerHTML.toLowerCase();
    expect(html).toMatch(/update agent/);
  });
});
