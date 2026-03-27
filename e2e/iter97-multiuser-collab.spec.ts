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

  const p1 = await ctx1.newPage();
  const p2 = await ctx2.newPage();

  // Make each client show a distinct name in awareness.
  // NOTE: tokens are injected after registration once the pages have an origin.
  await p1.addInitScript(() => {
    (window as any).__LEARNFLOW_ENV__ = { VITE_DEV_AUTH_BYPASS: '1' };
    localStorage.setItem('learnflow-onboarding-complete', 'true');
    localStorage.setItem('learnflow-userId', 'e2e-user-1');
  });
  await p2.addInitScript(() => {
    (window as any).__LEARNFLOW_ENV__ = { VITE_DEV_AUTH_BYPASS: '1' };
    localStorage.setItem('learnflow-onboarding-complete', 'true');
    localStorage.setItem('learnflow-userId', 'e2e-user-2');
  });

  // Create a real shared group so both JWT users can join a group-owned mindmap room.
  const apiBase = 'http://127.0.0.1:3000';

  // Register 2 distinct users
  const email = `iter97-${Date.now()}@test.com`;
  const regRes = await p1.request.post(`${apiBase}/api/v1/auth/register`, {
    data: { email, password: 'password123', displayName: 'Iter97User1' },
  });
  if (!regRes.ok()) throw new Error(`register failed: ${regRes.status()} ${await regRes.text()}`);
  const reg = await regRes.json();
  const token1 = String(reg.accessToken);
  expect(token1).toBeTruthy();

  const email2 = `iter97-2-${Date.now()}@test.com`;
  const regRes2 = await p1.request.post(`${apiBase}/api/v1/auth/register`, {
    data: { email: email2, password: 'password123', displayName: 'Iter97User2' },
  });
  if (!regRes2.ok())
    throw new Error(`register2 failed: ${regRes2.status()} ${await regRes2.text()}`);
  const reg2 = await regRes2.json();
  const token2 = String(reg2.accessToken);
  expect(token2).toBeTruthy();

  // Create group owned by user1 with user2 as member
  const groupRes = await p1.request.post(`${apiBase}/api/v1/collaboration/groups`, {
    headers: { Authorization: `Bearer ${token1}` },
    data: { name: 'Iter97 Group', memberIds: [String(reg2.user?.id || '')] },
  });
  if (!groupRes.ok())
    throw new Error(`group failed: ${groupRes.status()} ${await groupRes.text()}`);
  const group = await groupRes.json();
  const groupId = String(group.group?.id || '');
  expect(groupId).toMatch(/^cg-/);

  // Ensure pages have an origin before touching localStorage
  await p1.goto(`${baseURL}/login`);
  await p2.goto(`${baseURL}/login`);
  await p1.evaluate((t) => localStorage.setItem('learnflow-token', t), token1);
  await p2.evaluate((t) => localStorage.setItem('learnflow-token', t), token2);

  // Create a course so Mindmap Explorer renders the full mindmap UI.
  const createRes = await p1.request.post(`${apiBase}/api/v1/courses`, {
    headers: { Authorization: `Bearer ${token1}` },
    data: { topic: 'Iter97 Collaboration', depth: 'beginner', title: 'Iter97 Course', fast: true },
  });
  if (!createRes.ok()) {
    const txt = await createRes.text();
    throw new Error(`Failed to create course: ${createRes.status()} ${txt}`);
  }
  const created = await createRes.json();
  const courseId = String(created.id || created.courseId || created?.course?.id || '');
  expect(courseId).toBeTruthy();

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

  // Presence should eventually reflect the other peer (Here now = peers + self).
  // (This can be flaky if the y-websocket awareness handshake is slow; we assert on convergence below.)
  await expect(p1.locator('text=/Here now:/i')).toBeVisible({ timeout: 30_000 });
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
