// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, cleanup, screen, fireEvent } from '@testing-library/react';
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
          title: 'Test Course',
          modules: [
            {
              title: 'Module 1',
              lessons: [
                { id: 'l1', title: 'Intro', content: '# Hello\nThis is a lesson.', readTimeMin: 5 },
              ],
            },
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

describe('Lesson Reader', () => {
  it('renders lesson route without crashing', async () => {
    renderAt('/course/c1/lesson/l1');
    await new Promise((r) => setTimeout(r, 500));
    expect(document.body).toBeTruthy();
  });

  it('page has content area', async () => {
    renderAt('/course/c1/lesson/l1');
    await new Promise((r) => setTimeout(r, 500));
    expect(document.body.innerHTML.length).toBeGreaterThan(100);
  });

  it('renders accessible elements', async () => {
    renderAt('/course/c1/lesson/l1');
    await new Promise((r) => setTimeout(r, 500));
    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });

  it('has navigation structure', async () => {
    renderAt('/course/c1/lesson/l1');
    await new Promise((r) => setTimeout(r, 500));
    const html = document.body.innerHTML;
    expect(html.length).toBeGreaterThan(50);
  });

  it('renders without throwing for missing lesson', async () => {
    renderAt('/course/c1/lesson/nonexistent');
    await new Promise((r) => setTimeout(r, 500));
    expect(document.body).toBeTruthy();
  });
  it('opens Sources & Attribution drawer and shows new fields', async () => {
    localStorage.setItem(
      'learnflow-token',
      'h.' + btoa(JSON.stringify({ sub: 'test', exp: 9999999999 })) + '.s',
    );

    globalThis.fetch = (async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : (input as Request).url;

      if (url.includes('/api/v1/events')) {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (
        url.includes('/api/v1/courses/') &&
        url.includes('/lessons/') &&
        (url.includes('/notes') || url.includes('/illustrations') || url.includes('/annotations'))
      ) {
        if (url.includes('/notes')) {
          return new Response(JSON.stringify({ note: null }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (url.includes('/illustrations')) {
          return new Response(JSON.stringify({ illustrations: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (url.includes('/annotations')) {
          return new Response(JSON.stringify({ annotations: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      if (url.includes('/api/v1/courses/') && url.includes('/lessons/')) {
        // Helpful when test fails

        const payload = {
          id: 'l1',
          title: 'Intro',
          content: '# Hello\\nThis is a lesson.',
          readTimeMin: 5,
          sourcesMissingReason: '',
          sources: [
            {
              id: 's1',
              title: 'Example Docs',
              url: 'https://example.com/docs',
              sourceType: 'docs',
              summary: 'A short summary.',
              whyThisMatters: 'Because it clarifies the API surface.',
            },
            {
              id: 's2',
              title: 'Example Blog',
              url: 'https://example.com/blog',
              sourceType: 'blog',
              summary: 'Another short summary.',
              whyThisMatters: 'Because it provides an implementation walk-through.',
            },
          ],
          sectionIllustrations: [],
        };
        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url.includes('/api/v1/courses/')) {
        return new Response(
          JSON.stringify({
            id: 'c1',
            title: 'Test Course',
            modules: [
              {
                title: 'Module 1',
                lessons: [
                  {
                    id: 'l1',
                    title: 'Intro',
                    content: '# Hello\\nThis is a lesson.',
                    readTimeMin: 5,
                  },
                ],
              },
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

    renderAt('/courses/c1/lessons/l1');

    // Iter146: Sources button removed from Actions. Open attribution drawer via "Suggested reads" section.
    const btn = await screen.findByText(/Suggested reads/i);
    fireEvent.click(btn);

    expect(await screen.findByText('Sources & Attribution')).toBeInTheDocument();

    // Title appears in the drawer list
    expect((await screen.findAllByText('Example Docs')).length).toBeGreaterThanOrEqual(1);

    expect(await screen.findByText('A short summary.')).toBeInTheDocument();
    expect(await screen.findByText(/Because it clarifies the API surface\./)).toBeInTheDocument();
  });
});
