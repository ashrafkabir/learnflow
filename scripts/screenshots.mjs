/* eslint-env node */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function readArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

const base =
  readArg('base') ||
  readArg('baseUrl') ||
  process.env.SCREENSHOT_BASE_URL ||
  'http://localhost:3001';
const iter = readArg('iter') || process.env.ITERATION || process.env.ITER || 'unknown';
const outDir = readArg('outDir') || readArg('out') || `learnflow/screenshots/iter${iter}/run-001`;

const root = path.resolve(process.cwd());
const resolvedOutDir = path.resolve(root, outDir);
const desktopDir = path.resolve(resolvedOutDir, 'desktop');
const mobileDir = path.resolve(resolvedOutDir, 'mobile');

function ensureNotesTemplate() {
  try {
    fs.mkdirSync(resolvedOutDir, { recursive: true });
    const notesPath = path.join(resolvedOutDir, 'NOTES.md');
    if (!fs.existsSync(notesPath)) {
      fs.writeFileSync(
        notesPath,
        `# Screenshot Run Notes\n\n- Iteration: ${iter}\n- Date: ${new Date().toISOString().slice(0, 10)}\n- Base URL (client): ${base}\n- Base URL (marketing/web): ${
          readArg('baseWeb') || process.env.BASE_WEB_URL || process.env.SCREENSHOT_BASE_WEB_URL || 'http://localhost:3003'
        }\n\n## Captured surfaces\n\n### Desktop\n- Marketing (apps/web): /, /features, /pricing, /download, /blog, /about, /docs\n- Client public: /, /login, /register, onboarding steps 1–6\n- Client authed: /dashboard, /conversation, /mindmap, /pipelines (+ detail), /marketplace/*, /settings (+ about)\n\n### Mobile\n- Client key screens (multi-viewport)\n\n## What changed\n\n- \n\n## Known limitations\n\n- \n\n`,
        'utf8',
      );
    }
  } catch {
    // ignore
  }
}

function run(cmd, args, env = {}) {
  const res = spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, ...env },
  });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

ensureNotesTemplate();

const baseWeb =
  readArg('baseWeb') ||
  process.env.BASE_WEB_URL ||
  process.env.SCREENSHOT_BASE_WEB_URL ||
  'http://localhost:3003';

const skipMarketing =
  readArg('skipMarketing') === '1' ||
  readArg('skipMarketing') === 'true' ||
  process.env.SCREENSHOT_SKIP_MARKETING === '1' ||
  process.env.SKIP_MARKETING === '1';

// Desktop (client + marketing unless explicitly skipped)
run(
  'node',
  [
    'screenshot-all.mjs',
    desktopDir,
    '--base',
    base,
    '--baseWeb',
    baseWeb,
    '--iter',
    String(iter),
    ...(skipMarketing ? ['--skipMarketing', '1'] : []),
  ],
  {},
);

// Mobile (client only)
run('node', ['screenshot-mobile.mjs', mobileDir, '--base', base, '--iter', String(iter)]);

// CI guardrail: fail if required screenshots are missing (prevents silent evidence gaps)
const requiredDesktop = [
  // Marketing (apps/web)
  ...(skipMarketing
    ? []
    : [
        'marketing-home.png',
        'marketing-features.png',
        'marketing-pricing.png',
        'marketing-download.png',
        'marketing-blog.png',
        'marketing-about.png',
        'marketing-docs.png',
      ]),
  // Client public
  'landing-home.png',
  'auth-login.png',
  'auth-register.png',
  'onboarding-1-welcome.png',
  'onboarding-2-goals.png',
  'onboarding-3-topics.png',
  'onboarding-4-api-keys.png',
  'onboarding-5-subscription.png',
  'onboarding-6-first-course.png',
  // Client authed
  'app-dashboard.png',
  'app-conversation.png',
  'app-mindmap.png',
  'app-pipelines.png',
  'pipeline-detail.png',
  'lesson-reader.png',
  'marketplace-courses.png',
  'marketplace-agents.png',
  'marketplace-creator-dashboard.png',
  'app-settings.png',
  'settings-about-mvp-truth.png',
];

const missing = requiredDesktop.filter((f) => !fs.existsSync(path.join(desktopDir, f)));
if (missing.length) {
  console.error('\n[screenshots] Missing required desktop screenshots:');
  for (const f of missing) console.error(`- ${f}`);
  process.exit(2);
}

console.log(`Done! Saved desktop+mobile to ${path.resolve(outDir)}`);
