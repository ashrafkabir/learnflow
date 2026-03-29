import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: { timeout: 10000 },
  // Ensure the app+API are running for E2E; this keeps tests deterministic in CI/local.
  webServer: {
    // Client bypasses login UI; API must also allow unauthenticated calls.
    command: 'VITE_DEV_AUTH_BYPASS=1 LEARNFLOW_DEV_AUTH=1 npm run dev',
    url: 'http://127.0.0.1:3001',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  fullyParallel: false,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    // E2E routes should hit the client app (Vite) by default.
    // Note: This repo also runs a marketing Next.js app on :3003.
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3001',
    trace: 'on-first-retry',
    screenshot: 'on',
    launchOptions: {
      executablePath: '/home/aifactory/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Canonical output location for all Playwright artifacts (repo-relative, CI-safe).
  outputDir: 'learnflow/screenshots/playwright',
});
