import { test, expect } from '@playwright/test';

// Iter156 P0: Spec §6.1.1 UI guard — no Firecrawl/Tavily copy in onboarding + settings.
// No screenshots required.

test.describe('Iter156: no Firecrawl/Tavily text in UI', () => {
  test('onboarding api keys + settings contain no Firecrawl/Tavily text', async ({
    page,
    baseURL,
  }) => {
    await page.addInitScript(() => {
      (window as any).__LEARNFLOW_ENV__ = {
        ...(window as any).__LEARNFLOW_ENV__,
        VITE_DEV_AUTH_BYPASS: '1',
      };
      (window as any).__LEARNFLOW_E2E__ = true;
      localStorage.setItem('learnflow-onboarding-complete', 'false');
      localStorage.setItem('onboarding-tour-complete', 'true');
    });

    // Onboarding
    await page.goto(`${baseURL}/onboarding/api-keys`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-screen="onboarding-apikeys"]').first()).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText(/Firecrawl|Tavily/i)).toHaveCount(0);

    // Settings
    await page.goto(`${baseURL}/settings`, { waitUntil: 'domcontentloaded' });
    // Settings page uses a region label rather than data-screen.
    await expect(page.getByRole('region', { name: 'Profile Settings' })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText(/Firecrawl|Tavily/i)).toHaveCount(0);
  });
});
