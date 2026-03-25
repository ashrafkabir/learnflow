// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import React from 'react';
import { UpdateAgentSettingsPanel } from '../components/update-agent/UpdateAgentSettingsPanel.js';
import { ThemeProvider } from '../design-system/ThemeProvider.js';
import { ToastProvider } from '../components/Toast.js';
import { AppProvider } from '../context/AppContext.js';

beforeEach(() => {
  localStorage.setItem(
    'learnflow-token',
    'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjo5OTk5OTk5OTk5fQ.test',
  );
});

afterEach(() => cleanup());

function renderPanel() {
  return render(
    <ThemeProvider>
      <AppProvider>
        <ToastProvider>
          <UpdateAgentSettingsPanel />
        </ToastProvider>
      </AppProvider>
    </ThemeProvider>,
  );
}

describe('Update Agent trust loop UI', () => {
  it('shows per-topic last run status and allows Run now', async () => {
    const calls: Array<{ url: string; method: string; body?: any }> = [];

    globalThis.fetch = (async (input: any, init?: any) => {
      const url = String(input);
      const method = String(init?.method || 'GET');
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ url, method, body });

      if (url.includes('/api/v1/update-agent/topics')) {
        return new Response(
          JSON.stringify({
            topics: [
              {
                id: 't1',
                topic: 'AI Safety',
                enabled: true,
                createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
                updatedAt: null,
                lastRunAt: new Date('2026-01-02T00:00:00.000Z').toISOString(),
                lastRunOk: false,
                lastRunError: 'HTTP 429',
                lockedAt: null,
                lockId: '',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (url.includes('/api/v1/update-agent/sources')) {
        return new Response(
          JSON.stringify({
            sources: [
              {
                id: 's1',
                topicId: 't1',
                url: 'https://example.com/feed.xml',
                enabled: true,
                position: 0,
                sourceType: 'rss',
                createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
                lastCheckedAt: null,
                lastSuccessAt: null,
                lastError: 'Timeout',
                lastErrorAt: new Date('2026-01-03T00:00:00.000Z').toISOString(),
                nextEligibleAt: new Date('2026-01-04T00:00:00.000Z').toISOString(),
                failureCount: 2,
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (url.includes('/api/v1/notifications/generate')) {
        return new Response(JSON.stringify({ created: 0, failures: [] }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const ui = renderPanel();

    // allow effects to run
    await new Promise((r) => setTimeout(r, 50));

    expect(ui.getByText(/Topic status/i)).toBeInTheDocument();
    expect(ui.getByText(/crawl the open web/i)).toBeInTheDocument();
    expect(ui.getAllByText(/AI Safety/i).length).toBeGreaterThan(0);
    expect(ui.getAllByText(/^Failure$/i).length).toBeGreaterThan(0);
    expect(ui.getByText(/Last run error/i)).toBeInTheDocument();

    const runNow = ui.getByRole('button', { name: /Run now/i });
    fireEvent.click(runNow);

    await new Promise((r) => setTimeout(r, 50));

    expect(
      calls.some((c) => c.url.includes('/api/v1/notifications/generate') && c.method === 'POST'),
    ).toBe(true);
  });
});
