import { describe, expect, it } from 'vitest';
import { createServer } from 'http';
import supertest from 'supertest';
import { WebSocket } from 'ws';

import { createApp } from '../app.js';
import { createWebSocketServer } from '../websocket.js';

function waitForWsOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    ws.once('open', () => resolve());
    ws.once('error', (err) => reject(err));
  });
}

function collectWsEvents(ws: WebSocket, max = 50, timeoutMs = 2500): Promise<any[]> {
  return new Promise((resolve) => {
    const events: any[] = [];

    const timer = setTimeout(() => {
      cleanup();
      resolve(events);
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      ws.removeAllListeners('message');
    }

    ws.on('message', (raw: Buffer) => {
      try {
        events.push(JSON.parse(raw.toString()));
      } catch {
        // ignore
      }
      if (events.length >= max || events.some((e) => e?.event === 'response.end')) {
        cleanup();
        resolve(events);
      }
    });
  });
}

describe('WS inbound contract (Spec §11.2) — message_id is accepted + echoed', () => {
  it('echoes client-provided message_id in response.start', async () => {
    const app = createApp();
    const httpServer = createServer(app);
    createWebSocketServer(httpServer);

    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const addr = httpServer.address();
    if (!addr || typeof addr === 'string') throw new Error('Expected numeric address');
    const port = addr.port;

    const request = supertest(`http://127.0.0.1:${port}`);
    const health = await request.get('/health');
    expect(health.status).toBe(200);

    process.env.LEARNFLOW_DEV_AUTH = '1';
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?token=dev`);
    await waitForWsOpen(ws);

    ws.send(
      JSON.stringify({
        event: 'message',
        data: { text: 'Hello', requestId: 'ws-req-2', message_id: 'msg-42' },
      }),
    );

    const events = await collectWsEvents(ws);

    ws.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));

    const start = events.find((e) => e?.event === 'response.start');
    expect(start?.data?.message_id).toBe('msg-42');
  });
});
