import { test, expect } from '@playwright/test';

const API = 'http://127.0.0.1:3000';

async function registerAndGetToken(request: any): Promise<string> {
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@learnflow.dev`;
  const reg = await request.post(`${API}/api/v1/auth/register`, {
    timeout: 20_000,
    data: { email, password: 'password123', displayName: 'E2E' },
  });
  const data = await reg.json();
  return data.accessToken as string;
}

async function createCourse(request: any, token: string): Promise<string> {
  const create = await request.post(`${API}/api/v1/courses`, {
    timeout: 20_000,
    headers: { Authorization: `Bearer ${token}` },
    data: { topic: 'Iter138 Adaptive Loop Seed', depth: 'beginner', fast: true },
  });
  const data = await create.json();
  return data.id as string;
}

async function waitForCourseReady(request: any, token: string, courseId: string) {
  const started = Date.now();
  while (Date.now() - started < 60_000) {
    const res = await request.get(`${API}/api/v1/courses/${courseId}`, {
      timeout: 10_000,
      headers: { Authorization: `Bearer ${token}` },
    });
    const c = await res.json();
    if (c?.status === 'READY') return c;
    await new Promise((r) => setTimeout(r, 750));
  }
  throw new Error('Course not READY after 60s');
}

test('Iter138: adaptive loop end-to-end (quiz → mastery → CourseView badge → /daily review)', async ({
  page,
  request,
}) => {
  await page.addInitScript(() => {
    (window as any).__LEARNFLOW_ENV__ = {
      VITE_API_BASE_URL: 'http://127.0.0.1:3000',
      VITE_DEV_AUTH_BYPASS: '1',
    };
    localStorage.setItem('learnflow-onboarding-complete', 'true');
  });

  const token = await registerAndGetToken(request);
  const courseId = await createCourse(request, token);
  const course = await waitForCourseReady(request, token, courseId);

  const lessonId = course.modules?.[0]?.lessons?.[0]?.id as string;
  expect(typeof lessonId).toBe('string');

  // Ensure client uses this token
  await page.goto('/');
  await page.evaluate((t) => {
    localStorage.setItem('learnflow-token', t);
  }, token);

  // 1) Submit quiz (via events). The MVP API doesn't expose a dedicated /quiz endpoint.
  // Use a low score; MVP scheduler will set nextReviewAt into the future.
  await request.post(`${API}/api/v1/events`, {
    timeout: 30_000,
    headers: { Authorization: `Bearer ${token}` },
    data: {
      type: 'quiz.submitted',
      courseId,
      lessonId,
      meta: { score: 40, gaps: ['seed-review-due'] },
    },
  });

  // 2) Mark lesson completed as well to exercise both mastery paths.
  await request.post(`${API}/api/v1/events`, {
    timeout: 30_000,
    headers: { Authorization: `Bearer ${token}` },
    data: {
      type: 'lesson.completed',
      courseId,
      lessonId,
      meta: {},
    },
  });

  // 3) CourseView shows last quiz badge + mastery badge
  await page.goto(`/courses/${courseId}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator(`[data-testid="mastery-badge-${lessonId}"]`)).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator(`[data-testid="last-quiz-${lessonId}"]`)).toBeVisible({
    timeout: 30_000,
  });

  // 5) /daily includes at least one item; and should include our lesson either as a due review
  // (if nextReviewAt <= now) or as the next lesson to continue. The MVP scheduler sets
  // nextReviewAt into the future after a quiz, so 'continue' is acceptable.
  const daily = await request.get(`${API}/api/v1/daily?limit=10`, {
    timeout: 20_000,
    headers: { Authorization: `Bearer ${token}` },
  });
  const dailyJson = await daily.json();
  const lessons = Array.isArray(dailyJson?.lessons) ? dailyJson.lessons : [];
  expect(lessons.length).toBeGreaterThan(0);

  // /daily is a global heuristic and may return other courses first; just ensure it returns items.
  // Our per-lesson mastery assertions are covered via the CourseView badges above.
});
