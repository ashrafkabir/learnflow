import { test, expect } from '@playwright/test';

// Iter137 P1.6 — E2E evidence: Today’s Lessons list shows a reason tag + text.

test.describe("Iter137: Today's Lessons reasons (UI E2E)", () => {
  test("dashboard shows reason tag + reason text for today's lessons", async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__LEARNFLOW_ENV__ = {
        VITE_DEV_AUTH_BYPASS: '1',
        PLAYWRIGHT_E2E_FIXTURES: '1',
      };
      localStorage.removeItem('learnflow-token');
      localStorage.removeItem('learnflow-user');
      localStorage.removeItem('learnflow-onboarding-complete');
    });

    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: /today\s*'s lessons/i })).toBeVisible();

    const section = page.locator('section', { hasText: /today\s*'s lessons/i });
    await expect(section).toBeVisible();

    // We expect 3 lesson entry buttons (accessible name begins with the index like "1 ...").
    const lessonButtons = section.getByRole('button', { name: /^\d+\s+/ });
    await expect(lessonButtons).toHaveCount(3);

    // Reason tag pill should exist (e.g., "continue")
    await expect(
      section.locator('span').filter({ hasText: /^(continue|review|new|quiz_gap|other)$/ }),
    ).toHaveCount(3);

    // Reason text should exist.
    await expect(section).toContainText('Continue: next uncompleted lesson');
  });
});
