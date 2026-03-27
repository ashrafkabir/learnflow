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

describe('WS contract: attachments/context_overrides are accepted but ignored (Iter106)', () => {
  it('does not error when attachments/context_overrides are sent', async () => {
    const app = createApp();
    const httpServer = createServer(app);
    createWebSocketServer(httpServer);

    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const addr = httpServer.address();
    if (!addr || typeof addr === 'string') throw new Error('Expected numeric address');
    const port = addr.port;

    process.env.LEARNFLOW_DEV_AUTH = '1';
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?token=dev`);
    await waitForWsOpen(ws);

    ws.send(
      JSON.stringify({
        event: 'message',
        data: {
          text: 'Hello with attachments',
          requestId: 'ws-req-att-1',
          message_id: 'msg-att-1',
          attachments: [{ type: 'text', name: 'note.txt', content: 'hi' }],
          context_overrides: { systemPrompt: 'ignored in MVP' },
        },
      }),
    );

    const events = await collectWsEvents(ws);

    ws.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));

    const err = events.find((e) => e?.event === 'error');
    expect(err).toBeFalsy();

    const names = events.map((e) => e?.event).filter(Boolean);
    expect(names).toContain('response.start');
    expect(names).toContain('response.end');
  });
});
