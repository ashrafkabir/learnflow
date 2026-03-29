// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { ThemeProvider } from '../design-system/ThemeProvider.js';
import { AppProvider } from '../context/AppContext.js';
import { ToastProvider } from '../components/Toast.js';
import { App } from '../App.js';

beforeEach(async () => {
  // Preload lazy-loaded onboarding modules so Suspense resolves deterministically in jsdom.
  await import('../screens/onboarding/Welcome.js');
  await import('../screens/onboarding/Goals.js');
  await import('../screens/onboarding/Topics.js');
  await import('../screens/onboarding/ApiKeys.js');
  await import('../screens/onboarding/SubscriptionChoice.js');
  await import('../screens/onboarding/FirstCourse.js');

  localStorage.setItem('learnflow-token', 'test-token');
  localStorage.removeItem('learnflow-onboarding-complete');
  globalThis.fetch = (async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;

    // Minimal API stubs needed for app boot.
    if (url.includes('/api/v1/profile/context')) {
      return new Response(
        JSON.stringify({
          userId: 'test-user',
          role: 'student',
          tier: 'free',
          preferences: { telemetryEnabled: true },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.includes('/api/') || url.startsWith('/')) {
      return new Response(JSON.stringify({ courses: [], keys: [], currentStreak: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
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

describe('Onboarding flow', () => {
  it('renders welcome screen', async () => {
    renderAt('/onboarding/welcome');
    expect(await screen.findByText(/Welcome to LearnFlow/i)).toBeInTheDocument();
  });

  it('renders Get Started button', async () => {
    renderAt('/onboarding/welcome');
    expect(await screen.findByText(/Get Started/i)).toBeInTheDocument();
  });

  it('renders goals screen', async () => {
    renderAt('/onboarding/goals');
    expect(await screen.findByText(/What do you want to learn/i)).toBeInTheDocument();
  });

  it('renders topics screen', async () => {
    renderAt('/onboarding/topics');
    expect(await screen.findByText(/What interests you/i)).toBeInTheDocument();
  });

  it('renders api-keys screen', async () => {
    renderAt('/onboarding/api-keys');
    expect(await screen.findByText(/Connect Your AI Provider/i)).toBeInTheDocument();
  });

  it('renders subscription screen', async () => {
    renderAt('/onboarding/subscription');
    expect(await screen.findByText('Free')).toBeInTheDocument();
  });

  it('renders first-course screen', async () => {
    renderAt('/onboarding/first-course');
    expect(await screen.findByText(/course|generating|set/i)).toBeInTheDocument();
  });

  it('has progress indicator on welcome', async () => {
    renderAt('/onboarding/welcome');
    await screen.findByText(/Welcome to LearnFlow/i);
    const el = document.querySelector('[data-screen="onboarding-welcome"]');
    expect(el).toBeTruthy();
  });

  it('redirects unauthenticated user from /dashboard to /login', async () => {
    localStorage.removeItem('learnflow-token');
    renderAt('/dashboard');
    expect(await screen.findByText('Sign In')).toBeInTheDocument();
  });

  it('redirects authenticated unfinished user to onboarding', async () => {
    renderAt('/dashboard');
    expect(await screen.findByText(/Welcome to LearnFlow/i)).toBeInTheDocument();
  });
});
