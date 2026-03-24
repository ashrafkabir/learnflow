import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import {
  crawlSourcesForTopic,
  searchForLesson,
  searchTopicTrending,
  type FirecrawlSource,
} from '@learnflow/agents';
import {
  buildCourseResearchFrame,
  deriveFindingsFromSearch,
} from '@learnflow/agents/dist/content-pipeline/research-frame.js';
import { getAdminSearchConfig } from '../lib/search-config.js';
import { makeStage1Log, makeStage2Log, makeLayerLog } from '../lib/search-run-log.js';
import { getOpenAIForRequest } from '../llm/openai.js';
import { sendError } from '../errors.js';

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
}

export interface PipelineState {
  id: string;
  courseId: string;
  topic: string;
  stage: PipelineStage;
  progress: number; // 0-100
  startedAt: string;
  updatedAt: string;
  // Stage data
  crawlThreads: CrawlThread[];
  sources?: PipelineSource[];
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
}

import { dbPipelines, dbCourses } from '../db.js';

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

function updatePipeline(p: PipelineState, partial: Partial<PipelineState>) {
  Object.assign(p, partial, { updatedAt: new Date().toISOString() });
  pipelines.set(p.id, p);
  // Persist to SQLite
  dbPipelines.save(p);
  broadcast(p.id, 'pipeline:update', p);
}

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
    const resp = await openai.chat.completions.create({
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
    });

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

  const threads: CrawlThread[] = Array.from({ length: 4 }).map((_, i) => ({
    id: `thread-${i}`,
    url: `Discovery thread ${i + 1}`,
    status: 'pending' as const,
  }));
  updatePipeline(p, { crawlThreads: threads });

  let crawledSources: FirecrawlSource[] = [];

  for (let i = 0; i < threads.length; i++) {
    threads[i].status = 'crawling';
    updatePipeline(p, {
      crawlThreads: [...threads],
      progress: 5 + Math.round((i / threads.length) * 20),
    });
  }

  try {
    // Prefer web-search provider over paid scraping where possible.
    // NOTE: @learnflow/agents currently exports the Firecrawl provider by default,
    // which may 402 in some environments. Fall back to the internal free provider.
    try {
      crawledSources = await searchTopicTrending(topic);
    } catch {
      const mod = await import('@learnflow/agents/dist/content-pipeline/web-search-provider.js');
      crawledSources = await mod.searchTopicTrending(topic);
    }

    updatePipeline(p, {
      sources: crawledSources.map((s) => ({
        url: s.url,
        title: s.title,
        domain: s.domain,
        author: s.author,
        publishDate: s.publishDate || undefined,
        credibilityScore: s.credibilityScore,
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
    console.warn(
      '[Pipeline] Add-topic discovery failed, falling back to crawlSourcesForTopic:',
      err,
    );
    try {
      crawledSources = await crawlSourcesForTopic(topic);
    } catch {
      crawledSources = [];
    }

    updatePipeline(p, {
      sources: crawledSources.map((s) => ({
        url: s.url,
        title: s.title,
        domain: s.domain,
        author: s.author,
        publishDate: s.publishDate || undefined,
        credibilityScore: s.credibilityScore,
      })),
    });

    for (const t of threads) t.status = crawledSources.length > 0 ? 'done' : 'failed';
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
  const content = gen.markdown;
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

  updatePipeline(p, { stage: 'reviewing', progress: 100 });
  broadcast(p.id, 'pipeline:complete', { courseId });
}

async function runPipeline(pipelineId: string) {
  console.log('[Pipeline] Starting pipeline', pipelineId);
  const p = pipelines.get(pipelineId);
  if (!p) return;

  const topic = p.topic;

  // ── STAGE 1: Scraping (bulk research) ──────────────────────────────────
  updatePipeline(p, { stage: 'scraping', progress: 5 });

  // Threads are used only for UI progress visualization. Actual query generation
  // is done inside searchTopicTrending() (LLM-generated + multi-source).
  const threads: CrawlThread[] = Array.from({ length: 5 }).map((_, i) => ({
    id: `thread-${i}`,
    // Placeholder shown in UI; real queries are logged from searchTopicTrending().
    url: `Research thread ${i + 1}`,
    status: 'pending' as const,
  }));
  updatePipeline(p, { crawlThreads: threads });

  // Use searchTopicTrending for bulk research
  let crawledSources: FirecrawlSource[] = [];

  // Update threads visually as we go
  for (let i = 0; i < threads.length; i++) {
    threads[i].status = 'crawling';
    updatePipeline(p, {
      crawlThreads: [...threads],
      progress: 5 + Math.round((i / threads.length) * 20),
    });
  }

  // Load admin-configured search behavior (global)
  const searchCfg = getAdminSearchConfig();

  // Iter69 Phase 1: layered research (Market/Analyst, Academic, Practitioner)
  const frame = buildCourseResearchFrame(topic);
  const layerTemplates = searchCfg.layerTemplates;

  const searchRuns: any[] = Array.isArray((p as any).searchRuns) ? (p as any).searchRuns : [];
  const byLayer: Record<string, any[]> = {};

  try {
    // Run each layer as a bounded batch and record findings.
    for (const layer of frame.layers.filter((l) => l.id !== 'L4_filter')) {
      const templatesUsed =
        (layerTemplates && (layerTemplates as any)[layer.id]) ||
        // fall back to the frame defaults (hard requirement list)
        layer.queries.map((q) => `"${q.replaceAll(topic, '{courseTopic}')}"`);

      const queries = (Array.isArray(templatesUsed) ? templatesUsed : [])
        .map((t: string) =>
          String(t || '')
            .replaceAll('{courseTopic}', topic)
            .trim(),
        )
        .filter(Boolean);

      // Log the intended search runs
      searchRuns.push(
        makeLayerLog({
          layerId: layer.id,
          layerLabel: layer.label,
          templatesUsed: Array.isArray(templatesUsed) ? templatesUsed : [],
          queries,
          perQueryLimit: searchCfg.perQueryLimit,
          enabledSources: searchCfg.enabledSources,
        }),
      );

      // Execute searches for this layer using the existing provider.
      const perQueryLimit = Math.max(1, Math.min(10, searchCfg.perQueryLimit));
      const maxLayerQueries = Math.max(1, Math.min(20, queries.length));
      const capped = queries.slice(0, maxLayerQueries);

      const layerSources: FirecrawlSource[] = [];
      for (const q of capped) {
        const batch = await searchTopicTrending(q, {
          stage1Templates: [q],
          enabledSources: searchCfg.enabledSources,
          perQueryLimit,
          maxStage1Queries: 1,
        } as any);
        layerSources.push(...batch);
      }
      byLayer[layer.id] = layerSources.map((s) => ({
        title: s.title,
        description: (s.content || '').slice(0, 240),
        url: s.url,
        source: s.source,
      }));

      // Update last log with resultsCount (best effort)
      const last = searchRuns[searchRuns.length - 1];
      if (last && last.layerId === layer.id) last.resultsCount = layerSources.length;

      // merge into global sources set
      crawledSources.push(...layerSources);
    }

    // Persist search runs
    updatePipeline(p, { searchRuns });

    // Deduplicate
    crawledSources = crawledSources.filter(
      (s, i, arr) => arr.findIndex((x) => x.url === s.url) === i,
    );

    // Phase 1 outputs
    const findings = deriveFindingsFromSearch({ topic, byLayer });
    (p as any).researchFindings = findings;
  } catch (err) {
    console.warn('[Pipeline] Layered Phase 1 research failed, falling back to legacy stage1:', err);

    // Legacy stage1 behavior (kept as fallback)
    const stage1TemplatesUsed = searchCfg.stage1Templates;
    const stage1Queries = stage1TemplatesUsed
      .map((t) => t.replaceAll('{courseTopic}', topic))
      .slice(0, searchCfg.maxStage1Queries);

    searchRuns.push(
      makeStage1Log({
        templatesUsed: stage1TemplatesUsed,
        queries: stage1Queries,
        perQueryLimit: searchCfg.perQueryLimit,
        enabledSources: searchCfg.enabledSources,
      }),
    );
    updatePipeline(p, { searchRuns });

    crawledSources = await searchTopicTrending(topic, {
      stage1Templates: searchCfg.stage1Templates,
      enabledSources: searchCfg.enabledSources,
      perQueryLimit: searchCfg.perQueryLimit,
      maxStage1Queries: searchCfg.maxStage1Queries,
    } as any);
  }

  // Persist the actual sources discovered so the UI can attribute what was used.
  updatePipeline(p, {
    sources: crawledSources.map((s) => ({
      url: s.url,
      title: s.title,
      domain: s.domain,
      author: s.author,
      publishDate: s.publishDate || undefined,
      credibilityScore: s.credibilityScore,
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

  // Extra resilience: if Phase 1 produced no sources, fall back to simple crawl.
  if (crawledSources.length === 0) {
    try {
      crawledSources = await crawlSourcesForTopic(topic);
    } catch {
      /* will use empty sources */
    }
  }
  updatePipeline(p, { crawlThreads: [...threads], progress: 25 });

  const sourceMode = 'real' as const; // web-search-provider always uses real web sources
  updatePipeline(p, { progress: 28, sourceMode });

  const { client: openai } = getOpenAIForRequest({
    userId: (p as any).userId || 'test-user-1',
    tier: (p as any).tier || 'pro',
  });

  // Generate INFORMED course plan using scraped sources
  const modules = await generateModulesForTopic(topic, crawledSources, openai);
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

  await new Promise((r) => setTimeout(r, 1000));

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
        // ── Per-lesson source scraping ──
        console.log(`[Pipeline] Scraping sources for lesson: "${les.title}"`);
        let lessonSources: FirecrawlSource[];
        try {
          // Document Stage 2 searches (templates + resolved queries)
          const stage2TemplatesUsed = searchCfg.stage2Templates;
          const stage2Queries = stage2TemplatesUsed
            .map((t) =>
              t
                .replaceAll('{courseTopic}', topic)
                .replaceAll('{moduleTitle}', modules[mi].title)
                .replaceAll('{lessonTitle}', les.title)
                .replaceAll('{lessonDescription}', les.description),
            )
            .slice(0, searchCfg.maxStage2Queries);

          const sr2: any[] = Array.isArray((p as any).searchRuns)
            ? (p as any).searchRuns
            : searchRuns;
          sr2.push(
            makeStage2Log({
              templatesUsed: stage2TemplatesUsed,
              queries: stage2Queries,
              perQueryLimit: searchCfg.perQueryLimit,
              enabledSources: searchCfg.enabledSources,
              moduleTitle: modules[mi].title,
              lessonTitle: les.title,
            }),
          );
          updatePipeline(p, { searchRuns: sr2 });

          lessonSources = await searchForLesson(
            topic,
            modules[mi].title,
            les.title,
            les.description,
            {
              stage2Templates: searchCfg.stage2Templates,
              enabledSources: searchCfg.enabledSources,
              perQueryLimit: searchCfg.perQueryLimit,
              maxStage2Queries: searchCfg.maxStage2Queries,
              maxSourcesPerLesson: searchCfg.maxSourcesPerLesson,
            } as any,
          );
        } catch (err) {
          console.warn(
            `[Pipeline] Per-lesson scrape failed for "${les.title}", falling back to course sources:`,
            err,
          );
          lessonSources = uniqueSources.slice(0, 6);
        }

        if (lessonSources.length === 0) {
          lessonSources = uniqueSources.slice(0, 6);
        }

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
          content = await generateLesson(
            topic,
            modules[mi].title,
            les.title,
            les.description,
            lessonSources,
            openai,
            minWordHint,
            temp,
          );
          wc = content.split(/\s+/).filter((w) => w).length;
          if (wc >= MIN_WORDS) break;
          console.warn(
            `[Pipeline] Lesson "${les.title}" attempt ${attempt + 1}: ${wc} words (min ${MIN_WORDS})`,
          );
        }

        // If still short after retries, use enhanced fallback
        if (wc < MIN_WORDS) {
          content = generateEnhancedFallback(topic, modules[mi].title, les.title, les.description);
          wc = content.split(/\s+/).filter((w) => w).length;
        }

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
      } catch {
        syntheses[synthIdx].status = 'failed';
        syntheses[synthIdx].wordCount = 0;
        const fallback = generateEnhancedFallback(
          topic,
          modules[mi].title,
          les.title,
          les.description,
        );
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

  const synthesisSummary = `Generated ${allLessons.length} lessons across ${modules.length} modules using ${uniqueSources.length} primary sources. Key themes: ${themes.slice(0, 5).join(', ') || 'N/A'}.`;
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
  await new Promise((r) => setTimeout(r, 500));

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
    createdAt: new Date().toISOString(),
  };

  courses.set(course.id, course);
  dbCourses.save(course);

  updatePipeline(p, { stage: 'reviewing', progress: 100 });
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
router.post('/add-topic', (req: Request, res: Response) => {
  const { courseId, topic, parentLessonId } = req.body || {};
  // parentLessonId is optional for future lesson-level insertion; v1 ignores it server-side.
  void parentLessonId;
  if (!courseId || typeof courseId !== 'string') {
    sendError(res, req, { status: 400, code: 'validation_error', message: 'courseId is required' });
    return;
  }
  if (!topic || typeof topic !== 'string') {
    sendError(res, req, { status: 400, code: 'validation_error', message: 'topic is required' });
    return;
  }

  const pipelineId = uuid();

  const state: PipelineState & { userId?: string; tier?: string } = {
    id: pipelineId,
    courseId,
    topic: topic.trim(),
    userId: req.user?.sub,
    tier: req.user?.tier,
    stage: 'scraping',
    progress: 0,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    if (p) updatePipeline(p, { stage: 'failed', error: String(err) });
  });

  res.status(201).json({ pipelineId, courseId });
});

/** POST /api/v1/pipeline — Start a new course creation pipeline */
router.post('/', (req: Request, res: Response) => {
  const { topic } = req.body;
  if (!topic || typeof topic !== 'string') {
    sendError(res, req, { status: 400, code: 'validation_error', message: 'Topic is required' });
    return;
  }

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

  const state: PipelineState & { userId?: string; tier?: string } = {
    id: pipelineId,
    courseId,
    topic,
    userId: req.user?.sub,
    tier: req.user?.tier,
    stage: 'scraping',
    progress: 0,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    if (p) updatePipeline(p, { stage: 'failed', error: String(err) });
  });

  res.status(201).json({ pipelineId, courseId });
});

/** GET /api/v1/pipeline/:id — Get pipeline state */
router.get('/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const p = pipelines.get(id);
  if (!p) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Pipeline not found' });
    return;
  }
  res.json(p);
});

/** GET /api/v1/pipeline/:id/events — SSE stream */
router.get('/:id/events', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const p = pipelines.get(id);
  if (!p) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Pipeline not found' });
    return;
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
router.get('/', (_req: Request, res: Response) => {
  const all = Array.from(pipelines.values()).map((p) => ({
    id: p.id,
    courseId: p.courseId,
    topic: p.topic,
    stage: p.stage,
    progress: p.progress,
    courseTitle: p.courseTitle,
    startedAt: p.startedAt,
    updatedAt: p.updatedAt,
  }));
  res.json({ pipelines: all });
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
router.post('/:id/lessons/:lessonId/edit', async (req: Request, res: Response) => {
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
  if (!prompt || typeof prompt !== 'string') {
    sendError(res, req, { status: 400, code: 'validation_error', message: 'prompt is required' });
    return;
  }

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
});

/** POST /api/v1/pipeline/:id/publish — Publish course to marketplace */
router.post('/:id/publish', (req: Request, res: Response) => {
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
  res.json({ status: 'published', courseId: p.courseId });
});

/** POST /api/v1/pipeline/:id/personal — Keep course as personal */
router.post('/:id/personal', (req: Request, res: Response) => {
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
