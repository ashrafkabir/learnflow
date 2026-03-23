import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { sendError } from '../errors.js';
import { courses } from './courses.js';
import {
  buildStudentContext,
  getOrchestrator,
  makeSourcesFromLesson,
} from '../orchestratorShared.js';
import { db } from '../db.js';
import { guessProviderFromKey } from '../lib/provider.js';

const router = Router();

const chatSchema = z
  .object({
    text: z.string().optional(),
    message: z.string().optional(),
    agent: z.string().optional(),
    lessonId: z.string().optional(),
    courseId: z.string().optional(),
    moduleId: z.string().optional(),
    format: z.string().optional(),
    history: z.array(z.unknown()).optional(),
    attachments: z.array(z.string()).optional(),
    context_overrides: z.record(z.string(), z.unknown()).optional(),
    // Optional BYOAI key passed per-request (some clients do this instead of storing keys).
    apiKey: z.string().optional(),
    provider: z.string().optional(),
  })
  .refine((d) => d.text || d.message, { message: 'text or message required' });

// Find a lesson by ID across all courses
function findLesson(lessonId?: string) {
  if (!lessonId) return null;
  for (const course of courses.values()) {
    for (const mod of course.modules) {
      const l = mod.lessons.find((l) => l.id === lessonId);
      if (l) return { lesson: l, module: mod, course };
    }
  }
  return null;
}

function formatAgentName(agentName: string): string {
  const map: Record<string, string> = {
    notes_agent: 'Notes Agent',
    exam_agent: 'Exam Agent',
    research_agent: 'Research Agent',
    course_builder: 'Course Builder',
    summarizer_agent: 'Summarizer Agent',
    tutor_agent: 'Tutor Agent',
    mindmap_agent: 'Mindmap Agent',
    collaboration_agent: 'Collaboration Agent',
    export_agent: 'Export Agent',
  };
  return map[agentName] || agentName;
}

function normalizeNotes(
  raw: any,
):
  | { format: 'cornell'; content: string; cueQuestions?: string[]; summary?: string }
  | { format: 'flashcard'; content: string; flashcards: Array<{ front: string; back: string }> }
  | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  // If already in the REST shape, pass through.
  if (raw.format && (raw.content || raw.flashcards)) return raw;

  const fmt = String(raw.format || raw.noteFormat || '').toLowerCase();
  const notes = raw.notes;

  if (fmt === 'flashcards' || fmt === 'flashcard') {
    const cards = Array.isArray(notes) ? notes : [];
    const flashcards = cards.map((c: any) => ({
      front: c.front || c.question || '',
      back: c.back || c.answer || '',
    }));
    return { format: 'flashcard', content: '', flashcards };
  }

  // Cornell default
  if (
    notes &&
    typeof notes === 'object' &&
    ('cue' in notes || 'notes' in notes || 'summary' in notes)
  ) {
    const cue = (notes as any).cue ? `## Cue Questions\n${String((notes as any).cue)}` : '';
    const main = (notes as any).notes ? `## Main Notes\n${String((notes as any).notes)}` : '';
    const summary = (notes as any).summary ? `## Summary\n${String((notes as any).summary)}` : '';
    const content = ['# Cornell Notes', cue, main, summary].filter(Boolean).join('\n\n');
    const cueQuestions = (notes as any).cue
      ? String((notes as any).cue)
          .split('\n')
          .map((l: string) => l.replace(/^[-*]\s*/, '').trim())
          .filter(Boolean)
      : [];
    return { format: 'cornell', content, cueQuestions, summary: (notes as any).summary || '' };
  }

  return { format: 'cornell', content: String(notes || '') };
}

function buildAgentPrompt(params: {
  agent?: string;
  input: string;
  lessonTitle?: string;
  lessonContent?: string;
  courseTitle?: string;
  moduleLessonPreview?: string;
  format?: string;
}): string {
  const { agent, input, lessonTitle, lessonContent, courseTitle, moduleLessonPreview, format } =
    params;

  // Keep prompts intentionally simple so the keyword intent router can route deterministically.
  if (agent === 'notes') {
    const fmt =
      format === 'flashcard'
        ? 'flashcards'
        : format === 'flashcards'
          ? 'flashcards'
          : format || 'cornell';
    const title = lessonTitle || courseTitle || 'this lesson';
    const body = (lessonContent || input || '').slice(0, 4000);
    return `Take ${fmt} notes for the following lesson: ${title}\nFormat: ${fmt}\n\n${body}`;
  }

  if (agent === 'exam') {
    const body = (moduleLessonPreview || lessonContent || input || '').slice(0, 4500);
    return `Generate a quiz based on the following lesson content:\n\n${body}`;
  }

  if (agent === 'research') {
    return `Research: ${input}`;
  }

  return input;
}

