import { chromium } from 'playwright';

const OUT_DIR = 'screenshots/iter85/run-001';

async function main() {
  const base = process.env.LEARNFLOW_BASE_URL || 'http://localhost:3010';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  // App uses dev auth bypass; go directly to settings.
  await page.goto(`${base}/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT_DIR}/p0-1-settings-byoai.png`, fullPage: true });

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
