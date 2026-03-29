import { test, expect } from '@playwright/test';

/**
 * Iteration 101 — Screenshot capture for spec-truth adjustments + privacy consent toggle.
 * Saves into repo: learnflow/screenshots/iter101/run-001
 * And OneDrive mirror: /home/aifactory/onedrive-learnflow/learnflow/screenshots/iter101/run-001
 */

const OUT_REPO =
  process.env.LEARNFLOW_E2E_OUT_REPO ||
  '/home/aifactory/.openclaw/workspace/learnflow/learnflow/screenshots/iter101/run-001';

const OUT_OD =
  process.env.LEARNFLOW_E2E_OUT_OD ||
  '/home/aifactory/onedrive-learnflow/learnflow/screenshots/iter101/run-001';

async function snap(page: any, name: string, fullPage = true) {
  await page.waitForTimeout(750);
  await page.screenshot({ path: `${OUT_REPO}/${name}.png`, fullPage });
  await page.screenshot({ path: `${OUT_OD}/${name}.png`, fullPage });
}

test.describe('Iter101 screenshots (privacy + copy truth)', () => {
  test('settings privacy consent toggle + export section + pro copy', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('learnflow-token', 'test-token');
      localStorage.setItem('learnflow-onboarding-complete', 'true');
      (window as any).__LEARNFLOW_ENV__ = { VITE_DEV_AUTH_BYPASS: '1' };
    });

    await page.goto('/settings');
    await expect(page.locator('[data-screen="settings"]')).toBeVisible({ timeout: 15000 });
    await snap(page, '01-settings-top');

    // Scroll to Privacy section.
    await page.locator('text=Privacy').first().scrollIntoViewIfNeeded();
    await snap(page, '02-privacy-section');

    // Toggle telemetry off/on (best-effort; API may be mocked).
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.click({ timeout: 10000 });
    await page.waitForTimeout(500);
    await snap(page, '03-privacy-toggle-click');

    // Export section reflects truth about available formats.
    await page.goto('/settings');
    await expect(page.locator('[data-screen="settings"]')).toBeVisible({ timeout: 15000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('text=Data Export')).toBeVisible({ timeout: 15000 });
    await snap(page, '04-export-section');

    // Pricing copy lives in the marketing site (Next.js) on :3003.
    await page.goto('http://127.0.0.1:3003/pricing');
    await expect(page.locator('text=Simple, transparent pricing')).toBeVisible({ timeout: 15000 });
    await snap(page, '05-pricing-faq');

    // Docs site also lives on :3003.
    await page.goto('http://127.0.0.1:3003/docs');
    await expect(page.locator('text=Getting Started')).toBeVisible({ timeout: 15000 });
    await snap(page, '06-docs-api-keys');
  });
});
