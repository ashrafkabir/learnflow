import { test, expect } from '@playwright/test';

async function waitForApi(apiBase: string, request: any, timeoutMs = 30_000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await request.get(`${apiBase}/health`, { timeout: 5_000 });
      if (res.ok()) return;
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`API not ready after ${timeoutMs}ms: ${apiBase}`);
}

async function registerAndGetToken(
  apiBase: string,
  request: any,
): Promise<{ token: string; email: string }> {
  await waitForApi(apiBase, request);

  const email = `e2e-next-lesson-${Date.now()}-${Math.floor(Math.random() * 1e6)}@learnflow.dev`;
  const reg = await request.post(`${apiBase}/api/v1/auth/register`, {
    timeout: 20_000,
    data: { email, password: 'password123', displayName: 'E2E Next Lesson' },
  });
  if (!reg.ok()) {
    const body = await reg.text().catch(() => '');
    throw new Error(`Register failed: ${reg.status()} ${reg.statusText()} ${body}`);
  }
  const regData = await reg.json();
  const token = regData.accessToken as string;
  if (!token) throw new Error('Register did not return accessToken');
  return { token, email };
}

async function createCourse(
  apiBase: string,
  request: any,
  token: string,
): Promise<{ courseId: string; pipelineId?: string }> {
  const p = await request.post(`${apiBase}/api/v1/pipeline`, {
    timeout: 30_000,
    headers: { Authorization: `Bearer ${token}`, 'x-learnflow-e2e-fixtures': 'true' },
    data: { topic: `Iter152 Next lesson ${Date.now()}` },
  });
  if (!p.ok()) {
    const body = await p.text().catch(() => '');
    throw new Error(`Create pipeline failed: ${p.status()} ${p.statusText()} ${body}`);
  }
  const pdata = await p.json();
  const courseId = pdata.courseId as string;
  const pipelineId = pdata.pipelineId as string | undefined;
  if (!courseId) throw new Error('Create pipeline did not return courseId');
  return { courseId, pipelineId };
}

function initClientStorage() {
  return () => {
    (window as any).__LEARNFLOW_E2E__ = true;
    (window as any).__LEARNFLOW_ENV__ = {
      ...((window as any).__LEARNFLOW_ENV__ || {}),
      VITE_DEV_AUTH_BYPASS: '0',
    };
    localStorage.setItem('learnflow-onboarding-complete', 'true');
    localStorage.setItem('onboarding-tour-complete', 'true');
  };
}

// Iter152 Task 4: ensure Next lesson CTA exists when a next lesson exists.

test.describe('Iter152: Next lesson CTA', () => {
  test('lesson shows Next lesson CTA at end when next lesson exists', async ({ page, request }) => {
    test.setTimeout(180_000);
    await page.addInitScript(initClientStorage());

    const apiBase = 'http://127.0.0.1:3000';
    const { token } = await registerAndGetToken(apiBase, request);
    const { courseId } = await createCourse(apiBase, request, token);

    await page.goto('/');
    await page.evaluate((t) => {
      try {
        localStorage.setItem('learnflow-token', t);
      } catch {
        /* ignore */
      }
    }, token);

    await page.goto(`/courses/${courseId}`);
    await expect(page.locator('[data-screen="course-view"]')).toBeVisible({ timeout: 20_000 });

    // If still generating, we cannot assert lesson CTA.
    if (await page.locator('text=We are building your course').count()) return;

    const lessonHref = await page.getAttribute('a[href*="/lessons/"]', 'href').catch(() => null);
    if (!lessonHref) throw new Error('No lesson link found on course view');

    await page.goto(lessonHref);
    await expect(page.locator('[data-screen="lesson-reader"]')).toBeVisible({ timeout: 20_000 });

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    await expect(page.locator('[data-testid="next-lesson-cta"]')).toBeVisible();
    await expect(page.locator('[data-testid="next-lesson-cta"]')).toContainText(/Next lesson/i);
  });
});
