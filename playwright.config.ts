import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 120000,
  use: {
    baseURL: 'http://localhost:3001',
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
  outputDir: '/home/aifactory/onedrive-learnflow/evals/screenshots',
  webServer: [
    {
      command: 'PORT=3002 npx tsx src/index.ts',
      cwd: './apps/api',
      port: 3002,
      reuseExistingServer: true,
      timeout: 15000,
    },
    {
      command: 'npx vite --port 3001',
      cwd: './apps/client',
      port: 3001,
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
});
