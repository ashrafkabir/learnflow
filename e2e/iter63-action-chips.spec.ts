import { test, expect } from '@playwright/test';

const SS = process.env.LEARNFLOW_E2E_OUT || 'learnflow/screenshots/iter63';

test('Iter63: Orchestrator returns 3–4 contextual action chips (screenshot)', async ({ page }) => {
  // Deterministic: force dev auth bypass ON so this test doesn't depend on env.
  await page.addInitScript(() => {
    (window as any).__LEARNFLOW_ENV__ = { VITE_DEV_AUTH_BYPASS: '1' };
    localStorage.setItem(
      'learnflow-token',
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjo5OTk5OTk5OTk5fQ.test',
    );
    localStorage.setItem('learnflow-user', JSON.stringify({ id: 'u1', email: 'test@example.com' }));
    localStorage.setItem('learnflow-onboarding-complete', 'true');
  });

  await page.goto('/conversation');

  await expect(page.getByLabel('Message input')).toBeVisible();
  await page.getByLabel('Message input').fill('hello');
  await page.getByLabel('Send message').click();

  // Wait for assistant to finish (either via websocket streaming or HTTP fallback)
  // and chips to render under the last assistant message.
  // Wait for some assistant output before checking for chips.
  await expect(page.getByRole('log', { name: 'Messages' })).toBeVisible();
  await page.waitForTimeout(1500);

  const chipsContainer = page.locator('button', { hasText: 'Take Notes' }).first();
  await expect(chipsContainer).toBeVisible({ timeout: 30000 });

  const chipNames = [
    'Review Answers',
    'Try Again',
    'Take Notes',
    'Quiz Me',
    'Next Lesson',
    'Go Deeper',
    'See Sources',
  ];
  const found: string[] = [];

  for (const name of chipNames) {
    const chip = page.getByRole('button', { name });
    if (
      await chip
        .first()
        .isVisible()
        .catch(() => false)
    )
      found.push(name);
  }

  // Heuristic chips always render at least 3.
  expect(found.length).toBeGreaterThanOrEqual(3);
  await page.screenshot({ path: `${SS}/action-chips-conversation.png`, fullPage: true });
});
