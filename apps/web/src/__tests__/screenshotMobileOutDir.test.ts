import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { execFileSync } from 'node:child_process';

// Regression (Iter106 P2): screenshot-mobile.mjs must honor --outDir.
// Keep it lightweight: use --dryRun to avoid Playwright dependency/runtime.

describe('screenshot-mobile.mjs --outDir', () => {
  test('creates the provided outDir (dryRun)', () => {
    const repoRoot = path.resolve(__dirname, '../../../..');
    const script = path.join(repoRoot, 'screenshot-mobile.mjs');

    const outDir = path.join(repoRoot, 'artifacts/__tests__/screenshot-mobile-outdir');
    fs.rmSync(outDir, { recursive: true, force: true });

    execFileSync(process.execPath, [script, '--dryRun', '--outDir', outDir], {
      cwd: repoRoot,
      stdio: 'pipe',
      env: { ...process.env },
    });

    expect(fs.existsSync(outDir)).toBe(true);
    expect(fs.statSync(outDir).isDirectory()).toBe(true);
  });
});
