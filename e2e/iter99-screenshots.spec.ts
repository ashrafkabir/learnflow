import { test, expect } from '@playwright/test';

/**
 * Iteration 99 — Screenshot capture for Agent Marketplace activation feedback.
 * Saves into repo: learnflow/screenshots/iter99/run-001
 * And OneDrive mirror: /home/aifactory/onedrive-learnflow/learnflow/screenshots/iter99/run-001
 */

const OUT_REPO =
  process.env.LEARNFLOW_E2E_OUT_REPO ||
  '/home/aifactory/.openclaw/workspace/learnflow/screenshots/iter99/run-001';

const OUT_OD =
  process.env.LEARNFLOW_E2E_OUT_OD ||
  '/home/aifactory/onedrive-learnflow/learnflow/screenshots/iter99/run-001';

async function snap(page: any, name: string, fullPage = true) {
  await page.waitForTimeout(750);
  await page.screenshot({ path: `${OUT_REPO}/${name}.png`, fullPage });
  await page.screenshot({ path: `${OUT_OD}/${name}.png`, fullPage });
}

test.describe('Iter99 screenshots (Agent Marketplace)', () => {
  test('activation/deactivation shows toast feedback (best-effort)', async ({ page }) => {
    // Logged-out first: should show an error toast when activating.
    await page.addInitScript(() => {
      localStorage.removeItem('learnflow-token');
      localStorage.removeItem('learnflow-user');
      localStorage.removeItem('learnflow-onboarding-complete');

      // Force dev-auth bypass on for deterministic access to protected routes.
      (window as any).__LEARNFLOW_ENV__ = { VITE_DEV_AUTH_BYPASS: '1' };
    });

    // The route is guarded; capture logged-out behavior on Login screen.
    await page.goto('/marketplace/agents');
    await page.waitForTimeout(500);
    await snap(page, '01-guard-redirect-login');

    // Navigate to Agent Marketplace.
    await page.goto('/marketplace/agents');
    await expect(page.locator('[data-screen="agent-marketplace"]')).toBeVisible({
      timeout: 15000,
    });
    await snap(page, '02-agent-marketplace');

    // Click first toggle; should show a toast (success/error) depending on API availability.
    await page.locator('button[role="switch"]').first().click();
    await page.waitForTimeout(750);
    await snap(page, '03-activate-toast');

    // Toggle back for deactivation toast.
    await page.locator('button[role="switch"]').first().click();
    await page.waitForTimeout(750);
    await snap(page, '04-deactivate-toast');
  });
});
