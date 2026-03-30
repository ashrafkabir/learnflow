import { test, expect } from '@playwright/test';

/**
 * Iter162 P0: Dev Demo Login button must be deterministic.
 *
 * Expectations:
 * - When BOTH flags are enabled, user can one-click into the app without typing.
 * - We should land on /dashboard (or be redirected to onboarding if incomplete).
 */

test.describe('iter162 dev demo login', () => {
  test('Dev Demo Login takes you to dashboard (or onboarding) without manual typing', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.clear();

      // Force the client bypass flag ON.
      // Also supply server opt-in flag as a runtime hint for the UI.
      // NOTE: The server still enforces LEARNFLOW_DEV_AUTH; the UI hint just prevents confusion.
      (window as any).__LEARNFLOW_ENV__ = {
        VITE_DEV_AUTH_BYPASS: '1',
        LEARNFLOW_DEV_AUTH: '1',
      };
    });

    await page.goto('/login');
    await expect(page.locator('[data-screen="login"]')).toBeVisible();

    await page.getByRole('button', { name: 'Dev Demo Login' }).click();

    // App can route to onboarding if it considers onboarding incomplete.
    await page.waitForURL(/\/dashboard|\/onboarding\//);

    const url = page.url();
    expect(url).toMatch(/\/(dashboard|onboarding)\b/);
  });
});
