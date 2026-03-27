import { describe, expect, it } from 'vitest';
import { createServer } from 'http';
import { WebSocket } from 'ws';

import { createApp } from '../app.js';
import { createWebSocketServer } from '../websocket.js';

function waitForWsOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    ws.once('open', () => resolve());
    ws.once('error', (err) => reject(err));
  });
}

describe('WS idempotency (end exactly once per message_id)', () => {
  it('resending same message_id emits duplicate_message error and does not emit second response.end', async () => {
    process.env.LEARNFLOW_DEV_AUTH = '1';

    const app = createApp();
    const httpServer = createServer(app);
    createWebSocketServer(httpServer);

    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const addr = httpServer.address();
    if (!addr || typeof addr === 'string') throw new Error('Expected numeric address');
    const port = addr.port;
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?token=dev`);
    await waitForWsOpen(ws);

    const payload = {
      event: 'message',
      data: { text: 'Hello', requestId: 'ws-req-dup-1', message_id: 'dup-msg-1' },
    };

    const events: any[] = [];
    ws.on('message', (raw: Buffer) => {
      try {
        events.push(JSON.parse(raw.toString()));
      } catch {
        // ignore
      }
    });

    ws.send(JSON.stringify(payload));
    // give server a moment to process, then resend
    await new Promise((r) => setTimeout(r, 250));
    ws.send(JSON.stringify(payload));

    await new Promise((r) => setTimeout(r, 1500));
    ws.close();

    // allow close to flush
    await new Promise((r) => setTimeout(r, 100));

    await new Promise<void>((resolve) => httpServer.close(() => resolve()));

    const ends = events.filter(
      (e) => e?.event === 'response.end' && e?.data?.message_id === 'dup-msg-1',
    );
    expect(ends.length).toBe(1);

    const dupErr = events.find(
      (e) => e?.event === 'error' && e?.data?.error?.code === 'duplicate_message',
    );
    expect(dupErr).toBeTruthy();
  });
});
