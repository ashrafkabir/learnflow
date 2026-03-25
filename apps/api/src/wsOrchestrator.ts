import type { AuthUser } from './middleware.js';
import type { WebSocket } from 'ws';
import { courses } from './routes/courses.js';

import {
  buildStudentContext,
  getOrchestrator,
  mapActions,
  makeSourcesFromLesson,
} from './orchestratorShared.js';
import { db } from './db.js';
import { createRequestId } from './errors.js';

/**
 * Shared WS orchestrator.
 *
 * Iteration 32: route WS chat messages through the real Core Orchestrator + AgentRegistry
 * (instead of hand-authored streaming).
 */

type WsEnvelope = { event: string; data: unknown };

function safeSend(ws: WebSocket, msg: WsEnvelope): void {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}

function send(ws: WebSocket, event: string, data: unknown): void {
  safeSend(ws, { event, data });
}

function sendWsError(
  ws: WebSocket,
  requestId: string,
  params: { code: string; message: string; details?: unknown; message_id?: string },
): void {
  send(ws, 'error', {
    error: {
      code: params.code,
      message: params.message,
      ...(params.details !== undefined ? { details: params.details } : {}),
    },
    requestId,
    ...(params.message_id ? { message_id: params.message_id } : {}),
  });
}

function findLesson(lessonId?: string) {
  if (!lessonId) return null;
  for (const course of courses.values()) {
    for (const mod of course.modules) {
      const l = mod.lessons.find((x: any) => x.id === lessonId);
      if (l) return { lesson: l, module: mod, course };
    }
  }
  return null;
}

export async function handleWsMessage(
  ws: WebSocket,
  user: AuthUser,
  msg: { event: string; data: any },
): Promise<void> {
  if (msg.event !== 'message') return;

  const clientMessageId: string | undefined = msg?.data?.message_id;
  const messageId =
    (clientMessageId && String(clientMessageId).trim()) ||
    `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const text: string = msg?.data?.text || '';
  const clientRequestId: string | undefined = msg?.data?.requestId;
  const requestId = (clientRequestId && String(clientRequestId).trim()) || createRequestId();

  const lessonId: string | undefined = msg?.data?.lessonId;
  const courseId: string | undefined = msg?.data?.courseId;

  const found = findLesson(lessonId);
  const course = (courseId && courses.get(courseId)) || found?.course;
  const lesson = found?.lesson;

  const orchestrator = await getOrchestrator();
  const context = buildStudentContext(user.sub);

  // Lightly enrich context with current selections for routing.
  (context as any).currentCourseId = course?.id;
  (context as any).currentLessonId = lesson?.id;

  send(ws, 'response.start', { message_id: messageId, agent_name: 'orchestrator' });
  send(ws, 'agent.spawned', {
    agent_name: 'Orchestrator',
    task_summary: context.preferredAgents?.length
      ? `Routing message with activated marketplace agents (${context.preferredAgents.join(', ')}): "${text.slice(0, 120)}"`
      : `Routing message via orchestrator: "${text.slice(0, 120)}"`,
  });

  let aggregatedText = '';
  let suggestedActions: string[] = [];
  let routedAgentName = 'orchestrator';

  try {
    const result = await Promise.race([
      orchestrator.processMessage(text, context),
      new Promise<any>((_resolve, reject) =>
        setTimeout(() => reject(new Error('orchestrator_timeout')), 8000),
      ),
    ]);
    aggregatedText = result.text || '';
    suggestedActions = result.suggestedActions || [];
    routedAgentName = result.agentResults?.[0]?.agentName || routedAgentName;

    // Stream response in chunks so the client sees incremental output.
    const chunkSize = 500;
    for (let i = 0; i < aggregatedText.length; i += chunkSize) {
      const chunk = aggregatedText.slice(i, i + chunkSize);
      send(ws, 'response.chunk', { message_id: messageId, content_delta: chunk, type: 'text' });
    }

    // Usage persistence (Iter67): per-agent + best-effort provider attribution.
    try {
      // Our agents are mostly deterministic/offline today and may not report tokens.
      // Still record a minimal usage record so Settings can show provider usage.
      const tokensTotal = Math.max(1, Math.round(result.totalTokensUsed || 0) || 1);

      // WS requests don't carry an explicit apiKey override today.
      // Attribute provider as:
      // 1) user's active saved key provider (best-effort)
      // 2) otherwise unknown
      const savedProviders = (db.getKeysByUserId(user.sub) || []).filter((k) => k.active);
      const provider = (savedProviders[0]?.provider as any) || 'unknown';

      const origin = String((user as any)?.origin || 'user');
      db.addUsageRecord({
        userId: user.sub,
        agentName: routedAgentName,
        provider,
        tokensIn: 0,
        tokensOut: 0,
        tokensTotal,
        origin,
        createdAt: new Date(),
      });
    } catch {
      // ignore usage persistence failures
    }

    // Iter66: emit one agent.complete per executed agent (multi-agent orchestration trace).
    const completedAgents = new Set<string>();
    for (const ar of result.agentResults || []) {
      if (!ar?.agentName) continue;
      if (completedAgents.has(ar.agentName)) continue;
      completedAgents.add(ar.agentName);

      send(ws, 'agent.complete', {
        agent_name: ar.agentName,
        result_summary:
          ar.status === 'success' ? `Completed via ${ar.agentName}` : `Error in ${ar.agentName}`,
      });
    }

    // Fallback: if agentResults were empty for some reason, keep prior behavior.
    if (completedAgents.size === 0) {
      send(ws, 'agent.complete', {
        agent_name: routedAgentName,
        result_summary: `Completed via ${routedAgentName}`,
      });
    }

    send(ws, 'response.end', {
      message_id: messageId,
      actions: mapActions(suggestedActions),
      // Best-effort sources: if user is currently in a lesson, extract sources from it.
      sources: lesson?.content ? makeSourcesFromLesson(lesson.content) : [],
    });
  } catch (err: any) {
    const message = err?.message || 'Orchestrator error';
    sendWsError(ws, requestId, {
      code: message === 'orchestrator_timeout' ? 'timeout' : 'orchestrator_error',
      message,
      message_id: messageId,
    });
    send(ws, 'response.end', {
      message_id: messageId,
      actions: mapActions(['Try Again']),
      sources: [],
    });
  }
}
