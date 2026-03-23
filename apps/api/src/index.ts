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
import { attachYjsMindmapServer } from './yjsServer.js';
import { WebSocketServer } from 'ws';

const app = createApp({ devMode: config.devMode });
const server = http.createServer(app);

createWebSocketServer(server);

// Run Yjs collaboration server on a dedicated port.
// Rationale: in this repo's current stack, attempting to host a second ws path on the same HTTP server
// results in 400 Bad Request responses for non-/ws upgrade requests. A dedicated port avoids the race.
const yjsServer = http.createServer();
const yjsWss = new WebSocketServer({ server: yjsServer, path: '/yjs', perMessageDeflate: false });
attachYjsMindmapServer(yjsWss as any);

yjsServer.listen(config.yjsPort, () => {
  console.log(`LearnFlow Yjs server running on port ${config.yjsPort}`);
});

server.listen(config.port, () => {
  console.log(`LearnFlow API running on port ${config.port}`);
});
