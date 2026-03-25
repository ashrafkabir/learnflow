import { chromium } from 'playwright';

const BASE = process.env.LEARNFLOW_WEB_BASE || 'http://127.0.0.1:3001';
const DIR =
  process.env.SCREENSHOT_DIR ||
  process.env.LEARNFLOW_SCREENSHOT_DIR ||
  '/home/aifactory/.openclaw/workspace/learnflow/screenshots/iter95/run-001';

async function safeShot(page, name, opts = {}) {
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true, ...opts });
  console.log('OK ' + name);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  await page.addInitScript(() => {
    // eslint-disable-next-line no-undef
    window.localStorage.setItem('learnflow-onboarding-complete', 'true');
    // eslint-disable-next-line no-undef
    window.localStorage.setItem('learnflow-token', 'test-token');
  });

  // Collaborate route (Iter95: labels for mock/preview)
  await page.goto(`${BASE}/collaborate`, { waitUntil: 'domcontentloaded', timeout: 8000 });
  await page.waitForTimeout(700);
  await safeShot(page, 'collaborate');

  // Try click the Connect button (should say preview in UI)
  const connectBtn = page.getByRole('button', { name: /connect/i });
  if (await connectBtn.count()) {
    await connectBtn
      .first()
      .click({ timeout: 1000 })
      .catch(() => undefined);
    await page.waitForTimeout(400);
    await safeShot(page, 'collaborate-after-connect');
  }

  await browser.close();
  console.log('DONE');
})();
