import { test, expect } from '@playwright/test';

async function waitForApi(apiBase: string, request: any, timeoutMs = 30_000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await request.get(`${apiBase}/health`, { timeout: 5_000 });
      if (res.ok()) return;
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`API not ready after ${timeoutMs}ms: ${apiBase}`);
}

async function registerAndGetToken(
  apiBase: string,
  request: any,
): Promise<{ token: string; email: string }> {
  await waitForApi(apiBase, request);

  const email = `e2e-smoke-${Date.now()}-${Math.floor(Math.random() * 1e6)}@learnflow.dev`;
  const reg = await request.post(`${apiBase}/api/v1/auth/register`, {
    timeout: 20_000,
    data: { email, password: 'password123', displayName: 'E2E Smoke' },
  });
  if (!reg.ok()) {
    const body = await reg.text().catch(() => '');
    throw new Error(`Register failed: ${reg.status()} ${reg.statusText()} ${body}`);
  }
  const regData = await reg.json();
  const token = regData.accessToken as string;
  if (!token) throw new Error('Register did not return accessToken');
  return { token, email };
}

async function createCourse(
  apiBase: string,
  request: any,
  token: string,
): Promise<{ courseId: string; pipelineId?: string }> {
  const p = await request.post(`${apiBase}/api/v1/pipeline`, {
    timeout: 30_000,
    headers: { Authorization: `Bearer ${token}` },
    data: { topic: `Smoke topic ${Date.now()}` },
  });
  if (!p.ok()) {
    const body = await p.text().catch(() => '');
    throw new Error(`Create pipeline failed: ${p.status()} ${p.statusText()} ${body}`);
  }
  const pdata = await p.json();
  const courseId = pdata.courseId as string;
  const pipelineId = pdata.pipelineId as string | undefined;
  if (!courseId) throw new Error('Create pipeline did not return courseId');
  return { courseId, pipelineId };
}

async function getCourse(
  apiBase: string,
  request: any,
  token: string,
  courseId: string,
): Promise<any> {
  const res = await request.get(`${apiBase}/api/v1/courses/${courseId}`, {
    timeout: 20_000,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    const body = await res.text().catch(() => '');
    throw new Error(`GET course failed: ${res.status()} ${res.statusText()} ${body}`);
  }
  return res.json();
}

async function tryGetFirstLessonIdFromCourse(course: any): Promise<string | null> {
  const modules = Array.isArray(course?.modules) ? course.modules : [];
  for (const m of modules) {
    const lessons = Array.isArray(m?.lessons) ? m.lessons : [];
    for (const l of lessons) {
      if (l?.id) return String(l.id);
    }
  }
  return null;
}

async function getLesson(
  apiBase: string,
  request: any,
  token: string,
  courseId: string,
  lessonId: string,
): Promise<any> {
  const res = await request.get(`${apiBase}/api/v1/courses/${courseId}/lessons/${lessonId}`, {
    timeout: 20_000,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    const body = await res.text().catch(() => '');
    throw new Error(`GET lesson failed: ${res.status()} ${res.statusText()} ${body}`);
  }
  return res.json();
}

function initClientStorage() {
  return () => {
    (window as any).__LEARNFLOW_E2E__ = true;

    // Ensure the client uses a real JWT for API requests during this smoke test.
    // Some local dev modes set VITE_DEV_AUTH_BYPASS=1, which deliberately *suppresses*
    // Authorization headers (see getAuthHeaders()). That would make course fetches 401.
    (window as any).__LEARNFLOW_ENV__ = {
      ...((window as any).__LEARNFLOW_ENV__ || {}),
      VITE_DEV_AUTH_BYPASS: '0',
    };

    // Avoid onboarding overlays blocking interactions.
    localStorage.setItem('learnflow-onboarding-complete', 'true');
    localStorage.setItem('onboarding-tour-complete', 'true');
  };
}

test.describe('Iter136: smoke assertions', () => {
  test('dashboard renders; course creation works; course loads; lesson loads or shows generating', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    await page.addInitScript(initClientStorage());

    const apiBase = 'http://127.0.0.1:3000';
    const { token } = await registerAndGetToken(apiBase, request);
    const { courseId } = await createCourse(apiBase, request, token);

    // Set JWT before any authed route navigation.
    await page.goto('/');
    await page.evaluate((t) => {
      try {
        localStorage.setItem('learnflow-token', t);
      } catch {
        /* ignore */
      }
    }, token);

    // 1) dashboard renders
    await page.goto('/dashboard');
    await expect(page.locator('[aria-label="Dashboard"]')).toBeVisible({ timeout: 15_000 });

    // 2) course loads in UI (or truthful failure/generating state)
    await page.goto(`/courses/${courseId}`);
    await expect(page.locator('[data-screen="course-view"]')).toBeVisible({ timeout: 20_000 });

    // If UI is showing the explicit error screen, fail fast with a clear reason.
    const courseError = page.locator('text=Failed to load course');
    if (await courseError.count()) {
      const bodyTxt = await page
        .locator('body')
        .innerText()
        .catch(() => '');
      throw new Error(`CourseView rendered error state. Body:\n${bodyTxt.slice(0, 800)}`);
    }

    // 3) lesson loads (or generating state)
    // If the course is still in CREATING, we assert the truthful generating UI and stop.
    const creatingBadge = page.locator('text=Creating');
    if (await creatingBadge.count()) {
      await expect(page.locator('text=We are building your course')).toBeVisible({
        timeout: 10_000,
      });
      return;
    }

    // Prefer API to determine a lesson id; fall back to UI link.
    const course = await getCourse(apiBase, request, token, courseId);
    const lessonIdFromApi = await tryGetFirstLessonIdFromCourse(course);

    const lessonHrefFromUi = await page
      .getAttribute('a[href*="/lessons/"]', 'href')
      .catch(() => null);

    let lessonUrl: string | null = null;
    if (lessonIdFromApi) lessonUrl = `/courses/${courseId}/lessons/${lessonIdFromApi}`;
    else if (lessonHrefFromUi) lessonUrl = lessonHrefFromUi;

    if (!lessonUrl) {
      throw new Error('Could not determine a lesson URL from course API or CourseView UI');
    }

    await page.goto(lessonUrl);
    await expect(page.locator('[data-screen="lesson-reader"]')).toBeVisible({ timeout: 20_000 });

    const bodyText = await page
      .locator('body')
      .innerText()
      .catch(() => '');
    const hasGenerating =
      bodyText.toLowerCase().includes('generating') || bodyText.toLowerCase().includes('creating');
    const hasFailed = bodyText.toLowerCase().includes('failed');

    // If API can return the lesson, and it includes content, UI should render real rails.
    if (lessonIdFromApi) {
      const lessonRes = await getLesson(apiBase, request, token, courseId, lessonIdFromApi);
      const content = String(lessonRes?.lesson?.content || lessonRes?.content || '').trim();
      if (content && !hasGenerating) {
        await expect(page.locator('[data-testid="lesson-right-rail"]')).toBeVisible({
          timeout: 20_000,
        });
      }
    }

    if (hasFailed && !hasGenerating) {
      throw new Error(
        `LessonReader appears failed (and not generating). Body:\n${bodyText.slice(0, 800)}`,
      );
    }
  });
});
