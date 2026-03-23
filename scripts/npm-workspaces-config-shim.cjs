/*
  Workaround for Next.js dev on npm workspaces.

  Next.js calls `npm config get registry` to determine registry.
  `npm config` is explicitly "unaware of workspaces" and exits with ENOWORKSPACES
  when executed inside a workspace package directory.

  We intercept child_process.execSync and, for that specific command, run it from
  the workspace root (found via package-lock.json) so it succeeds.

  This is a minimal, targeted shim to prevent log spam in dev/systemd.
*/

const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function findWorkspaceRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 25; i++) {
    if (
      fs.existsSync(path.join(dir, 'package-lock.json')) &&
      fs.existsSync(path.join(dir, 'package.json'))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

const workspaceRoot = findWorkspaceRoot(process.cwd());

const origExecSync = childProcess.execSync;
childProcess.execSync = function patchedExecSync(command, options = {}) {
  if (typeof command === 'string' && /^npm\s+config\s+get\s+registry\s*$/.test(command)) {
    const merged = { ...options, cwd: workspaceRoot };
    try {
      return origExecSync.call(this, command, merged);
    } catch {
      // Fallback: default registry.
      return Buffer.from('https://registry.npmjs.org/\n', 'utf8');
    }
  }

  return origExecSync.call(this, command, options);
};

// Additionally, ensure `npm config get registry` never errors when invoked inside a workspace.
// This is intentionally limited to that command to avoid masking real npm errors.
const origSpawnSync = childProcess.spawnSync;
childProcess.spawnSync = function patchedSpawnSync(command, args, options = {}) {
  const cmd = typeof command === 'string' ? command : '';
  const joined = Array.isArray(args) ? args.join(' ') : '';
  if (cmd === 'npm' && /^config\s+get\s+registry\s*$/.test(joined.trim())) {
    const merged = { ...options, cwd: workspaceRoot };
    const res = origSpawnSync.call(this, command, args, merged);
    if (res && res.status && res.status !== 0) {
      return {
        ...res,
        status: 0,
        stdout: Buffer.from('https://registry.npmjs.org/\n', 'utf8'),
        stderr: Buffer.from('', 'utf8'),
      };
    }
    return res;
  }
  return origSpawnSync.call(this, command, args, options);
};
