import 'dotenv/config';

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
});

import http from 'http';
import { createApp } from './app.js';
import { config } from './config.js';
import { createWebSocketServer } from './websocket.js';

const app = createApp({ devMode: true });
const server = http.createServer(app);

createWebSocketServer(server);

server.listen(config.port, () => {
  console.log(`LearnFlow API running on port ${config.port}`);
});
