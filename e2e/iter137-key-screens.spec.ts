import { test, expect } from '@playwright/test';

// Iter137 P2.11: key screens sanity (desktop + 1 mobile)
// Goal: catch blank screens / critical regressions with stable assertions.

async function expectScreen(page: any, screen: string) {
  await expect(page.locator(`[data-screen="${screen}"]`)).toBeVisible();
}

test.describe('Iter137 key screens', () => {
  test('desktop: marketplace -> agent catalog -> settings', async ({ page, baseURL }) => {
    await page.addInitScript(() => {
      // Ensure dev auth bypass for protected routes in deterministic e2e.
      (window as any).__LEARNFLOW_ENV__ = {
        ...(window as any).__LEARNFLOW_ENV__,
        VITE_DEV_AUTH_BYPASS: '1',
      };
      localStorage.removeItem('learnflow-token');
      localStorage.removeItem('learnflow-user');
      localStorage.removeItem('learnflow-onboarding-complete');
    });

    await page.goto(`${baseURL}/marketplace`);
    await expectScreen(page, 'course-marketplace');

    // Agent catalog
    await page.goto(`${baseURL}/marketplace/agents`);
    await expectScreen(page, 'agent-marketplace');
    await expect(page.getByRole('heading', { name: 'Agent Marketplace' })).toBeVisible();

    // Settings
    await page.goto(`${baseURL}/settings`);
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('mobile: lesson reader renders core elements', async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.addInitScript(() => {
      (window as any).__LEARNFLOW_ENV__ = {
        ...(window as any).__LEARNFLOW_ENV__,
        VITE_DEV_AUTH_BYPASS: '1',
      };
      localStorage.removeItem('learnflow-token');
      localStorage.removeItem('learnflow-user');
      localStorage.removeItem('learnflow-onboarding-complete');
    });

    // Use a common test route used across e2e/unit tests.
    await page.goto(`${baseURL}/courses/c-1/lessons/l1`);

    // Expect lesson reader skeleton/content. (data-screen is used across the app.)
    // If the screen id changes, update this spec alongside the UI change.
    await expect(page.locator('[data-screen="lesson-reader"]').first()).toBeVisible();

    // Basic a11y affordance
    await expect(page.getByRole('main')).toBeVisible();
  });
});
