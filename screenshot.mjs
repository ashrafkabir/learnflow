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
  (AUTHED ? 'evals/screenshots/iter45-desktop-authed' : 'evals/screenshots/iter45-desktop');

fs.mkdirSync(path.resolve(DIR), { recursive: true });

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
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });

if (AUTHED) {
  await ctx.addInitScript(() => {
    try {
      // eslint-disable-next-line no-undef
      localStorage.setItem('learnflow-token', 'dev');
      // eslint-disable-next-line no-undef
      localStorage.setItem('learnflow-onboarding-complete', 'true');
      // eslint-disable-next-line no-undef
      localStorage.setItem('onboarding-tour-complete', 'true');
    } catch {
      /* ignore */
    }
  });
}

for (const [p, name] of pages) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
  await page.close();
  console.log(`✓ ${name}`);
}

// Create a course then screenshot course view and lesson
const page = await ctx.newPage();
await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
await page.waitForTimeout(600);

// Type topic and create course
const input = await page.$('input[placeholder*="topic"]');
if (input) {
  await input.fill('Agentic AI');
  await page.click('button:has-text("Create Course")');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${DIR}/course-view.png`, fullPage: true });

  // Click first lesson
  const lessonEl = await page.$('[role="article"]');
  if (lessonEl) {
    await lessonEl.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${DIR}/lesson-reader.png`, fullPage: true });
  }
}
await page.close();

await browser.close();
console.log(`Done! Saved to ${DIR}`);
