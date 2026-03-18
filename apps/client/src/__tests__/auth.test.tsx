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
  localStorage.removeItem('learnflow-onboarding-complete');
  localStorage.removeItem('learnflow-token');
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({}), {
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

describe('LoginScreen', () => {
  it('renders login page', async () => {
    renderAt('/login');
    await waitFor(
      () => {
        const text = document.body.textContent || '';
        expect(text.match(/sign in|log in|learnflow/i)).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });

  it('renders email input', async () => {
    renderAt('/login');
    await waitFor(
      () => {
        const emailInput = document.querySelector(
          'input[type="email"], input[placeholder*="mail" i], input[name="email"]',
        );
        expect(emailInput || screen.queryByText(/email/i)).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });

  it('renders password input', async () => {
    renderAt('/login');
    await waitFor(
      () => {
        const pwInput = document.querySelector('input[type="password"]');
        expect(pwInput || screen.queryByText(/password/i)).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });

  it('renders a form', async () => {
    renderAt('/login');
    await waitFor(
      () => {
        expect(document.querySelector('form')).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });

  it('has a link to register', async () => {
    renderAt('/login');
    await waitFor(
      () => {
        const text = document.body.textContent || '';
        expect(text.match(/sign up|register|create/i)).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });
});

describe('RegisterScreen', () => {
  it('renders register page', async () => {
    renderAt('/register');
    await waitFor(
      () => {
        const text = document.body.textContent || '';
        expect(text.match(/sign up|register|create account|learnflow/i)).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });
});
