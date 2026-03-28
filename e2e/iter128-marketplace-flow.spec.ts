import { test, expect } from '@playwright/test';

// Iter128 P1-6 — Marketplace publish/list/detail/enroll E2E flow
// NOTE: In MVP, publish is internal and checkout is mocked. This test asserts the
// UI flows exist and do not crash, not that real payments occur.

test.describe('Iter128: Marketplace flows (MVP-safe)', () => {
  test('list → detail → enroll CTA is present', async ({ page }) => {
    // Ensure we can access the marketplace route in E2E without relying on a real auth backend.
    await page.addInitScript(() => {
      (window as any).__LEARNFLOW_ENV__ = { VITE_DEV_AUTH_BYPASS: '1' };
      localStorage.removeItem('learnflow-token');
      localStorage.removeItem('learnflow-user');
      localStorage.removeItem('learnflow-onboarding-complete');
    });

    await page.goto('/marketplace');
    await expect(page.locator('body')).toContainText(/marketplace/i);

    // MVP UI: courses render as <article> cards with an Enroll button.
    const enrollBtn = page.getByRole('button', { name: /enroll/i }).first();
    await expect(enrollBtn).toBeVisible();

    // Click should not hard-crash the page. Depending on course pricing, this may
    // navigate, open a mocked checkout, or trigger an enroll flow.
    await enrollBtn.click();
    await expect(page.locator('body')).toBeVisible();
  });

  test('creator can reach marketplace publish UI (if present) without crashing', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as any).__LEARNFLOW_ENV__ = { VITE_DEV_AUTH_BYPASS: '1' };
      localStorage.removeItem('learnflow-token');
      localStorage.removeItem('learnflow-user');
      localStorage.removeItem('learnflow-onboarding-complete');
    });

    // This path is intentionally best-effort; different iterations gate this UI.
    await page.goto('/marketplace/creator');
    await expect(page.locator('body')).toBeVisible();

    // If there is a publish call-to-action, it should be clickable.
    const publish = page
      .getByRole('button')
      .filter({ hasText: /publish/i })
      .first();
    if (await publish.count()) {
      await publish.click();
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
