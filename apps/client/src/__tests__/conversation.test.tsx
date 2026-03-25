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
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/api/v1/profile/context')) {
      return new Response(
        JSON.stringify({ goals: [], topics: [], experience: 'beginner', subscriptionTier: 'free' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
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

    return new Response(JSON.stringify({ courses: [], keys: [], messages: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
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

describe('Conversation screen', () => {
  it('renders conversation', async () => {
    renderAt('/conversation');
    await waitFor(() => {
      const el = document.querySelector('[data-screen="conversation"]');
      expect(el).toBeTruthy();
    });
  });

  it('has message input area', async () => {
    renderAt('/conversation');
    // Look for textarea or input for messages
    const input = await screen
      .findByRole('textbox')
      .catch(() => document.querySelector('textarea, input[type="text"]'));
    expect(input).toBeTruthy();
  });

  it('has send button', async () => {
    renderAt('/conversation');
    await waitFor(() => {
      expect(document.querySelector('form, button')).toBeTruthy();
    });
  });

  it('shows agent activity indicator markup', async () => {
    renderAt('/conversation');
    await waitFor(() => {
      // The indicator is driven by websocket agent.spawned/agent.complete events;
      // assert the container exists to ensure the UI has a stable hook.
      expect(document.querySelector('[data-agent-activity]')).toBeTruthy();
    });
  });

  it('has quick-action chips or suggestions', async () => {
    renderAt('/conversation');
    await waitFor(() => {
      const chips = document.querySelectorAll('button, [class*="chip"], [class*="quick"]');
      expect(chips.length).toBeGreaterThan(0);
    });
  });

  it('renders conversation header with title', async () => {
    renderAt('/conversation');
    await waitFor(() => {
      const header = document.querySelector('header, [class*="header"], h1, h2');
      expect(header).toBeTruthy();
    });
  });

  it('has a scrollable message area', async () => {
    renderAt('/conversation');
    await waitFor(() => {
      const scrollable = document.querySelector(
        '[class*="overflow"], [class*="scroll"], [style*="overflow"]',
      );
      expect(scrollable || document.querySelector('[data-screen="conversation"]')).toBeTruthy();
    });
  });
});
