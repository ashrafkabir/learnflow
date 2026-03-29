import { test, expect } from '@playwright/test';

// Iter134 follow-ups: Lesson reader UX
// - only one "Mark Complete" CTA
// - previous/next lesson navigation present when course has multiple lessons
// - hero section renders, and illustration (if present) can render

test('Iter134: LessonReader has single Mark Complete + Prev/Next navigation', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__LEARNFLOW_ENV__ = {
      VITE_DEV_AUTH_BYPASS: '1',
      VITE_API_ORIGIN: 'http://localhost:3000',
    };
    (window as any).__LEARNFLOW_E2E__ = true;
    localStorage.setItem(
      'learnflow-token',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1MSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJzdHVkZW50IiwidGllciI6InBybyIsImlhdCI6MTc3NDYyMDQyMSwiZXhwIjoxODA2MTU2NDIxfQ._nna6R4wrrbsT_WJO_s8khz61FLp7gkGYfQSznS1eqI',
    );
    localStorage.setItem(
      'learnflow-user',
      JSON.stringify({ id: 'u1', email: 'test@example.com', tier: 'pro' }),
    );
    localStorage.setItem('learnflow-onboarding-complete', 'true');
  });

  await page.goto('/');
  // In auth bypass mode, routes may still land on /login; use the built-in dev skip link.
  const skip = page.getByRole('link', { name: /skip \(dev mode\)/i });
  if (await skip.count()) {
    await skip.first().click();
    await page.waitForURL(/\/dashboard/);
  }

  // Seed a course if needed and pick first module lesson 1 (so Next exists)
  const ids = await page.evaluate(async () => {
    const token = localStorage.getItem('learnflow-token');
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch('/api/v1/courses', { headers: authHeaders });
    const data = await res.json();

    let courseId: string;
    let lessonId: string;

    if (!data.courses || data.courses.length === 0) {
      const create = await fetch('/api/v1/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ topic: 'Iter134 LessonReader UX Seed', depth: 'beginner' }),
      });
      if (!create.ok) throw new Error(`Failed to create seed course: ${create.status}`);
      const created = await create.json();
      courseId = created.id;
      lessonId = created.modules?.[0]?.lessons?.[0]?.id;
      if (!lessonId) throw new Error('Seed course created but no lessonId found');
    } else {
      courseId = data.courses[0].id;
      const courseRes = await fetch(`/api/v1/courses/${courseId}`, { headers: authHeaders });
      const course = await courseRes.json();
      // Try to find a lesson id from modules; if not present, create a new course.
      lessonId = course.modules?.[0]?.lessons?.[0]?.id;
      if (!lessonId) {
        const create = await fetch('/api/v1/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ topic: 'Iter134 LessonReader UX Seed', depth: 'beginner' }),
        });
        if (!create.ok) throw new Error(`Failed to create seed course: ${create.status}`);
        const created = await create.json();
        courseId = created.id;
        lessonId = created.modules?.[0]?.lessons?.[0]?.id;
        if (!lessonId) throw new Error('Seed course created but no lessonId found');
      }
    }

    return { courseId, lessonId };
  });

  await page.goto(`/courses/${ids.courseId}/lessons/${ids.lessonId}`, {
    waitUntil: 'domcontentloaded',
  });

  // Wait for lesson to finish loading (skeleton removed)
  await expect(page.locator('[data-component="lesson-content"]')).toBeVisible({ timeout: 30000 });

  // Hero should exist
  await expect(page.locator('[data-component="lesson-hero"]')).toBeVisible({ timeout: 30000 });

  // Only one Mark Complete label should exist (bottom bar)
  const markComplete = page.getByText('Mark Complete', { exact: true });
  await expect(markComplete).toHaveCount(1);

  // Nav should show Next on first lesson (best-effort; some courses may have only 1 lesson)
  // If there is more than 1 lesson, Next should appear.
  const nextBtn = page.getByRole('button', { name: /next:/i });
  const prevBtn = page.getByRole('button', { name: /previous:/i });
  const totalLessons = await page.evaluate(async (courseId) => {
    const res = await fetch(`/api/v1/courses/${courseId}`);
    const c = await res.json();
    const flat: any[] = [];
    for (const m of c.modules || []) for (const l of m.lessons || []) flat.push(l);
    return flat.length;
  }, ids.courseId);

  if (totalLessons > 1) {
    await expect(nextBtn).toBeVisible();
    await expect(prevBtn).toHaveCount(0);
  }
});
