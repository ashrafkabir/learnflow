/* eslint-env node */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

function readArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

const BASE =
  process.env.SCREENSHOT_BASE_URL ||
  readArg('base') ||
  readArg('baseUrl') ||
  'http://localhost:3001';

const AUTHED = process.env.SCREENSHOT_AUTHED === '1' || process.env.SCREENSHOT_AUTHED === 'true';

const DIR =
  process.env.SCREENSHOT_DIR ||
  readArg('out') ||
  (AUTHED ? 'evals/screenshots/iter45-mobile-authed' : 'evals/screenshots/iter45-mobile');

fs.mkdirSync(path.resolve(DIR), { recursive: true });

const viewports = [
  { name: 'mobile-320', width: 320, height: 640 },
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-414', width: 414, height: 896 },
];

const pages = [
  ['/', 'home'],
  ['/onboarding/welcome', 'onboarding-welcome'],
  ['/onboarding/goals', 'onboarding-goals'],
  ['/onboarding/topics', 'onboarding-topics'],
  ['/onboarding/api-keys', 'onboarding-api-keys'],
  ['/onboarding/subscription', 'onboarding-subscription'],
  ['/onboarding/first-course', 'onboarding-first-course'],
  ['/dashboard', 'dashboard'],
  ['/conversation', 'conversation'],
  ['/mindmap', 'mindmap'],
  ['/settings', 'settings'],
  ['/marketplace/courses', 'marketplace-courses'],
  ['/marketplace/agents', 'marketplace-agents'],
];

const browser = await chromium.launch();

for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  if (AUTHED) {
    await ctx.addInitScript(() => {
      try {
        globalThis.localStorage.setItem('learnflow-token', 'dev');
        globalThis.localStorage.setItem('learnflow-onboarding-complete', 'true');
        globalThis.localStorage.setItem('onboarding-tour-complete', 'true');
      } catch {
        // ignore
      }
    });
  }

  for (const [p, name] of pages) {
    const page = await ctx.newPage();
    await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(700);

    // Safety: no horizontal scroll
    const scrollWidth = await page.evaluate(() => globalThis.document.documentElement.scrollWidth);
    const viewWidth = await page.evaluate(() => globalThis.window.innerWidth);
    if (scrollWidth > viewWidth + 10) {
      console.warn(`⚠️  ${vp.name} ${name} has horizontal overflow: ${scrollWidth} > ${viewWidth}`);
    }

    await page.screenshot({ path: `${DIR}/${vp.name}__${name}.png`, fullPage: true });
    await page.close();
    console.log(`✓ ${vp.name} ${name}`);
  }

  await ctx.close();
}

await browser.close();
console.log(`Done! Saved to ${DIR}`);
