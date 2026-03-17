import { chromium } from 'playwright';

const BASE = 'http://localhost:3001';
const DIR = 'evals/screenshots/rebuild';

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

for (const [path, name] of pages) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
  await page.close();
  console.log(`✓ ${name}`);
}

// Create a course then screenshot course view and lesson
const page = await ctx.newPage();
await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
await page.waitForTimeout(500);

// Type topic and create course
const input = await page.$('input[placeholder*="topic"]');
if (input) {
  await input.fill('Agentic AI');
  await page.click('button:has-text("Create Course")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}/course-view.png`, fullPage: true });

  // Click first lesson
  const lessonEl = await page.$('[role="article"]');
  if (lessonEl) {
    await lessonEl.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${DIR}/lesson-reader.png`, fullPage: true });
  }
}
await page.close();

await browser.close();
console.log('Done!');
