import { test, expect } from '@playwright/test';

// Iter135: Lesson reader rails
// - right rail (desktop) exists
// - suggested reads contains >=1 real http(s) URL
// - hero image renders when illustration exists (best-effort)
// - related images section renders if manifest non-empty

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
    data: { topic: 'Iter135 LessonReader Suggested Reads', depth: 'beginner', fast: true },
  });
  const data = await create.json();
  return data.id as string;
}

async function waitForCourseReady(request: any, token: string, courseId: string) {
  const started = Date.now();
  while (Date.now() - started < 60_000) {
    const res = await request.get(`${API}/api/v1/courses/${courseId}`, {
      timeout: 10_000,
      headers: { Authorization: `Bearer ${token}` },
    });
    const c = await res.json();
    if (c?.status === 'READY') return c;
    await new Promise((r) => setTimeout(r, 750));
  }
  throw new Error('Course not READY after 60s');
}

test('Iter135: LessonReader renders right rail + suggested reads (real URLs)', async ({
  page,
  request,
}) => {
  await page.addInitScript(() => {
    (window as any).__LEARNFLOW_ENV__ = {
      VITE_API_BASE_URL: 'http://127.0.0.1:3000',
    };
    (window as any).__LEARNFLOW_E2E__ = true;
    localStorage.setItem('learnflow-onboarding-complete', 'true');
  });

  const token = await registerAndGetToken(request);
  const courseId = await createCourse(request, token);
  const course = await waitForCourseReady(request, token, courseId);

  const lessonId = course.modules?.[0]?.lessons?.[0]?.id as string;
  expect(typeof lessonId).toBe('string');

  await page.goto('/');
  await page.evaluate((t) => {
    try {
      localStorage.setItem('learnflow-token', t);
    } catch {
      /* ignore */
    }
  }, token);

  await page.goto(`/courses/${courseId}/lessons/${lessonId}`, { waitUntil: 'domcontentloaded' });

  await expect(page.getByLabel('Take Notes')).toBeVisible({ timeout: 30_000 });

  // Right rail exists
  await expect(page.locator('[data-testid="lesson-right-rail"]')).toBeVisible();

  // Suggested reads has at least one real http(s) URL
  const links = page
    .locator('[data-testid="lesson-right-rail"]')
    .getByRole('link')
    .filter({ hasText: 'http' });
  await expect(links.first()).toBeVisible();
  const href = await links.first().getAttribute('href');
  expect(href || '').toMatch(/^https?:\/\//);

  // Hero exists; if hero image exists ensure it renders (not broken display: none)
  await expect(page.locator('[data-component="lesson-hero"]')).toBeVisible();
  const heroImg = page.locator('[data-component="lesson-hero"] img').first();
  if (await heroImg.count()) {
    await expect(heroImg).toBeVisible();
  }

  // Related images renders if manifest non-empty
  const related = page.locator('[data-testid="related-images"]');
  if (await related.count()) {
    await expect(related).toBeVisible();
    await expect(related.locator('img').first()).toBeVisible();
  }
});
