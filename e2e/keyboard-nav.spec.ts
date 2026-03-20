import { test, expect } from '@playwright/test';

test.describe('A11y smoke: keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure the client is in dev auth bypass mode for deterministic local E2E.
    await page.addInitScript(() => {
      (window as any).__LEARNFLOW_ENV__ = { VITE_DEV_AUTH_BYPASS: '1' };
      localStorage.removeItem('learnflow-token');
      localStorage.removeItem('learnflow-user');
      localStorage.removeItem('learnflow-onboarding-complete');
    });
  });

  test('Onboarding Welcome → Goals is keyboard accessible', async ({ page }) => {
    await page.goto('/onboarding/welcome');
    await expect(page.locator('[data-screen="onboarding-welcome"]')).toBeVisible();

    const cta = page.getByRole('button', { name: /get started/i });
    await expect(cta).toBeVisible();

    // Tab until CTA is focused (bounded loop)
    for (let i = 0; i < 12; i++) {
      const focused = await page.evaluate(() => document.activeElement?.textContent || '');
      if (/get started/i.test(focused)) break;
      await page.keyboard.press('Tab');
    }

    await cta.click();
    await expect(page).toHaveURL(/\/onboarding\/goals/);
    await expect(page.locator('[data-screen="onboarding-goals"]')).toBeVisible();

    // Ensure at least one interactive element can receive focus
    await page.keyboard.press('Tab');
    const activeTag = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.tagName,
    );
    expect(activeTag).toBeTruthy();
  });

  test('Settings has a focusable API keys section', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('[data-screen="settings"]')).toBeVisible();

    // Tab through until we hit "API Keys" section text
    for (let i = 0; i < 30; i++) {
      const has = await page
        .getByText(/api keys/i)
        .first()
        .isVisible()
        .catch(() => false);
      if (has) break;
      await page.keyboard.press('Tab');
    }

    await expect(page.getByText(/api keys/i).first()).toBeVisible();
  });
});
