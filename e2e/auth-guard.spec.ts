import { test, expect } from '@playwright/test';

/**
 * Iter49 P0-1: Make auth bypass deterministic.
 *
 * We can deterministically test both modes (bypass on/off) without relying on
 * external systemd environment by overriding Vite's env at runtime.
 */

test.describe('auth guard (dev bypass)', () => {
  test('with bypass OFF, protected routes redirect to /login when no token', async ({ page }) => {
    await page.addInitScript(() => {
      // Clear auth
      localStorage.removeItem('learnflow-token');
      localStorage.removeItem('learnflow-user');
      localStorage.removeItem('learnflow-onboarding-complete');

      // Ensure bypass is off in runtime env
      (window as any).__LEARNFLOW_ENV__ = { VITE_DEV_AUTH_BYPASS: '0' };
    });

    await page.goto('/settings');
    await page.waitForURL('**/login');
    await expect(page.locator('[data-screen="login"]')).toBeVisible();
  });

  test('with bypass ON, protected routes are accessible without a token', async ({ page }) => {
    await page.addInitScript(() => {
      // Clear auth
      localStorage.removeItem('learnflow-token');
      localStorage.removeItem('learnflow-user');
      localStorage.removeItem('learnflow-onboarding-complete');

      // Force bypass on in runtime env
      (window as any).__LEARNFLOW_ENV__ = { VITE_DEV_AUTH_BYPASS: '1' };
    });

    await page.goto('/settings');
    await expect(page).not.toHaveURL(/\/login/);
    // Settings page uses data-screen hooks
    await expect(page.locator('[data-screen="settings"]')).toBeVisible();
  });
});
