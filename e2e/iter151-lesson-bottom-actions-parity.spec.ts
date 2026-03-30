import { test, expect } from '@playwright/test';

// Iter151: Desktop parity for bottom action bar + right-rail Undo
// No screenshots required.

test.describe('Iter151: lesson bottom action bar parity (desktop)', () => {
  test('bottom bar shows 4 core actions; undo appears in both bottom bar + right rail after Improve apply', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as any).__LEARNFLOW_ENV__ = {
        VITE_DEV_AUTH_BYPASS: '1',
        PLAYWRIGHT_E2E_FIXTURES: '1',
      };
      (window as any).__LEARNFLOW_E2E__ = true;
      localStorage.setItem('learnflow-onboarding-complete', 'true');
      localStorage.setItem('onboarding-tour-complete', 'true');
      localStorage.setItem('learnflow-token', 'dev');
      localStorage.setItem(
        'learnflow-user',
        JSON.stringify({ id: 'u1', email: 'dev@learnflow', tier: 'pro' }),
      );
    });

    await page.setViewportSize({ width: 1280, height: 800 });

    await page.goto('/');

    // Use API to ensure we have a course + lesson id (avoid relying on Dashboard UI).
    const ids = await page.evaluate(async () => {
      const token = localStorage.getItem('learnflow-token');
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch('/api/v1/courses', { headers: authHeaders });
      const data = await res.json();

      if (!data.courses || data.courses.length === 0) {
        const create = await fetch('/api/v1/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ topic: 'Iter151 Seed', depth: 'beginner' }),
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

    // Stub Improve preview + replace-subsection so we can deterministically assert Undo appears.
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
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto(`/courses/${ids.courseId}/lessons/${ids.lessonId}`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.locator('[data-screen="lesson-reader"]')).toBeVisible({ timeout: 30_000 });

    const bottomBar = page.locator('[data-testid="lesson-bottom-action-bar"]');
    await expect(bottomBar).toBeVisible();

    await expect(bottomBar.locator('[data-testid="lesson-action-mark-complete"]')).toBeVisible();
    await expect(bottomBar.locator('[data-testid="lesson-action-quiz"]')).toBeVisible();
    await expect(bottomBar.locator('[data-testid="lesson-action-notes"]')).toBeVisible();
    await expect(bottomBar.locator('[data-testid="lesson-action-ask"]')).toBeVisible();

    // Undo should not exist initially.
    await expect(bottomBar.locator('[data-testid="lesson-action-undo"]')).toHaveCount(0);

    const firstH3 = page.locator('h3').first();
    await expect(firstH3).toBeVisible();
    await firstH3.hover();

    const improveBtn = page.getByRole('button', { name: /^Improve /i }).first();
    await expect(improveBtn).toBeVisible();
    await improveBtn.click();

    // Wait for apply/replace to complete: Undo should appear.
    await expect(bottomBar.locator('[data-testid="lesson-action-undo"]')).toBeVisible({
      timeout: 30_000,
    });

    // Right rail Undo should also appear.
    const rightRail = page.locator('[data-testid="lesson-actions"]');
    await expect(rightRail).toBeVisible();
    await expect(rightRail.locator('button[aria-label="Undo last edit"]')).toBeVisible();
  });
});
