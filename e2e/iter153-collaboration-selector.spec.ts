import { test, expect } from '@playwright/test';

// Reuse dev Pro token pattern (see iter152 spec).
const E2E_PRO_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1MSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJzdHVkZW50IiwidGllciI6InBybyIsImlhdCI6MTc3NDYyMDQyMSwiZXhwIjoxODA2MTU2NDIxfQ._nna6R4wrrbsT_WJO_s8khz61FLp7gkGYfQSznS1eqI';

function initClientStorage() {
  return () => {
    (window as any).__LEARNFLOW_E2E__ = true;

    localStorage.setItem('learnflow-onboarding-complete', 'true');
    localStorage.setItem('onboarding-tour-complete', 'true');

    (window as any).__LEARNFLOW_ENV__ = {
      ...((window as any).__LEARNFLOW_ENV__ || {}),
      VITE_DEV_AUTH_BYPASS: '1',
    };

    localStorage.setItem('learnflow-token', E2E_PRO_TOKEN);
    localStorage.setItem(
      'learnflow-user',
      JSON.stringify({ id: 'u1', email: 'test@example.com', tier: 'pro' }),
    );
  };
}

test('Iter153: Collaboration screen has stable selector', async ({ page }) => {
  test.setTimeout(60_000);
  await page.addInitScript(initClientStorage());

  await page.goto('/collaborate');
  await expect(page.locator('[data-screen="collaboration"]')).toBeVisible({ timeout: 20_000 });
});
