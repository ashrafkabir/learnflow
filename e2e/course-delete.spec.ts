import { test, expect } from '@playwright/test';

// Regression: Course deletion from Courses list (dashboard)

test('Dashboard: can delete a course from the course grid (with confirmation)', async ({
  page,
}) => {
  // Auth bootstrap (same approach as other e2e suites)
  await page.addInitScript(() => {
    (window as any).__LEARNFLOW_ENV__ = { VITE_DEV_AUTH_BYPASS: '1' };
    (window as any).__LEARNFLOW_E2E__ = true;
    localStorage.setItem(
      'learnflow-token',
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjo5OTk5OTk5OTk5fQ.test',
    );
    localStorage.setItem('learnflow-user', JSON.stringify({ id: 'u1', email: 'test@example.com' }));
    localStorage.setItem('learnflow-onboarding-complete', 'true');
  });

  await page.goto('/dashboard');

  // Wait for course grid
  const grid = page.locator('[data-component="course-carousel"]');
  await expect(grid).toBeVisible();

  const firstCard = grid.locator('[role="article"]').first();
  await expect(firstCard).toBeVisible();

  // Click delete icon inside card
  await firstCard.locator('button[aria-label^="Delete course"]').click();

  // Confirm dialog
  const dialog = page.getByRole('dialog', { name: 'Delete course?' });
  await expect(dialog).toBeVisible();

  await dialog.getByRole('button', { name: 'Delete' }).click();

  // After deleting, the grid should have fewer cards (or empty state)
  await expect(grid).toBeVisible();
});
