import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = process.argv[2] || 'screenshots/iter166/run-001';
const baseClient = 'http://localhost:3001';
const baseWeb = 'http://localhost:3003';

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });
const safeName = (s) =>
  s
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

async function snap(page, file) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: file, fullPage: true });
}

async function run() {
  ensureDir(outDir);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // Marketing site pages
  const webPages = ['/', '/features', '/pricing', '/download', '/docs', '/blog', '/about'];
  for (const p of webPages) {
    const url = baseWeb + p;
    await page.goto(url, { waitUntil: 'networkidle' });
    await snap(page, path.join(outDir, `web-${safeName(p || 'home')}.png`));
  }

  // Client app screens
  // Note: routes discovered from App.tsx + common paths.
  const clientPages = [
    '/',
    '/login',
    '/register',
    '/dashboard',
    '/conversation',
    '/mindmap',
    '/marketplace/courses',
    '/marketplace/agents',
    '/settings',
    '/settings?tab=keys',
    '/settings?tab=usage',
    '/settings?tab=export',
    '/settings/about-mvp-truth',
    '/docs',
  ];

  for (const p of clientPages) {
    const url = baseClient + p;
    await page.goto(url, { waitUntil: 'networkidle' });
    await snap(page, path.join(outDir, `client-${safeName(p || 'home')}.png`));
  }

  await browser.close();
  console.log(`[iter166] screenshots saved to ${outDir}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
