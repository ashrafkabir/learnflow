/* eslint-disable no-undef */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

function readArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

const BASE = process.env.BASE_URL || readArg('base') || 'http://localhost:3001';
const BASE_WEB = process.env.BASE_WEB_URL || readArg('baseWeb') || 'http://localhost:3003';

function requireBaseWeb() {
  if (!BASE_WEB) throw new Error('BASE_WEB is required');
  try {
    // eslint-disable-next-line no-new
    new URL(BASE_WEB);
  } catch {
    throw new Error(`Invalid BASE_WEB_URL: ${BASE_WEB}`);
  }
}

const ITER_ARG = process.env.ITERATION || process.env.ITER || readArg('iter');
const DATE = new Date().toISOString().slice(0, 10);

// Determine iteration early so default outDir is always in learnflow/screenshots/iter<iter>/...
const inferredIterFromArgs = (() => {
  const raw = [
    process.env.SCREENSHOT_DIR,
    process.env.SCREENSHOT_OUT,
    readArg('outDir'),
    readArg('out'),
    process.argv[2],
  ].find(Boolean);
  const m = raw ? String(raw).match(/iter(\d+)/i) : null;
  return m ? m[1] : undefined;
})();

const ITER = ITER_ARG || inferredIterFromArgs || 'unknown';

const DIR =
  process.env.SCREENSHOT_DIR ||
  process.env.SCREENSHOT_OUT ||
  // Preferred: explicit flag
  readArg('outDir') ||
  readArg('out') ||
  // Preferred: positional first arg (node screenshot-all.mjs <outDir>)
  (process.argv[2] && !String(process.argv[2]).startsWith('--') ? process.argv[2] : undefined) ||
  `learnflow/screenshots/iter${ITER}/run-${DATE}`;
// Keep ITER in scope for backwards compatibility (downstream tooling may grep logs).
void ITER;

console.log(`Using output dir: ${path.resolve(DIR)}`);

const PUBLIC_PAGES = [
  // Client landing/auth/onboarding
  ['/', 'landing-home'],
  ['/login', 'auth-login'],
  ['/register', 'auth-register'],
  ['/onboarding/welcome', 'onboarding-1-welcome'],
  ['/onboarding/goals', 'onboarding-2-goals'],
  ['/onboarding/topics', 'onboarding-3-topics'],
  ['/onboarding/api-keys', 'onboarding-4-api-keys'],
  ['/onboarding/subscription', 'onboarding-5-subscription'],
  ['/onboarding/first-course', 'onboarding-6-first-course'],
];

const MARKETING_PAGES = [
  ['/', 'marketing-home'],
  ['/features', 'marketing-features'],
  ['/pricing', 'marketing-pricing'],
  ['/download', 'marketing-download'],
  ['/blog', 'marketing-blog'],
  ['/about', 'marketing-about'],
  ['/docs', 'marketing-docs'],
];

const AUTHED_PAGES = [
  ['/dashboard', 'app-dashboard'],
  ['/conversation', 'app-conversation'],
  ['/mindmap', 'app-mindmap'],
  ['/marketplace/courses', 'marketplace-courses'],
  ['/marketplace/agents', 'marketplace-agents'],
  ['/collaborate', 'app-collaboration'],
  ['/settings', 'app-settings'],
  ['/settings/about', 'settings-about-mvp-truth'],
  ['/notifications', 'app-notifications'],
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

async function safeGotoWeb(page, path) {
  try {
    await page.goto(`${BASE_WEB}${path}`, { waitUntil: 'networkidle', timeout: 20000 });
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

fs.mkdirSync(path.resolve(DIR), { recursive: true });

// Iter123 (P2.10): NOTES.md is created by the harness in a single place (root outDir).
// Keep backward compatibility: do not create per-subfolder NOTES.md here.

const browser = await chromium.launch();

function isNotFound(page) {
  return page
    .evaluate(() => {
      const txt = (globalThis.document?.body?.innerText || '').toLowerCase();
      // Our client NotFound includes this exact heading.
      if (txt.includes('page not found')) return true;
      // Next.js 404 often contains this string.
      if (txt.includes('this page could not be found')) return true;
      return false;
    })
    .catch(() => false);
}

// 1) Marketing route screenshots (canonical in apps/web)
{
  requireBaseWeb();

  // Fail fast if BASE_WEB is unreachable.
  try {
    const res = await fetch(BASE_WEB, { method: 'HEAD' });
    if (!res.ok) {
      throw new Error(`HEAD ${BASE_WEB} returned ${res.status}`);
    }
  } catch (err) {
    throw new Error(
      `[screenshot-all] BASE_WEB unreachable (${BASE_WEB}). Start apps/web first or pass --baseWeb / BASE_WEB_URL.\n` +
        String(err),
    );
  }

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  for (const [p, name] of MARKETING_PAGES) {
    const page = await ctx.newPage();
    // NOTE: marketing must only use BASE_WEB (avoid flakiness + wasted request)
    await safeGotoWeb(page, p);

    if (await isNotFound(page)) {
      await page.screenshot({ path: `${DIR}/${name}__NOT_FOUND.png`, fullPage: true });
      throw new Error(`NotFound detected while capturing marketing page ${p} (${name})`);
    }

    await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
    await page.close();
    console.log(`✓ ${name}`);
  }
  await ctx.close();
}

// 2) Client public route screenshots (no auth)
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  for (const [p, name] of PUBLIC_PAGES) {
    const page = await ctx.newPage();
    await safeGoto(page, p);
    if (await isNotFound(page)) {
      await page.screenshot({ path: `${DIR}/${name}__NOT_FOUND.png`, fullPage: true });
      throw new Error(`NotFound detected while capturing client page ${p} (${name})`);
    }
    await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
    await page.close();
    console.log(`✓ ${name}`);
  }
  await ctx.close();
}

// 2) Authed route screenshots (dev auth bypass + onboarding complete)
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript((base) => {
    // Prefer bypass mode over fake tokens.
    // (Fake tokens can trigger auth middleware failures and redirect loops.)
    globalThis.__LEARNFLOW_ENV__ = {
      ...(globalThis.__LEARNFLOW_ENV__ || {}),
      VITE_DEV_AUTH_BYPASS: '1',
      PLAYWRIGHT_BASE_URL: base,
    };

    // Iter86: tag harness-origin so API can suppress durable data/usage writes.
    localStorage.setItem('learnflow-origin', 'harness');
    localStorage.setItem('learnflow-onboarding-complete', 'true');
    // Prevent the dashboard tour overlay from blocking clicks
    localStorage.setItem('onboarding-tour-complete', 'true');
  }, BASE);

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
console.log(`Done! Saved to ${DIR}`);
