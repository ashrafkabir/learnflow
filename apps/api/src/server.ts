/**
 * LEGACY ENTRYPOINT (do not use)
 *
 * LearnFlow’s canonical API entrypoint is `src/index.ts`.
 * It enforces the repo’s stable dev port contract (API 3000) and config/devMode rules.
 *
 * This file is kept only to avoid breaking any external/local scripts that might still
 * import it. If you are wiring a new environment, use `src/index.ts`.
 */

import 'dotenv/config';
import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp({ devMode: config.devMode });

app.listen(config.port, '0.0.0.0', () => {
  console.log(`LearnFlow API (legacy server.ts) running on http://0.0.0.0:${config.port}`);
});
