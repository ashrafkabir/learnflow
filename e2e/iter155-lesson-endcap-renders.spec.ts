import { test, expect } from '@playwright/test';

// Iter155 P0: Guard that LessonReader renders Next Steps + Quick Check sections when present.
// No screenshots required.

test.describe('Iter155: LessonReader endcap sections render', () => {
  test('renders Next Steps + Quick Check blocks when lesson content includes headings', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as any).__LEARNFLOW_ENV__ = {
        ...(window as any).__LEARNFLOW_ENV__,
        VITE_DEV_AUTH_BYPASS: '1',
        PLAYWRIGHT_E2E_FIXTURES: '1',
      };
      (window as any).__LEARNFLOW_E2E__ = true;

      // Avoid onboarding overlays blocking interactions.
      localStorage.setItem('learnflow-onboarding-complete', 'true');
      localStorage.setItem('onboarding-tour-complete', 'true');

      // Token values are irrelevant when DEV_AUTH_BYPASS is enabled.
      localStorage.setItem('learnflow-token', 'dev');
      localStorage.setItem(
        'learnflow-user',
        JSON.stringify({ id: 'u1', email: 'dev@learnflow', tier: 'pro' }),
      );
    });

    // Intercept lesson fetch and inject the headings that the parser expects.
    await page.route('**/api/v1/courses/*/lessons/*', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      const res = await route.fetch();
      try {
        const json = (await res.json()) as any;
        const content = typeof json?.content === 'string' ? json.content : '';
        const injected = `${content}\n\n## Next Steps\n- Do thing one\n- Do thing two\n\n## Quick Check\n1. What is X?\n2. Why does Y matter?\n`;
        return route.fulfill({
          status: res.status(),
          headers: res.headers(),
          contentType: 'application/json',
          body: JSON.stringify({ ...json, content: injected }),
        });
      } catch {
        return route.fulfill({ status: res.status(), body: await res.text() });
      }
    });

    await page.goto('/');

    // Create/find a course+lesson via dev API (same pattern as other LessonReader e2e specs)
    const ids = await page.evaluate(async () => {
      const token = localStorage.getItem('learnflow-token');
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch('/api/v1/courses', { headers: authHeaders });
      const data = await res.json();

      if (!data.courses || data.courses.length === 0) {
        const create = await fetch('/api/v1/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ topic: 'Iter155 Endcap Seed', depth: 'beginner' }),
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

    await expect(page.locator('[data-screen="lesson-reader"]').first()).toBeVisible({
      timeout: 60_000,
    });

    await expect(page.locator('[data-testid="lesson-next-steps"]').first()).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.locator('[data-testid="lesson-quick-check"]').first()).toBeVisible({
      timeout: 60_000,
    });
  });
});
