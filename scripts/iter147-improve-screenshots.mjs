/* eslint-env node */
/* eslint-disable no-undef */
// Iter147: capture BEFORE/AFTER screenshots showing Improve applied.
// Headless-friendly: uses DOM editing to simulate server-applied replace-subsection.
// Output: learnflow/screenshots/iter147-improve/{desktop,mobile}/

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.SCREENSHOT_BASE_URL || 'http://127.0.0.1:3001';
const OUT = process.env.SCREENSHOT_DIR || 'learnflow/screenshots/iter147-improve';

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

async function authedContext(browser, { width, height, mobile }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: !!mobile,
    hasTouch: !!mobile,
  });

  await ctx.addInitScript(() => {
    try {
      globalThis.__LEARNFLOW_ENV__ = {
        ...(globalThis.__LEARNFLOW_ENV__ || {}),
        VITE_DEV_AUTH_BYPASS: '1',
        PLAYWRIGHT_E2E_FIXTURES: '1',
      };
      globalThis.localStorage.setItem('learnflow-token', 'dev');
      globalThis.localStorage.setItem('learnflow-origin', 'harness');
      globalThis.localStorage.setItem('learnflow-onboarding-complete', 'true');
      globalThis.localStorage.setItem(
        'learnflow-user',
        JSON.stringify({ id: 'u1', email: 'dev@learnflow', tier: 'pro' }),
      );
    } catch {
      /* ignore */
    }
  });

  return ctx;
}

async function ensureCourseAndLesson(page) {
  const ids = await page.evaluate(async () => {
    const token = localStorage.getItem('learnflow-token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch('/api/v1/courses', { headers: authHeaders });
    const data = await res.json();

    if (!data.courses || data.courses.length === 0) {
      const create = await fetch('/api/v1/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ topic: 'Iter147 Improve Screenshots Seed', depth: 'beginner' }),
      });
      const created = await create.json();
      const lessonId = created.modules[0].lessons[0].id;
      return { courseId: created.id, lessonId };
    }

    const courseId = data.courses[0].id;
    const courseRes = await fetch(`/api/v1/courses/${courseId}`, { headers: authHeaders });
    const course = await courseRes.json();
    const lessonId = course.modules[0].lessons[0].id;
    return { courseId, lessonId };
  });
  return ids;
}

async function captureVariant({ name, width, height, mobile }) {
  const browser = await chromium.launch();
  const ctx = await authedContext(browser, { width, height, mobile });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  const ids = await ensureCourseAndLesson(page);

  await page.goto(`${BASE}/courses/${ids.courseId}/lessons/${ids.lessonId}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  await page.waitForTimeout(800);

  // Ensure lesson reader is visible.
  const root = page.locator('[data-screen="lesson-reader"]');
  await root.waitFor({ timeout: 60_000 });

  const outDir = path.resolve(OUT, mobile ? 'mobile' : 'desktop');
  ensureDir(outDir);

  // BEFORE
  await page.screenshot({ path: path.join(outDir, `${name}__before.png`), fullPage: true });

  // AFTER: simulate what replace-subsection would do by editing the first H3 and its following content.
  await page.evaluate(() => {
    const h3 = document.querySelector('h3');
    if (!h3) return;
    h3.textContent = 'New Heading Title (Improved)';

    // Replace content until next heading of same/higher level.
    const nodes = [];
    let n = h3.nextElementSibling;
    while (n && !/^H[1-3]$/.test(n.tagName)) {
      nodes.push(n);
      n = n.nextElementSibling;
    }
    nodes.forEach((el) => el.remove());

    const container = h3.parentElement || h3.closest('article') || document.body;

    const p = document.createElement('p');
    p.textContent = 'Improved subsection content. (Simulated apply)';

    const img = document.createElement('img');
    img.alt = 'JavaScript logo';
    img.src = 'https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png';
    img.style.maxWidth = '320px';
    img.style.display = 'block';
    img.style.margin = '12px 0';

    const a = document.createElement('a');
    a.href = 'https://developer.mozilla.org/';
    a.textContent = 'MDN';
    a.target = '_blank';
    a.rel = 'noreferrer';

    // Insert right after the H3.
    container.insertBefore(p, h3.nextSibling);
    container.insertBefore(img, p.nextSibling);
    container.insertBefore(a, img.nextSibling);
  });

  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, `${name}__after.png`), fullPage: true });

  await page.close();
  await ctx.close();
  await browser.close();
}

await captureVariant({ name: 'desktop-1280x800', width: 1280, height: 800, mobile: false });
await captureVariant({ name: 'mobile-375x812', width: 375, height: 812, mobile: true });

console.log(`Done. Saved to ${OUT}`);
