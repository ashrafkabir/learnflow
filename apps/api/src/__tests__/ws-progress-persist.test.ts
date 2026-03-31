import { describe, expect, it } from 'vitest';
import { createServer } from 'http';
import { WebSocket } from 'ws';

import { createApp } from '../app.js';
import { createWebSocketServer } from '../websocket.js';
import { dbProgress } from '../db.js';

function waitForWsOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    ws.once('open', () => resolve());
    ws.once('error', (err) => reject(err));
  });
}

function collectWsEvents(ws: WebSocket, max = 20, timeoutMs = 1200): Promise<any[]> {
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

describe('Iter163: WS progress.persist persists completion', () => {
  it('marks lesson complete + emits progress.update', async () => {
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

    ws.send(JSON.stringify({ event: 'progress.persist', data: { courseId: 'c-1', lessonId: 'l-1' } }));

    const events = await collectWsEvents(ws, 25, 1200);

    ws.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));

    const completed = dbProgress.getCompletedLessons('dev-user', 'c-1');
    expect(completed).toContain('l-1');

    const upd = events.find((e) => e?.event === 'progress.update');
    expect(upd).toBeTruthy();
    expect(upd.data?.course_id).toBe('c-1');
    expect(upd.data?.lesson_id).toBe('l-1');
  });
});
