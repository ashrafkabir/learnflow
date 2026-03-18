const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const BASE = 'http://127.0.0.1:3003';
  const DIR = '/home/aifactory/.openclaw/workspace/learnflow/screenshots/iter12';

  // Register via API
  const res = await fetch('http://127.0.0.1:3000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'screenshotuser' + Date.now() + '@test.com', password: 'TestPass123!', displayName: 'Screenshot User' }),
  });
  const auth = await res.json();
  console.log('Registered:', auth.user.email);

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
    } catch (e) { console.log('FAIL ' + name + ': ' + e.message.slice(0, 80)); }
  }

  // Create a course to get course/lesson screens
  try {
    await page.goto(BASE + '/create-course', { waitUntil: 'networkidle', timeout: 8000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: DIR + '/create-course-auth.png', fullPage: true });
    console.log('OK create-course-auth');
  } catch(e) { console.log('FAIL create-course: ' + e.message.slice(0,80)); }

  // Check if there are any courses
  try {
    const coursesRes = await fetch('http://127.0.0.1:3000/api/v1/courses', {
      headers: { 'Authorization': 'Bearer ' + auth.accessToken }
    });
    const courses = await coursesRes.json();
    console.log('Courses:', JSON.stringify(courses).slice(0, 200));

    if (courses.length > 0 || (courses.courses && courses.courses.length > 0)) {
      const courseList = courses.courses || courses;
      const cid = courseList[0].id;
      await page.goto(BASE + '/courses/' + cid, { waitUntil: 'networkidle', timeout: 8000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: DIR + '/course-detail-auth.png', fullPage: true });
      console.log('OK course-detail-auth');

      // Get lessons
      const lessonsRes = await fetch('http://127.0.0.1:3000/api/v1/courses/' + cid + '/lessons', {
        headers: { 'Authorization': 'Bearer ' + auth.accessToken }
      });
      const lessons = await lessonsRes.json();
      console.log('Lessons:', JSON.stringify(lessons).slice(0, 200));
      if (lessons.length > 0 || (lessons.lessons && lessons.lessons.length > 0)) {
        const lessonList = lessons.lessons || lessons;
        const lid = lessonList[0].id;
        await page.goto(BASE + '/courses/' + cid + '/lessons/' + lid, { waitUntil: 'networkidle', timeout: 8000 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: DIR + '/lesson-reader-auth.png', fullPage: true });
        console.log('OK lesson-reader-auth');
      }

      // Mindmap
      await page.goto(BASE + '/courses/' + cid + '/mindmap', { waitUntil: 'networkidle', timeout: 8000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: DIR + '/mindmap-auth.png', fullPage: true });
      console.log('OK mindmap-auth');
    }
  } catch(e) { console.log('FAIL courses: ' + e.message.slice(0,120)); }

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

  for (const [n, p] of [['m-dashboard-auth', '/dashboard'], ['m-settings-auth', '/settings']]) {
    try {
      await mp.goto(BASE + p, { waitUntil: 'networkidle', timeout: 5000 });
      await mp.waitForTimeout(1000);
      await mp.screenshot({ path: DIR + '/' + n + '.png', fullPage: true });
      console.log('OK ' + n);
    } catch(e) {}
  }

  await browser.close();
  console.log('DONE');
})();
