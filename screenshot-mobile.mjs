/* eslint-env node */
import { chromium } from 'playwright';

const BASE = process.env.SCREENSHOT_BASE_URL || 'http://localhost:3001';
const DIR = 'evals/screenshots/iter35-mobile';

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
  ['/onboarding/experience', 'onboarding-experience'],
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

  for (const [path, name] of pages) {
    const page = await ctx.newPage();
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(600);

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
console.log('Done!');
