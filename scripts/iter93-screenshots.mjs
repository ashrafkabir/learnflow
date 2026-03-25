import { chromium } from 'playwright';

const BASE = process.env.LEARNFLOW_WEB_BASE || 'http://127.0.0.1:3001';
const DIR =
  process.env.SCREENSHOT_DIR ||
  process.env.LEARNFLOW_SCREENSHOT_DIR ||
  '/home/aifactory/.openclaw/workspace/learnflow/screenshots/iter93/run-001';

async function safeShot(page, name, opts = {}) {
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true, ...opts });
  console.log('OK ' + name);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // 1) Conversation in-flight (simulate by setting localStorage flags and stopping on route)
  await page.addInitScript(() => {
    // eslint-disable-next-line no-undef
    window.localStorage.setItem('learnflow-onboarding-complete', 'true');
    // eslint-disable-next-line no-undef
    window.localStorage.setItem('learnflow-token', 'test-token');
  });

  // Best-effort: go to conversation and capture basic shell.
  await page.goto(`${BASE}/conversation`, { waitUntil: 'domcontentloaded', timeout: 8000 });
  await page.waitForTimeout(500);
  await safeShot(page, 'conversation');

  // 2) Open SourceDrawer in LessonReader (credibility/why/accessed)
  await page.goto(`${BASE}/courses/1/lessons/1`, { waitUntil: 'domcontentloaded', timeout: 8000 });
  // Try to click Sources & Attribution button if present.
  const drawerButton = page.getByRole('button', { name: /sources/i });
  if (await drawerButton.count()) {
    await drawerButton.first().click();
    await page.waitForTimeout(400);
  }
  await safeShot(page, 'lesson-sources-drawer');

  // 3) Pipeline detail (credibility visible)
  await page.goto(`${BASE}/pipeline/test-id`, { waitUntil: 'domcontentloaded', timeout: 8000 });
  await page.waitForTimeout(400);
  await safeShot(page, 'pipeline-detail');

  await browser.close();
  console.log('DONE');
})();
