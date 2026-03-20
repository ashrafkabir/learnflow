import { test, expect } from '@playwright/test';

// Iter49 Task 5 MVP: two sessions see the same mindmap state via Yjs CRDT server.

test('mindmap CRDT syncs between two clients', async ({ browser, baseURL }) => {
  const ctx1 = await browser.newContext();
  const ctx2 = await browser.newContext();
  const p1 = await ctx1.newPage();
  const p2 = await ctx2.newPage();

  // Ensure dev auth path for websocket token
  await p1.addInitScript(() => localStorage.setItem('learnflow-token', 'dev'));
  await p2.addInitScript(() => localStorage.setItem('learnflow-token', 'dev'));

  // Bypass onboarding and route guards
  await p1.addInitScript(() => localStorage.setItem('learnflow-onboarding-complete', 'true'));
  await p2.addInitScript(() => localStorage.setItem('learnflow-onboarding-complete', 'true'));

  await p1.goto(`${baseURL}/mindmap`);
  await p2.goto(`${baseURL}/mindmap`);

  await expect(p1.locator('[data-screen="mindmap"]')).toBeVisible();

  // Create a node in client 1
  await p1.getByRole('button', { name: /add node/i }).click();
  await p1.getByPlaceholder(/node label/i).fill('CRDT Node A');
  await p1.getByRole('button', { name: /^add$/i }).click();

  // Node should appear in client 2 within a short time.
  // NOTE: vis-network renders to a canvas; there is no DOM text to assert on.
  // Assert via the shared Yjs document exposed on window (dev-only escape hatch).
  await expect
    .poll(async () => {
      return await p2.evaluate(() => {
        const arr = (globalThis as any).__learnflowMindmapNodes as any;
        if (!arr) return [];
        try {
          return (arr.toArray ? arr.toArray() : []).map((n: any) => String(n.label));
        } catch {
          return [];
        }
      });
    })
    .toContain('CRDT Node A');

  await ctx1.close();
  await ctx2.close();
});
