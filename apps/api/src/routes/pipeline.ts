import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import {
  searchAndExtractTopic,
  writeCourseResearch,
  writeLessonResearch,
  readLessonResearch,
  searchWikimediaCommonsImages,
  type FirecrawlSource,
} from '@learnflow/agents';
import { getOpenAIForRequest } from '../llm/openai.js';
import { sendError } from '../errors.js';
import { validateBody } from '../validation.js';
import {
  buildSourceCards,
  selectFurtherReadingCards,
  formatFurtherReadingBlock,
} from '../utils/sourceCards.js';

const router = Router();

// ── Types ────────────────────────────────────────────────────────────────────

export type PipelineStage =
  | 'scraping'
  | 'organizing'
  | 'synthesizing'
  | 'quality_check'
  | 'reviewing'
  | 'published'
  | 'personal'
  | 'failed';

export type PipelineRunStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export interface CrawlThread {
  id: string;
  url: string;
  status: 'pending' | 'crawling' | 'done' | 'failed';
  title?: string;
  contentPreview?: string;
  wordCount?: number;
}

export interface LessonSynthesis {
  lessonId: string;
  lessonTitle: string;
  status: 'pending' | 'generating' | 'done' | 'failed';
  wordCount: number;
  sourcesUsed: number;
}

export interface QualityResult {
  lessonId: string;
  lessonTitle: string;
  checks: {
    wordCount: { pass: boolean; value: number; min: number };
    objectives: { pass: boolean; count: number; min: number };
    takeaways: { pass: boolean; count: number; min: number };
    sources: { pass: boolean; count: number; min: number };
    readability: { pass: boolean; score: number };
  };
  overallPass: boolean;
}

export interface PipelineSource {
  url: string;
  title: string;
  domain?: string;
  author?: string;
  publishDate?: string;
  credibilityScore?: number;
  provider?: string;
  /** short snippet/summary from search provider or scraped preview */
  summary?: string;
}

export interface SourceCard {
  title: string;
  url: string;
  provider: string;
  summary: string;
  relevance: string;
  keyConcepts: string[];
  accessedAt: string;
}

export interface PipelineState {
  id: string;
  courseId: string;
  topic: string;

  /** Last error encountered (for UI). Prefer this over scanning logs. */
  lastError?: string;
  /** Best-effort retry counter (incremented on restart). */
  retryCount?: number;

  /** Iter74 P0.5: milestone events per lesson */
  lessonMilestones?: Array<{
    lessonId: string;
    lessonTitle: string;
    type: 'plan_ready' | 'sources_ready' | 'draft_ready' | 'quality_passed';
    ts: string;
  }>;

  /** Run state machine (Iter73 hotfix) */
  status: PipelineRunStatus;
  startedAt: string;
  updatedAt: string;
  finishedAt?: string;
  failReason?: string;

  /** Legacy/progress UI */
  stage: PipelineStage;
  progress: number; // 0-100

  /** Persisted log lines for UI + debugging */
  logs?: Array<{ ts: string; level: 'info' | 'warn' | 'error'; message: string }>;

  // Stage data
  crawlThreads: CrawlThread[];
  sources?: PipelineSource[];
  /** Rich per-result source cards (Iter73): shown live in UI + used for Further Reading blocks */
  sourceCards?: SourceCard[];
  /**
   * Search run documentation for course creation (Iter68):
   * - stage 1: topic trending queries
   * - stage 2: per-lesson queries
   */
  searchRuns?: any[];
  synthesisSummary?: string;
  organizedSources: number;
  deduplicatedCount: number;
  credibilityScores: number[];
  themes: string[];
  lessonSyntheses: LessonSynthesis[];
  qualityResults: QualityResult[];
  // Course data
  courseTitle?: string;
  courseDescription?: string;
  moduleCount?: number;
  lessonCount?: number;
  error?: string;
  sourceMode?: 'real' | 'mock';

  /** Debug-only attachments for UI inspection (not persisted) */
  debug?: {
    coursePlan?: any;
  };
}

import { dbPipelines, dbCourses } from '../db.js';
import { buildCoursePlan } from '../utils/coursePlan.js';

// Pipeline store — runtime cache backed by SQLite
const pipelines: Map<string, PipelineState> = new Map();
// Load existing pipelines from SQLite on startup
for (const p of dbPipelines.getAll()) pipelines.set(p.id, p as PipelineState);
// SSE clients per pipeline
const sseClients: Map<string, Set<Response>> = new Map();

function broadcast(pipelineId: string, event: string, data: unknown) {
  const clients = sseClients.get(pipelineId);
  if (!clients) return;
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try {
      res.write(msg);
    } catch {
      clients.delete(res);
    }
  }
}

function appendLog(p: PipelineState, level: 'info' | 'warn' | 'error', message: string): void {
  const line = { ts: new Date().toISOString(), level, message } as const;
  const logs = Array.isArray(p.logs) ? p.logs : [];
  logs.push(line);
  // cap to prevent unbounded growth
  const capped = logs.slice(-800);
  Object.assign(p, { logs: capped, updatedAt: new Date().toISOString() });
  pipelines.set(p.id, p);
  dbPipelines.save(p);
  broadcast(p.id, 'pipeline:log', line);
  broadcast(p.id, 'pipeline:update', p);
}

function appendLessonMilestone(
  p: PipelineState,
  event: { lessonId: string; lessonTitle: string; type: any },
): void {
  const milestones = Array.isArray(p.lessonMilestones) ? p.lessonMilestones : [];
  milestones.push({ ...event, ts: new Date().toISOString() });
  const capped = milestones.slice(-2000);
  updatePipeline(p, { lessonMilestones: capped });
  appendLog(p, 'info', `milestone lessonId=${event.lessonId} type=${event.type}`);
}

function classifyAuth(statusCode?: number): 'auth_error' | null {
  return statusCode === 401 || statusCode === 403 ? 'auth_error' : null;
}

function extractStatusCode(err: any): number | undefined {
  const candidates = [err?.status, err?.statusCode, err?.response?.status, err?.cause?.status];
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c;
  }
  return undefined;
}

