import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Iteration 59 — Fresh screenshot capture.
 *
 * Hard requirement for this builder cycle:
 * - Save under repo: learnflow/screenshots/iter59
 * - Mirror to OneDrive: /home/aifactory/onedrive-learnflow/learnflow/learnflow/screenshots/iter59
 *
 * Also (queue P0): refresh iter58 folder because prior run contained mirrored older images.
 */

const OUT_REPO_59 = '/home/aifactory/.openclaw/workspace/learnflow/screenshots/iter59';
const OUT_OD_59 =
  process.env.LEARNFLOW_E2E_OUT_OD_59 ||
  '/home/aifactory/onedrive-learnflow/learnflow/learnflow/screenshots/iter59';

const OUT_REPO_58 = '/home/aifactory/.openclaw/workspace/learnflow/screenshots/iter58';
const OUT_OD_58 =
  process.env.LEARNFLOW_E2E_OUT_OD_58 ||
  '/home/aifactory/onedrive-learnflow/learnflow/learnflow/screenshots/iter58';

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

async function snap(page: any, name: string, fullPage = true) {
  await page.waitForTimeout(750);
  for (const outDir of [OUT_REPO_59, OUT_OD_59, OUT_REPO_58, OUT_OD_58]) {
    ensureDir(outDir);
    await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage });
  }
}

test.describe('Iter59 screenshots', () => {
  test.beforeAll(async () => {
    [OUT_REPO_59, OUT_OD_59, OUT_REPO_58, OUT_OD_58].forEach(ensureDir);
  });

  test('logged-out: login + register', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('learnflow-token');
      localStorage.removeItem('learnflow-user');
      localStorage.removeItem('learnflow-onboarding-complete');
      // Ensure bypass is off so we see true logged-out state
      (window as any).__LEARNFLOW_ENV__ = { VITE_DEV_AUTH_BYPASS: '0' };
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
    await page.addInitScript(() => {
      (window as any).__LEARNFLOW_ENV__ = { VITE_DEV_AUTH_BYPASS: '1' };
      localStorage.removeItem('learnflow-token');
      localStorage.removeItem('learnflow-user');
      localStorage.removeItem('learnflow-onboarding-complete');
      localStorage.setItem('onboarding-tour-complete', 'true');
    });

    await page.goto('/onboarding/welcome');
    await expect(page.locator('[data-screen="onboarding-welcome"]')).toBeVisible();
    await snap(page, '03-onboarding-welcome');

    await page.click('text=Get Started');
    await expect(page.locator('[data-screen="onboarding-goals"]')).toBeVisible();
    await snap(page, '04-onboarding-goals');

    await page.locator('input[type="text"]').first().fill('Learn multi-agent systems');
    await page.click('button:has-text("Add")');
    await snap(page, '05-onboarding-goals-added');

    await page.click('text=Continue');
    await expect(page.locator('[data-screen="onboarding-topics"]')).toBeVisible();
    await snap(page, '06-onboarding-topics');

    // pick a topic to enable Continue
    await page.locator('[data-screen="onboarding-topics"] button').first().click();
    await page.click('text=Continue');

    await expect(
      page.locator('[data-screen="onboarding-api-keys"]').or(page.locator('text=API Keys')),
    ).toBeVisible();
    await snap(page, '07-onboarding-apikeys');

    await page.goto('/onboarding/subscription');
    await expect(page.locator('[data-screen="onboarding-subscription"]').first()).toBeVisible();
    await snap(page, '08-onboarding-subscription');

    await page.goto('/onboarding/first-course');
    await expect(
      page
        .locator('[data-screen="onboarding-first-course"]')
        .or(page.locator('text=Create your first course')),
    ).toBeVisible();
    await snap(page, '09-onboarding-first-course');
  });

  test('core: dashboard, conversation, mindmap, marketplace, settings', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__LEARNFLOW_ENV__ = { VITE_DEV_AUTH_BYPASS: '1' };
      localStorage.removeItem('learnflow-token');
      localStorage.removeItem('learnflow-user');
      localStorage.removeItem('learnflow-onboarding-complete');
      localStorage.setItem('onboarding-tour-complete', 'true');
    });

    await page.goto('/dashboard');
    await expect(page.locator('[data-screen="dashboard"]').first()).toBeVisible();
    await snap(page, '10-dashboard');

    await page.goto('/conversation');
    await expect(page.locator('[data-screen="conversation"]').first()).toBeVisible();
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
    for (const [route, name] of [
      ['/', '20-home'],
      ['/features', '21-features'],
      ['/pricing', '22-pricing'],
      ['/download', '23-download'],
      ['/blog', '24-blog'],
      ['/docs', '25-docs'],
      ['/about', '26-about'],
    ] as const) {
      await page.goto(route);
      await snap(page, name);
    }
  });
});
