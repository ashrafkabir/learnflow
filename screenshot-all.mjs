/* eslint-disable no-undef */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3001';
const ITER = process.env.ITERATION || process.env.ITER || '61';
const DATE = new Date().toISOString().slice(0, 10);
const DIR = process.env.SCREENSHOT_DIR || `learnflow/screenshots/iter${ITER}-${DATE}`;

const PUBLIC_PAGES = [
  ['/', 'landing-home'],
  ['/features', 'marketing-features'],
  ['/pricing', 'marketing-pricing'],
  ['/download', 'marketing-download'],
  ['/blog', 'marketing-blog'],
  ['/about', 'marketing-about'],
  ['/docs', 'marketing-docs'],
  ['/login', 'auth-login'],
  ['/register', 'auth-register'],
  ['/onboarding/welcome', 'onboarding-1-welcome'],
  ['/onboarding/goals', 'onboarding-2-goals'],
  ['/onboarding/topics', 'onboarding-3-topics'],
  ['/onboarding/api-keys', 'onboarding-4-api-keys'],
  ['/onboarding/subscription', 'onboarding-5-subscription'],
  ['/onboarding/first-course', 'onboarding-6-first-course'],
];

const AUTHED_PAGES = [
  ['/dashboard', 'app-dashboard'],
  ['/conversation', 'app-conversation'],
  ['/mindmap', 'app-mindmap'],
  ['/marketplace/courses', 'marketplace-courses'],
  ['/marketplace/agents', 'marketplace-agents'],
  ['/collaborate', 'app-collaboration'],
  ['/settings', 'app-settings'],
  ['/pipelines', 'app-pipelines'],
  // Stable seeded routes for deterministic coverage
  ['/courses/c-1', 'course-view'],
  ['/courses/c-1/lessons/l1', 'lesson-reader'],
];

async function safeGoto(page, path) {
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 20000 });
  } catch {
    // best effort; still screenshot whatever rendered
  }
  await page.waitForTimeout(800);
}

async function dismissOverlays(page) {
  // Our onboarding tooltip tour uses an overlay that can intercept clicks.
  try {
    await page.evaluate(() => {
      const tour = document.querySelector('[aria-label="Onboarding tour"]');
      if (tour) tour.remove();
    });
  } catch {
    /* ignore */
  }
}

const browser = await chromium.launch();

// 1) Public route screenshots (no auth)
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  for (const [path, name] of PUBLIC_PAGES) {
    const page = await ctx.newPage();
    await safeGoto(page, path);
    await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
    await page.close();
    console.log(`✓ ${name}`);
  }
  await ctx.close();
}

// 2) Authed route screenshots (force token + onboarding complete)
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => {
    localStorage.setItem('learnflow-token', 'dev');
    localStorage.setItem('learnflow-onboarding-complete', 'true');
    // Prevent the dashboard tour overlay from blocking clicks
    localStorage.setItem('onboarding-tour-complete', 'true');
  });

  for (const [path, name] of AUTHED_PAGES) {
    const page = await ctx.newPage();
    await safeGoto(page, path);
    await dismissOverlays(page);
    await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
    await page.close();
    console.log(`✓ ${name}`);
  }

  // Extra: pipeline detail (click first pipeline card)
  const page = await ctx.newPage();
  await safeGoto(page, '/pipelines');
  await dismissOverlays(page);
  const pipelineCard = await page.$('[role="listitem"]');
  if (pipelineCard) {
    await pipelineCard.click({ force: true });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${DIR}/pipeline-detail.png`, fullPage: true });
    console.log('✓ pipeline-detail');
  }

  // Extra: attempt course create + course/lesson views
  await safeGoto(page, '/dashboard');
  await dismissOverlays(page);

  const topic = `Agentic AI ${Date.now().toString().slice(-5)}`;
  const input = await page.$('input[placeholder*="Enter a topic" i]');
  if (input) {
    await input.fill(topic);
    const btn = await page.$('button:has-text("Create Course")');
    if (btn) {
      await btn.click({ force: true });
      await page.waitForTimeout(2500);
    }
  }
  await page.screenshot({ path: `${DIR}/course-create-after-click.png`, fullPage: true });
  console.log('✓ course-create-after-click');

  const firstCourse = await page.$('[role="article"]');
  if (firstCourse) {
    await firstCourse.click({ force: true });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${DIR}/course-view.png`, fullPage: true });
    console.log('✓ course-view');

    // Prefer a stable selector to ensure lesson reader is always captured.
    let lessonHref = await page.getAttribute('a[href*="/lessons/"]', 'href').catch(() => null);
    if (!lessonHref) {
      // Fallback: if no link found, attempt to guess the first lesson route from DOM.
      const hrefs = await page
        .$$eval('a[href]', (els) =>
          els.map((el) =>
            el && typeof el.getAttribute === 'function' ? el.getAttribute('href') : '',
          ),
        )
        .catch(() => []);
      lessonHref = hrefs.find((h) => h.includes('/lessons/')) || null;
    }

    if (lessonHref) {
      await safeGoto(page, lessonHref);
      await dismissOverlays(page);
      await page.screenshot({ path: `${DIR}/lesson-reader.png`, fullPage: true });
      console.log('✓ lesson-reader');
    }
  }

  await page.close();
  await ctx.close();
}

await browser.close();
console.log('Done!');
