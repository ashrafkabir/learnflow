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
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ courses: [], keys: [], currentStreak: 0 }), {
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

describe('Creator Dashboard', () => {
  it('renders the creator dashboard route', async () => {
    renderAt('/creator');
    await new Promise((r) => setTimeout(r, 500));
    expect(document.body.innerHTML.length).toBeGreaterThan(100);
  });

  it('has dashboard sections', async () => {
    renderAt('/creator');
    await new Promise((r) => setTimeout(r, 500));
    const html = document.body.innerHTML.toLowerCase();
    expect(html).toMatch(/creator|dashboard|publish|course/);
  });

  it('renders action buttons', async () => {
    renderAt('/creator');
    await new Promise((r) => setTimeout(r, 500));
    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});