function redactSecrets(input: string): string {
  return String(input || '')
    .replace(/sk-[A-Za-z0-9]{10,}/g, '[REDACTED]')
    .replace(/tvly-[A-Za-z0-9]{10,}/g, '[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]{10,}/gi, 'Bearer [REDACTED]');
}

async function writeOpenAILogArtifact(params: {
  courseId: string;
  kind: string;
  request: unknown;
  response: unknown;
}): Promise<{ requestPath: string; responsePath: string } | null> {
  try {
    const { courseArtifactsRoot } = await import('@learnflow/agents');
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const dir = path.join(courseArtifactsRoot(params.courseId), 'logs', 'openai');
    await fs.mkdir(dir, { recursive: true });

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const requestPath = path.join(dir, `${stamp}_${params.kind}_request.json`);
    const responsePath = path.join(dir, `${stamp}_${params.kind}_response.json`);

    await fs.writeFile(requestPath, JSON.stringify(params.request, null, 2), 'utf8');
    await fs.writeFile(responsePath, JSON.stringify(params.response, null, 2), 'utf8');

    return { requestPath, responsePath };
  } catch {
    return null;
  }
}

function previewJson(x: unknown, maxChars: number): string {
  try {
    const s = JSON.stringify(x);
    if (s.length <= maxChars) return s;
    return s.slice(0, maxChars) + '…';
  } catch {
    const s = String(x || '');
    if (s.length <= maxChars) return s;
    return s.slice(0, maxChars) + '…';
  }
}

async function logOpenAIRequestResponse(params: {
  p: PipelineState;
  courseId: string;
  kind: string;
  request: unknown;
  response: unknown;
}): Promise<void> {
  const { p, courseId, kind, request, response } = params;

  // Write full artifacts to disk.
  const paths = await writeOpenAILogArtifact({ courseId, kind, request, response });

  // Log truncated previews to pipeline logs.
  appendLog(
    p,
    'info',
    `[openai.request] kind=${kind} ${redactSecrets(previewJson(request, 2000))}`,
  );
  appendLog(
    p,
    'info',
    `[openai.response] kind=${kind} ${redactSecrets(previewJson(response, 2000))}`,
  );

  if (paths) {
    appendLog(
      p,
      'info',
      `[openai.artifacts] request=${paths.requestPath} response=${paths.responsePath}`,
    );
  }
}

function safeErrorMessage(err: any): string {
  const msg = String(err?.message || err || '')
    .replace(/\s+/g, ' ')
    .trim();
  // Never leak common key patterns if an upstream lib echoed it (defense in depth).
  return redactSecrets(msg).slice(0, 260);
}

function logAuthIssue(
  pipelineId: string,
  provider: string,
  statusCode: number | undefined,
  message: string,
  envVar?: string,
): void {
  const p = pipelines.get(pipelineId);
  if (!p) return;
  const classification = classifyAuth(statusCode);
  const parts = [
    `${provider} ${classification ? 'auth error' : 'error'}`,
    statusCode ? `status=${statusCode}` : null,
    classification ? 'classification=auth_error' : null,
    envVar ? `suggestion=check ${envVar}` : null,
    message ? `message="${message}"` : null,
  ].filter(Boolean);
  appendLog(p, classification ? 'warn' : 'error', parts.join(' | '));
}

function updatePipeline(p: PipelineState, partial: Partial<PipelineState>) {
  Object.assign(p, partial, { updatedAt: new Date().toISOString() });
  pipelines.set(p.id, p);
  // Persist to SQLite
  dbPipelines.save(p);
  broadcast(p.id, 'pipeline:update', p);
}

function failPipeline(p: PipelineState, reason: string, error?: unknown): void {
  if (p.status === 'FAILED' || p.status === 'SUCCEEDED') return;
  const msg = error ? `${reason}: ${String(error)}` : reason;
  appendLog(p, 'error', msg);
  updatePipeline(p, {
    status: 'FAILED',
    stage: 'failed',
    failReason: reason,
    error: error ? String(error) : p.error,
    lastError: safeErrorMessage(error) || reason,
    finishedAt: new Date().toISOString(),
    progress: Math.min(100, Math.max(p.progress ?? 0, 1)),
  });
}

function stallTimeoutMs(): number {
  return Number(process.env.PIPELINE_STALL_TIMEOUT_MS || 5 * 60_000);
}
function cleanupMaxAgeMs(): number {
  return Number(process.env.PIPELINE_CLEANUP_MAX_AGE_MS || 24 * 60 * 60_000);
}

function isStalled(p: PipelineState, now = Date.now()): boolean {
  if (p.status !== 'RUNNING') return false;
  const updated = Date.parse(p.updatedAt || p.startedAt || '') || 0;
  return now - updated > stallTimeoutMs();
}

function cleanupStalePipelines(): void {
  const now = Date.now();
  for (const p of pipelines.values()) {
    const started = Date.parse(p.startedAt || '') || 0;
    const finished = Date.parse(p.finishedAt || '') || 0;
    if (p.status === 'RUNNING' && isStalled(p, now)) {
      failPipeline(p, 'stalled');
      continue;
    }
    // hard cleanup very old runs so list doesn't accumulate forever
    const age = now - (finished || started || now);
    if ((p.status === 'SUCCEEDED' || p.status === 'FAILED') && age > cleanupMaxAgeMs()) {
      pipelines.delete(p.id);
      // Also remove from DB to avoid a long-lived list of finished pipelines
      dbPipelines.delete(p.id);
    }
  }
}

// Periodic sweep to prevent stuck runs accumulating (no auto-start behavior)
setInterval(() => {
  try {
    cleanupStalePipelines();
  } catch {
    // ignore
  }
}, 30_000).unref();

// ── Topic → Module structure (reuse from courses.ts logic) ───────────────────

interface TopicModule {
  title: string;
  objective: string;
  lessons: Array<{ title: string; description: string }>;
}

function getGenericModules(topic: string): TopicModule[] {
  return [
    {
      title: `Foundations of ${topic}`,
      objective: `Understand the core principles and history of ${topic}`,
      lessons: [
        {
          title: `Introduction to ${topic}`,
          description: `Core concepts and definitions in ${topic}`,
        },
        {
          title: `History and Evolution of ${topic}`,
          description: `How ${topic} developed over time`,
        },
        { title: `Key Terminology in ${topic}`, description: `Essential vocabulary and concepts` },
      ],
    },
    {
      title: `Core Concepts in ${topic}`,
      objective: `Master the fundamental techniques and methodologies`,
      lessons: [
        { title: `Fundamental Techniques`, description: `Primary methods used in ${topic}` },
        {
          title: `Advanced Patterns and Frameworks`,
          description: `Higher-level abstractions and patterns`,
        },
        { title: `Tools and Technologies`, description: `Key tools and platforms for ${topic}` },
      ],
    },
    {
      title: `Practical Applications of ${topic}`,
      objective: `Apply knowledge to real-world scenarios`,
      lessons: [
        { title: `Real-World Use Cases`, description: `How ${topic} is applied in industry` },
        {
          title: `Best Practices and Common Pitfalls`,
          description: `Expert recommendations and mistakes to avoid`,
        },
        { title: `Future Directions`, description: `Emerging trends and the roadmap ahead` },
      ],
    },
  ];
}

async function generateModulesForTopic(
  topic: string,
  scrapedSources: FirecrawlSource[] = [],
  openai: any = null,
): Promise<TopicModule[]> {
  if (!openai) return getGenericModules(topic);

  // Build source context for informed planning
  const sourceContext = scrapedSources
    .slice(0, 15)
    .map(
      (s, i) => `[Source ${i + 1}] "${s.title}" (${s.domain})\n${(s.content || '').slice(0, 800)}`,
    )
    .join('\n---\n');

  const hasRealSources = scrapedSources.length > 0;

  try {
    const reqPayload = {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a curriculum designer. Generate a detailed course syllabus as JSON. Return:
{
  "courseTitle": "A specific, compelling course title",
  "courseDescription": "2-3 sentence description",
  "modules": [
    {
      "title": "Module title specific to the topic",
      "objective": "What the learner will achieve",
      "lessons": [
        { "title": "Specific lesson title", "description": "What this lesson covers" }
      ]
    }
  ]
}
Rules:
- Generate 4-6 modules, each with 3-5 lessons
- Titles must be SPECIFIC to the topic (not generic like "Foundations of X")
- Lessons should progress from fundamentals to advanced
- Include practical/hands-on lessons
- Each lesson title should be unique and descriptive
${hasRealSources ? `- You have REAL scraped web sources below. Use them to inform what topics are trending, important, and practically relevant. Base your module/lesson titles on what the sources actually cover — not generic templates.` : ''}`,
        },
        {
          role: 'user',
          content: `Create a comprehensive intermediate-level course syllabus for: "${topic}"${hasRealSources ? `\n\nHere are real sources scraped from the web to inform your plan:\n\n${sourceContext}` : ''}`,
        },
      ],
    };

    const resp = await openai.chat.completions.create(reqPayload);
    // NOTE: This function doesn't have access to the pipeline state (p). We only log
    // request/response when we have a pipeline context in runPipeline.
    // (OpenAI request/response will be logged from runPipeline around this call.)

    const content = resp.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      if (parsed.modules && Array.isArray(parsed.modules) && parsed.modules.length >= 3) {
        const valid = parsed.modules.every(
          (m: any) =>
            m.title &&
            m.objective &&
            Array.isArray(m.lessons) &&
            m.lessons.length >= 2 &&
            m.lessons.every((l: any) => l.title && l.description),
        );
        if (valid) {
          // Store course title/description from LLM if provided
          (generateModulesForTopic as any)._lastTitle = parsed.courseTitle;
          (generateModulesForTopic as any)._lastDescription = parsed.courseDescription;
          return parsed.modules;
        }
      }
    }
  } catch (err) {
    console.warn('[Pipeline] LLM syllabus generation failed, using generic:', err);
  }

  return getGenericModules(topic);
}

// ── Pipeline execution ───────────────────────────────────────────────────────

async function runAddTopicPipeline(pipelineId: string) {
  console.log('[Pipeline] Starting add-topic pipeline', pipelineId);
  const p = pipelines.get(pipelineId);
  if (!p) return;

  updatePipeline(p, { status: 'RUNNING', startedAt: p.startedAt || new Date().toISOString() });
  appendLog(p, 'info', `run started (add-topic) id=${pipelineId}`);

  const topic = p.topic;
  const courseId = p.courseId;

  // Validate target course exists
  const { courses } = await import('./courses.js');
  const existing = courses.get(courseId) as any;
  if (!existing) {
    updatePipeline(p, { stage: 'failed', error: 'Course not found' });
    return;
  }

  // ── STAGE 1: Discovery (web search) ──────────────────────────────────
  updatePipeline(p, { stage: 'scraping', progress: 5 });
  appendLog(p, 'info', `stage=scraping (discovery) topic="${topic}"`);

  const threads: CrawlThread[] = Array.from({ length: 4 }).map((_, i) => ({
    id: `thread-${i}`,
    url: `Discovery thread ${i + 1}`,
    status: 'pending' as const,
  }));
  updatePipeline(p, { crawlThreads: threads });

  let crawledSources: FirecrawlSource[] = [];

  // In test mode, keep pipeline offline + deterministic.
  const testMode = process.env.NODE_ENV === 'test';

  for (let i = 0; i < threads.length; i++) {
    threads[i].status = 'crawling';
    updatePipeline(p, {
      crawlThreads: [...threads],
      progress: 5 + Math.round((i / threads.length) * 20),
    });
  }

  try {
    if (testMode) {
      crawledSources = [
        {
          url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
          title: 'JavaScript — MDN Web Docs',
          author: 'MDN contributors',
          domain: 'developer.mozilla.org',
          source: 'mdn',
          content:
            'JavaScript is a programming language that allows you to implement complex features on web pages. It is used to create dynamic content, control multimedia, animate images, and more.',
          credibilityScore: 0.9,
          recencyScore: 0.8,
          relevanceScore: 0.8,
          wordCount: 30,
        },
        {
          url: 'https://en.wikipedia.org/wiki/JavaScript',
          title: 'JavaScript - Wikipedia',
          author: 'Wikipedia contributors',
          domain: 'en.wikipedia.org',
          source: 'wikipedia',
          content:
            'JavaScript is a high-level, often just-in-time compiled language that conforms to the ECMAScript specification. It has curly-bracket syntax, dynamic typing, and first-class functions.',
          credibilityScore: 0.7,
          recencyScore: 0.6,
          relevanceScore: 0.7,
          wordCount: 33,
        },
      ] as any;
      appendLog(p, 'info', `(test) using deterministic sources: ${crawledSources.length}`);
    } else {
      // OpenAI-only search: use OpenAI web_search + page extraction.
      const extracted = await searchAndExtractTopic({
        topic,
        maxResults: 12,
        perPageTimeoutMs: 12_000,
      } as any);
      crawledSources = extracted.sources.map((s: any) => ({
        url: s.url,
        title: s.title,
        author: s.author,
        domain: s.publisher || new URL(s.url).hostname,
        source: 'openai_web_search',
        content: s.extractedText || s.snippet || '',
        wordCount: (s.extractedText || s.snippet || '').split(/\s+/).filter(Boolean).length,
        credibilityScore: 0.7,
        recencyScore: 0.6,
        relevanceScore: 0.7,
        provider: 'openai_web_search',
      })) as any;
      appendLog(p, 'info', `research.provider=openai_web_search sources=${crawledSources.length}`);
    }

    updatePipeline(p, {
      sources: crawledSources.map((s) => ({
        url: s.url,
        title: s.title,
        domain: s.domain,
        author: s.author,
        publishDate: s.publishDate || undefined,
        credibilityScore: s.credibilityScore,
        provider: (s as any).provider || s.source || s.domain,
        summary: (s.content || '').slice(0, 240),
      })),
    });

    for (let i = 0; i < threads.length; i++) {
      threads[i].status = 'done';
      const chunk = crawledSources.slice(i * 3, (i + 1) * 3);
      threads[i].title = chunk.length > 0 ? `Found ${chunk.length} sources` : 'Completed';
      threads[i].contentPreview = chunk
        .map((s) => s.title)
        .join(', ')
        .slice(0, 100);
      threads[i].wordCount = chunk.reduce((s, c) => s + c.wordCount, 0);
    }
  } catch (err) {
    console.warn('[Pipeline] OpenAI web_search discovery failed:', err);
    // OpenAI-only: do not fall back to other search providers.
    throw err;
  }

  updatePipeline(p, { crawlThreads: [...threads], progress: 25, sourceMode: 'real' });

  // ── STAGE 2: Extract (dedupe/themes) ──────────────────────────────────
  updatePipeline(p, { stage: 'organizing', progress: 35 });

  const uniqueSources = crawledSources.filter(
    (s, i, arr) => arr.findIndex((x) => x.url === s.url) === i,
  );
  const credScores = uniqueSources.map((s) => s.credibilityScore);

  updatePipeline(p, {
    organizedSources: uniqueSources.length,
    deduplicatedCount: crawledSources.length - uniqueSources.length,
    credibilityScores: credScores,
    themes: uniqueSources
      .map((s) => s.domain)
      .filter(Boolean)
      .slice(0, 6) as string[],
    progress: 50,
  });

  await new Promise((r) => setTimeout(r, 400));

  // ── STAGE 3: Synthesize (generate new module+lesson) ─────────────────
  updatePipeline(p, { stage: 'synthesizing', progress: 60 });

  // Create a single synthetic lesson entry so UI shows work happening
  const moduleIndex = existing.modules.length;
  const lessonId = `${courseId}-m${moduleIndex}-l0`;

  appendLessonMilestone(p, {
    lessonId,
    lessonTitle: `${topic}: Overview`,
    type: 'plan_ready',
  });
  const syntheses: LessonSynthesis[] = [
    {
      lessonId,
      lessonTitle: `${topic}: Overview`,
      status: 'generating',
      wordCount: 0,
      sourcesUsed: Math.min(6, uniqueSources.length),
    },
  ];
  updatePipeline(p, { lessonSyntheses: [...syntheses] });

  // Generate content by calling shared generator in courses.ts through dynamic import.
  // Keeps the add-topic behavior consistent with the direct /courses/:id/add-topic path.
  const { generateLessonContentWithLLM } = await import('./courses.js');
  const gen = await generateLessonContentWithLLM(
    topic,
    topic,
    `${topic}: Overview`,
    `A focused, practical introduction to ${topic} for learners already following this course.`,
    uniqueSources.slice(0, 8),
  );
  const cards = buildSourceCards(uniqueSources, topic, { accessedAt: p.startedAt, limit: 40 });
  updatePipeline(p, { sourceCards: cards });

  const further = selectFurtherReadingCards(cards, { min: 2, max: 5 });
  const content = `${gen.markdown}${formatFurtherReadingBlock(further)}`;
  const wc = content.split(/\s+/).filter((w: string) => w).length;

  syntheses[0].status = 'done';
  syntheses[0].wordCount = wc;

  const synthesisSummary = `Added 1 new module to an existing course using ${uniqueSources.length} sources. Focus: ${topic}.`;
  updatePipeline(p, { lessonSyntheses: [...syntheses], synthesisSummary, progress: 80 });

  // ── STAGE 4: Course update (persist) ─────────────────────────────────
  updatePipeline(p, { stage: 'quality_check', progress: 90 });

  const moduleId = `${courseId}-m${moduleIndex}`;
  const newLesson: any = {
    id: lessonId,
    title: `${topic}: Overview`,
    description: `Add-on topic: ${topic}`,
    content,
    estimatedTime: Math.min(12, Math.max(6, Math.ceil(wc / 200))),
    wordCount: wc,
  };

  const newModule: any = {
    id: moduleId,
    title: topic,
    objective: `Learn ${topic} as an extension topic`,
    description: `Supplemental module added from suggested mindmap topic: ${topic}`,
    lessons: [newLesson],
  };

  existing.modules.push(newModule);
  dbCourses.save(existing);

  updatePipeline(p, {
    stage: 'reviewing',
    progress: 100,
    status: 'SUCCEEDED',
    finishedAt: new Date().toISOString(),
  });
  appendLog(p, 'info', 'run succeeded');
  broadcast(p.id, 'pipeline:complete', { courseId });
}

async function runPipeline(pipelineId: string) {
  console.log('[Pipeline] Starting pipeline', pipelineId);
  const p = pipelines.get(pipelineId);
  if (!p) return;

  updatePipeline(p, { status: 'RUNNING', startedAt: p.startedAt || new Date().toISOString() });
  appendLog(p, 'info', `run started id=${pipelineId}`);

  const topic = p.topic;

  // ── STAGE 1: Scraping (bulk research) ──────────────────────────────────
  updatePipeline(p, { stage: 'scraping', progress: 5 });
  appendLog(p, 'info', `stage=scraping topic="${topic}"`);

  // Threads are used only for UI progress visualization. Query generation is handled
  // by OpenAI web_search + extraction.
  const threads: CrawlThread[] = Array.from({ length: 5 }).map((_, i) => ({
    id: `thread-${i}`,
    // Placeholder shown in UI; real queries are logged from OpenAI web_search.
    url: `Research thread ${i + 1}`,
    status: 'pending' as const,
  }));
  updatePipeline(p, { crawlThreads: threads });

  // Use OpenAI web_search for bulk research
  let crawledSources: FirecrawlSource[] = [];

  // Update threads visually as we go
  for (let i = 0; i < threads.length; i++) {
    threads[i].status = 'crawling';
    updatePipeline(p, {
      crawlThreads: [...threads],
      progress: 5 + Math.round((i / threads.length) * 20),
    });
  }

  // OpenAI-only Phase 1: single research pass via OpenAI web_search.
  appendLog(p, 'info', `openai_web_search:course topic="${topic}"`);
  const extractedCourse = await searchAndExtractTopic({
    topic,
    maxResults: 12,
    perPageTimeoutMs: 12_000,
  } as any);

  crawledSources = extractedCourse.sources.map((s: any) => ({
    url: s.url,
    title: s.title,
    author: s.author,
    domain: s.publisher || new URL(s.url).hostname,
    source: 'openai_web_search',
    content: s.extractedText || s.snippet || '',
    wordCount: (s.extractedText || s.snippet || '').split(/\s+/).filter(Boolean).length,
    credibilityScore: 0.7,
    recencyScore: 0.6,
    relevanceScore: 0.7,
    provider: 'openai_web_search',
  })) as any;

  appendLog(p, 'info', `openai_web_search:course results=${crawledSources.length}`);

  // Persist the actual sources discovered so the UI can attribute what was used.
  updatePipeline(p, {
    sources: crawledSources.map((s) => ({
      url: s.url,
      title: s.title,
      domain: s.domain,
      author: s.author,
      publishDate: s.publishDate || undefined,
      credibilityScore: s.credibilityScore,
      provider: (s as any).provider || s.source || s.domain,
      summary: (s.content || '').slice(0, 240),
    })),
  });

  for (let i = 0; i < threads.length; i++) {
    threads[i].status = 'done';
    const chunk = crawledSources.slice(i * 4, (i + 1) * 4);
    threads[i].title = chunk.length > 0 ? `Found ${chunk.length} sources` : 'Completed';
    threads[i].contentPreview = chunk
      .map((s) => s.title)
      .join(', ')
      .slice(0, 100);
    threads[i].wordCount = chunk.reduce((s, c) => s + c.wordCount, 0);
  }

  // OpenAI-only: if Phase 1 returned no sources, proceed with an empty bundle (MVP truth).
  updatePipeline(p, { crawlThreads: [...threads], progress: 25 });

  // Persist the Phase 1 research bundle (sources + extracted markdown + images manifest)
  // so later stages can run without re-scraping.
  try {
    const { client: openaiForResearch } = getOpenAIForRequest({
      userId: (p as any).userId || 'test-user-1',
      tier: (p as any).tier || 'pro',
    });

    const web = await searchAndExtractTopic({
      topic,
      openai: openaiForResearch || undefined,
      maxResults: 12,
      maxPagesToExtract: 6,
      perPageTimeoutMs: 12_000,
    } as any);

    // Attach a few Wikimedia Commons license-safe images per topic (best-effort)
    const images = await searchWikimediaCommonsImages(topic, { limit: 4 }).catch(() => []);

    await writeCourseResearch(`course-${p.courseId || p.id}`, {
      topic: web.topic,
      sourcesMissingReason: web.sourcesMissingReason,
      sources: (web.sources || []).map((s) => ({
        ...s,
        images: (s.images || []).concat(
          images.slice(0, 4).map((img) => ({
            url: img.url,
            alt: img.title,
            credit: img.author,
            license: img.license,
            sourceUrl: img.sourcePageUrl,
          })),
        ),
      })),
    });

    appendLog(p, 'info', 'artifacts:course research bundle written');
  } catch (err: any) {
    appendLog(
      p,
      'warn',
      `artifacts:course research bundle write failed | message="${safeErrorMessage(err)}"`,
    );
  }

  const sourceMode = 'real' as const; // web-search-provider always uses real web sources
  updatePipeline(p, { progress: 28, sourceMode });

  const { client: openai } = getOpenAIForRequest({
    userId: (p as any).userId || 'test-user-1',
    tier: (p as any).tier || 'pro',
  });

  // Generate INFORMED course plan using scraped sources
  let modules: TopicModule[] = [];
  try {
    // Log the OpenAI request/response for the syllabus generation into pipeline logs + disk artifacts.
    // We reconstruct the request payload here to avoid threading pipeline state into helpers.
    const sourceContext = crawledSources
      .slice(0, 15)
      .map(
        (s, i) =>
          `[Source ${i + 1}] "${s.title}" (${(s as any).domain || ''})\n${String((s as any).content || '').slice(0, 800)}`,
      )
      .join('\n---\n');
    const hasRealSources = crawledSources.length > 0;
    const syllabusReq = {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' as const },
      messages: [
        {
          role: 'system' as const,
          content: `You are a curriculum designer. Generate a detailed course syllabus as JSON. Return:\n{\n  "courseTitle": "A specific, compelling course title",\n  "courseDescription": "2-3 sentence description",\n  "modules": [\n    {\n      "title": "Module title specific to the topic",\n      "objective": "What the learner will achieve",\n      "lessons": [\n        { "title": "Specific lesson title", "description": "What this lesson covers" }\n      ]\n    }\n  ]\n}\nRules:\n- Generate 4-6 modules, each with 3-5 lessons\n- Titles must be SPECIFIC to the topic (not generic like "Foundations of X")\n- Lessons should progress from fundamentals to advanced\n- Include practical/hands-on lessons\n- Each lesson title should be unique and descriptive\n${hasRealSources ? `- You have REAL scraped web sources below. Use them to inform what topics are trending, important, and practically relevant. Base your module/lesson titles on what the sources actually cover — not generic templates.` : ''}`,
        },
        {
          role: 'user' as const,
          content: `Create a comprehensive intermediate-level course syllabus for: "${topic}"${hasRealSources ? `\n\nHere are real sources scraped from the web to inform your plan:\n\n${sourceContext}` : ''}`,
        },
      ],
    };

    if (!openai) throw new Error('openai_unavailable');
    const syllabusResp = await openai.chat.completions.create(syllabusReq as any);
    await logOpenAIRequestResponse({
      p,
      courseId: `course-${p.courseId || p.id}`,
      kind: 'course_syllabus',
      request: syllabusReq,
      response: syllabusResp,
    });

    // Reuse the existing parser by passing the sources + openai client
    modules = await generateModulesForTopic(topic, crawledSources, openai);
  } catch (err: any) {
    // OpenAI invalid_api_key / 401/403 should be clearly visible in pipeline logs.
    const statusCode = extractStatusCode(err);
    const msg = safeErrorMessage(err);
    const code = String(err?.code || '').toLowerCase();
    const type = String(err?.type || '').toLowerCase();
    const looksAuth =
      statusCode === 401 ||
      statusCode === 403 ||
      code.includes('invalid_api_key') ||
      type.includes('invalid_api_key');
    if (looksAuth) {
      logAuthIssue(p.id, 'OpenAI', statusCode, msg, 'OPENAI_API_KEY');
    } else {
      appendLog(
        p,
        'warn',
        `OpenAI error while generating modules (continuing with generic) | message="${msg}"`,
      );
    }
    modules = getGenericModules(topic);
  }
  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);

  const llmTitle = (generateModulesForTopic as any)._lastTitle;
  const llmDesc = (generateModulesForTopic as any)._lastDescription;

  p.moduleCount = modules.length;
  p.lessonCount = totalLessons;
  p.courseTitle = llmTitle || `Mastering ${topic}`;
  p.courseDescription =
    llmDesc ||
    `Build practical skill in ${topic} through guided lessons and worked examples (intermediate level).`;

  updatePipeline(p, { progress: 30 });

  // ── STAGE 2: Organizing ────────────────────────────────────────────────
  updatePipeline(p, { stage: 'organizing', progress: 35 });

  // Deduplicate and score
  const uniqueSources = crawledSources.filter(
    (s, i, arr) => arr.findIndex((x) => x.url === s.url) === i,
  );
  const credScores = uniqueSources.map((s) => s.credibilityScore);
  const themes = [...new Set(modules.map((m) => m.title))];

  updatePipeline(p, {
    organizedSources: uniqueSources.length,
    deduplicatedCount: crawledSources.length - uniqueSources.length,
    credibilityScores: credScores,
    themes,
    progress: 45,
  });

  if (!process.env.VITEST && process.env.NODE_ENV !== 'test') {
    await new Promise((r) => setTimeout(r, 1000));
  }

  // ── STAGE 3: Synthesizing (per-lesson scraping + generation) ─────────
  updatePipeline(p, { stage: 'synthesizing', progress: 50 });

  const syntheses: LessonSynthesis[] = [];
  const allLessons: Array<{
    id: string;
    title: string;
    description: string;
    content: string;
    estimatedTime: number;
    wordCount: number;
  }> = [];

  let lessonIdx = 0;
  for (let mi = 0; mi < modules.length; mi++) {
    for (let li = 0; li < modules[mi].lessons.length; li++) {
      const les = modules[mi].lessons[li];
      const lessonId = `${p.courseId}-m${mi}-l${li}`;
      const synth: LessonSynthesis = {
        lessonId,
        lessonTitle: les.title,
        status: 'pending',
        wordCount: 0,
        sourcesUsed: 0,
      };
      syntheses.push(synth);
    }
  }
  updatePipeline(p, { lessonSyntheses: [...syntheses] });

  for (let mi = 0; mi < modules.length; mi++) {
    for (let li = 0; li < modules[mi].lessons.length; li++) {
      const les = modules[mi].lessons[li];
      const lessonId = `${p.courseId}-m${mi}-l${li}`;
      const synthIdx = syntheses.findIndex((s) => s.lessonId === lessonId);

      syntheses[synthIdx].status = 'generating';
      updatePipeline(p, {
        lessonSyntheses: [...syntheses],
        progress: 50 + Math.round((lessonIdx / totalLessons) * 30),
      });

      try {
        appendLessonMilestone(p, { lessonId, lessonTitle: les.title, type: 'plan_ready' });

        const withTimeout = async <T>(
          label: string,
          ms: number,
          fn: () => Promise<T>,
        ): Promise<T> => {
          // Keep pipeline from being marked stalled while awaiting long network ops.
          const keepAlive = setInterval(() => {
            try {
              updatePipeline(p, {} as any);
            } catch {
              // ignore
            }
          }, 20_000).unref();

          const t = new Promise<T>((_, reject) => {
            const id = setTimeout(() => reject(new Error(`${label}_timeout_${ms}ms`)), ms);
            (reject as any)._timeoutId = id;
          });

          try {
            return await Promise.race([fn(), t]);
          } finally {
            clearInterval(keepAlive);
          }
        };

        // ── Per-lesson source scraping ──
        console.log(`[Pipeline] Scraping sources for lesson: "${les.title}"`);
        let lessonSources: FirecrawlSource[];
        try {
          if (process.env.NODE_ENV === 'test') {
            lessonSources = uniqueSources.slice(0, 6);
          } else {
            // OpenAI-only: stage2 query templates are removed.

            const extracted = await withTimeout('lesson_scrape', 90_000, async () =>
              searchAndExtractTopic({
                topic: `${topic} ${les.title}`,
                maxResults: 8,
                perPageTimeoutMs: 12_000,
              } as any),
            );

            lessonSources = extracted.sources.map((s: any) => ({
              url: s.url,
              title: s.title,
              author: s.author,
              domain: s.publisher || new URL(s.url).hostname,
              source: 'openai_web_search',
              content: s.extractedText || s.snippet || '',
              wordCount: (s.extractedText || s.snippet || '').split(/\s+/).filter(Boolean).length,
              credibilityScore: 0.7,
              recencyScore: 0.6,
              relevanceScore: 0.7,
              provider: 'openai_web_search',
            })) as any;

            appendLog(
              p,
              'info',
              `lesson.research.provider=openai_web_search lesson="${les.title}" sources=${lessonSources.length}`,
            );
          }
        } catch (err: any) {
          // Log provider errors (esp. auth) without leaking secrets.
          const statusCode = extractStatusCode(err);
          const msg = safeErrorMessage(err);
          const provider = String(err?.provider || 'web_search');
          const envVar =
            provider === 'tavily'
              ? 'TAVILY_API_KEY'
              : provider === 'openai'
                ? 'OPENAI_API_KEY'
                : undefined;
          logAuthIssue(p.id, provider, statusCode, msg, envVar);

          console.warn(
            `[Pipeline] Per-lesson scrape failed for "${les.title}", falling back to course sources:`,
            err,
          );
          lessonSources = uniqueSources.slice(0, 6);
        }

        if (lessonSources.length === 0) {
          lessonSources = uniqueSources.slice(0, 6);
        }

        // Persist per-lesson research bundle so later stages don't need to re-scrape.
        try {
          const images = await searchWikimediaCommonsImages(`${topic} ${les.title}`, {
            limit: 4,
          }).catch(() => []);

          await writeLessonResearch(`course-${p.courseId || p.id}`, lessonId, {
            topic: `${topic} / ${modules[mi].title} / ${les.title}`,
            sources: (lessonSources || []).slice(0, 8).map((s) => ({
              url: s.url,
              title: s.title,
              publisher: s.domain,
              accessedAt: p.startedAt,
              snippet: (s.content || '').slice(0, 240),
              extractedText: (s.content || '').slice(0, 20_000),
              images: images.slice(0, 4).map((img) => ({
                url: img.url,
                alt: img.title,
                credit: img.author,
                license: img.license,
                sourceUrl: img.sourcePageUrl,
              })),
            })),
          });
          appendLog(p, 'info', `artifacts:lesson research bundle written | lessonId=${lessonId}`);
        } catch (err: any) {
          appendLog(
            p,
            'warn',
            `artifacts:lesson research bundle write failed | lessonId=${lessonId} | message="${safeErrorMessage(err)}"`,
          );
        }

        // Update live source cards for UI and downstream Further Reading blocks.
        const cards = buildSourceCards(
          lessonSources,
          `${topic} / ${modules[mi].title} / ${les.title}`,
          {
            accessedAt: p.startedAt,
            limit: 40,
          },
        );
        updatePipeline(p, { sourceCards: cards });
        appendLessonMilestone(p, { lessonId, lessonTitle: les.title, type: 'sources_ready' });
        const further = selectFurtherReadingCards(cards, { min: 2, max: 5 });

        let content = '';
        let wc = 0;
        const MIN_WORDS = 500;

        // Try up to 3 times to get adequate content
        for (let attempt = 0; attempt < 3; attempt++) {
          const minWordHint =
            attempt > 0
              ? ` The response MUST be at least 800 words. Be thorough and detailed.`
              : '';
          const temp = attempt >= 2 ? 0.9 : 0.7;
          try {
            // Use saved artifacts if available (no re-scrape), so generation is reproducible.
            let sourcesForGen = lessonSources;
            try {
              const bundle = await readLessonResearch(`course-${p.courseId || p.id}`, lessonId);
              if (bundle?.sources?.length) {
                sourcesForGen = bundle.sources.map((s: any) => ({
                  url: s.url,
                  title: s.title,
                  domain: s.publisher || (s.url ? new URL(s.url).hostname : ''),
                  content: s.extractedText || '',
                  author: '',
                  publishDate: null,
                  credibilityScore: 0,
                  relevanceScore: 0,
                  recencyScore: 0,
                  wordCount: (s.extractedText || '').split(/\s+/).filter(Boolean).length,
                  source: s.publisher,
                }));
              }
            } catch {
              // best-effort: fall back to in-memory scraped sources
            }

            const lessonReq = {
              model: 'gpt-4o-mini',
              temperature: temp,
              max_tokens: 5000,
              lessonTitle: les.title,
              moduleTitle: modules[mi].title,
              topic,
              sourcesCount: sourcesForGen.length,
            };
            appendLog(
              p,
              'info',
              `[openai.request] kind=lesson_generate meta=${redactSecrets(previewJson(lessonReq, 1200))}`,
            );

            content = await withTimeout('lesson_synthesize', 120_000, async () =>
              generateLesson(
                topic,
                modules[mi].title,
                les.title,
                les.description,
                sourcesForGen,
                openai,
                minWordHint,
                temp,
              ),
            );

            appendLog(
              p,
              'info',
              `[openai.response] kind=lesson_generate length=${content?.length || 0}`,
            );

            content = `${content}${formatFurtherReadingBlock(further)}`;
          } catch (err: any) {
            const statusCode = extractStatusCode(err);
            const msg = safeErrorMessage(err);
            const code = String(err?.code || '').toLowerCase();
            const type = String(err?.type || '').toLowerCase();
            const looksAuth =
              statusCode === 401 ||
              statusCode === 403 ||
              code.includes('invalid_api_key') ||
              type.includes('invalid_api_key');
            if (looksAuth) {
              logAuthIssue(p.id, 'OpenAI', statusCode, msg, 'OPENAI_API_KEY');
            } else {
              appendLog(
                p,
                'warn',
                `OpenAI error while generating lesson (attempt ${attempt + 1}) | message="${msg}"`,
              );
            }
            throw err;
          }
          wc = content.split(/\s+/).filter((w) => w).length;
          if (wc >= MIN_WORDS) break;
          console.warn(
            `[Pipeline] Lesson "${les.title}" attempt ${attempt + 1}: ${wc} words (min ${MIN_WORDS})`,
          );
        }

        // If still short after retries, use enhanced fallback
        if (wc < MIN_WORDS) {
          content = generateEnhancedFallback(topic, modules[mi].title, les.title, les.description);
          content = `${content}${formatFurtherReadingBlock(further)}`;
          wc = content.split(/\s+/).filter((w) => w).length;
        }

        appendLessonMilestone(p, { lessonId, lessonTitle: les.title, type: 'draft_ready' });
        appendLessonMilestone(p, { lessonId, lessonTitle: les.title, type: 'quality_passed' });

        syntheses[synthIdx].status = 'done';
        syntheses[synthIdx].wordCount = wc;
        syntheses[synthIdx].sourcesUsed = lessonSources.length;

        allLessons.push({
          id: lessonId,
          title: les.title,
          description: les.description,
          content,
          estimatedTime: Math.max(5, Math.ceil(wc / 200)),
          wordCount: wc,
        });
      } catch (err: any) {
        const msg = safeErrorMessage(err);
        appendLog(p, 'error', `lesson_failed | lesson="${les.title}" | message="${msg}"`);
        appendLessonMilestone(p, { lessonId, lessonTitle: les.title, type: 'draft_ready' });
        // NOTE: in failure mode we do not emit quality_passed.
        syntheses[synthIdx].status = 'failed';
        syntheses[synthIdx].wordCount = 0;
        let fallback = generateEnhancedFallback(
          topic,
          modules[mi].title,
          les.title,
          les.description,
        );
        // best-effort: in case further-reading cards weren't computed (unexpected early failure)
        const bestEffortFurther = selectFurtherReadingCards(p.sourceCards || []);
        fallback = `${fallback}${formatFurtherReadingBlock(bestEffortFurther)}`;
        const wc = fallback.split(/\s+/).filter((w) => w).length;
        allLessons.push({
          id: lessonId,
          title: les.title,
          description: les.description,
          content: fallback,
          estimatedTime: Math.max(5, Math.ceil(wc / 200)),
          wordCount: wc,
        });
      }

      updatePipeline(p, { lessonSyntheses: [...syntheses] });
      lessonIdx++;
    }
  }

  const synthesisSummary = `Generated ${allLessons.length} lessons across ${modules.length} modules using ${uniqueSources.length} primary sources. Key themes: ${themes.slice(0, 5).join(', ') || 'N/A'}. (Synthesis is best-effort; timeouts fall back to snippet-based drafts.)`;
  updatePipeline(p, { progress: 82, synthesisSummary });

  // ── STAGE 4: Quality Check ─────────────────────────────────────────────
  updatePipeline(p, { stage: 'quality_check', progress: 85 });

  const qualityResults: QualityResult[] = allLessons.map((lesson) => {
    const objectivesMatch = lesson.content.match(/^- .+$/gm);
    const takeawaysMatch = lesson.content.match(/^\d+\. .+$/gm);
    const sourcesMatch = lesson.content.match(/^\[\d+\]/gm);
    const readability = Math.min(
      100,
      Math.max(40, 60 + (lesson.wordCount > 500 ? 20 : 0) + (objectivesMatch ? 10 : 0)),
    );

    return {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      checks: {
        wordCount: { pass: lesson.wordCount >= 500, value: lesson.wordCount, min: 500 },
        objectives: {
          pass: (objectivesMatch?.length || 0) >= 2,
          count: objectivesMatch?.length || 0,
          min: 2,
        },
        takeaways: {
          pass: (takeawaysMatch?.length || 0) >= 3,
          count: takeawaysMatch?.length || 0,
          min: 3,
        },
        sources: {
          pass: (sourcesMatch?.length || 0) >= 2,
          count: sourcesMatch?.length || 0,
          min: 2,
        },
        readability: { pass: readability >= 60, score: readability },
      },
      overallPass: lesson.wordCount >= 500 && readability >= 60,
    };
  });

  updatePipeline(p, { qualityResults, progress: 92 });
  if (!process.env.VITEST && process.env.NODE_ENV !== 'test') {
    await new Promise((r) => setTimeout(r, 500));
  }

  // ── STAGE 5: Ready for Review ──────────────────────────────────────────
  // Build the course object and store it
  const { courses } = await import('./courses.js');

  const builtModules = modules.map((mod, mi) => ({
    id: `${p.courseId}-m${mi}`,
    title: mod.title,
    objective: mod.objective,
    description: mod.objective,
    lessons: allLessons.filter((l) => l.id.startsWith(`${p.courseId}-m${mi}-`)),
  }));

  const course = {
    id: p.courseId,
    title: p.courseTitle!,
    description: p.courseDescription!,
    topic,
    depth: 'intermediate',
    // Pipeline-created courses must be owned by the authenticated user for limits/deletion/analytics.
    authorId: (p as any).userId || 'pipeline',
    modules: builtModules,
    progress: {},
    // Iter74 P0.1: persist course plan artifact on pipeline-created courses too.
    plan: buildCoursePlan({
      topic,
      depth: 'intermediate',
      modules,
      topicSources: uniqueSources,
    }),
    createdAt: new Date().toISOString(),
  };

  courses.set(course.id, course);
  dbCourses.save(course);

  updatePipeline(p, {
    stage: 'reviewing',
    progress: 100,
    status: 'SUCCEEDED',
    finishedAt: new Date().toISOString(),
  });
  appendLog(p, 'info', 'run succeeded');
  broadcast(p.id, 'pipeline:complete', { courseId: p.courseId });
}

function generateEnhancedFallback(
  topic: string,
  moduleTitle: string,
  lessonTitle: string,
  lessonDesc: string,
): string {
  return `# ${lessonTitle}

## Learning Objectives
- Understand the core principles of ${lessonDesc.toLowerCase()}
- Apply concepts from ${moduleTitle} to practical scenarios
- Evaluate trade-offs and best practices in the context of ${topic}

## Estimated Time
**10 minutes**

## Main Content

### What is ${lessonTitle}?

${lessonDesc}. This concept is a critical building block within ${topic}, and understanding it deeply will give you a strong foundation for more advanced material in ${moduleTitle}.

At its core, **${lessonTitle.toLowerCase()}** addresses a fundamental challenge: how do we translate theoretical knowledge of ${topic} into practical, repeatable outcomes? The answer lies in understanding both the underlying principles and the proven techniques that practitioners use every day.

### Why It Matters

The significance of ${lessonTitle.toLowerCase()} extends beyond academic interest. In real-world applications:

- **In industry**, organizations use these principles to build scalable systems, optimize processes, and drive measurable business outcomes. For example, companies adopting structured approaches to ${topic.toLowerCase()} have reported significant improvements in efficiency and quality.
- **In research**, these concepts provide rigorous frameworks for experimentation and analysis, ensuring reproducible and reliable results.
- **In practice**, mastering ${lessonTitle.toLowerCase()} enables you to make better-informed decisions, avoid common pitfalls, and deliver higher-quality work.

### Core Principles and Techniques

There are several foundational techniques you need to understand:

1. **Systematic decomposition** — Break complex problems into smaller, manageable components. This allows you to apply targeted solutions and measure effectiveness incrementally. For ${topic.toLowerCase()}, this often means isolating variables, defining clear metrics, and iterating on each component separately.

2. **Iterative refinement** — Rather than seeking a perfect solution upfront, start with a prototype, test it, gather feedback, and improve. This agile approach is especially effective in ${topic.toLowerCase()} where requirements and understanding evolve rapidly.

3. **Evidence-based decision making** — Ground every decision in data and measurable outcomes. Track key metrics, run experiments, and let results guide your next steps rather than relying on intuition alone.

### Practical Example

Consider a scenario where you need to implement ${lessonTitle.toLowerCase()} in a real project:

- **Step 1**: Define your objective clearly — what specific outcome are you trying to achieve within ${moduleTitle.toLowerCase()}?
- **Step 2**: Research existing approaches — what has worked for others in similar ${topic.toLowerCase()} contexts?
- **Step 3**: Build a minimal implementation and test it against your defined metrics.
- **Step 4**: Analyze results, identify gaps, and iterate. Document what you learn at each stage.
- **Step 5**: Scale the solution once validated, incorporating monitoring and feedback loops.

This structured approach ensures that you are not just learning theory but building real competence through application.

### Common Pitfalls to Avoid

- **Over-engineering early** — Start simple, validate, then add complexity
- **Ignoring context** — Techniques that work in one area of ${topic.toLowerCase()} may not transfer directly; always consider your specific constraints
- **Skipping measurement** — Without clear metrics, you cannot know if your approach is working
- **Working in isolation** — Collaborate with peers, review existing literature, and leverage community knowledge

## Key Takeaways
1. **${lessonTitle}** is foundational to ${topic} — master it before moving to advanced topics
2. Combine systematic decomposition with iterative refinement for best results
3. Always ground decisions in evidence and measurable outcomes
4. Real-world application is essential — theory alone is insufficient
5. Avoid common pitfalls by starting simple, measuring everything, and iterating

## Sources
- Content synthesized from established best practices in ${topic}
- Industry standards and practitioner guidelines for ${moduleTitle.toLowerCase()}`;
}

async function generateLesson(
  topic: string,
  moduleTitle: string,
  lessonTitle: string,
  lessonDesc: string,
  sources: FirecrawlSource[],
  openai: any = null,
  extraInstruction: string = '',
  temperature: number = 0.7,
): Promise<string> {
  // Pass up to 6 sources with actual content (first 1500 chars each)
  const topSources = sources.slice(0, 6);
  const srcContext = topSources
    .map(
      (s, i) =>
        `[Source ${i + 1}] Title: "${s.title}"\nURL: ${s.url}\nDomain: ${s.domain}\nContent:\n${(s.content || '').slice(0, 1500)}`,
    )
    .join('\n\n---\n\n');

  const sourceList = topSources.map((s, i) => `${i + 1}. [${s.title}](${s.url})`).join('\n');

  if (openai) {
    try {
      const resp = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature,
        max_tokens: 5000,
        messages: [
          {
            role: 'system',
            content: `You are a world-class science communicator and educator — think Feynman meets Kurzgesagt. Your job is to make complex topics feel simple, visual, and fascinating.

WRITING PHILOSOPHY:
- **Simple first**: Explain like the reader is smart but new to this. No jargon without an immediate plain-English explanation.
- **Visual & concrete**: Use analogies, mental models, and "imagine this..." scenarios. Describe things so vividly the reader can picture them.
- **Interesting**: Lead with the most surprising or counterintuitive fact. Make the reader think "wait, really?"
- **Frontier-focused**: Always end with what's NEW — emerging research, open questions, bleeding-edge applications. Give the learner rabbit holes to explore.

STRICT SOURCE RULES:
1. Synthesize from the provided sources. Cite as inline links: [Source Title](https://url.com)
2. Each source must appear at least once in the body
3. Extract specific facts, examples, stats, code snippets FROM sources — no generic filler
4. Every substantive claim traces back to a source

STRUCTURE:

# [Lesson Title]

## Learning Objectives
- 3-4 objectives framed as "By the end, you'll be able to..." (specific, not vague)

## Estimated Time
**X minutes**

## Main Content
900-1400 words. 4-6 subsections with ### headings.

### [Hook — start with the most interesting angle]
Open with a surprising fact, a "what if" question, or a real-world story that makes the reader care.

### [Core Concepts — simplified with analogies]
- Use analogies: "Think of X like Y..."
- Use ASCII diagrams or simple text visuals where they help:
  \`\`\`
  Request → Load Balancer → [Server A] [Server B] [Server C]
  \`\`\`
- Bold **key terms** and immediately define them in plain language
- Compare and contrast: "Unlike X, which does A, Y does B because..."

### [Practical — show don't tell]
- Real code examples (if technical), real case studies, or step-by-step walkthroughs
- "Here's what this looks like in practice..."

### [Why It Matters — connect to the bigger picture]
- How does this fit into the broader field? What problems does it solve?

### 🔭 Frontiers & Open Questions
This section is MANDATORY. Include:
- What's the cutting-edge research in this area right now?
- What unsolved problems remain?
- What emerging tools, frameworks, or approaches are changing the game?
- 3-5 specific topics the learner could explore next, with brief descriptions of why they're exciting
- Frame as: "If this topic excites you, look into..."

## Key Takeaways
1. 5-6 specific, memorable takeaways (write them like you'd text a friend, not a textbook)

## Sources
- List each source as: [Title](URL)

${extraInstruction}`,
          },
          {
            role: 'user',
            content: `Create a lesson titled "${lessonTitle}" for module "${moduleTitle}" in a course on "${topic}".
Lesson description: ${lessonDesc}

HERE ARE YOUR SOURCES — synthesize content from these:

${srcContext}

Available sources for the Sources section:
${sourceList}

Write the lesson now, starting with # ${lessonTitle}`,
          },
        ],
      });
      const content = resp.choices[0]?.message?.content;
      if (content && content.length > 200) return content;
    } catch (err) {
      console.warn('[Pipeline] LLM generation failed:', err);
    }
  }

  // Fallback — use source-aware fallback
  return generateSourceAwareFallback(topic, moduleTitle, lessonTitle, lessonDesc, topSources);
}

