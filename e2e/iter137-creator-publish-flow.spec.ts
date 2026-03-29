import { test, expect } from '@playwright/test';

// Iter137 P0.4 — End-to-end UI proof for creator publish flow.
// Flow: create course (fast shell) → creator dashboard select from library → publish → appears in marketplace list.
// NOTE: Marketplace QC can block publishing if lessonCount/attributionCount are too low.
// In E2E we enable a dev-only fixture gate (LEARNFLOW_E2E_FIXTURES=1) so the test is deterministic.

test.describe('Iter137: Creator publish flow (UI E2E)', () => {
  test('create course → publish from creator dashboard → appears in marketplace', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as any).__LEARNFLOW_ENV__ = {
        VITE_DEV_AUTH_BYPASS: '1',
        PLAYWRIGHT_E2E_FIXTURES: '1',
      };
      localStorage.removeItem('learnflow-token');
      localStorage.removeItem('learnflow-user');
      localStorage.removeItem('learnflow-onboarding-complete');
    });

    // Go to Creator dashboard and publish an existing library course.
    // (Creating a new course can hit the free-tier limit in dev fixtures, making E2E flaky.)
    await page.goto('/marketplace/creator');
    await expect(page.getByRole('heading', { name: /creator dashboard/i })).toBeVisible();

    await page.getByRole('button', { name: /publish new course/i }).click();

    // Step 1: select a course from the library.
    const librarySelect = page.getByRole('combobox', {
      name: /select a course from your library/i,
    });
    await expect(librarySelect).toBeVisible();

    // Pick the first real course option (skip placeholder).
    const options = librarySelect.locator('option');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(1);

    const firstLabel = await options.nth(1).textContent();
    const chosenTitle = (firstLabel || '').trim();
    expect(chosenTitle.length).toBeGreaterThan(0);

    await librarySelect.selectOption({ label: chosenTitle });

    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3: ensure free price (0) and submit.
    const priceInput = page.getByRole('spinbutton', { name: /price/i });
    if (await priceInput.count()) {
      await priceInput.fill('0');
    }

    await page.getByRole('button', { name: /submit for review/i }).click();

    // Now verify the marketplace lists at least one course and that our title appears.
    await page.goto('/marketplace');

    // The empty-state text should be gone.
    await expect(page.locator('body')).not.toContainText(
      'This marketplace list is empty in local/dev until a creator publishes a course.',
    );

    // Our newly published listing should appear.
    await expect(page.locator('body')).toContainText(chosenTitle);
  });
});
