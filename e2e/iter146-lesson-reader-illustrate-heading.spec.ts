import { test, expect } from '@playwright/test';

// Iter146: Heading-level Improve should persist subsection changes (replace-subsection).

test('Iter146: heading Improve triggers replace-subsection', async ({ page }) => {
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

  await page.route('**/api/v1/courses/*/lessons/*/selection-tools/preview', async (route) => {
    const body = (await route.request().postDataJSON()) as any;
    if (body.tool !== 'dig_deeper') return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        tool: 'dig_deeper',
        selectedText: body.selectedText,
        preview: {
          newTitle: 'New Heading Title',
          markdown: 'Improved subsection content.',
          images: [
            {
              url: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png',
              caption: 'JavaScript logo',
              license: 'Public domain',
              author: 'Wikimedia',
              sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:JavaScript-logo.png',
            },
          ],
          links: [{ title: 'MDN', url: 'https://developer.mozilla.org/' }],
        },
      }),
    });
  });

  const calls: any[] = [];
  await page.route('**/api/v1/courses/*/lessons/*/content/replace-subsection', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    calls.push(await route.request().postDataJSON());
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
        body: JSON.stringify({ topic: 'Iter146 Improve Seed', depth: 'beginner' }),
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

  const firstH3 = page.locator('h3').first();
  if (await firstH3.count()) {
    await expect(firstH3).toBeVisible({ timeout: 30_000 });
    await firstH3.hover();

    const improve = page.getByRole('button', { name: /^Improve /i }).first();
    await improve.click();
  }

  if (await firstH3.count()) {
    await expect.poll(() => calls.length, { timeout: 30_000 }).toBeGreaterThan(0);

    // Assert request includes newHeading + markdown (not raw JSON)
    const payload = calls[0];
    expect(payload.newContentMarkdown).toMatch(/Improved subsection content/);
    expect(payload.newHeading).toBe('New Heading Title');
    expect(payload.newContentMarkdown).toMatch(/!\[JavaScript logo\]\(/);
  }
});
