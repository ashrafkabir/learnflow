import type { AuthUser } from './middleware.js';
import type { WebSocket } from 'ws';
import { courses } from './routes/courses.js';

/**
 * Shared WS “orchestrator” for MVP.
 * For now, we reuse the existing REST-ish agent routing via HTTP semantics isn't shared,
 * but we ensure the WS stream is based on real lesson/course context (not canned strings).
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

function makeLessonSources(lessonContent: string): Array<{
  title: string;
  author?: string;
  publication?: string;
  year?: number;
  url: string;
}> {
  // Extremely small heuristic: pull URLs from a References/Sources section if present.
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

  send(ws, 'response.start', { message_id: messageId, agent_name: 'orchestrator' });
  send(ws, 'agent.spawned', {
    agent_name: 'Orchestrator Agent',
    task_summary: lesson
      ? `Answering with lesson context: "${lesson.title}"`
      : `Processing: "${text.slice(0, 100)}"`,
  });

  // Create a “real enough” stream: brief context + suggestion. No LLM calls here.
  const parts: string[] = [];
  if (lesson?.content) {
    parts.push(`You asked: "${text}"\n\n`);
    parts.push(`Here’s the relevant context from **${lesson.title}**:\n`);
    const excerpt = lesson.content
      .replace(/\n{3,}/g, '\n\n')
      .slice(0, 700)
      .trim();
    parts.push(excerpt + (lesson.content.length > excerpt.length ? '…' : ''));
    parts.push(
      `\n\nIf you want, I can: (1) summarize this section, (2) generate notes, or (3) quiz you.`,
    );
  } else if (course?.title) {
    parts.push(`You’re working on **${course.title}**. `);
    parts.push(`Ask me about a specific lesson (open it first) for citations.`);
  } else {
    parts.push(`I received: "${text}". `);
    parts.push('Tell me which course/lesson you’re on so I can answer with sources.');
  }

  for (const p of parts) {
    send(ws, 'response.chunk', { message_id: messageId, content_delta: p, type: 'text' });
  }

  send(ws, 'agent.complete', {
    agent_name: 'Orchestrator Agent',
    result_summary: lesson?.title
      ? `Responded with lesson context: ${lesson.title}`
      : 'Response generated',
  });

  send(ws, 'response.end', {
    message_id: messageId,
    actions: [
      { type: 'take_notes', label: 'Take Notes' },
      { type: 'quiz_me', label: 'Quiz Me' },
      { type: 'go_deeper', label: 'Go Deeper' },
    ],
    sources: lesson?.content ? makeLessonSources(lesson.content) : [],
  });
}
