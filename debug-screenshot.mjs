import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.goto('http://localhost:3001/dashboard', { waitUntil: 'domcontentloaded', timeout: 10000 });
await page.waitForTimeout(3000);

const content = await page.content();
console.log('Page content length:', content.length);
console.log('First 1000 chars:', content.substring(0, 1000));

const errors = [];
page.on('pageerror', err => errors.push(err.message));
page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));

await page.waitForTimeout(1000);
console.log('Errors:', errors);

await page.screenshot({ path: 'evals/screenshots/rebuild/debug-dashboard.png', fullPage: true });
const text = await page.textContent('body');
console.log('Body text:', text?.substring(0, 500));

await browser.close();
