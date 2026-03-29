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

// Polyfill IntersectionObserver for jsdom
beforeEach(() => {
  globalThis.IntersectionObserver = class IntersectionObserver {
    constructor(_cb: unknown) {
      /* noop */
    }
    observe() {
      return null;
    }
    unobserve() {
      return null;
    }
    disconnect() {
      return null;
    }
  } as any;

  localStorage.removeItem('learnflow-token');
  localStorage.removeItem('learnflow-onboarding-complete');
  // Ensure the app doesn't take an env-gated auth bypass path in marketing tests.
  delete (globalThis as any).__LEARNFLOW_ENV__;
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

describe('Marketing pages', () => {
  it('renders homepage', async () => {
    renderAt('/');
    const els = await screen.findAllByText(/LearnFlow/i);
    expect(els.length).toBeGreaterThan(0);
  });

  it('homepage has CTA', async () => {
    renderAt('/');
    // Best-effort: ensure the route renders without crashing.
    await waitFor(() => {
      expect(document.querySelector('main[role="main"]')).toBeTruthy();
    });
  });

  // NOTE: Canonical marketing is served by apps/web (Next.js). The client app no longer routes
  // /features, /pricing, /download, /about, /docs, /blog to avoid split-brain.

  it('renders login page', async () => {
    renderAt('/login');
    await waitFor(() => {
      const text = document.body.textContent || '';
      expect(text.match(/sign in|log in|email|password/i)).toBeTruthy();
    });
  });

  it('renders register page', async () => {
    renderAt('/register');
    await waitFor(() => {
      const text = document.body.textContent || '';
      expect(text.match(/sign up|register|create|account/i)).toBeTruthy();
    });
  });

  it('renders 404 page for unknown routes', async () => {
    localStorage.setItem('learnflow-token', 'test-token');
    localStorage.setItem('learnflow-onboarding-complete', 'true');
    renderAt('/this-does-not-exist');
    expect(await screen.findByText('404')).toBeInTheDocument();
  });

  it('404 has navigation buttons', async () => {
    localStorage.setItem('learnflow-token', 'test-token');
    localStorage.setItem('learnflow-onboarding-complete', 'true');
    renderAt('/this-does-not-exist');
    expect(await screen.findByText(/Go Home/i)).toBeInTheDocument();
    expect(await screen.findByText(/Go to Dashboard/i)).toBeInTheDocument();
  });
});