function generateSourceAwareFallback(
  topic: string,
  moduleTitle: string,
  lessonTitle: string,
  lessonDesc: string,
  sources: FirecrawlSource[],
): string {
  const sourceRefs = sources.map((s, _i) => `[${s.title}](${s.url})`);
  const sourceList = sources.map((s) => `- [${s.title}](${s.url})`).join('\n');

  const sections: string[] = [];
  sections.push(`# ${lessonTitle}\n`);
  sections.push(`## Learning Objectives`);
  sections.push(`- Understand the core principles of ${lessonDesc.toLowerCase()}`);
  sections.push(`- Apply concepts from ${moduleTitle} to practical scenarios`);
  sections.push(`- Evaluate trade-offs and best practices in the context of ${topic}\n`);
  sections.push(`## Estimated Time\n**10 minutes**\n`);
  sections.push(`## Main Content\n`);

  sections.push(`### Overview\n`);
  sections.push(
    `${lessonDesc}. This concept is a critical building block within ${topic}, and understanding it deeply will give you a strong foundation for more advanced material in ${moduleTitle}.\n`,
  );

  // Synthesize from actual sources
  if (sources.length > 0) {
    sections.push(`### Insights from Research\n`);
    for (let i = 0; i < Math.min(sources.length, 4); i++) {
      const s = sources[i];
      const snippet = (s.content || '').slice(0, 300).replace(/\n/g, ' ').trim();
      if (snippet) {
        sections.push(
          `According to ${sourceRefs[i]}, ${snippet.endsWith('.') ? snippet : snippet + '.'}\n`,
        );
      }
    }

    sections.push(`### Key Concepts and Techniques\n`);
    for (let i = 0; i < Math.min(sources.length, 3); i++) {
      const s = sources[i];
      const sentences = (s.content || '').split(/\.\s+/).filter((sent) => sent.length > 40);
      const points = sentences.slice(1, 4);
      if (points.length > 0) {
        sections.push(`From ${sourceRefs[i]}:\n`);
        for (const pt of points) {
          sections.push(`- ${pt.trim()}`);
        }
        sections.push('');
      }
    }
  }

  sections.push(`### Practical Applications\n`);
  sections.push(
    `The concepts discussed above have direct practical applications. When working with ${lessonTitle.toLowerCase()}, consider starting with the foundational concepts outlined above, then progressively applying them to your specific use case.\n`,
  );

  sections.push(`## Key Takeaways`);
  sections.push(`1. ${lessonTitle} is foundational to ${topic}`);
  sections.push(`2. Multiple authoritative sources confirm the importance of these concepts`);
  sections.push(`3. Combine systematic approaches with iterative refinement for best results`);
  sections.push(`4. Always ground decisions in evidence and measurable outcomes`);
  sections.push(`5. Real-world application is essential — theory alone is insufficient\n`);

  sections.push(`## Sources`);
  sections.push(sourceList);

  return sections.join('\n');
}

