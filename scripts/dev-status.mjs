/* eslint-env node */
import { execSync } from 'node:child_process';

function safe(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString('utf8')
      .trim();
  } catch {
    return '';
  }
}

const PORTS = [
  { name: 'web', port: 3000, url: 'http://localhost:3000' },
  { name: 'client', port: 3001, url: 'http://localhost:3001' },
  { name: 'api', port: 3003, url: 'http://localhost:3003' },
];

console.log('LearnFlow dev status');
console.log('-------------------');

for (const p of PORTS) {
  const line = safe(`bash -lc "ss -ltnp '( sport = :${p.port} )' | tail -n +2"`);
  const running = Boolean(line);
  console.log(`${p.name.padEnd(7)} : ${running ? 'RUNNING' : 'STOPPED'}  ${p.url}`);
  if (running) {
    console.log(`  ${line.replace(/\s+/g, ' ')}`);
  }
}

const turbo = safe(
  `bash -lc "ps -eo pid,cmd | grep -E 'turbo run dev' | grep -v grep | head -n 5"`,
);
if (turbo) {
  console.log('\nTurbo dev processes:');
  console.log(turbo);
}
