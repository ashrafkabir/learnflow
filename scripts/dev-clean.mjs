#!/usr/bin/env node
/**
 * Iter107: dev server boot reliability helper.
 *
 * Goal: prevent EADDRINUSE failures for the canonical LearnFlow dev ports.
 *
 * Ports:
 * - 3000: API
 * - 3001: Client (Vite)
 * - 3003: Web (Next)
 *
 * This script is intentionally conservative:
 * - It only targets listeners on 3000/3001/3003
 * - It only kills processes that look like Node/Next/Vite
 */

import { execSync } from 'node:child_process';

const PORTS = [3000, 3001, 3003];

function sh(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8');
}

function findListeners() {
  const out = sh('ss -ltnp');
  const lines = out.split('\n');
  const listeners = [];
  for (const line of lines) {
    for (const port of PORTS) {
      if (!line.includes(`:${port}`)) continue;
      const m = line.match(/pid=(\d+)/);
      if (!m) continue;
      const pid = Number(m[1]);
      listeners.push({ port, pid, line: line.trim() });
    }
  }
  // de-dupe
  const seen = new Set();
  return listeners.filter((l) => {
    const k = `${l.port}:${l.pid}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function pidCmd(pid) {
  try {
    return sh(`ps -p ${pid} -o cmd= --no-headers`).trim();
  } catch {
    return '';
  }
}

function looksKillable(cmd) {
  const c = cmd.toLowerCase();
  return (
    c.includes(' node ') ||
    c.startsWith('node ') ||
    c.includes('/usr/bin/node') ||
    c.includes('next-server') ||
    c.includes('next dev') ||
    c.includes('vite') ||
    c.includes('tsx') ||
    c.includes('turbo')
  );
}

const listeners = findListeners();
if (listeners.length === 0) {
  console.log('[LearnFlow] dev:clean — ports 3000/3001/3003 are already free.');
} else {
  console.log('[LearnFlow] dev:clean — found listeners:');
  for (const l of listeners) {
    const cmd = pidCmd(l.pid);
    console.log(`- :${l.port} pid=${l.pid} cmd=${cmd || '(unknown)'}`);
  }
}

const killed = [];
for (const l of listeners) {
  const cmd = pidCmd(l.pid);
  if (!cmd || !looksKillable(cmd)) {
    console.warn(
      `[LearnFlow] dev:clean — SKIP pid=${l.pid} (cmd not recognized as node/vite/next): ${cmd}`,
    );
    continue;
  }
  try {
    process.kill(l.pid, 'SIGTERM');
    killed.push(l);
  } catch (e) {
    console.warn(`[LearnFlow] dev:clean — failed to SIGTERM pid=${l.pid}: ${String(e)}`);
  }
}

// Also clean up orphaned turbo dev parent processes (common after interrupted terminals).
function findTurboDevPids() {
  let out = '';
  try {
    out = sh('ps -eo pid=,cmd=');
  } catch {
    return [];
  }
  return out
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(\d+)\s+(.*)$/);
      if (!m) return null;
      return { pid: Number(m[1]), cmd: m[2] };
    })
    .filter(Boolean)
    .filter((p) => {
      const c = p.cmd;
      // Conservative: only kill turbo dev started from this repo.
      return (
        c.includes('turbo run dev') &&
        (c.includes('/home/aifactory/.openclaw/workspace/learnflow') || c.includes('learnflow'))
      );
    });
}

const turbo = findTurboDevPids();
if (turbo.length > 0) {
  console.log('[LearnFlow] dev:clean — found leftover turbo dev processes:');
  for (const t of turbo) console.log(`- pid=${t.pid} cmd=${t.cmd}`);

  for (const t of turbo) {
    try {
      process.kill(t.pid, 'SIGTERM');
    } catch (e) {
      console.warn(`[LearnFlow] dev:clean — failed to SIGTERM pid=${t.pid}: ${String(e)}`);
    }
  }
}

if (killed.length > 0 || turbo.length > 0) {
  // Give processes a moment to exit.
  await new Promise((r) => setTimeout(r, 800));
}

const remaining = findListeners();
if (remaining.length > 0) {
  console.warn('[LearnFlow] dev:clean — some listeners remain (may require manual action):');
  for (const l of remaining) {
    const cmd = pidCmd(l.pid);
    console.warn(`- :${l.port} pid=${l.pid} cmd=${cmd || '(unknown)'}`);
  }
  process.exit(1);
}

console.log('[LearnFlow] dev:clean — ports freed.');
