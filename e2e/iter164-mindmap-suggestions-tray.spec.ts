import { test, expect } from '@playwright/test';

// Iter164:
// Ensure WS-driven mindmap suggestions are visible and can be dismissed from the Mindmap Explorer tray.
// Acceptance path is tested indirectly via existing MindmapExplorer on-graph accept flow;
// here we validate the tray is present + wired to server.

const API = 'http://127.0.0.1:3000';

async function registerAndGetToken(request: any): Promise<string> {
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@learnflow.dev`;
  const reg = await request.post(`${API}/api/v1/auth/register`, {
    timeout: 20_000,
    data: { email, password: 'password123', displayName: 'E2E' },
  });
  const data = await reg.json();
  return data.accessToken as string;
}

async function createCourse(request: any, token: string): Promise<string> {
  const create = await request.post(`${API}/api/v1/courses`, {
    timeout: 20_000,
    headers: { Authorization: `Bearer ${token}`, 'x-learnflow-e2e-fixtures': 'true' },
    data: { topic: 'Iter164 Mindmap Suggestions Tray', depth: 'beginner', fast: true },
  });
  const data = await create.json();
  return data.id as string;
}

test('Iter164: Mindmap Explorer shows suggestions tray and can dismiss items', async ({
  page,
  request,
  baseURL,
}) => {
  await page.addInitScript(() => {
    (window as any).__LEARNFLOW_ENV__ = {
      VITE_API_BASE_URL: 'http://127.0.0.1:3000',
      VITE_DEV_AUTH_BYPASS: '1',
    };
    (window as any).__LEARNFLOW_E2E__ = true;
    localStorage.setItem('learnflow-onboarding-complete', 'true');
  });

  const token = await registerAndGetToken(request);
  const courseId = await createCourse(request, token);

  await page.goto(baseURL || '/');
  await page.evaluate((t) => {
    localStorage.setItem('learnflow-token', t);
  }, token);

  // Open mindmap with explicit courseId so sharedParams.courseId is set.
  await page.goto(`${baseURL}/mindmap?courseId=${encodeURIComponent(courseId)}`, {
    waitUntil: 'domcontentloaded',
  });

  await expect(page.locator('[data-screen="mindmap"]')).toBeVisible();
  const tray = page.locator('[data-testid="mindmap-suggestions-tray"]');
  await expect(tray).toBeVisible();

  // Ensure tray shows at least one suggestion soon (MindmapExplorer triggers /mindmap/suggest and /suggestions on mount).
  await expect(tray.getByRole('button', { name: 'Dismiss' }).first()).toBeVisible({
    timeout: 30_000,
  });

  const before = await tray.getByRole('button', { name: 'Dismiss' }).count();
  await tray.getByRole('button', { name: 'Dismiss' }).first().click();

  // After dismissal, count should decrease (best-effort; allow stable if backend returns same count due to race).
  await expect
    .poll(async () => tray.getByRole('button', { name: 'Dismiss' }).count(), {
      timeout: 10_000,
    })
    .toBeLessThan(before);

  await page.screenshot({
    path: `e2e/screenshots/iter164-mindmap-suggestions-tray.png`,
    fullPage: true,
  });
});
