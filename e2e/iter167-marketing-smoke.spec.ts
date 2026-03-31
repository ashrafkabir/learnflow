import { test, expect } from '@playwright/test';

// Iter167: keep MVP marketing pages from silently breaking.
// These URLs are rendered by the Next.js marketing app, not the Vite client.
const baseWeb =
  process.env.SCREENSHOT_BASE_WEB_URL || process.env.BASE_WEB_URL || 'http://127.0.0.1:3003';

const pages: Array<{ path: string; h1: RegExp }> = [
  { path: '/', h1: /Learn Anything|LearnFlow/i },
  { path: '/features', h1: /Features/i },
  { path: '/pricing', h1: /Pricing/i },
  { path: '/download', h1: /Use LearnFlow|Download/i },
  { path: '/blog', h1: /Blog/i },
  { path: '/about', h1: /About/i },
  { path: '/docs', h1: /Docs|Documentation/i },
];

test.describe('marketing smoke (Next.js app)', () => {
  for (const p of pages) {
    test(`loads ${p.path}`, async ({ page }) => {
      await page.goto(new URL(p.path, baseWeb).toString());
      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible();
      await expect(h1).toHaveText(p.h1);
    });
  }
});
