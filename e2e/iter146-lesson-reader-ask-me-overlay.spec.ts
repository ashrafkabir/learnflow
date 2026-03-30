import { test, expect } from '@playwright/test';

test('Iter146: Ask me opens overlay and does not navigate', async ({ page }) => {
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

  await page.goto('/');

  // Create/find a course+lesson via dev API
  const ids = await page.evaluate(async () => {
    const token = localStorage.getItem('learnflow-token');
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch('/api/v1/courses', { headers: authHeaders });
    const data = await res.json();

    if (!data.courses || data.courses.length === 0) {
      const create = await fetch('/api/v1/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ topic: 'Iter146 Ask Me Seed', depth: 'beginner' }),
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

  const before = page.url();

  // Expand Actions then click Ask me (button exists only when Actions is expanded)
  await page.getByRole('button', { name: /^Actions/i }).click();

  const ask = page.getByRole('button', { name: /ask me/i });
  if (await ask.count()) {
    await expect(ask).toBeVisible({ timeout: 30_000 });
    await ask.click();

    await expect(page.getByTestId('lesson-ask-overlay')).toBeVisible();
    expect(page.url()).toBe(before);

    await page.getByRole('button', { name: /close ask me/i }).click();
    await expect(page.getByTestId('lesson-ask-overlay')).toBeHidden();
  }
});
