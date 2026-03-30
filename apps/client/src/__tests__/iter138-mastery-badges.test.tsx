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

  (globalThis as any).__LEARNFLOW_ENV__ = {
    VITE_DEV_AUTH_BYPASS: '1',
    PLAYWRIGHT_E2E_FIXTURES: '1',
  };

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;

    if (url.includes('/api/v1/courses/c-1/mastery')) {
      // Mastery fetch
      return new Response(
        JSON.stringify({
          courseId: 'c-1',
          mastery: [
            {
              courseId: 'c-1',
              lessonId: 'l1',
              masteryLevel: 0.9,
              lastStudiedAt: new Date().toISOString(),
              nextReviewAt: new Date(Date.now() - 60_000).toISOString(),
              lastQuizScore: 0.8,
              lastQuizAt: new Date().toISOString(),
              gaps: ['x'],
              updatedAt: new Date().toISOString(),
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.includes('/api/v1/courses/c-1')) {
      // Course fetch
      return new Response(
        JSON.stringify({
          id: 'c-1',
          title: 'Test Course',
          description: 'desc',
          modules: [
            {
              id: 'm1',
              title: 'Module 1',
              objective: 'obj',
              description: 'd',
              lessons: [
                { id: 'l1', title: 'Lesson 1', description: 'd1', content: '' },
                { id: 'l2', title: 'Lesson 2', description: 'd2', content: '' },
              ],
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
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

describe('Iter138: mastery badges', () => {
  it('renders mastery + last quiz + review due badges in CourseView lesson rows (best-effort)', async () => {
    renderAt('/courses/c-1');
    await new Promise((r) => setTimeout(r, 800));

    // Lesson 1 has mastery data
    const badge = document.querySelector('[data-testid="mastery-badge-l1"]');
    expect(badge).toBeTruthy();
    expect(badge?.textContent || '').toMatch(/Mastered|Solid|Learning|New/);

    const lastQuiz = document.querySelector('[data-testid="last-quiz-l1"]');
    expect(lastQuiz).toBeTruthy();
    expect(lastQuiz?.textContent || '').toContain('Last quiz: 80%');

    const reviewDue = document.querySelector('[data-testid="review-due-l1"]');
    expect(reviewDue).toBeTruthy();

    // Lesson 2 has no mastery record (should still render defaults)
    const badge2 = document.querySelector('[data-testid="mastery-badge-l2"]');
    expect(badge2).toBeTruthy();

    const lastQuiz2 = document.querySelector('[data-testid="last-quiz-l2"]');
    expect(lastQuiz2).toBeTruthy();
    expect(lastQuiz2?.textContent || '').toContain('No quiz yet');
  });
});
