/* eslint-disable no-undef */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3001';
const DIR =
  process.env.SCREENSHOT_DIR || `evals/screenshots/iter28-${new Date().toISOString().slice(0, 10)}`;

async function safeGoto(page, path) {
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 20000 });
  } catch {
    // best effort
  }
  await page.waitForTimeout(800);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.addInitScript(() => {
  localStorage.setItem('learnflow-token', 'dev');
  // Iter86: tag harness-origin so API can suppress durable data/usage writes.
  localStorage.setItem('learnflow-origin', 'harness');
  localStorage.setItem('learnflow-onboarding-complete', 'true');
  localStorage.setItem('onboarding-tour-complete', 'true');
});

const page = await ctx.newPage();
await safeGoto(page, '/dashboard');
await page.screenshot({ path: `${DIR}/_debug-dashboard-before.png`, fullPage: true });

const input = await page.$('input[placeholder*="Enter a topic" i]');
if (!input) {
  console.log('No topic input found on dashboard');
} else {
  await input.fill(`Debug Topic ${Date.now().toString().slice(-5)}`);
  const btn = await page.$('button:has-text("Create Course")');
  if (!btn) {
    console.log('No Create Course button found');
  } else {
    await btn.click({ force: true });
    await page.waitForTimeout(1500);
  }
}

await page.screenshot({ path: `${DIR}/_debug-dashboard-after-click.png`, fullPage: true });
console.log('url after click:', page.url());

await page.close();
await ctx.close();
await browser.close();
