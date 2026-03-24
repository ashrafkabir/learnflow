// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import { UsageDashboard } from '../components/UsageDashboard.js';

beforeEach(() => {
  localStorage.setItem('learnflow-token', 'test');
});

afterEach(() => cleanup());

describe('UsageDashboard', () => {
  it('renders stable layout for 7/30 day tabs', async () => {
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          windows: [7, 30],
          data: {
            '7': {
              days: 7,
              since: new Date().toISOString(),
              totalTokens: 123,
              byDay: [],
              topAgents: [{ agentName: 'course_builder', total: 90 }],
              topProviders: [{ provider: 'openai', total: 123 }],
              byProvider: [{ provider: 'openai', total: 123 }],
              providerMeta: [
                {
                  provider: 'openai',
                  total: 123,
                  callCount: 3,
                  lastUsed: new Date().toISOString(),
                },
              ],
            },
            '30': {
              days: 30,
              since: new Date().toISOString(),
              totalTokens: 456,
              byDay: [],
              topAgents: [{ agentName: 'update_agent', total: 200 }],
              topProviders: [{ provider: 'anthropic', total: 456 }],
              byProvider: [{ provider: 'anthropic', total: 456 }],
              providerMeta: [
                {
                  provider: 'anthropic',
                  total: 456,
                  callCount: 9,
                  lastUsed: null,
                },
              ],
            },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )) as typeof fetch;

    render(<UsageDashboard />);

    await new Promise((r) => setTimeout(r, 50));
    expect(document.body.innerHTML).toContain('Usage');
    expect(document.body.innerHTML).toContain('7 days');
    expect(document.body.innerHTML).toContain('30 days');
    expect(document.body.innerHTML).toContain('Total tokens');

    expect(document.body.innerHTML).toMatchSnapshot();
  });
});