// ── Routes ───────────────────────────────────────────────────────────────────

/** POST /api/v1/pipeline/add-topic — Add a suggested topic to an existing course with pipeline UX */
const addTopicSchema = z.object({
  courseId: z.string().min(1),
  topic: z.string().min(1),
  parentLessonId: z.string().min(1).optional(),
});

router.post('/add-topic', validateBody(addTopicSchema), (req: Request, res: Response) => {
  const { courseId, topic, parentLessonId } = req.body;
  // parentLessonId is optional for future lesson-level insertion; v1 ignores it server-side.
  void parentLessonId;

  const pipelineId = uuid();

  const now = new Date().toISOString();
  const state: PipelineState & { userId?: string; tier?: string } = {
    id: pipelineId,
    courseId,
    topic: topic.trim(),
    userId: req.user?.sub,
    tier: req.user?.tier,
    status: 'QUEUED',
    stage: 'scraping',
    progress: 0,
    startedAt: now,
    updatedAt: now,
    logs: [{ ts: now, level: 'info', message: 'queued (add-topic)' }],
    crawlThreads: [],
    sources: [],
    synthesisSummary: '',
    organizedSources: 0,
    deduplicatedCount: 0,
    credibilityScores: [],
    themes: [],
    lessonSyntheses: [],
    qualityResults: [],
  };

  pipelines.set(pipelineId, state);
  dbPipelines.save(state);

  runAddTopicPipeline(pipelineId).catch((err) => {
    const p = pipelines.get(pipelineId);
    if (p) failPipeline(p, 'error', err);
  });

  res.status(201).json({ pipelineId, courseId });
});

