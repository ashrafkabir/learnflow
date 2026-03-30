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

beforeEach(() => {
  localStorage.setItem('learnflow-onboarding-complete', 'true');
  localStorage.setItem(
    'learnflow-token',
    'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjo5OTk5OTk5OTk5fQ.test',
  );
});

afterEach(() => cleanup());

describe('Marketplace trust: no fake metrics', () => {
  it('course marketplace browse UI does not show enrolled counts even if API includes enrollmentCount', async () => {
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
                enrollmentCount: 99999,
                lessonCount: 3,
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    renderAt('/marketplace');

    await waitFor(
      () => {
        const text = document.body.textContent || '';
        expect(text).toMatch(/Test Course/);
        expect(text).not.toMatch(/enrolled/i);
      },
      { timeout: 5000 },
    );
  });
});
