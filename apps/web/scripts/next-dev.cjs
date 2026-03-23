#!/usr/bin/env node
/*
  Wrapper for `next dev` to reduce noisy logs under systemd when running from
  a workspace package.

  Next.js calls `npm config get registry` which fails inside a workspace package
  directory on npm (ENOWORKSPACES). We apply a shim that re-runs that command
  from the monorepo root.
*/

const path = require('node:path');

// Apply shim from the monorepo root so it computes the correct workspaceRoot.
require(path.join(process.cwd(), '../../scripts/npm-workspaces-config-shim.cjs'));

const { spawn } = require('node:child_process');

const args = ['next', 'dev', '--port', process.env.PORT || '3003'];

const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', args, {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: {
    ...process.env,
    PATH: `${path.join(process.cwd(), '../../scripts/npm-shim-bin')}:${process.env.PATH || ''}`,
  },
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error('[LearnFlow] Web dev server port already in use.');
    process.exit(1);
  }
  throw err;
});
