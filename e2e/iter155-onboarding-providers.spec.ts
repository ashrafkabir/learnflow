import { test, expect } from '@playwright/test';

// Iter155 P0: Guard that onboarding providers list remains spec-aligned (no Tavily/Firecrawl).
// No screenshots required.

test.describe('Iter155: onboarding provider options', () => {
  test('provider select options match MVP list', async ({ page, baseURL }) => {
    await page.addInitScript(() => {
      (window as any).__LEARNFLOW_ENV__ = {
        ...(window as any).__LEARNFLOW_ENV__,
        VITE_DEV_AUTH_BYPASS: '1',
      };
      (window as any).__LEARNFLOW_E2E__ = true;
      localStorage.setItem('learnflow-onboarding-complete', 'false');
      localStorage.setItem('onboarding-tour-complete', 'true');
    });

    await page.goto(`${baseURL}/onboarding/api-keys`, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('[data-screen="onboarding-apikeys"]').first()).toBeVisible({ timeout: 60_000 });

    const providerSelect = page.locator('select').first();
    await expect(providerSelect).toBeVisible();

    const values = await providerSelect.locator('option').evaluateAll((opts) =>
      opts.map((o) => (o as HTMLOptionElement).value),
    );

    expect(values).toEqual(['openai', 'anthropic', 'google', 'mistral', 'groq', 'ollama']);
  });
});
