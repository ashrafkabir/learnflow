#!/usr/bin/env node
/*
  Shim for `npm` that automatically adds `--workspaces=false` for `npm config`.

  Why:
  - `npm config` is "unaware of workspaces" and errors with ENOWORKSPACES when
    executed inside a workspace package.
  - Next.js runs `npm config get registry` at dev startup which causes noisy logs.

  This wrapper preserves all args and only modifies `npm config` invocations.
*/

const { spawn } = require('node:child_process');

const argv = process.argv.slice(2);

let finalArgs = argv;
if (
  argv[0] === 'config' &&
  !argv.includes('--workspaces=false') &&
  !argv.includes('--no-workspaces')
) {
  finalArgs = [...argv, '--workspaces=false'];
}

const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', finalArgs, {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 0));
