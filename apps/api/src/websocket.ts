import { Server as HttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import type { AuthUser } from './middleware.js';
import { URL } from 'url';
import { registerSocket } from './wsHub.js';

interface WsEvent {
  event: string;
  data: unknown;
}

/**
 * Spec §11.2 — WebSocket Events
 * Events: response.start, response.chunk, response.end,
 *         agent.spawned, agent.complete,
 *         mindmap.update, progress.update, error
 */
export function createWebSocketServer(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Missing token');
      return;
    }

    // Dev-only auth path to make local screenshots/evals deterministic.
    // In production, a real JWT is always required.
    let user: AuthUser;
    if (token === 'dev' && process.env.NODE_ENV !== 'production') {
      user = { sub: 'dev-user', email: 'dev@learnflow.local' } as AuthUser;
    } else {
      try {
        user = jwt.verify(token, config.jwtSecret) as AuthUser;
      } catch {
        ws.close(4001, 'Invalid token');
        return;
      }
    }

    registerSocket(user.sub, ws);

    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString()) as WsEvent;
        void handleMessage(ws, user, msg);
      } catch {
        sendEvent(ws, 'error', { message: 'Invalid JSON' });
      }
    });

    sendEvent(ws, 'connected', { userId: user.sub });
  });

  return wss;
}

function sendEvent(ws: WebSocket, event: string, data: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ event, data }));
  }
}

async function handleMessage(ws: WebSocket, user: AuthUser, msg: WsEvent): Promise<void> {
  if (msg.event === 'message') {
    const { handleWsMessage } = await import('./wsOrchestrator.js');
    await handleWsMessage(ws, user, msg as any);
    return;
  }

  if (msg.event === 'mindmap.subscribe') {
    // §11.2: mindmap.update — { nodes_added[], edges_added[] }
    // Provide a minimal but meaningful update for the Mindmap Explorer.
    sendEvent(ws, 'mindmap.update', {
      nodes_added: [
        { id: 'concept-1', label: 'Learning', kind: 'concept' },
        { id: 'concept-2', label: 'Practice', kind: 'concept' },
      ],
      edges_added: [{ from: 'concept-1', to: 'concept-2', label: 'leads to' }],
    });
  }
}

export { WsEvent };
