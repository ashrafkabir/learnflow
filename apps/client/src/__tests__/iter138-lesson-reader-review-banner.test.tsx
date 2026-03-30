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
  (globalThis as any).__LEARNFLOW_ENV__ = {
    VITE_DEV_AUTH_BYPASS: '1',
    PLAYWRIGHT_E2E_FIXTURES: '1',
  };
  localStorage.setItem('learnflow-onboarding-complete', 'true');
  localStorage.setItem(
    'learnflow-token',
    'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjo5OTk5OTk5OTk5fQ.test',
  );

  globalThis.fetch = (async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;

    if (url.includes('/api/v1/courses/c-1/lessons/l1/mastery')) {
      return new Response(
        JSON.stringify({
          mastery: {
            courseId: 'c-1',
            lessonId: 'l1',
            masteryLevel: 0.6,
            nextReviewAt: new Date(Date.now() - 60_000).toISOString(),
            lastStudiedAt: new Date().toISOString(),
            lastQuizScore: 0.75,
            lastQuizAt: new Date().toISOString(),
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.includes('/api/v1/courses/c-1/lessons/l1')) {
      return new Response(
        JSON.stringify({
          id: 'l1',
          title: 'Lesson 1',
          description: 'd',
          content: '# Lesson 1\n\nhello',
          sources: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.includes('/api/v1/courses/c-1')) {
      return new Response(
        JSON.stringify({
          id: 'c-1',
          title: 'Course',
          modules: [{ title: 'm', lessons: [{ id: 'l1', title: 'Lesson 1' }] }],
          status: 'READY',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Avoid errors on other endpoints used by LessonReader.
    if (
      url.includes('/api/v1/profile/context') ||
      url.includes('/api/v1/subscription') ||
      url.includes('/api/v1/notifications')
    ) {
      // handled below
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
    if (url.includes('/notes')) {
      return new Response(JSON.stringify({ note: { content: { text: '', customText: '' } } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.includes('/events')) {
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

describe('Iter138: lesson reader review due banner', () => {
  it('shows the review due banner when nextReviewAt is in the past (best-effort)', async () => {
    renderAt('/courses/c-1/lessons/l1');

    await waitFor(
      () => {
        const banner = document.querySelector('[data-testid="review-due-banner"]');
        expect(banner).toBeTruthy();
        expect(banner?.textContent || '').toContain('Review due');
      },
      { timeout: 5000 },
    );
  });
});