router.post('/', async (req: Request, res: Response) => {
  const parse = chatSchema.safeParse(req.body);
  if (!parse.success) {
    sendError(res, req, {
      status: 400,
      code: 'validation_error',
      message: parse.error.message,
      details: parse.error.flatten(),
    });
    return;
  }

  const { text, message, agent, lessonId, courseId, moduleId, format, apiKey } = parse.data;
  const input = text || message || '';

  // If a client supplies a one-off apiKey, perform basic sanity check.
  // This is format-only validation; real provider auth happens when calling the provider.
  if (typeof apiKey === 'string' && apiKey.trim().length > 0) {
    const key = apiKey.trim();
    const looksLikeKnownKey =
      /^sk-[A-Za-z0-9_-]{20,}$/.test(key) ||
      /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key) ||
      /^(AI|AIza)[A-Za-z0-9_-]{20,}$/.test(key) ||
      /^gsk_[A-Za-z0-9_-]{20,}$/.test(key);

    if (!looksLikeKnownKey) {
      sendError(res, req, {
        status: 400,
        code: 'invalid_key',
        message:
          'Invalid API key format. Please add a valid BYOAI key in Settings (or remove apiKey to use your saved key).',
      });
      return;
    }
  }
  // Route all chat (REST) through Core Orchestrator to match WebSocket behavior.
  const found = findLesson(lessonId);
  const courseData = courseId ? courses.get(courseId) : found?.course || null;
  const lesson = found?.lesson;

  const orchestrator = await getOrchestrator();
  const context = buildStudentContext(req.user!.sub);
  (context as any).currentCourseId = courseData?.id;
  (context as any).currentLessonId = lesson?.id;

  const mod = courseData?.modules?.find((m) => m.id === moduleId) || courseData?.modules?.[0];
  const moduleLessonPreview = mod?.lessons
    ? mod.lessons
        .slice(0, 6)
        .map((l) => `## ${l.title}\n${(l.content || l.description || '').slice(0, 700)}`)
        .join('\n\n')
    : '';

  const routedInput = buildAgentPrompt({
    agent,
    input,
    format,
    lessonTitle: lesson?.title,
    lessonContent: lesson?.content,
    courseTitle: courseData?.title,
    moduleLessonPreview,
  });

  const result = await orchestrator.processMessage(routedInput, context);
  const routedAgentName = formatAgentName(result.agentResults?.[0]?.agentName || 'orchestrator');

  // Usage persistence (Iter67): record per-agent + best-effort provider attribution.
  try {
    // Our agents are mostly deterministic/offline today and may not report tokens.
    // Still record a minimal usage record so Settings can show provider usage.
    const tokensTotal = Math.max(1, Math.round(result.totalTokensUsed || 0) || 1);

    // Provider selection order (spec):
    // 1) per-request apiKey override (if provided)
    // 2) active saved key provider (best-effort)
    // 3) otherwise unknown
    const savedActive = (db.getKeysByUserId(req.user!.sub) || []).find((k) => k.active);
    const provider = apiKey
      ? guessProviderFromKey(apiKey)
      : (savedActive?.provider as any) || 'unknown';

    db.addUsageRecord({
      userId: req.user!.sub,
      agentName: routedAgentName,
      provider,
      tokensIn: 0,
      tokensOut: 0,
      tokensTotal,
      createdAt: new Date(),
    });
  } catch {
    // ignore
  }

  // Shape legacy REST response fields expected by client + tests.
  let notes: any = undefined;
  let questions: any = undefined;
  let sources: any = lesson?.content ? makeSourcesFromLesson(lesson.content) : [];

  const ar0: any = (result.agentResults || [])[0];
  const data: any = ar0?.data;
  if (data && typeof data === 'object') {
    if ((data as any).notes) notes = normalizeNotes(data);
    if (data.questions) questions = data.questions;
    if (Array.isArray(data.sources)) sources = data.sources;
    // ResearchAgent returns { papers, summary } in data; expose deterministic sources in test/dev.
    if (!Array.isArray(data.sources) && Array.isArray(data.papers)) {
      sources = data.papers.map((p: any) => ({
        title: p.title,
        url: p.url,
        author: (p.authors && p.authors[0]) || undefined,
      }));
    }
  }

  res.status(200).json({
    message_id: `msg-${Date.now()}`,
    agentName: routedAgentName,
    content: result.text,
    response: result.text,
    reply: result.text,
    actions: result.suggestedActions || [],
    sources,
    notes,
    questions,
  });
});

export const chatRouter = router;
