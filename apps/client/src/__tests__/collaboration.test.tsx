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
  globalThis.fetch = (async () => new Response(JSON.stringify({ courses: [], keys: [], currentStreak: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } })) as typeof fetch;
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

describe('Collaboration page', () => {
  it('renders the collaboration route', async () => {
    renderAt('/collaborate');
    await new Promise(r => setTimeout(r, 500));
    expect(document.body.innerHTML).toContain('Learn Together');
  });

  it('shows interest tags for partner matching', async () => {
    renderAt('/collaborate');
    await new Promise(r => setTimeout(r, 500));
    const html = document.body.innerHTML;
    expect(html).toMatch(/Machine Learning|Web Development|Data Science/);
  });

  it('has tab navigation', async () => {
    renderAt('/collaborate');
    await new Promise(r => setTimeout(r, 500));
    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('shows suggested partners section', async () => {
    renderAt('/collaborate');
    await new Promise(r => setTimeout(r, 500));
    const html = document.body.innerHTML;
    expect(html).toMatch(/Suggested Partners|Connect/);
  });
});
