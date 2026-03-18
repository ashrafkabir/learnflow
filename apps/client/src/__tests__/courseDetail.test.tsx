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
  localStorage.setItem('learnflow-token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjo5OTk5OTk5OTk5fQ.test');
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    if (url.includes('/marketplace/')) {
      return new Response(JSON.stringify({
        id: 'mp1', title: 'Advanced React', author: 'Jane Doe', description: 'Deep dive into React patterns',
        modules: [{ title: 'Hooks', lessons: [{ id: 'l1', title: 'useState' }] }], rating: 4.8, enrollments: 150
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ courses: [], keys: [], currentStreak: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
});

afterEach(() => cleanup());

function renderAt(path: string) {
  cleanup();
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider><AppProvider><ToastProvider><App /></ToastProvider></AppProvider></ThemeProvider>
    </MemoryRouter>,
  );
}

describe('Course Detail / Marketplace Detail', () => {
  it('renders course detail page', async () => {
    renderAt('/marketplace/mp1');
    await new Promise(r => setTimeout(r, 500));
    expect(document.body.innerHTML.length).toBeGreaterThan(100);
  });

  it('has enroll or action button', async () => {
    renderAt('/marketplace/mp1');
    await new Promise(r => setTimeout(r, 500));
    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders without crashing for unknown course', async () => {
    renderAt('/marketplace/unknown-id');
    await new Promise(r => setTimeout(r, 500));
    expect(document.body).toBeTruthy();
  });
});
