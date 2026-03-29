import { test, expect } from '@playwright/test';

async function waitForApi(apiBase: string, request: any, timeoutMs = 30_000): Promise<void> {
  const started = Date.now();
  // Wait for API health endpoint to respond.
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await request.get(`${apiBase}/health`, { timeout: 5_000 });
      if (res.ok()) return;
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`API not ready after ${timeoutMs}ms: ${apiBase}`);
}

async function createAuthedPipeline(
  apiBase: string,
  request: any,
): Promise<{ token: string; pipelineId: string }> {
  await waitForApi(apiBase, request);

  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@learnflow.dev`;

  const reg = await request.post(`${apiBase}/api/v1/auth/register`, {
    timeout: 20_000,
    data: { email, password: 'password123', displayName: 'E2E' },
  });
  const regData = await reg.json();
  const token = regData.accessToken as string;

  const p = await request.post(`${apiBase}/api/v1/pipeline`, {
    timeout: 20_000,
    headers: { Authorization: `Bearer ${token}` },
    data: { topic: 'E2E pipeline topic' },
  });
  const pdata = await p.json();

  return { token, pipelineId: pdata.pipelineId as string };
}

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
    // E2E uses a real JWT (created via /auth/register) so API requests can be authenticated.
    // Keep onboarding complete to avoid overlays.
    (window as any).__LEARNFLOW_E2E__ = true;
    (window as any).__LEARNFLOW_ENV__ = { ...(window as any).__LEARNFLOW_ENV__ };
    localStorage.setItem('learnflow-onboarding-complete', 'true');
    localStorage.setItem('onboarding-tour-complete', 'true');
  };
}

test.describe('Iter134 builder screenshots', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      console.log(`[browser:${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', (err) => {
      console.log(`[pageerror] ${String(err)}`);
    });
    page.on('response', (res) => {
      if (res.status() === 401) {
        console.log(`[http:401] ${res.url()}`);
      }
    });
  });
  test('desktop: pipeline detail + logs', async ({ page, request }) => {
    await page.addInitScript(initAuth());

    // Create a real pipeline so the detail screen can render deterministically.
    const { token, pipelineId } = await createAuthedPipeline('http://127.0.0.1:3000', request);

    await page.goto('/');

    // The pipeline detail polls the API; it needs a valid JWT.
    // Must be set BEFORE navigating to the route.
    await page.evaluate((t) => {
      try {
        localStorage.setItem('learnflow-token', t);
      } catch {
        /* ignore */
      }
    }, token);

    await page.goto(`/pipeline/${pipelineId}`);
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

  test('mobile: pipeline detail + logs', async ({ browser, request }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.addInitScript(initAuth());

    // Create a real pipeline so the detail screen can render deterministically.
    const { token, pipelineId } = await createAuthedPipeline('http://127.0.0.1:3000', request);

    await page.goto('/');

    // The pipeline detail polls the API; it needs a valid JWT.
    // Must be set BEFORE navigating to the route.
    await page.evaluate((t) => {
      try {
        localStorage.setItem('learnflow-token', t);
      } catch {
        /* ignore */
      }
    }, token);

    await page.goto(`/pipeline/${pipelineId}`);
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
