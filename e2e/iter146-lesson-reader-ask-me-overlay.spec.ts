import { test, expect } from '@playwright/test';

const API = 'http://127.0.0.1:3000';

test('Iter146: Ask me opens overlay and does not navigate', async ({ page, request }) => {
  await page.addInitScript(() => {
    (window as any).__LEARNFLOW_ENV__ = {
      VITE_API_BASE_URL: 'http://127.0.0.1:3000',
      VITE_DEV_AUTH_BYPASS: '0',
      PLAYWRIGHT_E2E_FIXTURES: '1',
    };
    (window as any).__LEARNFLOW_E2E__ = true;
    localStorage.setItem('learnflow-onboarding-complete', 'true');
  });

  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@learnflow.dev`;
  const reg = await request.post(`${API}/api/v1/auth/register`, {
    timeout: 20_000,
    data: { email, password: 'password123', displayName: 'E2E' },
  });
  const regData = await reg.json();
  const token = regData.accessToken as string;

  const create = await request.post(`${API}/api/v1/courses`, {
    timeout: 20_000,
    headers: { Authorization: `Bearer ${token}`, 'x-learnflow-e2e-fixtures': 'true' },
    data: { topic: 'Iter146 Ask Me Overlay', depth: 'beginner', fast: true },
  });
  const createData = await create.json();
  const courseId = createData.id as string;

  const started = Date.now();
  let course: any = null;
  while (Date.now() - started < 60_000) {
    const res = await request.get(`${API}/api/v1/courses/${courseId}`, {
      timeout: 10_000,
      headers: { Authorization: `Bearer ${token}` },
    });
    course = await res.json();
    if (course?.status === 'READY') break;
    await new Promise((r) => setTimeout(r, 750));
  }
  expect(course?.status).toBe('READY');

  const lessonId = course.modules?.[0]?.lessons?.[0]?.id as string;
  await page.goto('/');
  await page.evaluate((t) => localStorage.setItem('learnflow-token', t), token);

  await page.goto(`/courses/${courseId}/lessons/${lessonId}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-screen="lesson-reader"]')).toBeVisible({ timeout: 30_000 });

  const before = page.url();

  // Ask me is in Actions drawer
  await page.getByRole('button', { name: /ask me/i }).click();

  // Overlay visible; URL unchanged
  await expect(page.getByTestId('lesson-ask-overlay')).toBeVisible();
  expect(page.url()).toBe(before);

  // Close
  await page.getByRole('button', { name: /close ask me/i }).click();
  await expect(page.getByTestId('lesson-ask-overlay')).toBeHidden();
});
