import { test, expect } from '@playwright/test';

// Valid JWT for local API (dev secret). Keep consistent with other e2e specs.
const E2E_PRO_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1MSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJzdHVkZW50IiwidGllciI6InBybyIsImlhdCI6MTc3NDYyMDQyMSwiZXhwIjoxODA2MTU2NDIxfQ._nna6R4wrrbsT_WJO_s8khz61FLp7gkGYfQSznS1eqI';

function initClientStorage() {
  return () => {
    (window as any).__LEARNFLOW_E2E__ = true;

    // Avoid onboarding overlays blocking interactions.
    localStorage.setItem('learnflow-onboarding-complete', 'true');
    localStorage.setItem('onboarding-tour-complete', 'true');

    // Ensure auth bypass stays enabled for the UI portion of this smoke run.
    (window as any).__LEARNFLOW_ENV__ = {
      ...((window as any).__LEARNFLOW_ENV__ || {}),
      VITE_DEV_AUTH_BYPASS: '1',
    };

    localStorage.setItem('learnflow-token', E2E_PRO_TOKEN);
    localStorage.setItem(
      'learnflow-user',
      JSON.stringify({ id: 'u1', email: 'test@example.com', tier: 'pro' }),
    );
  };
}

test.describe('Iter153: LessonReader next lesson CTA', () => {
  test('shows next lesson CTA on a non-last lesson and navigates', async ({ page }) => {
    test.setTimeout(180_000);
    await page.addInitScript(initClientStorage());

    // Create a deterministic course via API to avoid relying on any pre-seeded ids.
    const create = await page.request.post('/api/v1/courses', {
      data: { topic: `Iter153 Next Lesson ${Date.now()}`, fast: true },
      headers: { authorization: `Bearer ${E2E_PRO_TOKEN}` },
    });
    expect(create.ok()).toBeTruthy();
    const created = await create.json();
    const courseId = String((created as any)?.id || '').trim();
    expect(courseId).not.toEqual('');

    // Load course view, then click first lesson. This ensures we pick a non-last lesson.
    await page.goto(`/courses/${courseId}`);
    await expect(page.locator('[data-screen="course-view"]')).toBeVisible({ timeout: 60_000 });

    // Lessons are rendered as cards with a Start button (not a link).
    const start = page.getByRole('button', { name: /^start$/i }).first();
    await expect(start).toBeVisible({ timeout: 60_000 });

    await start.click();
    await expect(page.locator('[data-screen="lesson-reader"]')).toBeVisible({ timeout: 60_000 });

    const cta = page.locator('[data-testid="next-lesson-cta"]');
    await expect(cta).toBeVisible({ timeout: 60_000 });

    await cta.getByRole('button', { name: /go to next lesson/i }).click();

    await expect(page).toHaveURL(/\/courses\/.+\/lessons\//, { timeout: 20_000 });
  });
});
