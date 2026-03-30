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

    // Wait for either the catalog or the empty state, to avoid hanging on slow/dev API.
    const catalog = page.locator('[data-component="agent-catalog"]');
    const empty = page.getByText('No results found');
    await Promise.race([
      catalog.waitFor({ state: 'visible', timeout: 15000 }),
      empty.waitFor({ state: 'visible', timeout: 15000 }),
    ]);

    // If empty, capture and exit (don’t hang).
    if (await empty.isVisible()) {
      await snap(page, '03-empty-state');
      return;
    }

    const firstToggle = page.locator('button[role="switch"]').first();

    // Click first toggle; may open disclosure modal on first activation.
    await firstToggle.click();

    const disclosure = page.getByRole('dialog', { name: /agent activation disclosure/i });
    if (await disclosure.isVisible().catch(() => false)) {
      await disclosure.getByRole('button', { name: /i understand/i }).click();
    }

    await page.waitForTimeout(750);
    await snap(page, '03-activate-toast');

    // Toggle back for deactivation toast.
    await firstToggle.click();
    await page.waitForTimeout(750);
    await snap(page, '04-deactivate-toast');
  });
});
