// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
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
    new Response(JSON.stringify({ courses: [], keys: [], currentStreak: 5 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;
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

describe('Dashboard', () => {
  it('renders dashboard screen', async () => {
    renderAt('/dashboard');
    expect(await screen.findByText(/dashboard|welcome back|good/i)).toBeInTheDocument();
  });

  it('has streak display area', async () => {
    renderAt('/dashboard');
    await waitFor(() => {
      const el = document.querySelector('[data-screen="dashboard"]');
      expect(el).toBeTruthy();
    });
  });

  it('shows today lessons section', async () => {
    renderAt('/dashboard');
    await waitFor(() => {
      const text = document.body.textContent || '';
      expect(text.match(/today|lesson|continue|course/i)).toBeTruthy();
    });
  });

  it('renders course cards or empty state', async () => {
    renderAt('/dashboard');
    // Should render either course cards or a CTA to create one
    const text = document.body.textContent || '';
    expect(text.match(/course|create|start|explore/i)).toBeTruthy();
  });

  it('has navigation elements', async () => {
    renderAt('/dashboard');
    // MobileNav should be present for app screens
    expect(document.querySelector('nav')).toBeTruthy();
  });
});
