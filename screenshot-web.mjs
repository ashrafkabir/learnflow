import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

function readArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

const BASE =
  process.env.WEB_BASE_URL ||
  process.env.SCREENSHOT_BASE_URL ||
  readArg('base') ||
  'http://localhost:3003';

const DIR =
  process.env.SCREENSHOT_DIR ||
  readArg('out') ||
  `evals/screenshots/iter45-web-${new Date().toISOString().slice(0, 10)}`;

fs.mkdirSync(path.resolve(DIR), { recursive: true });

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

async function safeGoto(page, p) {
  try {
    await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle', timeout: 20000 });
  } catch {
    // best effort
  }
  await page.waitForTimeout(900);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
for (const [p, name] of PAGES) {
  const page = await ctx.newPage();
  await safeGoto(page, p);
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
  await page.close();
  console.log(`✓ ${name}`);
}
await ctx.close();
await browser.close();
console.log(`Done! Saved to ${DIR}`);
