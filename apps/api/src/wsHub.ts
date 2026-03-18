import type { WebSocket } from 'ws';

/**
 * Very small WS hub so non-WS modules (routes) can emit events.
 * MVP: userId -> sockets.
 */

type WsEnvelope = { event: string; data: unknown };

const socketsByUser = new Map<string, Set<WebSocket>>();

export function registerSocket(userId: string, ws: WebSocket): void {
  const set = socketsByUser.get(userId) ?? new Set<WebSocket>();
  set.add(ws);
  socketsByUser.set(userId, set);

  ws.on('close', () => {
    const cur = socketsByUser.get(userId);
    if (!cur) return;
    cur.delete(ws);
    if (cur.size === 0) socketsByUser.delete(userId);
  });
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  const set = socketsByUser.get(userId);
  if (!set) return;
  const msg = JSON.stringify({ event, data } satisfies WsEnvelope);
  for (const ws of set) {
    // ws.OPEN === 1 but avoid importing constant for simplicity
    if ((ws as any).readyState === 1) {
      try {
        (ws as any).send(msg);
      } catch {
        // ignore
      }
    }
  }
}

export function clearHubForTests(): void {
  socketsByUser.clear();
}
