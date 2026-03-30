import { test, expect } from '@playwright/test';

// Valid JWT for local API (dev secret). Keep consistent with other e2e specs.
const E2E_PRO_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1MSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJzdHVkZW50IiwidGllciI6InBybyIsImlhdCI6MTc3NDYyMDQyMSwiZXhwIjoxODA2MTU2NDIxfQ._nna6R4wrrbsT_WJO_s8khz61FLp7gkGYfQSznS1eqI';

function initClientStorage() {
  return () => {
    (window as any).__LEARNFLOW_E2E__ = true;

    // Avoid onboarding overlays blocking interactions.
    localStorage.setItem('learnflow-onboarding-complete', 'true');
    localStorage.setItem('onboarding-tour-complete', 'true');

    // Ensure auth bypass stays enabled for the UI portion of this smoke run.
    (window as any).__LEARNFLOW_ENV__ = {
      ...((window as any).__LEARNFLOW_ENV__ || {}),
      VITE_DEV_AUTH_BYPASS: '1',
    };

    // For deterministic E2E runs, force a Pro-tier JWT so pipeline/course creation isn't blocked by free-tier limits.
    // This is safe: server still verifies JWT signature; we only use the dev secret in devMode tests.
    localStorage.setItem('learnflow-token', E2E_PRO_TOKEN);
    localStorage.setItem(
      'learnflow-user',
      JSON.stringify({ id: 'u1', email: 'test@example.com', tier: 'pro' }),
    );
  };
}

async function snap(page: any, relPath: string) {
  await page.screenshot({
    path: `learnflow/screenshots/iter152/run-002/${relPath}`,
    fullPage: true,
  });
}

test.describe('Iter152: spec compliance smoke', () => {
  test('captures key screens and asserts stable selectors', async ({ page }) => {
    test.setTimeout(180_000);
    await page.addInitScript(initClientStorage());

    // Landing (app landing)
    await page.goto('/');
    await expect(page.locator('text=Welcome to the LearnFlow app.')).toBeVisible({ timeout: 20_000 });
    await snap(page, 'landing-app.png');

    // Auth screens
    await page.goto('/login');
    await expect(page.locator('[data-screen="login"]')).toBeVisible({ timeout: 20_000 });
    await snap(page, 'auth-login.png');

    await page.goto('/register');
    await expect(page.locator('[data-screen="register"]')).toBeVisible({ timeout: 20_000 });
    await snap(page, 'auth-register.png');

    // Onboarding screens (6)
    const onboarding: Array<{ path: string; sel: string; shot: string }> = [
      { path: '/onboarding/welcome', sel: '[data-screen="onboarding-welcome"]', shot: 'onboarding-welcome.png' },
      { path: '/onboarding/goals', sel: '[data-screen="onboarding-goals"]', shot: 'onboarding-goals.png' },
      { path: '/onboarding/topics', sel: '[data-screen="onboarding-topics"]', shot: 'onboarding-topics.png' },
      { path: '/onboarding/api-keys', sel: '[data-screen="onboarding-apikeys"]', shot: 'onboarding-api-keys.png' },
      { path: '/onboarding/subscription', sel: '[data-screen="onboarding-subscription"]', shot: 'onboarding-subscription.png' },
      { path: '/onboarding/first-course', sel: '[data-screen="onboarding-ready"]', shot: 'onboarding-first-course.png' },
    ];

    for (const o of onboarding) {
      await page.goto(o.path);
      await expect(page.locator(o.sel)).toBeVisible({ timeout: 20_000 });
      await snap(page, o.shot);
    }

    // App core screens
    const appScreens: Array<{ path: string; sel: string; shot: string }> = [
      { path: '/dashboard', sel: '[data-screen="dashboard"]', shot: 'dashboard.png' },
      { path: '/conversation', sel: '[data-screen="conversation"]', shot: 'conversation.png' },
      { path: '/mindmap', sel: '[data-screen="mindmap"]', shot: 'mindmap.png' },
      { path: '/marketplace/courses', sel: '[data-screen="course-marketplace"]', shot: 'marketplace-courses.png' },
      { path: '/marketplace/agents', sel: '[data-screen="agent-marketplace"]', shot: 'marketplace-agents.png' },
      { path: '/settings', sel: '[data-screen="settings"]', shot: 'settings.png' },
      { path: '/notifications', sel: '[data-screen="notifications"]', shot: 'notifications.png' },
      { path: '/pipelines', sel: '[data-screen="pipelines"]', shot: 'pipelines.png' },
    ];

    for (const s of appScreens) {
      await page.goto(s.path);
      await expect(page.locator(s.sel)).toBeVisible({ timeout: 20_000 });
      await snap(page, s.shot);
    }

    // Course + lesson screens
    await page.goto('/courses/c-1');
    await expect(page.locator('[data-screen="course-view"]')).toBeVisible({ timeout: 20_000 });
    await snap(page, 'course-view.png');

    await page.goto('/courses/c-1/lessons/l1');
    await expect(page.locator('[data-screen="lesson-reader"]')).toBeVisible({ timeout: 20_000 });
    await snap(page, 'lesson-reader.png');

    // Pipeline detail screen
    // The fixtures dev server does not seed a stable pipeline id, so create one via the API
    // to make this smoke deterministic.
    const createdRes = await page.request.post('/api/v1/pipeline', {
      data: { topic: 'Iter152 Smoke Pipeline' },
      headers: {
        // Ensure API requests from Playwright carry the same auth token as the SPA.
        authorization: `Bearer ${E2E_PRO_TOKEN}`,
      },
    });
    expect(createdRes.ok()).toBeTruthy();
    const created = await createdRes.json();
    const pipelineId = String((created as any)?.pipelineId || '').trim();
    expect(pipelineId).not.toEqual('');

    await page.goto(`/pipeline/${pipelineId}`);
    await expect(page.locator('[data-screen="pipeline-detail"]')).toBeVisible({ timeout: 60_000 });
    await snap(page, 'pipeline-detail.png');

    // Marketing site: canonical lives in apps/web on a separate port; do not test it here.
    // The client app intentionally does not mount marketing routes.
    // Keep a lightweight reachability check for the app landing instead.
    await page.goto('/');
    await expect(page.locator('text=Welcome to the LearnFlow app.')).toBeVisible({ timeout: 20_000 });
    await snap(page, 'app-landing.png');
  });
});
