import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { PricingPage } from '../screens/marketing/Pricing.js';

function setAuth() {
  // In unit tests, localStorage may not exist depending on vitest environment.
  // Provide a tiny in-memory shim when needed.
  if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map<string, string>();
    // test shim
    globalThis.localStorage = {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => {
        store.set(k, String(v));
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => {
        store.clear();
      },
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      get length() {
        return store.size;
      },
    } as any;
  }

  localStorage.setItem('learnflow-token', 'test-token');
}

describe('Subscription upgrade UX', () => {
  it('calls subscription upgrade endpoint when upgrading to Pro', async () => {
    setAuth();

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/v1/subscription')) {
        return new Response(JSON.stringify({ tier: 'pro' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    });

    // test override
    globalThis.fetch = fetchMock;

    render(
      <MemoryRouter initialEntries={['/pricing']}>
        <PricingPage />
      </MemoryRouter>,
    );

    const upgradeBtn = await screen.findByRole('button', { name: /upgrade to pro/i });
    fireEvent.click(upgradeBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const subscriptionCall = fetchMock.mock.calls
      .map((c) => String(c[0]))
      .find((u) => u.includes('/api/v1/subscription'));

    expect(subscriptionCall).toBeTruthy();
  });
});