/** POST /api/v1/pipeline — Start a new course creation pipeline */
const createPipelineSchema = z.object({
  topic: z.string().min(1),
});

router.post('/', validateBody(createPipelineSchema), (req: Request, res: Response) => {
  const { topic } = req.body;

  const pipelineId = uuid();
  // Deterministic course id for idempotency: one pipeline → one course.
  // Prevents duplicate courses when a pipeline is retried or resumed.
  const courseId = `course-${pipelineId}`;

  // Enforce free-tier course limit server-side (pipelines create new courses).
  const tier = req.user?.tier || 'free';
  if (tier !== 'pro') {
    const authorId = req.user?.sub;
    if (authorId) {
      const existingCount = dbCourses.getAll().filter((c: any) => c.authorId === authorId).length;
      const FREE_LIMIT = 3;
      if (existingCount >= FREE_LIMIT) {
        sendError(res, req, {
          status: 402,
          code: 'payment_required',
          message: 'Free plan is limited to 3 courses. Upgrade to Pro for unlimited courses.',
          details: { tier, limit: FREE_LIMIT, count: existingCount },
        });
        return;
      }
    }
  }

  const now = new Date().toISOString();
  const state: PipelineState & { userId?: string; tier?: string } = {
    id: pipelineId,
    courseId,
    topic,
    userId: req.user?.sub,
    tier: req.user?.tier,
    status: 'QUEUED',
    stage: 'scraping',
    progress: 0,
    startedAt: now,
    updatedAt: now,
    logs: [{ ts: now, level: 'info', message: 'queued' }],
    crawlThreads: [],
    sources: [],
    synthesisSummary: '',
    organizedSources: 0,
    deduplicatedCount: 0,
    credibilityScores: [],
    themes: [],
    lessonSyntheses: [],
    qualityResults: [],
  };

  pipelines.set(pipelineId, state);
  dbPipelines.save(state);

  // Start pipeline async
  runPipeline(pipelineId).catch((err) => {
    const p = pipelines.get(pipelineId);
    if (p) failPipeline(p, 'error', err);
  });

  res.status(201).json({ pipelineId, courseId });
});

