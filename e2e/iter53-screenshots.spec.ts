import { test, expect } from '@playwright/test';

/**
 * Iteration 53 — Screenshot capture for every major screen/state.
 * Saves into repo: learnflow/screenshots/iter53
 * And OneDrive: /home/aifactory/onedrive-learnflow/evals/screenshots/iter53
 */

const OUT_REPO = '/home/aifactory/.openclaw/workspace/learnflow/screenshots/iter53';
const OUT_OD =
  process.env.LEARNFLOW_E2E_OUT_OD || '/home/aifactory/onedrive-learnflow/evals/screenshots/iter53';

async function snap(page: any, name: string, fullPage = true) {
  await page.waitForTimeout(750);
  await page.screenshot({ path: `${OUT_REPO}/${name}.png`, fullPage });
  await page.screenshot({ path: `${OUT_OD}/${name}.png`, fullPage });
}

test.describe('Iter49 screenshots (client app)', () => {
  test('logged-out: login + register', async ({ page }) => {
    // Ensure logged-out
    await page.addInitScript(() => {
      localStorage.removeItem('learnflow-token');
      localStorage.removeItem('learnflow-user');
      localStorage.removeItem('learnflow-onboarding-complete');
    });

    await page.goto('/login');
    await expect(page.locator('[data-screen="login"]')).toBeVisible({ timeout: 15000 });
    await snap(page, '01-login');

    await page.goto('/register');
    await expect(page.locator('[data-screen="register"]')).toBeVisible({ timeout: 15000 });
    await snap(page, '02-register');
  });

  test('onboarding: welcome -> goals -> topics -> api keys -> subscription -> first course', async ({
    page,
  }) => {
    // Dev auth bypass is enabled in systemd service; navigate directly.
    await page.goto('/onboarding/welcome');
    await expect(page.locator('[data-screen="onboarding-welcome"]')).toBeVisible();
    await snap(page, '03-onboarding-welcome');

    await page.click('text=Get Started');
    await expect(page.locator('[data-screen="onboarding-goals"]')).toBeVisible();
    await snap(page, '04-onboarding-goals');

    // Add a goal via input so Continue is enabled
    await page.locator('input[type="text"]').first().fill('Learn AI agents');
    await page.click('button:has-text("Add")');
    await snap(page, '05-onboarding-goals-added');

    await page.click('text=Continue');
    await expect(page.locator('[data-screen="onboarding-topics"]')).toBeVisible();
    await snap(page, '06-onboarding-topics');

    await page.locator('[data-screen="onboarding-topics"] button').first().click();
    await page.click('text=Continue');

    // API Keys step (some builds route here before subscription)
    await page.waitForTimeout(750);
    await snap(page, '07-onboarding-apikeys');

    // Subscription choice
    await page.goto('/onboarding/subscription');
    await expect(
      page.locator('[data-screen="onboarding-subscription"]').or(page.locator('text=Free')).first(),
    ).toBeVisible();
    await snap(page, '08-onboarding-subscription');

    // First course
    await page.goto('/onboarding/first-course');
    await snap(page, '09-onboarding-first-course');
  });

  test('core: dashboard, conversation, mindmap, marketplace, settings', async ({ page }) => {
    await page.goto('/dashboard');
    // Some builds might redirect; capture whatever we get
    await snap(page, '10-dashboard');

    await page.goto('/conversation');
    await snap(page, '11-conversation');

    await page.goto('/mindmap');
    await snap(page, '12-mindmap');

    await page.goto('/marketplace');
    await snap(page, '13-marketplace-courses');

    await page.goto('/marketplace/agents');
    await snap(page, '14-marketplace-agents');

    await page.goto('/settings');
    await snap(page, '15-settings');
  });

  test('marketing: home/features/pricing/download/blog/docs/about', async ({ page }) => {
    for (const [path, name] of [
      ['/', '20-home'],
      ['/features', '21-features'],
      ['/pricing', '22-pricing'],
      ['/download', '23-download'],
      ['/blog', '24-blog'],
      ['/docs', '25-docs'],
      ['/about', '26-about'],
    ] as const) {
      await page.goto(path);
      await snap(page, name);
    }
  });
});
