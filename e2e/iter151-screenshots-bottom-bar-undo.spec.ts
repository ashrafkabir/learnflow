import { test, expect } from '@playwright/test';

/**
 * Iter151: screenshot evidence for bottom action bar + Undo visibility (desktop + mobile).
 *
 * Output dirs:
 * - repo: /home/aifactory/.openclaw/workspace/learnflow/learnflow/screenshots/iter151/run-001
 * - OneDrive: /home/aifactory/onedrive-learnflow/iter151/screenshots/run-001
 */

const OUT_REPO =
  process.env.LEARNFLOW_E2E_OUT_REPO ||
  '/home/aifactory/.openclaw/workspace/learnflow/learnflow/screenshots/iter151/run-001';

const OUT_OD =
  process.env.LEARNFLOW_E2E_OUT_OD ||
  '/home/aifactory/onedrive-learnflow/iter151/screenshots/run-001';

async function snap(page: any, name: string, fullPage = true) {
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT_REPO}/${name}.png`, fullPage });
  await page.screenshot({ path: `${OUT_OD}/${name}.png`, fullPage });
}

async function seedAuth(page: any) {
  await page.addInitScript(() => {
    (window as any).__LEARNFLOW_ENV__ = {
      VITE_DEV_AUTH_BYPASS: '1',
      PLAYWRIGHT_E2E_FIXTURES: '1',
    };
    (window as any).__LEARNFLOW_E2E__ = true;
    localStorage.setItem('learnflow-onboarding-complete', 'true');
    localStorage.setItem('learnflow-token', 'dev');
    localStorage.setItem(
      'learnflow-user',
      JSON.stringify({ id: 'u1', email: 'dev@learnflow', tier: 'pro' }),
    );
  });
}

test.describe('Iter151 screenshots: bottom bar + undo', () => {
  test('desktop: bottom bar visible + undo visible after improve', async ({ page }) => {
    await seedAuth(page);
    await page.setViewportSize({ width: 1280, height: 800 });

    // Ensure lesson content contains an H3 so Improve hover affordance exists.
    await page.route('**/api/v1/courses/*/lessons/*', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      const res = await route.fetch();
      try {
        const json = (await res.json()) as any;
        if (typeof json?.content === 'string' && !json.content.includes('\n### ')) {
          json.content = `${json.content}\n\n### Iter151 Test Subsection\n\nA short paragraph for Improve + Undo.\n`;
        }
        return route.fulfill({
          status: res.status(),
          headers: res.headers(),
          contentType: 'application/json',
          body: JSON.stringify(json),
        });
      } catch {
        return route.fulfill({ status: res.status(), body: await res.text() });
      }
    });

    await page.addInitScript(() => {
      (window as any).__ITER151_REPLACE_OK__ = false;
    });

    // Stub Improve preview.
    await page.route('**/api/v1/courses/*/lessons/*/selection-tools/preview', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      const body = (await route.request().postDataJSON()) as any;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tool: body.tool,
          selectedText: body.selectedText,
          preview: {
            newTitle: 'Improved: New Heading Title (Iter151)',
            markdown: '### Improved subsection\n\nIter151 content.',
            images: [],
            links: [],
          },
        }),
      });
    });

    await page.route('**/api/v1/courses/*/lessons/*/content/replace-subsection', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      await page.evaluate(() => {
        (window as any).__ITER151_REPLACE_OK__ = true;
      });
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto('/');

    const ids = await page.evaluate(async () => {
      const token = localStorage.getItem('learnflow-token');
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch('/api/v1/courses', { headers: authHeaders });
      const data = await res.json();

      if (!data.courses || data.courses.length === 0) {
        const create = await fetch('/api/v1/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ topic: 'Iter151 Screenshot Seed', depth: 'beginner' }),
        });
        const created = await create.json();
        const lessonId = created.modules[0].lessons[0].id as string;
        return { courseId: created.id as string, lessonId };
      }

      const courseId = data.courses[0].id as string;
      const courseRes = await fetch(`/api/v1/courses/${courseId}`, { headers: authHeaders });
      const course = await courseRes.json();
      const lessonId = course.modules[0].lessons[0].id as string;
      return { courseId, lessonId };
    });

    await page.goto(`/courses/${ids.courseId}/lessons/${ids.lessonId}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('[data-screen="lesson-reader"]')).toBeVisible({ timeout: 30_000 });

    await expect(page.locator('[data-testid="lesson-bottom-action-bar"]')).toBeVisible();
    await snap(page, '01-desktop-bottom-bar');

    const firstH3 = page.locator('h3').first();
    await expect(firstH3).toBeVisible();
    await firstH3.hover();

    const improveBtn = page.getByRole('button', { name: /^Improve /i }).first();
    await expect(improveBtn).toBeVisible();
    await improveBtn.click();

    await expect
      .poll(() => page.evaluate(() => (window as any).__ITER151_REPLACE_OK__ === true), {
        timeout: 15_000,
      })
      .toBeTruthy();

    await expect(page.locator('[data-testid="lesson-action-undo"]')).toBeVisible();
    await snap(page, '02-desktop-undo-visible');
  });

  test('mobile: bottom bar visible', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'mobile screenshot uses chromium only');

    await seedAuth(page);
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/');

    const ids = await page.evaluate(async () => {
      const token = localStorage.getItem('learnflow-token');
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch('/api/v1/courses', { headers: authHeaders });
      const data = await res.json();

      if (!data.courses || data.courses.length === 0) {
        const create = await fetch('/api/v1/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ topic: 'Iter151 Screenshot Seed', depth: 'beginner' }),
        });
        const created = await create.json();
        const lessonId = created.modules[0].lessons[0].id as string;
        return { courseId: created.id as string, lessonId };
      }

      const courseId = data.courses[0].id as string;
      const courseRes = await fetch(`/api/v1/courses/${courseId}`, { headers: authHeaders });
      const course = await courseRes.json();
      const lessonId = course.modules[0].lessons[0].id as string;
      return { courseId, lessonId };
    });

    await page.goto(`/courses/${ids.courseId}/lessons/${ids.lessonId}`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.locator('[data-screen="lesson-reader"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-testid="lesson-bottom-action-bar"]')).toBeVisible();

    await snap(page, '03-mobile-bottom-bar');
  });
});
