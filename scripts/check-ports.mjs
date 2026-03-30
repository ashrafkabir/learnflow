#!/usr/bin/env node
import { execSync } from 'node:child_process';

const ports = [3000, 3001, 3003];

function checkPort(p) {
  try {
    const out = execSync(`ss -ltnp | grep -E ":${p}\\b" || true`, {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim();
    if (!out) return { port: p, inUse: false, lines: [] };
    return { port: p, inUse: true, lines: out.split('\n').filter(Boolean) };
  } catch {
    return { port: p, inUse: false, lines: [] };
  }
}

const results = ports.map(checkPort);
const used = results.filter((r) => r.inUse);

if (!used.length) {
  console.log(`[LearnFlow] Ports OK: ${ports.join(', ')} are free.`);
  process.exit(0);
}

console.error('[LearnFlow] Port conflict detected. LearnFlow expects stable dev ports:');
for (const r of results) {
  const status = r.inUse ? 'IN USE' : 'free';
  console.error(`- ${r.port}: ${status}`);
  if (r.inUse) {
    for (const line of r.lines.slice(0, 5)) {
      console.error(`  ${line}`);
    }
  }
}

console.error('\nFix:');
console.error('  npm run dev:clean   # safely SIGTERM known node/vite/next listeners on these ports');
console.error('  npm run dev:status  # show what is listening');
console.error('  ss -ltnp | egrep ":3000|:3001|:3003"');
console.error(
  '  kill <pid>   # OR: systemctl --user restart learnflow-api learnflow-client learnflow-web',
);

process.exit(1);
