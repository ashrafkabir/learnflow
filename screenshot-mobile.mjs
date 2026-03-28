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
const DRY_RUN =
  process.argv.includes('--dryRun') ||
  process.argv.includes('--dry-run') ||
  process.env.SCREENSHOT_DRY_RUN === '1' ||
  process.env.SCREENSHOT_DRY_RUN === 'true';

const DIR =
  process.env.SCREENSHOT_DIR ||
  process.env.SCREENSHOT_OUT_DIR ||
  // Preferred: explicit flag
  readArg('outDir') ||
  readArg('out') ||
  // Preferred: positional first arg (node screenshot-mobile.mjs <outDir>)
  process.argv[2] ||
  (AUTHED ? 'evals/screenshots/iter45-mobile-authed' : 'evals/screenshots/iter45-mobile');

const resolvedDir = path.resolve(DIR);
fs.mkdirSync(resolvedDir, { recursive: true });

// Iter114: Always create a NOTES.md template for each run so planners/builders can log context.
try {
  const notesPath = path.join(resolvedDir, 'NOTES.md');
  if (!fs.existsSync(notesPath)) {
    fs.writeFileSync(
      notesPath,
      `# Screenshot Run Notes\n\n- Mobile run\n- Date: ${new Date().toISOString().slice(0, 10)}\n- Base URL: ${BASE}\n- Authed: ${AUTHED}\n\n## What changed\n\n- \n\n## Known limitations\n\n- \n\n`,
      'utf8',
    );
  }
} catch {
  // ignore
}

console.log(`Using output dir: ${resolvedDir}`);

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
  ['/notifications', 'notifications'],
  ['/marketplace/courses', 'marketplace-courses'],
  ['/marketplace/agents', 'marketplace-agents'],
];

if (DRY_RUN) {
  console.log('Dry run: skipping Playwright launch and navigation.');
  console.log(`Done! Saved to ${resolvedDir}`);
  process.exit(0);
}

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
        // Iter86: tag harness-origin so API can suppress durable data/usage writes.
        globalThis.localStorage.setItem('learnflow-origin', 'harness');
        globalThis.localStorage.setItem('learnflow-onboarding-complete', 'true');
        globalThis.localStorage.setItem('onboarding-tour-complete', 'true');
      } catch {
        // ignore
      }
    });
  }

  for (const [p, name] of pages) {
    const page = await ctx.newPage();

    let navOk = false;
    try {
      await page.goto(`${BASE}${p}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Some routes keep sockets/polling open; "networkidle" can hang. Instead: wait for DOM + a short settle.
      await page.waitForTimeout(800);
      navOk = true;
    } catch (err) {
      console.warn(`⚠️  ${vp.name} ${name} navigation failed: ${String(err)}`);
    }

    if (navOk && !page.isClosed()) {
      // Safety: no horizontal scroll (best-effort; don't crash harness)
      try {
        const { scrollWidth, viewWidth } = await page.evaluate(() => ({
          scrollWidth: globalThis.document.documentElement.scrollWidth,
          viewWidth: globalThis.window.innerWidth,
        }));
        if (scrollWidth > viewWidth + 10) {
          console.warn(
            `⚠️  ${vp.name} ${name} has horizontal overflow: ${scrollWidth} > ${viewWidth}`,
          );
        }
      } catch (err) {
        console.warn(`⚠️  ${vp.name} ${name} overflow check failed: ${String(err)}`);
      }

      try {
        await page.screenshot({ path: `${resolvedDir}/${vp.name}__${name}.png`, fullPage: true });
        console.log(`✓ ${vp.name} ${name}`);
      } catch (err) {
        console.warn(`⚠️  ${vp.name} ${name} screenshot failed: ${String(err)}`);
      }
    }

    await page.close().catch(() => {});
  }

  await ctx.close();
}

await browser.close();
console.log(`Done! Saved to ${resolvedDir}`);
