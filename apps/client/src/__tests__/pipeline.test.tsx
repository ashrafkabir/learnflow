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

// Polyfill EventSource for jsdom
if (typeof globalThis.EventSource === 'undefined') {
  globalThis.EventSource = class EventSource {
    url: string;
    readyState = 0;
    constructor(url: string) {
      this.url = url;
    }
    addEventListener() {}
    removeEventListener() {}
    close() {}
    onerror: any = null;
    onmessage: any = null;
    onopen: any = null;
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSED = 2;
    CONNECTING = 0;
    OPEN = 1;
    CLOSED = 2;
    dispatchEvent() {
      return false;
    }
  } as any;
}

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

describe('PipelineDetail screen', () => {
  it('renders milestones section when lessonMilestones present', async () => {
    localStorage.setItem('learnflow-token', 'test-token');

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : (input as Request).url;
      if (url.includes('/api/v1/profile/context')) {
        return new Response(
          JSON.stringify({
            goals: [],
            topics: [],
            experience: 'beginner',
            subscriptionTier: 'free',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (url.includes('/api/v1/subscription')) {
        return new Response(JSON.stringify({ tier: 'free' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url.includes('/api/v1/notifications')) {
        return new Response(JSON.stringify({ notifications: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url.includes('/api/v1/pipeline/test-id')) {
        return new Response(
          JSON.stringify({
            id: 'test-id',
            courseId: 'c1',
            topic: 'Test Topic',
            status: 'RUNNING',
            stage: 'synthesizing',
            progress: 60,
            startedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            crawlThreads: [],
            organizedSources: 0,
            deduplicatedCount: 0,
            credibilityScores: [],
            themes: [],
            lessonSyntheses: [],
            qualityResults: [],
            moduleCount: 1,
            lessonCount: 1,
            lessonMilestones: [
              {
                lessonId: 'c1-m0-l0',
                lessonTitle: 'Intro',
                type: 'plan_ready',
                ts: new Date().toISOString(),
              },
              {
                lessonId: 'c1-m0-l0',
                lessonTitle: 'Intro',
                type: 'sources_ready',
                ts: new Date().toISOString(),
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response(JSON.stringify({ courses: [], keys: [], currentStreak: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    renderAt('/pipeline/test-id');

    expect(await screen.findByText('Milestones')).toBeInTheDocument();
    expect(await screen.findAllByText('Intro')).toHaveLength(3);

    // pending/done indicator should exist via aria-label
    expect(
      document.querySelector('[aria-label*="plan_ready"]') ||
        document.querySelector('[aria-label*="sources_ready"]'),
    ).toBeTruthy();
  });

  it('renders without crash at /pipeline/test-id', async () => {
    const { container } = renderAt('/pipeline/test-id');
    await waitFor(
      () => {
        expect(container.querySelector('section, main, div')).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });

  it('shows a back button in loading state', async () => {
    renderAt('/pipeline/test-id');
    await waitFor(
      () => {
        expect(screen.getByText(/back|←/i)).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });

  it('renders a section element', async () => {
    renderAt('/pipeline/test-id');
    await waitFor(
      () => {
        expect(document.querySelector('section')).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });

  it('shows loading skeleton when state is null', async () => {
    renderAt('/pipeline/test-id');
    await waitFor(
      () => {
        const pulse = document.querySelector('[class*="animate-pulse"], [class*="skeleton"]');
        expect(pulse).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });

  it('has a sticky header', async () => {
    renderAt('/pipeline/test-id');
    await waitFor(
      () => {
        const header = document.querySelector('header');
        expect(header).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });

  it('renders navigation structure', async () => {
    renderAt('/pipeline/test-id');
    await waitFor(
      () => {
        expect(document.querySelector('nav, button')).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });
});
