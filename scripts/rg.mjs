#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const rgPath = require('@vscode/ripgrep').rgPath;

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npm run rg -- <pattern> [path ...] [rg flags ...]');
  process.exit(2);
}

const res = spawnSync(rgPath, args, { stdio: 'inherit' });
process.exit(res.status ?? 1);
