const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const BASE = process.env.LEARNFLOW_WEB_BASE || 'http://127.0.0.1:3003';
  const DIR =
    process.env.SCREENSHOT_DIR ||
    process.env.LEARNFLOW_SCREENSHOT_DIR ||
    '/home/aifactory/.openclaw/workspace/learnflow/screenshots/iter57';

  const routes = [
    ['landing', '/'],
    ['login', '/login'],
    ['register', '/register'],
    ['pricing', '/pricing'],
    ['features', '/features'],
    ['dashboard', '/dashboard'],
    ['onboarding', '/onboarding'],
    ['settings', '/settings'],
    ['marketplace', '/marketplace'],
    ['create-course', '/create-course'],
    ['about', '/about'],
    ['blog', '/blog'],
  ];

  for (const [name, path] of routes) {
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 8000 });
      await page.screenshot({ path: DIR + '/' + name + '.png', fullPage: true });
      console.log('OK ' + name);
    } catch (e) {
      console.log('FAIL ' + name + ': ' + e.message.slice(0, 60));
    }
  }

  // Register
  try {
    await page.goto(BASE + '/register', { waitUntil: 'networkidle', timeout: 5000 });
    await page.fill('input[name="email"]', 'test12@example.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    const nameInp = await page.$('input[name="name"]');
    if (nameInp) await nameInp.fill('Test User 12');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: DIR + '/after-register.png', fullPage: true });
    console.log('OK after-register at ' + page.url());
  } catch (e) {
    console.log('FAIL register: ' + e.message.slice(0, 80));
  }

  // Dashboard after auth
  try {
    await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle', timeout: 5000 });
    await page.screenshot({ path: DIR + '/dashboard-auth.png', fullPage: true });
    console.log('OK dashboard-auth');
  } catch (e) {}

  // Course detail
  try {
    await page.goto(BASE + '/courses/1', { waitUntil: 'networkidle', timeout: 5000 });
    await page.screenshot({ path: DIR + '/course-detail.png', fullPage: true });
    console.log('OK course-detail');
  } catch (e) {}

  // Lesson
  try {
    await page.goto(BASE + '/courses/1/lessons/1', { waitUntil: 'networkidle', timeout: 5000 });
    await page.screenshot({ path: DIR + '/lesson-reader.png', fullPage: true });
    console.log('OK lesson-reader');
  } catch (e) {}

  // Mindmap
  try {
    await page.goto(BASE + '/courses/1/mindmap', { waitUntil: 'networkidle', timeout: 5000 });
    await page.screenshot({ path: DIR + '/mindmap.png', fullPage: true });
    console.log('OK mindmap');
  } catch (e) {}

  // Pipeline detail (optional)
  try {
    const pipelineId = process.env.PIPELINE_ID;
    if (pipelineId) {
      await page.goto(BASE + '/pipeline/' + pipelineId, {
        waitUntil: 'networkidle',
        timeout: 8000,
      });
      await page.screenshot({ path: DIR + '/pipeline-detail.png', fullPage: true });
      console.log('OK pipeline-detail');
    }
  } catch (e) {
    console.log('FAIL pipeline-detail: ' + e.message.slice(0, 80));
  }

  // Mobile
  const mctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mp = await mctx.newPage();
  for (const [n, p] of [
    ['m-landing', '/'],
    ['m-dashboard', '/dashboard'],
    ['m-lesson', '/courses/1/lessons/1'],
  ]) {
    try {
      await mp.goto(BASE + p, { waitUntil: 'networkidle', timeout: 5000 });
      await mp.screenshot({ path: DIR + '/' + n + '.png', fullPage: true });
      console.log('OK ' + n);
    } catch (e) {}
  }

  await browser.close();
  console.log('DONE');
})();
