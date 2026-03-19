import { chromium } from 'playwright';

const BASE = process.env.WEB_BASE_URL || 'http://localhost:3003';
const DIR =
  process.env.SCREENSHOT_DIR ||
  `evals/screenshots/iter38-web-${new Date().toISOString().slice(0, 10)}`;

const PAGES = [
  ['/', 'web-home'],
  ['/about', 'web-about'],
  ['/marketplace', 'web-marketplace'],
  ['/docs', 'web-docs'],
  ['/features', 'web-features'],
  ['/pricing', 'web-pricing'],
  ['/download', 'web-download'],
  ['/blog', 'web-blog'],
];

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
for (const [path, name] of PAGES) {
  const page = await ctx.newPage();
  await safeGoto(page, path);
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
  await page.close();
  console.log(`✓ ${name}`);
}
await ctx.close();
await browser.close();
console.log('Done!');
