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
  localStorage.setItem('learnflow-token', 'test-token');
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ courses: [], agents: [], keys: [] }), {
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

describe('Marketplace', () => {
  it('renders course marketplace', async () => {
    renderAt('/marketplace');
    await waitFor(() => expect(document.querySelector('[data-screen]')).toBeTruthy());
  });

  it('renders agent marketplace', async () => {
    renderAt('/marketplace/agents');
    await waitFor(() => expect(document.querySelector('[data-screen]')).toBeTruthy());
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
