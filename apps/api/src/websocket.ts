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
 * Create and attach a WebSocket server to the HTTP server.
 * Handles token auth via query param and streams agent lifecycle events.
 */
export function createWebSocketServer(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    // Extract token from query string
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

    // Handle incoming messages
    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString()) as WsEvent;
        handleMessage(ws, user, msg);
      } catch {
        sendEvent(ws, 'error', { message: 'Invalid JSON' });
      }
    });

    // Send connected event
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
    // Simulate orchestrator processing with agent lifecycle events
    sendEvent(ws, 'response.start', { messageId: `msg-${Date.now()}` });

    sendEvent(ws, 'agent.spawned', {
      agentId: 'orchestrator',
      agentName: 'Orchestrator Agent',
      timestamp: new Date().toISOString(),
    });

    // Stream response chunks
    const text =
      typeof msg.data === 'object' && msg.data !== null && 'text' in msg.data
        ? (msg.data as { text: string }).text
        : '';

    const chunks = [`I received: "${text}". `, 'Let me help you ', 'learn today!'];
    for (const chunk of chunks) {
      sendEvent(ws, 'response.chunk', { content: chunk });
    }

    sendEvent(ws, 'agent.complete', {
      agentId: 'orchestrator',
      agentName: 'Orchestrator Agent',
      status: 'success',
      timestamp: new Date().toISOString(),
    });

    sendEvent(ws, 'response.end', {
      messageId: `msg-${Date.now()}`,
      fullResponse: chunks.join(''),
    });
  }
}

export { WsEvent };
