import { test, expect } from '@playwright/test';

// Evidence spec: mindmap legend text is present and stable.
// NOTE: vis-network renders to canvas; we validate legend DOM.

test('Iter138: Mindmap shows mastery legend (New/Learning/Solid/Mastered) and review due affordance', async ({
  page,
  baseURL,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('learnflow-token', 'dev');
    localStorage.setItem('learnflow-onboarding-complete', 'true');
  });

  await page.goto(`${baseURL}/mindmap?courseId=shared-course-${Date.now()}`, {
    waitUntil: 'domcontentloaded',
  });

  await expect(page.locator('[data-screen="mindmap"]')).toBeVisible();

  // Legend content
  const legend = page.getByText('Mastery Legend').locator('..');
  await expect(page.getByText('Mastery Legend')).toBeVisible();
  await expect(legend.getByText('New')).toBeVisible();
  await expect(legend.getByText('Learning')).toBeVisible();
  await expect(legend.getByText('Solid')).toBeVisible();
  await expect(legend.getByText('Mastered')).toBeVisible();
  await expect(legend.getByText(/review due/i)).toBeVisible();

  await page.screenshot({
    path: `e2e/screenshots/iter138-mindmap-mastery-legend.png`,
    fullPage: true,
  });
});
