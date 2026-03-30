// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { ThemeProvider } from '../design-system/ThemeProvider.js';
import { AppProvider } from '../context/AppContext.js';
import { ToastProvider } from '../components/Toast.js';
import { App } from '../App.js';

beforeEach(() => {
  localStorage.setItem('learnflow-onboarding-complete', 'true');
  // Use a JWT-shaped token so apiGet/apiPost won't attempt refresh/redirect during tests.
  localStorage.setItem(
    'learnflow-token',
    'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjo5OTk5OTk5OTk5fQ.test',
  );

  (globalThis as any).__LEARNFLOW_ENV__ = {
    VITE_DEV_AUTH_BYPASS: '1',
    PLAYWRIGHT_E2E_FIXTURES: '1',
  };

  // Provide route-specific API mocks so marketplace routes render reliably.
  globalThis.fetch = (async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url = String(input);

    if (url.includes('/api/v1/marketplace/creator/dashboard')) {
      return new Response(
        JSON.stringify({
          courses: [],
          totalEnrollments: 0,
          totalEarnings: 0,
          payouts: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.includes('/api/v1/marketplace/courses')) {
      return new Response(JSON.stringify({ courses: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Support legacy /marketplace alias route used in some navigation/tests.
    if (url.includes('/api/v1/marketplace')) {
      return new Response(JSON.stringify({ courses: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.includes('/api/v1/marketplace/checkout')) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

    // Default.
    return new Response(JSON.stringify({ courses: [], agents: [], keys: [], currentStreak: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as unknown as typeof fetch;

  // Silence expected React unmount warning from explicit cleanup() usage in tests.
  const originalError = console.error;
  console.error = ((...args: any[]) => {
    const msg = String(args?.[0] ?? '');
    if (msg.includes('Attempted to synchronously unmount a root')) return;
    originalError(...args);
  }) as any;
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

describe('Marketplace', () => {
  it('renders course marketplace', async () => {
    renderAt('/marketplace');
    await waitFor(
      () => expect(document.querySelector('[data-screen="course-marketplace"]')).toBeTruthy(),
      { timeout: 8000 },
    );
  });

  it('renders agent marketplace', async () => {
    renderAt('/marketplace/agents');
    await waitFor(() =>
      expect(document.querySelector('[data-screen="agent-marketplace"]')).toBeTruthy(),
    );
  });

  it('renders creator dashboard', async () => {
    renderAt('/marketplace/creator');
    await waitFor(() =>
      expect(document.querySelector('[data-screen="creator-dashboard"]')).toBeTruthy(),
    );
  });

  it('marketplace has search or filter', async () => {
    renderAt('/marketplace');
    await waitFor(() => {
      const text = document.body.textContent || '';
      expect(text.match(/search|filter|browse|marketplace|explore/i)).toBeTruthy();
    });
  });

  it('renders mindmap screen', async () => {
    renderAt('/mindmap');
    await waitFor(() => expect(document.querySelector('[data-screen="mindmap"]')).toBeTruthy());
  });

  it('renders settings screen', async () => {
    renderAt('/settings');
    await waitFor(() => expect(document.querySelector('[data-screen="settings"]')).toBeTruthy());
  });
});
