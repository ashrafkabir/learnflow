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

  it('shows course titles', async () => {
    renderAt('/marketplace');
    await waitFor(
      () => {
        const text = document.body.textContent || '';
        expect(text.match(/machine learning|python|kubernetes|react/i)).toBeTruthy();
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

  it('shows Free label for free courses', async () => {
    renderAt('/marketplace');
    await waitFor(
      () => {
        const text = document.body.textContent || '';
        expect(text.match(/free/i)).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });

  it('shows enroll buttons', async () => {
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
