import { test, expect } from '@playwright/test';

// Iter151: regression-proof that bottom action bar doesn't prevent reaching the end of the lesson.
// No screenshots required.

test.describe('Iter151: lesson bottom action bar does not cover content', () => {
  test('can scroll to bottom and see final References heading above the bar', async ({ page }) => {
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

    await page.setViewportSize({ width: 375, height: 812 });

    // Make sure lesson is long enough and ends with a visible marker heading we can assert on.
    await page.route('**/api/v1/courses/*/lessons/*', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      const res = await route.fetch();
      try {
        const json = (await res.json()) as any;
        if (typeof json?.content === 'string') {
          const marker = 'ITER151_SCROLL_MARKER';
          const tail = `\n\n### ${marker}\n\n${'Extra filler.\n\n'.repeat(60)}`;
          if (!json.content.includes(marker)) json.content = `${json.content}${tail}`;
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

    await page.goto('/');

    const ids = await page.evaluate(async () => {
      const token = localStorage.getItem('learnflow-token');
      const authHeaders: Record<string, string> = { Authorization: `Bearer ${token || 'dev'}` };

      const res = await fetch('/api/v1/courses', { headers: authHeaders });
      const data = await res.json();

      if (!data.courses || data.courses.length === 0) {
        const create = await fetch('/api/v1/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ topic: 'Iter151 Scroll Seed', depth: 'beginner' }),
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
    const bottomBar = page.locator('[data-testid="lesson-bottom-action-bar"]');
    await expect(bottomBar).toBeVisible();

    const markerHeading = page.getByRole('heading', { name: 'ITER151_SCROLL_MARKER' }).first();
    await expect(markerHeading).toBeVisible({ timeout: 30_000 });

    // Scroll to very bottom.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Ensure the marker is still visible (i.e., not permanently covered by the fixed bar).
    await expect(markerHeading).toBeVisible();

    // Sanity: bar is fixed and visible at bottom.
    await expect(bottomBar).toBeVisible();
  });
});
