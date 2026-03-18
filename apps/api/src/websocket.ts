import { Server as HttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import type { AuthUser } from './middleware.js';
import { URL } from 'url';

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

    let user: AuthUser;
    try {
      user = jwt.verify(token, config.jwtSecret) as AuthUser;
    } catch {
      ws.close(4001, 'Invalid token');
      return;
    }

    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString()) as WsEvent;
        handleMessage(ws, user, msg);
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

function handleMessage(ws: WebSocket, user: AuthUser, msg: WsEvent): void {
  if (msg.event === 'message') {
    const messageId = `msg-${Date.now()}`;
    const text =
      typeof msg.data === 'object' && msg.data !== null && 'text' in msg.data
        ? (msg.data as { text: string }).text
        : '';

    // §11.2: response.start — { message_id, agent_name }
    sendEvent(ws, 'response.start', {
      message_id: messageId,
      agent_name: 'orchestrator',
    });

    // §11.2: agent.spawned — { agent_name, task_summary }
    sendEvent(ws, 'agent.spawned', {
      agent_name: 'Orchestrator Agent',
      task_summary: `Processing: "${text.slice(0, 100)}"`,
    });

    // §11.2: response.chunk — { message_id, content_delta, type }
    const chunks = [`I received: "${text}". `, 'Let me help you ', 'learn today!'];
    for (const chunk of chunks) {
      sendEvent(ws, 'response.chunk', {
        message_id: messageId,
        content_delta: chunk,
        type: 'text',
      });
    }

    // §11.2: agent.complete — { agent_name, result_summary }
    sendEvent(ws, 'agent.complete', {
      agent_name: 'Orchestrator Agent',
      result_summary: 'Response generated successfully',
    });

    // §11.2: progress.update — { user_id, metric, value }
    sendEvent(ws, 'progress.update', {
      user_id: user.sub,
      metric: 'messages_sent',
      value: 1,
    });

    // §11.2: response.end — { message_id, actions[], sources[] }
    sendEvent(ws, 'response.end', {
      message_id: messageId,
      actions: [
        { type: 'take_notes', label: 'Take Notes' },
        { type: 'quiz_me', label: 'Quiz Me' },
        { type: 'go_deeper', label: 'Go Deeper' },
      ],
      sources: [],
    });
  }

  if (msg.event === 'mindmap.subscribe') {
    // §11.2: mindmap.update — { nodes_added[], nodes_updated[], edges_added[] }
    sendEvent(ws, 'mindmap.update', {
      nodes_added: [],
      nodes_updated: [],
      edges_added: [],
    });
  }
}

export { WsEvent };
