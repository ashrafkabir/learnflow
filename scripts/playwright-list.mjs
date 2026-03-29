#!/usr/bin/env node
/**
 * Playwright list wrapper to avoid Node EPIPE crashes when output is piped.
 *
 * Problem: `npx playwright test --list | head` can crash with unhandled EPIPE
 * in Node 22+ when the consumer closes the pipe early.
 *
 * Fix: run Playwright in a child process and swallow EPIPE from stdout/stderr.
 */

import { spawn } from 'node:child_process';

function swallowEpipe(stream) {
  if (!stream) return;
  stream.on('error', (err) => {
    if (err && err.code === 'EPIPE') {
      // Downstream closed early (e.g., piped to head). Treat as success.
      process.exitCode = process.exitCode ?? 0;
      return;
    }
    throw err;
  });
}

const args = process.argv.slice(2);

const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['playwright', 'test', '--list', ...args],
  { stdio: ['inherit', 'pipe', 'pipe'] },
);

swallowEpipe(process.stdout);
swallowEpipe(process.stderr);

child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

child.on('exit', (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 1);
});
