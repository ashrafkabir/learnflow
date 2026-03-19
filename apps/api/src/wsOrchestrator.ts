import type { AuthUser } from './middleware.js';
import type { WebSocket } from 'ws';
import { courses } from './routes/courses.js';
import { db, dbMarketplace } from './db.js';

import type { StudentContextObject } from '@learnflow/core';
import { AgentRegistry, Orchestrator } from '@learnflow/core';
import {
  CollaborationAgent,
  CourseBuilderAgent,
  ExamAgent,
  MindmapAgent,
  NotesAgent,
  ResearchAgent,
  SummarizerAgent,
} from '@learnflow/agents';

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

function buildStudentContext(userId: string): StudentContextObject {
  const dbUser = db.findUserById(userId);

  // Build a shared/types User (matches packages/shared User interface)
  const user = {
    id: userId,
    email: dbUser?.email || 'dev@learnflow.local',
    displayName: dbUser?.displayName || 'Learner',
    role: (dbUser?.role || 'student') as 'student' | 'creator' | 'admin',
    tier: (dbUser?.tier || 'free') as 'free' | 'pro',
    goals: (dbUser?.goals || []) as string[],
    preferredLanguage: dbUser?.preferredLanguage || 'en',
    createdAt: dbUser?.createdAt || new Date(),
    updatedAt: dbUser?.updatedAt || new Date(),
  };

  // NOTE: The API DB doesn't yet persist all spec fields; we provide sane defaults.
  return {
    userId,
    user,
    currentCourseId: undefined,
    currentLessonId: undefined,
    enrolledCourseIds: [],
    completedLessonIds: [],
    goals: user.goals,
    strengths: [],
    weaknesses: [],
    learningStyle: 'reading',
    quizScores: {},
    studyStreak: 0,
    totalStudyMinutes: 0,
    lastActiveAt: new Date(),

    goalDetails: user.goals.map((g) => ({ goal: g, priority: 'medium' as const })),
    interests: [],
    browseHistory: [],
    searchQueries: [],
    bookmarkedContent: [],
    sessionFrequency: 0,
    preferredTimeOfDay: 'morning',
    preferredLessonLength: 10,
    subscriptionTier: user.tier,
    billingStatus: 'active',
    apiKeyProvider: undefined,
    usageQuotas: {},
    notificationSettings: { email: true, push: true, inApp: true },
    preferredAgents: dbMarketplace.getActivatedAgents(userId),
    displayPreferences: { theme: 'light', fontSize: 16 },
    collaborationOptIn: false,
    peerConnections: [],
    sharedCourses: [],
    lessonRatings: {},
    agentRatings: {},
    courseReviews: [],
  };
}

let singletonOrchestrator: Orchestrator | null = null;
async function getOrchestrator(): Promise<Orchestrator> {
  if (singletonOrchestrator) return singletonOrchestrator;

  const registry = new AgentRegistry();
  const agents = [
    new CourseBuilderAgent(),
    new NotesAgent(),
    new ExamAgent(),
    new ResearchAgent(),
    new SummarizerAgent(),
    new MindmapAgent(),
    new CollaborationAgent(),
  ];

  for (const a of agents) {
    await a.initialize();
    registry.register(a);
  }

  singletonOrchestrator = new Orchestrator(registry);
  return singletonOrchestrator;
}

function mapActions(actions: string[]): Array<{ type: string; label: string }> {
  // Keep wire contract stable: {type,label}. Use lower_snake for type.
  return (actions || []).slice(0, 5).map((label) => ({
    type: label.toLowerCase().replace(/\s+/g, '_'),
    label,
  }));
}

function makeSourcesFromLesson(lessonContent: string): Array<{
  title: string;
  author?: string;
  publication?: string;
  year?: number;
  url: string;
}> {
  // Minimal heuristic: pull URLs from a Sources/References section if present.
  const refSection =
    lessonContent.match(/## (?:References|Sources|Further Reading)[\s\S]*$/im)?.[0] || '';
  const urls = Array.from(refSection.matchAll(/https?:\/\/\S+/g)).map((m) =>
    m[0].replace(/[).,;]+$/, ''),
  );
  const unique = Array.from(new Set(urls)).slice(0, 5);
  return unique.map((url, i) => ({
    title: `Reference ${i + 1}`,
    author: 'Source',
    publication: '',
    year: 2024,
    url,
  }));
}

export async function handleWsMessage(
  ws: WebSocket,
  user: AuthUser,
  msg: { event: string; data: any },
): Promise<void> {
  if (msg.event !== 'message') return;

  const messageId = `msg-${Date.now()}`;
  const text: string = msg?.data?.text || '';
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
    const result = await orchestrator.processMessage(text, context);
    aggregatedText = result.text || '';
    suggestedActions = result.suggestedActions || [];
    routedAgentName = result.agentResults?.[0]?.agentName || routedAgentName;

    // Stream response in chunks so the client sees incremental output.
    const chunkSize = 500;
    for (let i = 0; i < aggregatedText.length; i += chunkSize) {
      const chunk = aggregatedText.slice(i, i + chunkSize);
      send(ws, 'response.chunk', { message_id: messageId, content_delta: chunk, type: 'text' });
    }

    // Persist usage (approx): use orchestrator token accounting if available.
    try {
      const tokens = Math.max(0, Math.round(result.totalTokensUsed || 0));
      if (tokens > 0) {
        db.addTokenUsage({
          userId: user.sub,
          agentId: routedAgentName,
          tokensUsed: tokens,
          timestamp: new Date(),
        });
      }
    } catch {
      // ignore usage persistence failures
    }

    send(ws, 'agent.complete', {
      agent_name: routedAgentName,
      result_summary: `Completed via ${routedAgentName}`,
    });

    send(ws, 'response.end', {
      message_id: messageId,
      actions: mapActions(suggestedActions),
      // Best-effort sources: if user is currently in a lesson, extract sources from it.
      sources: lesson?.content ? makeSourcesFromLesson(lesson.content) : [],
    });
  } catch (err: any) {
    send(ws, 'error', { message: err?.message || 'Orchestrator error' });
    send(ws, 'response.end', {
      message_id: messageId,
      actions: mapActions(['Try Again']),
      sources: [],
    });
  }
}