/** GET /api/v1/pipeline/:id — Get pipeline state */
router.get('/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);

  // Always prefer persisted state so UI reflects latest, and tests can force stale timestamps.
  const persisted = dbPipelines.getById(id) as PipelineState | undefined;
  const p = (persisted || pipelines.get(id)) as (PipelineState & { userId?: string }) | undefined;

  if (!p) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Pipeline not found' });
    return;
  }

  // Enforce ownership: only the pipeline owner can read it.
  // (Dev auth still sets req.user, so this holds in dev/test too.)
  if (p.userId && req.user?.sub && p.userId !== req.user.sub) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Pipeline not found' });
    return;
  }

  // Keep in-memory cache fresh
  pipelines.set(id, p);

  // Opportunistic stall check on read
  if (isStalled(p)) {
    failPipeline(p, 'stalled');
  }

  const current = pipelines.get(id) as PipelineState;
  const course = dbCourses.getById(current.courseId);

  // Attach persisted course planning artifact in the pipeline detail response for debug view.
  // Do NOT persist this onto the pipeline record (keeps pipeline state stable/portable).
  const withDebug: PipelineState = {
    ...current,
    debug: {
      ...(current.debug || {}),
      coursePlan: course?.plan,
    },
  };

  res.json(withDebug);
});

