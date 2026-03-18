import { chromium } from 'playwright';
const browser = await chromium.launch();
const DIR = 'evals/screenshots/iter14';

async function shot(page, url, name) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
  const text = (await page.textContent('body'))?.substring(0, 300) || '(empty)';
  console.log(`✓ ${name}: ${text.replace(/\s+/g, ' ').substring(0, 120)}`);
}

// Desktop
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const p = await ctx.newPage();

await shot(p, 'http://127.0.0.1:3001/', '01-home');
await shot(p, 'http://127.0.0.1:3001/login', '02-login');
await shot(p, 'http://127.0.0.1:3001/register', '03-register');
await shot(p, 'http://127.0.0.1:3001/features', '04-features');
await shot(p, 'http://127.0.0.1:3001/pricing', '05-pricing');

// Auth
await p.evaluate(() => {
  localStorage.setItem('learnflow-token', 'demo-token');
  localStorage.setItem('learnflow-onboarding-complete', 'true');
});

await shot(p, 'http://127.0.0.1:3001/dashboard', '06-dashboard');
await shot(p, 'http://127.0.0.1:3001/conversation', '07-conversation');
await shot(p, 'http://127.0.0.1:3001/marketplace', '08-marketplace');
await shot(p, 'http://127.0.0.1:3001/marketplace/agents', '09-agents');
await shot(p, 'http://127.0.0.1:3001/settings', '10-settings');
await shot(p, 'http://127.0.0.1:3001/mindmap', '11-mindmap');

// Onboarding
await p.evaluate(() => localStorage.removeItem('learnflow-onboarding-complete'));
await shot(p, 'http://127.0.0.1:3001/onboarding/welcome', '12-onboard-welcome');
await shot(p, 'http://127.0.0.1:3001/onboarding/goals', '13-onboard-goals');
await shot(p, 'http://127.0.0.1:3001/onboarding/topics', '14-onboard-topics');

// Mobile
const mCtx = await browser.newContext({ viewport: { width: 375, height: 812 } });
const m = await mCtx.newPage();
await m.evaluate(() => {
  localStorage.setItem('learnflow-token', 'demo-token');
  localStorage.setItem('learnflow-onboarding-complete', 'true');
});
await shot(m, 'http://127.0.0.1:3001/', '15-mobile-home');
await shot(m, 'http://127.0.0.1:3001/dashboard', '16-mobile-dashboard');
await shot(m, 'http://127.0.0.1:3001/marketplace', '17-mobile-marketplace');
await shot(m, 'http://127.0.0.1:3001/conversation', '18-mobile-conversation');

await browser.close();
console.log('ALL DONE');
