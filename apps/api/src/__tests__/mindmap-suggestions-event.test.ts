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

function collectWsEvents(ws: WebSocket, max = 50, timeoutMs = 2000): Promise<any[]> {
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
      if (events.length >= max) {
        cleanup();
        resolve(events);
      }
    });
  });
}

describe('Iter163: mindmap suggestions event semantics', () => {
  it('mindmap.subscribe emits mindmap.suggestions (not mindmap.update)', async () => {
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
        event: 'mindmap.subscribe',
        data: { courseId: 'c-1', lessonId: 'l-1', seedTopic: 'Test Topic' },
      }),
    );

    const events = await collectWsEvents(ws, 25, 1500);

    ws.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));

    const names = events.map((e) => e?.event).filter(Boolean);
    expect(names).toContain('mindmap.suggestions');

    const sug = events.find((e) => e?.event === 'mindmap.suggestions');
    expect(String(sug?.data?.courseId)).toBe('c-1');
    expect(Array.isArray(sug?.data?.suggestions)).toBe(true);
    // Back-compat: server should no longer emit mindmap.update for suggestions payloads.
    expect(names).not.toContain('mindmap.update');
  });
});