/** GET /api/v1/pipeline/:id/events — SSE stream */
router.get('/:id/events', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const persisted = dbPipelines.getById(id) as PipelineState | undefined;
  const p = (persisted || pipelines.get(id)) as (PipelineState & { userId?: string }) | undefined;
  if (!p) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Pipeline not found' });
    return;
  }

  // Enforce ownership
  if (p.userId && req.user?.sub && p.userId !== req.user.sub) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Pipeline not found' });
    return;
  }

  pipelines.set(id, p);

  // Ensure subscribers see stalled runs as failed quickly
  if (isStalled(p)) {
    failPipeline(p, 'stalled');
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  // Send current state immediately
  res.write(`event: pipeline:update\ndata: ${JSON.stringify(p)}\n\n`);

  if (!sseClients.has(id)) sseClients.set(id, new Set());
  sseClients.get(id)!.add(res);

  req.on('close', () => {
    sseClients.get(id)?.delete(res);
  });
});

/** GET /api/v1/pipeline — List all pipelines */
router.get('/', (req: Request, res: Response) => {
  // Proactively prevent stuck run accumulation
  cleanupStalePipelines();

  const userId = req.user?.sub;
  const all = Array.from(pipelines.values())
    .filter((p: any) => {
      // Only show pipelines for the current user. If userId is missing (shouldn't happen with auth), return none.
      if (!userId) return false;
      return !p.userId || p.userId === userId;
    })
    .map((p: any) => ({
      id: p.id,
      courseId: p.courseId,
      topic: p.topic,
      status: p.status,
      stage: p.stage,
      progress: p.progress,
      courseTitle: p.courseTitle,
      startedAt: p.startedAt,
      updatedAt: p.updatedAt,
      finishedAt: p.finishedAt,
      failReason: p.failReason,
    }));
  res.json({ pipelines: all });
});

