import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
    // IMPORTANT: This config is used by workspaces that do not have their own vitest config.
    // `setupFiles` must be an absolute path; otherwise Vitest resolves it relative to the
    // current workspace root (e.g. apps/web), which makes it look for apps/web/vitest.setup.ts.
    setupFiles: [path.resolve(__dirname, 'vitest.setup.ts')],
  },
});
