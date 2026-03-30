import { test, expect } from '@playwright/test';

// Iter146: Dig Deeper should not call API when subsection body is empty/too short.
// Uses dev bypass + E2E hook override.

test('Iter146: Dig Deeper empty subsection body shows toast + no request', async ({ page }) => {
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

  // Track preview endpoint calls (should be none)
  const calls: string[] = [];
  await page.route('**/api/v1/courses/*/lessons/*/selection-tools/preview', async (route) => {
    calls.push(route.request().url());
    return route.fallback();
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
        body: JSON.stringify({ topic: 'Iter146 Dig Deeper Empty Seed', depth: 'beginner' }),
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

  // Force empty body text for first subsection via E2E hook.
  await page.evaluate(() => {
    (window as any).__learnflowE2E?.setSubsectionBody?.(0, '');
  });

  const firstH3 = page.locator('h3').first();
  if (await firstH3.count()) {
    await expect(firstH3).toBeVisible({ timeout: 30_000 });
    await firstH3.hover();

    const dig = page.getByRole('button', { name: /^Dig Deeper /i }).first();
    await dig.click();

    await expect(page.getByText(/select a paragraph under this heading/i)).toBeVisible();
    expect(calls.length).toBe(0);
  }
});
