import { test, expect } from '@playwright/test';

/**
 * Iteration 134 — Builder run screenshots (desktop + mobile) for research→plan→lesson pipeline.
 *
 * Saves into repo:
 *   learnflow/screenshots/iter134/builder-run/task-01/{desktop,mobile}
 * And OneDrive mirror:
 *   /home/aifactory/onedrive-learnflow/learnflow/learnflow/screenshots/iter134/builder-run/task-01/{desktop,mobile}
 */

const OUT_REPO_DESKTOP =
  process.env.LEARNFLOW_E2E_OUT_REPO_DESKTOP ||
  '/home/aifactory/.openclaw/workspace/learnflow/screenshots/iter134/builder-run/task-01/desktop';

const OUT_REPO_MOBILE =
  process.env.LEARNFLOW_E2E_OUT_REPO_MOBILE ||
  '/home/aifactory/.openclaw/workspace/learnflow/screenshots/iter134/builder-run/task-01/mobile';

const OUT_OD_DESKTOP =
  process.env.LEARNFLOW_E2E_OUT_OD_DESKTOP ||
  '/home/aifactory/onedrive-learnflow/learnflow/learnflow/screenshots/iter134/builder-run/task-01/desktop';

const OUT_OD_MOBILE =
  process.env.LEARNFLOW_E2E_OUT_OD_MOBILE ||
  '/home/aifactory/onedrive-learnflow/learnflow/learnflow/screenshots/iter134/builder-run/task-01/mobile';

async function snap(page: any, outRepo: string, outOd: string, name: string, fullPage = true) {
  await page.waitForTimeout(750);
  await page.screenshot({ path: `${outRepo}/${name}.png`, fullPage });
  await page.screenshot({ path: `${outOd}/${name}.png`, fullPage });
}

function initAuth() {
  return () => {
    // Bypass auth reliably in E2E: set the runtime env flag only.
    // Note: setting a fake token can trigger client-side refresh/401 flows that
    // remove it and redirect to /login.
    (window as any).__LEARNFLOW_E2E__ = true;
    (window as any).__LEARNFLOW_ENV__ = { VITE_DEV_AUTH_BYPASS: '1' };
    localStorage.setItem('learnflow-onboarding-complete', 'true');
  };
}

test.describe('Iter134 builder screenshots', () => {
  test('desktop: pipeline detail + logs', async ({ page }) => {
    await page.addInitScript(initAuth());

    await page.goto('/pipeline/test-id');
    await expect(page.locator('[data-screen="pipeline-detail"]')).toBeVisible({ timeout: 15000 });
    await snap(page, OUT_REPO_DESKTOP, OUT_OD_DESKTOP, '01-pipeline-detail');

    // Best-effort: open View Logs if present.
    const viewLogs = page.getByRole('button', { name: /view logs/i });
    if (await viewLogs.count()) {
      await viewLogs.first().click();
      await page.waitForTimeout(500);
      await snap(page, OUT_REPO_DESKTOP, OUT_OD_DESKTOP, '02-view-logs');
    }
  });

  test('mobile: pipeline detail + logs', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.addInitScript(initAuth());

    await page.goto('/pipeline/test-id');
    await expect(page.locator('[data-screen="pipeline-detail"]')).toBeVisible({ timeout: 15000 });
    await snap(page, OUT_REPO_MOBILE, OUT_OD_MOBILE, '01-pipeline-detail');

    const viewLogs = page.getByRole('button', { name: /view logs/i });
    if (await viewLogs.count()) {
      await viewLogs.first().click();
      await page.waitForTimeout(500);
      await snap(page, OUT_REPO_MOBILE, OUT_OD_MOBILE, '02-view-logs');
    }

    await context.close();
  });
});