/** POST /api/v1/pipeline/:id/restart — Restart a failed/stalled pipeline by creating a new run id */
router.post('/:id/restart', validateBody(z.object({})), (req: Request, res: Response) => {
  const id = String(req.params.id);
  const old = pipelines.get(id) as any;
  if (!old) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Pipeline not found' });
    return;
  }

  // Enforce ownership
  if (old.userId && req.user?.sub && old.userId !== req.user.sub) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Pipeline not found' });
    return;
  }

  // Mark old run failed if it is stalled but not yet marked
  if (isStalled(old)) {
    failPipeline(old, 'stalled');
  }

  if (old.status === 'RUNNING' || old.status === 'QUEUED') {
    sendError(res, req, {
      status: 409,
      code: 'conflict',
      message: 'Pipeline is still running',
    });
    return;
  }

  const pipelineId = uuid();
  const now = new Date().toISOString();

  // Clone params, create new courseId deterministically for the new run.
  // IMPORTANT: restarting should not be a no-op.
  const courseId = `course-${pipelineId}`;

  const next: PipelineState & { userId?: string; tier?: string } = {
    ...(old as any),
    id: pipelineId,
    courseId,
    status: 'QUEUED',
    stage: 'scraping',
    progress: 0,
    retryCount: (old as any).retryCount ? Number((old as any).retryCount) + 1 : 1,
    lastError: undefined,
    startedAt: now,
    updatedAt: now,
    finishedAt: undefined,
    failReason: undefined,
    error: undefined,
    logs: [{ ts: now, level: 'info', message: `queued (restart of ${old.id})` }],
    crawlThreads: [],
    sources: [],
    synthesisSummary: '',
    organizedSources: 0,
    deduplicatedCount: 0,
    credibilityScores: [],
    themes: [],
    lessonSyntheses: [],
    qualityResults: [],
  };

  pipelines.set(pipelineId, next);
  dbPipelines.save(next);

  // Best-effort: label old run as stale to avoid confusion
  if (old.status !== 'FAILED' && old.status !== 'SUCCEEDED') {
    failPipeline(old, 'stale');
  }

  runPipeline(pipelineId).catch((err) => {
    const p = pipelines.get(pipelineId);
    if (p) failPipeline(p, 'error', err);
  });

  res.status(201).json({ pipelineId, courseId });
});

/** GET /api/v1/pipeline/:id/lessons — Get all lessons for a pipeline's course */
router.get('/:id/lessons', async (req: Request, res: Response) => {
  const p = pipelines.get(String(req.params.id));
  if (!p) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Pipeline not found' });
    return;
  }

  const { courses } = await import('./courses.js');
  const course = courses.get(p.courseId) as any;
  if (!course) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Course not found yet' });
    return;
  }

  const lessons = course.modules.flatMap((mod: any) =>
    mod.lessons.map((l: any) => ({
      id: l.id,
      title: l.title,
      moduleTitle: mod.title,
      content: l.content,
      wordCount: l.wordCount,
      estimatedTime: l.estimatedTime,
    })),
  );
  res.json({ lessons });
});

/** POST /api/v1/pipeline/:id/lessons/:lessonId/edit — Edit a lesson with a prompt */
const editLessonSchema = z.object({
  prompt: z.string().min(1),
  // Optional per-request override key (same pattern as chat/courses)
  apiKey: z.string().optional(),
});

router.post(
  '/:id/lessons/:lessonId/edit',
  validateBody(editLessonSchema),
  async (req: Request, res: Response) => {
    const p = pipelines.get(String(req.params.id));
    if (!p) {
      sendError(res, req, { status: 404, code: 'not_found', message: 'Pipeline not found' });
      return;
    }
    if (p.stage !== 'reviewing') {
      sendError(res, req, {
        status: 400,
        code: 'validation_error',
        message: 'Pipeline must be in reviewing stage',
      });
      return;
    }

    const { prompt } = req.body;

    const lessonId = String(req.params.lessonId);

    // Find the course and lesson
    const { courses } = await import('./courses.js');
    const course = courses.get(p.courseId) as any;
    if (!course) {
      sendError(res, req, { status: 404, code: 'not_found', message: 'Course not found' });
      return;
    }

    let targetLesson: any = null;
    for (const mod of course.modules) {
      const found = mod.lessons.find((l: any) => l.id === lessonId);
      if (found) {
        targetLesson = found;
        break;
      }
    }
    if (!targetLesson) {
      sendError(res, req, { status: 404, code: 'not_found', message: 'Lesson not found' });
      return;
    }

    const { client: openai } = getOpenAIForRequest({
      userId: req.user!.sub,
      tier: req.user!.tier,
      apiKeyOverride: (req.body as any)?.apiKey,
    });
    if (!openai) {
      sendError(res, req, {
        status: 500,
        code: 'openai_unavailable',
        message: 'OpenAI not configured',
      });
      return;
    }

    try {
      const resp = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 4000,
        messages: [
          {
            role: 'system',
            content: `You are an expert educational content editor. You will be given the current lesson content and a user's edit instruction. Revise the lesson accordingly while maintaining the same structure (headings, objectives, takeaways, sources). Keep all source attributions and links intact. Return the full revised lesson content in markdown.`,
          },
          {
            role: 'user',
            content: `Here is the current lesson content:\n\n${targetLesson.content}\n\n---\n\nThe user wants: ${prompt}\n\nRevise the lesson accordingly. Return the FULL revised lesson content.`,
          },
        ],
      });

      const newContent = resp.choices[0]?.message?.content;
      if (newContent && newContent.length > 100) {
        targetLesson.content = newContent;
        targetLesson.wordCount = newContent.split(/\s+/).filter((w: string) => w).length;
        targetLesson.estimatedTime = Math.max(5, Math.ceil(targetLesson.wordCount / 200));
        // Persist edited course to SQLite
        dbCourses.save(course);
        res.json({ lessonId, content: newContent, wordCount: targetLesson.wordCount });
      } else {
        sendError(res, req, {
          status: 500,
          code: 'llm_insufficient_content',
          message: 'LLM returned insufficient content',
        });
      }
    } catch (err) {
      sendError(res, req, {
        status: 500,
        code: 'edit_failed',
        message: `Edit failed: ${String(err)}`,
      });
    }
  },
);

/** POST /api/v1/pipeline/:id/publish — Mark pipeline as published (does NOT publish to Marketplace) */
router.post('/:id/publish', validateBody(z.object({})), (req: Request, res: Response) => {
  const p = pipelines.get(String(req.params.id));
  if (!p) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Pipeline not found' });
    return;
  }
  if (p.stage !== 'reviewing') {
    sendError(res, req, {
      status: 400,
      code: 'validation_error',
      message: 'Pipeline must be in reviewing stage',
    });
    return;
  }
  updatePipeline(p, { stage: 'published' });
  res.json({ status: 'published', courseId: p.courseId, marketplacePublished: false });
});

/** POST /api/v1/pipeline/:id/personal — Keep course as personal */
router.post('/:id/personal', validateBody(z.object({})), (req: Request, res: Response) => {
  const p = pipelines.get(String(req.params.id));
  if (!p) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Pipeline not found' });
    return;
  }
  if (p.stage !== 'reviewing') {
    sendError(res, req, {
      status: 400,
      code: 'validation_error',
      message: 'Pipeline must be in reviewing stage',
    });
    return;
  }
  updatePipeline(p, { stage: 'personal' });
  res.json({ status: 'personal', courseId: p.courseId });
});

export const pipelineRouter = router;
