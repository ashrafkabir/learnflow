#!/usr/bin/env node
import { execSync } from 'node:child_process';

// Iter121 Task 10: dev stack attach mode
// This intentionally does NOT fail on port conflicts.
// It prints what is currently bound, so the user can reuse running services.

const ports = [3000, 3001, 3003, 3002];

function getListeners(p) {
  try {
    const out = execSync(`ss -ltnp | grep -E ":${p}\\b" || true`, {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim();
    return out ? out.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

console.log('[LearnFlow] dev:attach — skipping port conflict checks. Detected listeners:');
for (const p of ports) {
  const lines = getListeners(p);
  if (!lines.length) {
    console.log(`- ${p}: free`);
    continue;
  }
  console.log(`- ${p}: IN USE`);
  for (const line of lines.slice(0, 6)) console.log(`  ${line}`);
}

console.log('\n[LearnFlow] Expected dev URLs (if running):');
console.log('- API:    http://localhost:3000');
console.log('- Client: http://localhost:3001');
console.log('- Web:    http://localhost:3003');
console.log('- Yjs WS: ws://localhost:3002/yjs');
