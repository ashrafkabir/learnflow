import { Server as HttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import type { AuthUser } from './middleware.js';
import { URL } from 'url';
import { registerSocket } from './wsHub.js';
import { createRequestId } from './errors.js';
import { rateLimitKeyFromReq, takeRateLimit } from './rateLimit.js';

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
    // Iter86: require explicit opt-in to avoid accidental real builds during harness runs.
    // In production, a real JWT is always required.
    let user: AuthUser;
    if (
      token === 'dev' &&
      process.env.NODE_ENV !== 'production' &&
      (process.env.LEARNFLOW_DEV_AUTH === '1' || process.env.LEARNFLOW_DEV_AUTH === 'true')
    ) {
      user = { sub: 'dev-user', email: 'dev@learnflow.local', tier: 'free' } as AuthUser;
      (user as any).origin = 'harness';
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
      // WS-07 parity: Apply tiered rate limiting to inbound messages (best-effort).
      const devMode = process.env.NODE_ENV !== 'production' && config.devMode;
      const tier = (user as any)?.tier === 'pro' ? 'pro' : 'free';
      const ip =
        String((req.headers['x-forwarded-for'] as any) || '')
          ?.split(',')?.[0]
          ?.trim() ||
        req.socket.remoteAddress ||
        'unknown';
      const key = rateLimitKeyFromReq({ ip, user });

      // Parse first so we can respect a client-provided requestId for correlation.
      let msg: WsEvent | null = null;
      try {
        msg = JSON.parse(raw.toString()) as WsEvent;
      } catch {
        sendWsError(ws, createRequestId(), {
          code: 'invalid_json',
          message: 'Invalid JSON',
        });
        return;
      }

      const event = String((msg as any)?.event || '').trim();
      if (!event) {
        sendWsError(ws, createRequestId(), {
          code: 'invalid_request',
          message: 'Missing event',
        });
        return;
      }

      const clientRequestId = (msg as any)?.data?.requestId;
      const requestId = (clientRequestId && String(clientRequestId).trim()) || createRequestId();

      // Minimal request validation (Iter89): avoid silent no-ops and give clients a stable error shape.
      if (event === 'message') {
        const text = (msg as any)?.data?.text;
        if (typeof text !== 'string' || text.trim().length === 0) {
          sendWsError(ws, requestId, {
            code: 'invalid_request',
            message: 'Missing required field: data.text',
            details: {
              issues: [{ path: ['data', 'text'], message: 'Required string' }],
            },
            message_id: (msg as any)?.data?.message_id,
          });
          return;
        }
      }

      const take = takeRateLimit({ key, tier, devMode });
      if (!take.ok) {
        sendWsError(ws, requestId, {
          code: 'rate_limit_exceeded',
          message: `Rate limit of ${take.limit} requests per minute exceeded for ${tier} tier. Try again in ~${take.retryAfterSeconds}s.`,
          details: {
            tier,
            limitPerMinute: take.limit,
            retryAfterSeconds: take.retryAfterSeconds,
          },
          message_id: (msg as any)?.data?.message_id,
        });
        return;
      }

      void handleMessage(ws, user, msg);
    });

    sendEvent(ws, 'connected', { userId: user.sub });

    // Tell clients what this server expects for inbound envelopes.
    // Keeping it explicit helps avoid silent drift across iterations.
    sendEvent(ws, 'ws.contract', {
      inbound: {
        message: {
          required: ['text'],
          optional: ['requestId', 'message_id', 'courseId', 'lessonId'],
        },
      },
    });
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
