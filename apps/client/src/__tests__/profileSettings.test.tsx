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
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ courses: [], keys: [], currentStreak: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;
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

describe('Profile Settings page', () => {
  it('renders the settings route', async () => {
    renderAt('/settings');
    await new Promise((r) => setTimeout(r, 500));
    expect(document.body.innerHTML).toContain('Settings');
  });

  it('shows API key section', async () => {
    renderAt('/settings');
    await new Promise((r) => setTimeout(r, 500));
    const html = document.body.innerHTML.toLowerCase();
    expect(html).toMatch(/api|key|vault/);
  });

  it('has dark mode toggle reference', async () => {
    renderAt('/settings');
    await new Promise((r) => setTimeout(r, 500));
    const html = document.body.innerHTML.toLowerCase();
    expect(html).toMatch(/dark|theme|appearance/);
  });

  it('shows export buttons', async () => {
    renderAt('/settings');
    await new Promise((r) => setTimeout(r, 500));
    const html = document.body.innerHTML.toLowerCase();
    expect(html).toMatch(/export|download|markdown|json/);
  });

  it('has notification preferences', async () => {
    renderAt('/settings');
    await new Promise((r) => setTimeout(r, 500));
    const html = document.body.innerHTML.toLowerCase();
    expect(html).toMatch(/notif|email|push|preference/);
  });
});
