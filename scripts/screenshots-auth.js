const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Iter76: Deterministic screenshot harness (no manual IDs).
 *
 * We intentionally do NOT depend on a lessons-list endpoint.
 * Instead, we derive a lessonId from the existing course detail response (modules[].lessons[].id).
 */

(async () => {
  const browser = await chromium.launch();
  // Note: the app (client) runs on :3001; the marketing site runs on :3003.
  // This script targets the app so we can capture authenticated UI states.
  const BASE = process.env.LEARNFLOW_WEB_BASE || 'http://127.0.0.1:3001';
  const DIR =
    process.env.SCREENSHOT_DIR ||
    process.env.LEARNFLOW_SCREENSHOT_DIR ||
    '/home/aifactory/.openclaw/workspace/learnflow/screenshots/iter57';

  const API_BASE = process.env.LEARNFLOW_API_BASE || 'http://127.0.0.1:3000';

  fs.mkdirSync(DIR, { recursive: true });

  const runStartedAt = new Date().toISOString();

  async function writeNotes(partial) {
    const notesPath = path.join(DIR, 'NOTES.md');
    const payload = {
      timestamp: runStartedAt,
      command: partial.command || '',
      env: {
        LEARNFLOW_WEB_BASE: BASE,
        LEARNFLOW_API_BASE: API_BASE,
        SCREENSHOT_DIR: DIR,
        PIPELINE_ID: process.env.PIPELINE_ID || '',
      },
      ids: partial.ids || {},
    };

    const md = `# Iter76 Screenshot Run Notes\n\n- Timestamp: ${payload.timestamp}\n- Command: ${payload.command}\n\n## Environment\n- LEARNFLOW_WEB_BASE: ${payload.env.LEARNFLOW_WEB_BASE}\n- LEARNFLOW_API_BASE: ${payload.env.LEARNFLOW_API_BASE}\n- SCREENSHOT_DIR: ${payload.env.SCREENSHOT_DIR}\n- PIPELINE_ID (input): ${payload.env.PIPELINE_ID || '(none)'}\n\n## IDs Used\n- pipelineId: ${payload.ids.pipelineId || ''}\n- pipelineCourseId: ${payload.ids.pipelineCourseId || ''}\n- courseId: ${payload.ids.courseId || ''}\n- lessonId: ${payload.ids.lessonId || ''}\n\n## Notes\n- Lesson screenshot includes Sources drawer opened via UI click and verified by drawer heading.\n`;

    fs.writeFileSync(notesPath, md, 'utf8');
  }

  // Register via API
  const email = 'screenshotuser' + Date.now() + '@test.com';
  const res = await fetch(API_BASE + '/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'TestPass123!',
      displayName: 'Screenshot User',
    }),
  });
  const auth = await res.json();
  console.log('Registered:', auth.user?.email || email);

  // Create context with auth
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Set auth tokens in localStorage via a public page first
  await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 8000 });
  await page.evaluate((data) => {
    localStorage.setItem('learnflow-token', data.accessToken);
    localStorage.setItem('learnflow-refresh', data.refreshToken);
    localStorage.setItem('learnflow-user', JSON.stringify(data.user));
    localStorage.setItem('learnflow-onboarding-complete', 'true');
    // Prevent onboarding overlay/tour from intercepting clicks
    localStorage.setItem('onboarding-tour-complete', 'true');
  }, auth);

  const routes = [
    ['dashboard', '/dashboard'],
    ['settings', '/settings'],
    ['marketplace', '/marketplace'],
    ['create-course', '/create-course'],
    ['onboarding-welcome', '/onboarding/welcome'],
  ];

  for (const [name, path] of routes) {
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: DIR + '/' + name + '-auth.png', fullPage: true });
      console.log('OK ' + name);
    } catch (e) {
      console.log('FAIL ' + name + ': ' + e.message.slice(0, 80));
    }
  }

  // Create a course to get course/lesson screens
  try {
    await page.goto(BASE + '/create-course', { waitUntil: 'networkidle', timeout: 8000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: DIR + '/create-course-auth.png', fullPage: true });
    console.log('OK create-course-auth');
  } catch (e) {
    console.log('FAIL create-course: ' + e.message.slice(0, 80));
  }

  // Deterministic course + lesson resolution (no /courses/:id/lessons endpoint)
  // We create a course via API, then derive lessonId from course detail (modules[].lessons[].id).
  let courseId = '';
  let lessonId = '';
  try {
    const createRes = await fetch(API_BASE + '/api/v1/courses', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + auth.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic: 'Iter76 Screenshot Harness', depth: 'beginner', fast: true }),
    });
    const created = await createRes.json();
    courseId = created?.id || created?.courseId || created?.course?.id || '';
    if (!courseId) throw new Error('courseId missing from create course response');

    // Poll course detail until the first lesson has content (or timeout)
    const deadline = Date.now() + 60_000;
    let courseDetail = null;
    while (Date.now() < deadline) {
      const cRes = await fetch(API_BASE + '/api/v1/courses/' + courseId, {
        headers: { Authorization: 'Bearer ' + auth.accessToken },
      });
      courseDetail = await cRes.json();
      const firstLesson =
        courseDetail?.modules?.[0]?.lessons?.find((l) => l && l.id) ||
        courseDetail?.modules?.[0]?.lessons?.[0];

      lessonId = firstLesson?.id || '';
      const hasContent = Boolean(firstLesson?.content && String(firstLesson.content).length > 200);
      if (lessonId && hasContent) break;
      await new Promise((r) => setTimeout(r, 1500));
    }

    if (!lessonId) {
      lessonId = courseDetail?.modules?.[0]?.lessons?.[0]?.id || '';
    }

    console.log('Resolved courseId:', courseId);
    console.log('Resolved lessonId:', lessonId);

    await writeNotes({
      command:
        'SCREENSHOT_DIR=' +
        DIR +
        ' LEARNFLOW_WEB_BASE=' +
        BASE +
        ' LEARNFLOW_API_BASE=' +
        API_BASE +
        ' node scripts/screenshots-auth.js',
      ids: { courseId, lessonId },
    });

    await page.goto(BASE + '/courses/' + courseId, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: DIR + '/course-detail-auth.png', fullPage: true });
    console.log('OK course-detail-auth');

    if (lessonId) {
      await page.goto(BASE + '/courses/' + courseId + '/lessons/' + lessonId, {
        waitUntil: 'networkidle',
        timeout: 15000,
      });

      // Dismiss any overlays that can block clicks
      try {
        await page.evaluate(() => {
          const tour = document.querySelector('[aria-label="Onboarding tour"]');
          if (tour) tour.remove();
        });
      } catch {}

      // Ensure Lesson Reader is interactive before clicking
      const seeSourcesBtn = page.getByRole('button', { name: 'See Sources' });
      await seeSourcesBtn.waitFor({ timeout: 25000 });
      await seeSourcesBtn.click({ timeout: 25000 });

      // Verify drawer is open
      await page
        .getByRole('heading', { name: 'Sources & Attribution' })
        .waitFor({ timeout: 25000 });

      await page.waitForTimeout(400);
      await page.screenshot({ path: DIR + '/lesson-reader-sources-drawer.png', fullPage: true });
      console.log('OK lesson-reader-sources-drawer');
    }

    // Mindmap
    await page.goto(BASE + '/courses/' + courseId + '/mindmap', {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: DIR + '/mindmap-auth.png', fullPage: true });
    console.log('OK mindmap-auth');
  } catch (e) {
    console.log('FAIL deterministic course/lesson: ' + e.message.slice(0, 160));
  }

  // Pipeline detail: use provided PIPELINE_ID or create one deterministically.
  try {
    let pipelineId = process.env.PIPELINE_ID || '';
    let pipelineCourseId = '';

    if (!pipelineId) {
      const pRes = await fetch(API_BASE + '/api/v1/pipeline', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + auth.accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: 'Iter76 Pipeline Screenshot' }),
      });
      const created = await pRes.json();
      pipelineId = created?.pipelineId || created?.id || '';
      pipelineCourseId = created?.courseId || '';
      console.log('Created pipelineId:', pipelineId);
    } else {
      console.log('Using pipelineId from env:', pipelineId);
    }

    // Poll for stable state (at least created / not QUEUED)
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      const stateRes = await fetch(API_BASE + '/api/v1/pipeline/' + pipelineId, {
        headers: { Authorization: 'Bearer ' + auth.accessToken },
      });
      const state = await stateRes.json();
      const status = state?.status;
      const progress = state?.progress;
      const milestones = Array.isArray(state?.lessonMilestones) ? state.lessonMilestones : [];
      const stable =
        status === 'RUNNING' || status === 'SUCCEEDED' || status === 'FAILED' || progress > 1;
      if (stable || milestones.length > 0) break;
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Update NOTES with pipelineId
    await writeNotes({
      command:
        'SCREENSHOT_DIR=' +
        DIR +
        ' LEARNFLOW_WEB_BASE=' +
        BASE +
        ' LEARNFLOW_API_BASE=' +
        API_BASE +
        ' node scripts/screenshots-auth.js',
      ids: { pipelineId, courseId, lessonId, pipelineCourseId },
    });

    // NOTE: pipeline detail page may keep an SSE connection open, which prevents "networkidle".
    await page.goto(BASE + '/pipeline/' + pipelineId, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    // Best-effort wait for the detail screen to render something stable
    try {
      await page.getByText('Pipeline', { exact: false }).first().waitFor({ timeout: 15000 });
    } catch {}
    await page.waitForTimeout(1600);
    await page.screenshot({ path: DIR + '/pipeline-detail.png', fullPage: true });
    console.log('OK pipeline-detail');
  } catch (e) {
    console.log('FAIL pipeline-detail: ' + e.message.slice(0, 120));
  }

  // Mobile
  const mctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mp = await mctx.newPage();
  await mp.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 5000 });
  await mp.evaluate((data) => {
    localStorage.setItem('learnflow-token', data.accessToken);
    localStorage.setItem('learnflow-refresh', data.refreshToken);
    localStorage.setItem('learnflow-user', JSON.stringify(data.user));
    localStorage.setItem('learnflow-onboarding-complete', 'true');
  }, auth);

  for (const [n, p] of [
    ['m-dashboard-auth', '/dashboard'],
    ['m-settings-auth', '/settings'],
  ]) {
    try {
      await mp.goto(BASE + p, { waitUntil: 'networkidle', timeout: 5000 });
      await mp.waitForTimeout(1000);
      await mp.screenshot({ path: DIR + '/' + n + '.png', fullPage: true });
      console.log('OK ' + n);
    } catch (e) {}
  }

  await browser.close();
  console.log('DONE');
})();
