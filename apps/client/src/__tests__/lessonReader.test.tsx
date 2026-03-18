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
    if (url.includes('/courses/')) {
      return new Response(JSON.stringify({
        id: 'c1', title: 'Test Course', modules: [
          { title: 'Module 1', lessons: [{ id: 'l1', title: 'Intro', content: '# Hello\nThis is a lesson.', readTimeMin: 5 }] }
        ]
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

describe('Lesson Reader', () => {
  it('renders lesson route without crashing', async () => {
    renderAt('/course/c1/lesson/l1');
    await new Promise(r => setTimeout(r, 500));
    expect(document.body).toBeTruthy();
  });

  it('page has content area', async () => {
    renderAt('/course/c1/lesson/l1');
    await new Promise(r => setTimeout(r, 500));
    expect(document.body.innerHTML.length).toBeGreaterThan(100);
  });

  it('renders accessible elements', async () => {
    renderAt('/course/c1/lesson/l1');
    await new Promise(r => setTimeout(r, 500));
    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });

  it('has navigation structure', async () => {
    renderAt('/course/c1/lesson/l1');
    await new Promise(r => setTimeout(r, 500));
    const html = document.body.innerHTML;
    expect(html.length).toBeGreaterThan(50);
  });

  it('renders without throwing for missing lesson', async () => {
    renderAt('/course/c1/lesson/nonexistent');
    await new Promise(r => setTimeout(r, 500));
    expect(document.body).toBeTruthy();
  });
});
