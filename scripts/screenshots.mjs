/* eslint-env node */
import { spawnSync } from 'node:child_process';
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
const desktopDir = path.resolve(root, outDir, 'desktop');
const mobileDir = path.resolve(root, outDir, 'mobile');

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

// Desktop
run('node', ['screenshot-all.mjs', desktopDir, '--base', base, '--iter', String(iter)]);
// Mobile
run('node', ['screenshot-mobile.mjs', mobileDir, '--base', base]);

console.log(`Done! Saved desktop+mobile to ${path.resolve(outDir)}`);
