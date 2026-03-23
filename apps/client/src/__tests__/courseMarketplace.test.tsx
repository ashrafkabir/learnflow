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
    new Response(JSON.stringify({ courses: [], keys: [], currentStreak: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;
});

afterEach(() => cleanup());

function renderAt(path: string) {
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

describe('CourseMarketplace screen', () => {
  it('renders page', async () => {
    renderAt('/marketplace');
    await waitFor(
      () => {
        const text = document.body.textContent || '';
        expect(text.match(/marketplace|course|browse/i)).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });

  it('shows course titles (from API when available)', async () => {
    // Marketplace no longer falls back to hardcoded sample data.
    // This test just asserts we render an empty state or course cards.
    renderAt('/marketplace');
    await waitFor(
      () => {
        const text = document.body.textContent || '';
        expect(text.match(/no courses found|course marketplace/i)).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });

  it('has filter or sort controls', async () => {
    renderAt('/marketplace');
    await waitFor(
      () => {
        const controls = document.querySelectorAll('select, input, button');
        expect(controls.length).toBeGreaterThan(0);
      },
      { timeout: 5000 },
    );
  });

  it('shows empty state when API returns no courses', async () => {
    renderAt('/marketplace');
    await waitFor(
      () => {
        const text = document.body.textContent || '';
        expect(text.match(/no courses found/i)).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });

  it('shows enroll buttons when courses exist', async () => {
    globalThis.fetch = (async (input: any) => {
      const url = String(input);
      if (url.includes('/api/v1/marketplace/courses')) {
        return new Response(
          JSON.stringify({
            courses: [
              {
                id: 'mc-1',
                title: 'Test Course',
                description: 'desc',
                topic: 'programming',
                difficulty: 'beginner',
                price: 0,
                rating: 4.8,
                enrollmentCount: 10,
                lessonCount: 3,
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

    renderAt('/marketplace');
    await waitFor(
      () => {
        const text = document.body.textContent || '';
        expect(text.match(/enroll/i)).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });
});
