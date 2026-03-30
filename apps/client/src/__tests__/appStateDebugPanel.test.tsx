// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
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

  // Basic stubs to keep /settings from crashing during hydration.
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;
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

describe('App State Debug panel', () => {
  it('does not render in prod mode', async () => {
    // Ensure no dev-only runtime bypass changes behavior.
    delete (globalThis as any).__LEARNFLOW_ENV__;

    const prev = import.meta.env.DEV;
    // Force prod-like env for this test.
    (import.meta as any).env.DEV = false;

    try {
      renderAt('/settings');
      await waitFor(() => {
        expect(document.querySelector('main[role="main"]')).toBeTruthy();
      });
      expect(screen.queryByLabelText(/App State Debug/i)).toBeNull();
    } finally {
      (import.meta as any).env.DEV = prev;
    }
  });
});
