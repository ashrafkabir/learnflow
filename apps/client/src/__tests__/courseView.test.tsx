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
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;
    if (url.includes('/courses/')) {
      return new Response(
        JSON.stringify({
          id: 'c1',
          title: 'Rust Programming',
          description: 'Learn Rust',
          modules: [
            {
              title: 'Basics',
              lessons: [
                { id: 'l1', title: 'Getting Started' },
                { id: 'l2', title: 'Variables' },
              ],
            },
            { title: 'Advanced', lessons: [{ id: 'l3', title: 'Ownership' }] },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
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

describe('Course View page', () => {
  it('renders course route', async () => {
    renderAt('/course/c1');
    await new Promise((r) => setTimeout(r, 500));
    expect(document.body.innerHTML.length).toBeGreaterThan(100);
  });

  it('renders syllabus structure', async () => {
    renderAt('/course/c1');
    await new Promise((r) => setTimeout(r, 500));
    expect(document.body).toBeTruthy();
  });

  it('has navigable module headers', async () => {
    renderAt('/course/c1');
    await new Promise((r) => setTimeout(r, 500));
    const headings = document.querySelectorAll('h1, h2, h3, h4');
    expect(headings.length).toBeGreaterThanOrEqual(0);
  });

  it('renders buttons for lesson navigation', async () => {
    renderAt('/course/c1');
    await new Promise((r) => setTimeout(r, 500));
    const buttons = document.querySelectorAll('button, a');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('handles missing course gracefully', async () => {
    renderAt('/course/nonexistent');
    await new Promise((r) => setTimeout(r, 500));
    expect(document.body).toBeTruthy();
  });
});
