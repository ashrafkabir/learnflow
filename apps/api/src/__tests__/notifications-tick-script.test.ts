import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import path from 'node:path';

// Iter78 P0.4: cron-safe entrypoint exists.
// We don't require a running server here; script should be present and executable.

describe('Iter78 P0.4: notifications:tick script exists', () => {
  it('runs (may return 200/created=0 when server absent)', () => {
    const root = path.resolve(__dirname, '../../../..');

    // If no server, fetch will fail -> script exits non-zero.
    // So we only assert the script file is readable and node can parse it.
    const cmd = `node -c ${path.join(root, 'scripts/notifications-tick.mjs')}`;
    const out = execSync(cmd, { cwd: root }).toString();
    expect(out).toBe('');
  });
});
