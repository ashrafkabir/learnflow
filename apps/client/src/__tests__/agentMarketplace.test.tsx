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

describe('AgentMarketplace screen', () => {
  it('renders the screen', async () => {
    renderAt('/marketplace/agents');
    await waitFor(
      () => {
        const text = document.body.textContent || '';
        expect(text.match(/agent|marketplace/i)).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });

  it('shows agent names in listing', async () => {
    renderAt('/marketplace/agents');
    await waitFor(
      () => {
        const text = document.body.textContent || '';
        expect(text.match(/tutor|research|quiz|solver|coach/i)).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });

  it('has a search input', async () => {
    renderAt('/marketplace/agents');
    await waitFor(
      () => {
        const input = document.querySelector('input');
        expect(input).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });

  it('renders buttons for agent actions', async () => {
    renderAt('/marketplace/agents');
    await waitFor(
      () => {
        const buttons = document.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThan(0);
      },
      { timeout: 5000 },
    );
  });

  it('shows rating numbers', async () => {
    renderAt('/marketplace/agents');
    await waitFor(
      () => {
        const text = document.body.textContent || '';
        expect(text.match(/4\.\d/)).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });

  it('has category filter options', async () => {
    renderAt('/marketplace/agents');
    await waitFor(
      () => {
        const text = document.body.textContent || '';
        expect(text.match(/study|research|all|creative|assessment/i)).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });
});
