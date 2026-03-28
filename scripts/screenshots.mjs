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
        `# Screenshot Run Notes\n\n- Iteration: ${iter}\n- Date: ${new Date().toISOString().slice(0, 10)}\n- Base URL: ${base}\n\n## What changed\n\n- \n\n## Known limitations\n\n- \n\n`,
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

// Desktop
run('node', ['screenshot-all.mjs', desktopDir, '--base', base, '--iter', String(iter)]);
// Mobile
run('node', ['screenshot-mobile.mjs', mobileDir, '--base', base]);

console.log(`Done! Saved desktop+mobile to ${path.resolve(outDir)}`);
