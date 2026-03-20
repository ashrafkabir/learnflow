import { test, expect } from '@playwright/test';

/**
 * Iter49 P0-2: Fix learning journey E2E to reflect actual UI and avoid false failures.
 *
 * Goals screen requires entering a goal before the Add button enables.
 * Also, the onboarding flow currently does not include an "experience" step.
 *
 * This suite is intentionally "local-dev safe": it does not require network/LLM calls.
 */

test.describe('LearnFlow Learning Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__LEARNFLOW_ENV__ = { VITE_DEV_AUTH_BYPASS: '1' };
      localStorage.removeItem('learnflow-token');
      localStorage.removeItem('learnflow-user');
      localStorage.removeItem('learnflow-onboarding-complete');
    });
  });

  test('Test 1: Onboarding flow completes (welcome → goals → topics → api keys → subscription → first course)', async ({
    page,
  }) => {
    // 1) Navigate to /onboarding — should redirect to /onboarding/welcome
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/onboarding\/welcome/);
    await expect(page.locator('[data-screen="onboarding-welcome"]')).toBeVisible();
    await page.screenshot({
      path: 'evals/screenshots/learning-journey-01-welcome.png',
      fullPage: true,
    });

    // 2) Click Get Started
    await page.getByRole('button', { name: /get started/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/goals/);
    await expect(page.locator('[data-screen="onboarding-goals"]')).toBeVisible();
    await page.screenshot({
      path: 'evals/screenshots/learning-journey-02-goals.png',
      fullPage: true,
    });

    // 3) Add a goal via input (button is disabled until text entered)
    const goalInput = page.locator('[data-screen="onboarding-goals"] input').first();
    await goalInput.fill('Become better at system design');

    // Prefer an explicit Add button; fall back to the first enabled button in the goals screen.
    const addButton = page
      .locator('[data-screen="onboarding-goals"] button', { hasText: /add/i })
      .first();
    if (await addButton.isVisible()) {
      await addButton.click();
    } else {
      await page.locator('[data-screen="onboarding-goals"] button:enabled').first().click();
    }

    // Continue
    await page.getByRole('button', { name: /continue|next/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/topics/);
    await expect(page.locator('[data-screen="onboarding-topics"]')).toBeVisible();
    await page.screenshot({
      path: 'evals/screenshots/learning-journey-03-topics.png',
      fullPage: true,
    });

    // 4) Select a topic and continue
    await page.locator('[data-screen="onboarding-topics"] button:enabled').first().click();
    await page.getByRole('button', { name: /continue|next/i }).click();

    await expect(page).toHaveURL(/\/onboarding\/api-keys/);
    await expect(page.locator('[data-screen="onboarding-apikeys"]')).toBeVisible();
    await page.screenshot({
      path: 'evals/screenshots/learning-journey-04-apikeys.png',
      fullPage: true,
    });

    // 5) Continue past API keys (no requirement to enter keys for local dev)
    await page.getByRole('button', { name: /continue|next|skip/i }).click();

    await expect(page).toHaveURL(/\/onboarding\/subscription/);
    await expect(page.locator('[data-screen="onboarding-subscription"]')).toBeVisible();
    await page.screenshot({
      path: 'evals/screenshots/learning-journey-05-subscription.png',
      fullPage: true,
    });

    // 6) Choose a tier if needed, then continue
    const tierButtons = page.locator('[data-screen="onboarding-subscription"] button:enabled');
    if ((await tierButtons.count()) > 0) {
      await tierButtons.first().click();
    }
    await page.getByRole('button', { name: /continue|next/i }).click();

    // Current implementation routes to /onboarding/ready ("You're All Set") rather than a first-course builder step.
    await expect(page).toHaveURL(/\/onboarding\/(ready|first-course)/);

    const readyScreen = page.locator('[data-screen="onboarding-ready"]');
    const firstCourseScreen = page.locator('[data-screen="onboarding-first-course"]');
    await expect(readyScreen.or(firstCourseScreen)).toBeVisible();

    await page.screenshot({
      path: 'evals/screenshots/learning-journey-06-ready-or-first-course.png',
      fullPage: true,
    });

    // Finish by going to dashboard
    await page.getByRole('button', { name: /go to dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('[data-screen="dashboard"]')).toBeVisible();
    await page.screenshot({
      path: 'evals/screenshots/learning-journey-07-dashboard-after-onboarding.png',
      fullPage: true,
    });
  });

  test('Test 2: Core routes are accessible in dev bypass mode', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('[data-screen="dashboard"]')).toBeVisible();
    await page.screenshot({
      path: 'evals/screenshots/learning-journey-07-dashboard.png',
      fullPage: true,
    });

    await page.goto('/settings');
    await expect(page.locator('[data-screen="settings"]')).toBeVisible();
    await page.screenshot({
      path: 'evals/screenshots/learning-journey-08-settings.png',
      fullPage: true,
    });

    await page.goto('/conversation');
    await expect(page.locator('[data-screen="conversation"]')).toBeVisible();
    await page.screenshot({
      path: 'evals/screenshots/learning-journey-09-conversation.png',
      fullPage: true,
    });
  });
});
