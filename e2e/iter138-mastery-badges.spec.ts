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
    data: { topic: 'Iter138 Mastery Badge Seed', depth: 'beginner', fast: true },
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

test('Iter138: CourseView shows mastery + review due badges and LessonReader shows review due banner (best-effort)', async ({
  page,
  request,
}) => {
  await page.addInitScript(() => {
    (window as any).__LEARNFLOW_ENV__ = {
      VITE_API_BASE_URL: 'http://127.0.0.1:3000',
    };
    localStorage.setItem('learnflow-onboarding-complete', 'true');
  });

  const token = await registerAndGetToken(request);
  const courseId = await createCourse(request, token);
  const course = await waitForCourseReady(request, token, courseId);

  const lessonId = course.modules?.[0]?.lessons?.[0]?.id as string;
  expect(typeof lessonId).toBe('string');

  await page.goto('/');
  await page.evaluate((t) => {
    try {
      localStorage.setItem('learnflow-token', t);
    } catch {
      /* ignore */
    }
  }, token);

  // Create a quiz attempt to populate mastery + lastQuizScore in persistence.
  const q = await request.post(`${API}/api/v1/courses/${courseId}/lessons/${lessonId}/quiz`, {
    timeout: 30_000,
    headers: { Authorization: `Bearer ${token}` },
    data: { questionCount: 5 },
  });
  const quiz = await q.json();

  const questions = (quiz?.questions || []) as any[];
  const answers: Record<string, string> = {};
  for (const qu of questions) {
    if (qu?.id && Array.isArray(qu?.options) && qu.options[0]) {
      answers[String(qu.id)] = String(qu.options[0]);
    }
  }

  await request.post(`${API}/api/v1/courses/${courseId}/lessons/${lessonId}/quiz/submit`, {
    timeout: 30_000,
    headers: { Authorization: `Bearer ${token}` },
    data: { answers },
  });

  // Force nextReviewAt to be in the past so "Review due" is deterministic.
  // Public API does not expose a direct mastery write endpoint.
  // Seed via the standard /events endpoint which updates mastery as a side-effect.
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

  // CourseView badges
  await page.goto(`/courses/${courseId}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator(`[data-testid="mastery-badge-${lessonId}"]`)).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.locator(`[data-testid="review-due-${lessonId}"]`)).toBeVisible({
    timeout: 30_000,
  });
  await page.screenshot({
    path: `e2e/screenshots/iter138-courseview-mastery-badges.png`,
    fullPage: true,
  });

  // LessonReader banner
  await page.goto(`/courses/${courseId}/lessons/${lessonId}`, { waitUntil: 'domcontentloaded' });
  // Wait for top bar to render
  await expect(page.getByTitle('Back')).toBeVisible({ timeout: 30_000 });
  // Banner only shows on >= sm; set viewport large.
  await page.setViewportSize({ width: 1200, height: 800 });
  await expect(page.locator('[data-testid="review-due-banner"]')).toBeVisible({ timeout: 30_000 });
  await page.screenshot({
    path: `e2e/screenshots/iter138-lessonreader-review-due-banner.png`,
    fullPage: true,
  });
});
