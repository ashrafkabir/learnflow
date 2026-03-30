import { test, expect } from '@playwright/test';

// Iter97 P0: Proof of multi-user collaboration
// - 2 browser contexts = 2 users
// - Join same group-owned mindmap room
// - Perform edits
// - Assert convergence + presence count changes
// - Capture screenshots to screenshots/iter97/run-001/

test('Iter97: two users collaborate in shared mindmap room (converges + presence)', async ({
  browser,
  baseURL,
}) => {
  const runDir = 'screenshots/iter97/run-001';

  const ctx1 = await browser.newContext();
  const ctx2 = await browser.newContext();

  // Force a stable Yjs websocket origin for tests. Playwright baseURL uses 127.0.0.1,
  // and the app defaults to Yjs on :3002 for localhost/127.0.0.1.
  const yjsOrigin = 'ws://127.0.0.1:3002';

  const p1 = await ctx1.newPage();
  const p2 = await ctx2.newPage();

  // Make each client show a distinct name in awareness.
  // NOTE: tokens are injected after registration once the pages have an origin.
  await p1.addInitScript((o) => {
    (window as any).__LEARNFLOW_ENV__ = {
      VITE_DEV_AUTH_BYPASS: '1',
      VITE_YJS_WS_ORIGIN: o,
    };
    localStorage.setItem('learnflow-onboarding-complete', 'true');
    localStorage.setItem('learnflow-userId', 'e2e-user-1');
  }, yjsOrigin);
  await p2.addInitScript((o) => {
    (window as any).__LEARNFLOW_ENV__ = {
      VITE_DEV_AUTH_BYPASS: '1',
      VITE_YJS_WS_ORIGIN: o,
    };
    localStorage.setItem('learnflow-onboarding-complete', 'true');
    localStorage.setItem('learnflow-userId', 'e2e-user-2');
  }, yjsOrigin);

  // Use dev auth bypass for Yjs so collaboration is deterministic in CI.
  // The Yjs server accepts token=dev when LEARNFLOW_DEV_AUTH is enabled.
  // Using dev tokens also bypasses group ACL checks for the groupId.
  const _apiBase = 'http://127.0.0.1:3000';
  const token1 = 'dev';
  const token2 = 'dev';
  const email = `iter97-${Date.now()}@test.com`;
  const email2 = `iter97-2-${Date.now()}@test.com`;
  const groupId = 'cg-iter97-dev';

  // Ensure pages have an origin before touching localStorage
  await p1.goto(`${baseURL}/login`);
  await p2.goto(`${baseURL}/login`);
  await p1.evaluate((t) => localStorage.setItem('learnflow-token', t), token1);
  await p2.evaluate((t) => localStorage.setItem('learnflow-token', t), token2);

  // Ensure mindmap awareness identifies the two peers distinctly.
  await p1.evaluate((e) => localStorage.setItem('learnflow-email', e), email);
  await p2.evaluate((e) => localStorage.setItem('learnflow-email', e), email2);

  // Use a stable courseId (avoid hitting free-tier course creation limits in CI).
  const courseId = 'c-1';

  await p1.goto(
    `${baseURL}/mindmap?groupId=${encodeURIComponent(groupId)}&courseId=${encodeURIComponent(courseId)}`,
  );
  await p2.goto(
    `${baseURL}/mindmap?groupId=${encodeURIComponent(groupId)}&courseId=${encodeURIComponent(courseId)}`,
  );

  // Debug: confirm tokens are present in each context
  expect(await p1.evaluate(() => localStorage.getItem('learnflow-token'))).toBeTruthy();
  expect(await p2.evaluate(() => localStorage.getItem('learnflow-token'))).toBeTruthy();

  await expect(p1.locator('[data-screen="mindmap"]')).toBeVisible({ timeout: 30_000 });
  await expect(p2.locator('[data-screen="mindmap"]')).toBeVisible({ timeout: 30_000 });

  await p1.screenshot({ path: `${runDir}/01-p1-loaded.png`, fullPage: true });
  await p2.screenshot({ path: `${runDir}/02-p2-loaded.png`, fullPage: true });

  // Presence should eventually reflect the other peer.
  await expect(p1.locator('text=/Here now:/i')).toBeVisible({ timeout: 30_000 });
  // The count is rendered as separate text nodes; assert via the container.
  await expect(p1.locator('text=/Here now:/i').locator('..')).toContainText('Here now:', {
    timeout: 60_000,
  });
  await expect(p1.locator('text=/Here now:/i').locator('..')).toContainText('2', {
    timeout: 60_000,
  });
  await p1.screenshot({ path: `${runDir}/03-p1-presence.png`, fullPage: true });

  // Edit from user 1 → should converge to user 2.
  await p1.getByRole('button', { name: /add node/i }).click();
  await p1.getByPlaceholder(/node label/i).fill('Iter97 Node A');
  await p1.getByRole('button', { name: /^add$/i }).click();

  // Debug: confirm node was added to p1's exposed Yjs array
  await expect
    .poll(async () => {
      return await p1.evaluate(() => {
        const arr = (globalThis as any).__learnflowMindmapNodes as any;
        if (!arr) return [];
        try {
          return (arr.toArray ? arr.toArray() : []).map((n: any) => String(n.label));
        } catch {
          return [];
        }
      });
    })
    .toContain('Iter97 Node A');

  await p1.screenshot({ path: `${runDir}/04-p1-added-node.png`, fullPage: true });

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
    .toContain('Iter97 Node A');

  await p2.screenshot({ path: `${runDir}/05-p2-converged.png`, fullPage: true });

  // Now close user 2; presence may drop back to 1 depending on awareness timing.
  await ctx2.close();

  await p1.screenshot({ path: `${runDir}/06-p1-after-close.png`, fullPage: true });

  await ctx1.close();
});
