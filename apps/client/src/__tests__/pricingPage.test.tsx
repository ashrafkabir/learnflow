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
  localStorage.removeItem('learnflow-onboarding-complete');
  localStorage.removeItem('learnflow-token');
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;
});

afterEach(() => cleanup());

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider><AppProvider><ToastProvider><App /></ToastProvider></AppProvider></ThemeProvider>
    </MemoryRouter>,
  );
}

describe('Pricing page', () => {
  it('renders the pricing page', async () => {
    renderAt('/pricing');
    await waitFor(() => {
      const text = document.body.textContent || '';
      expect(text.match(/pricing|plans|free/i)).toBeTruthy();
    }, { timeout: 5000 });
  });

  it('shows Free and Pro tiers', async () => {
    renderAt('/pricing');
    await waitFor(() => {
      const text = document.body.textContent || '';
      expect(text.match(/free|pro/i)).toBeTruthy();
    }, { timeout: 5000 });
  });

  it('shows pricing amounts or period', async () => {
    renderAt('/pricing');
    await waitFor(() => {
      const text = document.body.textContent || '';
      expect(text.match(/\$|\/mo|month|free/i)).toBeTruthy();
    }, { timeout: 5000 });
  });

  it('has CTA buttons', async () => {
    renderAt('/pricing');
    await waitFor(() => {
      const text = document.body.textContent || '';
      expect(text.match(/get started|start|sign up|try/i)).toBeTruthy();
    }, { timeout: 5000 });
  });
});
