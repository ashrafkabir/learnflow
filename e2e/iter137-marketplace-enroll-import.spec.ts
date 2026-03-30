import { test, expect } from '@playwright/test';

// Iter137 P1.9 — Marketplace enroll should import into user's library and be visible on dashboard.

test.describe('Iter137: Marketplace enroll import (UI E2E)', () => {
  test('browse → detail → enroll → dashboard shows imported course', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__LEARNFLOW_ENV__ = {
        VITE_DEV_AUTH_BYPASS: '1',
        PLAYWRIGHT_E2E_FIXTURES: '1',
      };
      localStorage.removeItem('learnflow-token');
      localStorage.removeItem('learnflow-user');
      localStorage.removeItem('learnflow-onboarding-complete');
    });

    // Ensure there is at least one marketplace course by publishing via creator UI.
    await page.goto('/marketplace/creator');
    await expect(page.getByRole('heading', { name: /creator dashboard/i })).toBeVisible();

    await page.getByRole('button', { name: /publish new course/i }).click();

    const librarySelect = page.getByRole('combobox', {
      name: /select a course from your library/i,
    });
    await expect(librarySelect).toBeVisible();

    const options = librarySelect.locator('option');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(1);

    const chosenTitle = ((await options.nth(1).textContent()) || '').trim();
    expect(chosenTitle.length).toBeGreaterThan(0);
    await librarySelect.selectOption({ label: chosenTitle });

    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /next/i }).click();

    const priceInput = page.getByRole('spinbutton', { name: /price/i });
    if (await priceInput.count()) await priceInput.fill('0');

    await page.getByRole('button', { name: /submit for review/i }).click();

    // Browse marketplace and open detail.
    await page.goto('/marketplace');
    await expect(page.locator('body')).toContainText(chosenTitle);

    // Click the card (role=article) to enter detail page.
    await page.getByRole('article', { name: chosenTitle }).first().click();

    // Enroll
    const enrollBtn = page.getByRole('button', { name: /enroll/i }).first();
    await expect(enrollBtn).toBeVisible();
    await enrollBtn.click();

    // Enrollment navigates to dashboard; imported course should appear.
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('body')).toContainText(chosenTitle);
  });
});
