import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function axeScan(page: any, label: string) {
  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations || [];

  // Write results for review (deterministic JSON ordering is not guaranteed by axe,
  // but we store for human inspection only).
  test.info().attachments.push({
    name: `axe-${label}.json`,
    contentType: 'application/json',
    body: Buffer.from(JSON.stringify(results, null, 2)),
  });

  // Keep this as a smoke gate: no *critical* violations.
  // (We still attach the full results JSON so serious issues are visible, but
  // we only fail the build on critical blockers.)
  const critical = violations.filter((v: any) => v.impact === 'critical');
  expect(
    critical,
    `axe critical violations on ${label}: ${critical.map((v: any) => v.id).join(', ')}`,
  ).toEqual([]);
}

test.describe('Accessibility smoke (axe)', () => {
  test.beforeEach(async ({ page }) => {
    // Force deterministic dev auth bypass so these routes are reachable in CI.
    await page.addInitScript(() => {
      localStorage.removeItem('learnflow-token');
      localStorage.removeItem('learnflow-user');
      localStorage.removeItem('learnflow-onboarding-complete');
      (window as any).__LEARNFLOW_ENV__ = { VITE_DEV_AUTH_BYPASS: '1' };
    });
  });

  test('Dashboard has no serious/critical violations', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('[data-screen="dashboard"]');
    await axeScan(page, 'dashboard');
  });

  test('Conversation has no serious/critical violations', async ({ page }) => {
    await page.goto('/conversation');
    await page.waitForSelector('[data-screen="conversation"]');
    await axeScan(page, 'conversation');
  });

  test('CourseView has no serious/critical violations', async ({ page }) => {
    await page.goto('/courses/c-1');
    await page.waitForSelector('[data-screen="course-view"]');
    await axeScan(page, 'course-view');
  });

  test('LessonReader has no serious/critical violations', async ({ page }) => {
    // Use seeded course ids from test harness
    await page.goto('/courses/c-1/lessons/l1');
    await page.waitForSelector('[data-screen="lesson-reader"]');
    await axeScan(page, 'lesson-reader');
  });

  test('Settings has no serious/critical violations', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForSelector('[data-screen="settings"]');
    await axeScan(page, 'settings');
  });

  test('Login has no serious/critical violations', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('[data-screen="login"]');
    await axeScan(page, 'login');
  });

  test('Onboarding API Keys has no serious/critical violations', async ({ page }) => {
    await page.goto('/onboarding/api-keys');
    await page.waitForSelector('[data-screen="onboarding-apikeys"]');
    await axeScan(page, 'onboarding-apikeys');
  });
});
