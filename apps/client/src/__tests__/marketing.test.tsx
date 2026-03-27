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
    await waitFor(() => {
      const text = document.body.textContent || '';
      expect(text.match(/get started|sign up|try|start/i)).toBeTruthy();
    });
  });

  it('renders features page', async () => {
    renderAt('/features');
    await waitFor(() => {
      const text = document.body.textContent || '';
      expect(text.match(/feature/i)).toBeTruthy();
    });
  });

  it('renders pricing page', async () => {
    renderAt('/pricing');
    await waitFor(() => {
      const text = document.body.textContent || '';
      expect(text.match(/free|pro|pric/i)).toBeTruthy();
    });
  });

  it('pricing has plan cards', async () => {
    renderAt('/pricing');
    await waitFor(() => {
      const text = document.body.textContent || '';
      expect(text.match(/free|pro|enterprise/i)).toBeTruthy();
    });
  });

  it('renders about page', async () => {
    renderAt('/about');
    await waitFor(() => {
      const text = document.body.textContent || '';
      expect(text.match(/about|mission|team/i)).toBeTruthy();
    });
  });

  it('renders download page', async () => {
    renderAt('/download');
    await waitFor(() => {
      const text = document.body.textContent || '';
      expect(text.match(/download|install|app/i)).toBeTruthy();
    });
  });

  it('renders docs page', async () => {
    renderAt('/docs');
    await waitFor(() => {
      const text = document.body.textContent || '';
      expect(text.match(/doc|guide|getting started|documentation/i)).toBeTruthy();
    });
  });

  it('renders blog page', async () => {
    renderAt('/blog');
    await waitFor(() => {
      const text = document.body.textContent || '';
      expect(text.match(/blog|article|post|LearnFlow/i)).toBeTruthy();
    });
  });

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
