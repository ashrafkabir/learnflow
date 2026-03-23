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
  const wss = new WebSocketServer({ server, path: '/ws', perMessageDeflate: false });

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
        sendWsError(ws, `ws-${Date.now()}`, {
          code: 'invalid_json',
          message: 'Invalid JSON',
        });
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

function sendWsError(
  ws: WebSocket,
  requestId: string,
  params: { code: string; message: string; details?: unknown; message_id?: string },
): void {
  sendEvent(ws, 'error', {
    error: {
      code: params.code,
      message: params.message,
      ...(params.details !== undefined ? { details: params.details } : {}),
    },
    requestId,
    ...(params.message_id ? { message_id: params.message_id } : {}),
  });
}

async function handleMessage(ws: WebSocket, user: AuthUser, msg: WsEvent): Promise<void> {
  if (msg.event === 'message') {
    const { handleWsMessage } = await import('./wsOrchestrator.js');
    await handleWsMessage(ws, user, msg as any);
    return;
  }

  if (msg.event === 'mindmap.subscribe') {
    // Dual-purpose event:
    // - Spec §11.2 expects { nodes_added[], edges_added[] }
    // - Client Iter38+ expects { courseId?, suggestions[] } for dashed/dimmed expansion nodes.
    // Iter39: suggestions should be timely and derived from web search signals.

    const courseId = (msg as any)?.data?.courseId || null;
    const lessonId = (msg as any)?.data?.lessonId || null;

    // Seed topic: if client provides seedTopic use it; else prefer course title; else lesson id fallback.
    const seedTopic = String((msg as any)?.data?.seedTopic || '').trim();
    let topic = seedTopic;

    try {
      if (!topic && courseId) {
        const { dbCourses } = await import('./db.js');
        const course = dbCourses.getById(String(courseId));
        if (course?.title) topic = String(course.title);
        else if (course?.topic) topic = String(course.topic);
      }
    } catch {
      // ignore
    }

    if (!topic) topic = lessonId ? `Lesson ${lessonId}` : 'Learning';

    let suggestions: Array<{
      id: string;
      label: string;
      parentLessonId?: string;
      reason?: string;
    }> = [];

    try {
      const mod = await import('@learnflow/agents');
      const result = await mod.generateSuggestedMindmapNodes(topic, { max: 5 });
      suggestions = (result.suggestions || []).map((s: any) => ({
        id: s.id,
        label: s.label,
        parentLessonId: lessonId || undefined,
        reason: s.reason,
      }));
    } catch {
      // very small fallback
      suggestions = [
        { id: `sug-${Date.now()}-0`, label: `${topic}: 2025–2026 trends` },
        { id: `sug-${Date.now()}-1`, label: `${topic}: common pitfalls` },
        { id: `sug-${Date.now()}-2`, label: `${topic}: real-world case studies` },
      ].map((s) => ({ ...s, parentLessonId: lessonId || undefined }));
    }

    sendEvent(ws, 'mindmap.update', {
      courseId,
      suggestions,
      nodes_added: [],
      edges_added: [],
    });
  }
}

export { WsEvent };
