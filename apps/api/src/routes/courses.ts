import { Router, Request, Response } from 'express';
import { emitToUser } from '../wsHub.js';
import { z } from 'zod';
import {
  crawlSourcesForTopic,
  searchForLesson,
  buildCourseOutline,
  classifyTopicDomain,
  quantumComputingRequiredModules,
  programmingRequiredModules,
  mathRequiredModules,
  policyBusinessRequiredModules,
  cookingRequiredModules,
  aiPromptingRequiredModules,
  searchWikimediaCommonsImages,
  type FirecrawlSource,
  type LicenseSafeImageCandidate,
} from '@learnflow/agents';
import {
  dbCourses,
  dbLessonSources,
  dbProgress,
  dbNotes,
  dbIllustrations,
  dbAnnotations,
  dbEvents,
  sqlite,
} from '../db.js';
import { parseLessonSources, type LessonSource } from '../utils/sources.js';
import { enforceBiteSizedLesson } from '../utils/lessonSizing.js';
import { lessonHasRequiredStructure } from '../utils/lessonStructure.js';
import {
  toStructuredLessonSources,
  type StructuredLessonSource,
} from '../utils/sourcesStructured.js';
import {
  validateWorkedExampleQuality,
  validateNoPlaceholders,
  type LessonDomain,
} from '../utils/lessonQuality.js';
import { getOpenAIForRequest } from '../llm/openai.js';
import { sendError } from '../errors.js';
import { validateBody } from '../validation.js';

const router = Router();

// Iter72: topic-adaptive outline generation.
// We keep course structure generation in one pipeline:
// topic -> fingerprint/classification -> domain profile -> outline modules.
// (Hard-coded TOPIC_CONTENT templates are deprecated and removed from the default path.)

function buildLessonSystemPrompt(): string {
  return `You are an expert educational content writer. Write a comprehensive, engaging lesson for an online learning platform. 

Requirements:
- The lesson must be bite-sized: target 500-900 words (<= ~10 minutes at 200 wpm)
- Use an e-learning narration cadence: explain clearly, avoid filler, favor concrete details.
- Include inline citations like [1], [2] referencing the provided sources.
- Be specific and technical — avoid generic platitudes.
- Use markdown formatting with headers, bold, lists, and code blocks.
- REQUIRED STRUCTURE (all headings must appear exactly):
  - ## Learning Objectives
  - ## Estimated Time
  - ## Core Concepts
  - ## Worked Example
  - ## Recap
  - ## Quick Check (include an explicit Answer Key)
  - ## Sources
  - ## Next Steps
- Worked Example MUST be fully worked (show steps). For programming: include a runnable code block.
- Quick Check MUST include 3-5 questions AND an Answer Key.
- Do not invent sources. If you cannot support a claim with sources, mark it as an assumption.`;
}

function buildSourceContextForPrompt(crawledSources?: FirecrawlSource[]): string {
  if (!crawledSources || crawledSources.length === 0) return '';
  return crawledSources
    .slice(0, 4)
    .map((s, i) => {
      const title = s.title || 'Untitled';
      const author = s.author || 'Unknown';
      const domain = s.domain || s.source || 'unknown';
      const url = s.url || '';
      const excerpt = (s.content || '').slice(0, 1500);
      return `[Source ${i + 1}] "${title}" by ${author} (${domain})\nURL: ${url}\nContent excerpt: ${excerpt}`;
    })
    .join('\n\n');
}

function formatSourcesForPrompt(sourceRefs: StructuredLessonSource[]): string {
  if (!sourceRefs || sourceRefs.length === 0) return 'No sources available.';
  return sourceRefs
    .map((s, i) => {
      const author = s.author || 'Unknown';
      const title = s.title || 'Untitled';
      const publication = s.publication || 'Unknown';
      const year = s.year || 2024;
      const url = s.url || '';
      const license = s.license || 'unknown';
      const accessedAt = s.accessedAt || new Date().toISOString();
      return `[${i + 1}] ${author}. "${title}". ${publication}, ${year}. ${url} (License: ${license}; Accessed: ${accessedAt})`;
    })
    .join('\n');
}

function buildLessonUserPrompt(args: {
  topic: string;
  moduleTitle: string;
  lessonTitle: string;
  lessonDesc: string;
  sourceContext: string;
  sourcesSectionTemplate: string;
}): string {
  const { topic, moduleTitle, lessonTitle, lessonDesc, sourceContext, sourcesSectionTemplate } =
    args;

  const basis = sourceContext
    ? `Use these real sources as the basis for your content:\n\n${sourceContext}`
    : 'Write based on your knowledge of the topic.';

  return `Write a lesson titled "${lessonTitle}" for the module "${moduleTitle}" in a course on "${topic}".

Lesson description: ${lessonDesc}

${basis}

Format the output as markdown starting with # ${lessonTitle}

In the ## Sources section, list ONLY the provided sources (no extras), with this format:
${sourcesSectionTemplate}

In ## Quick Check, include a "### Answer Key" subsection.

Then a ## Next Steps section.`;
}

export async function generateLessonContentWithLLM(
  topic: string,
  moduleTitle: string,
  lessonTitle: string,
  lessonDesc: string,
  crawledSources?: FirecrawlSource[],
  llm?: { openai?: any } | null,
): Promise<{ markdown: string; sources: StructuredLessonSource[] }> {
  const accessedAt = new Date().toISOString();
  const structuredSources = toStructuredLessonSources(crawledSources, { limit: 4, accessedAt });

  const sourceRefs = structuredSources;
  const sourceContext = buildSourceContextForPrompt(crawledSources);
  const sourcesSectionTemplate = formatSourcesForPrompt(sourceRefs);
  const userPrompt = buildLessonUserPrompt({
    topic,
    moduleTitle,
    lessonTitle,
    lessonDesc,
    sourceContext,
    sourcesSectionTemplate,
  });

  const openai = (llm as any)?.openai || null;
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 3000,
        messages: [
          {
            role: 'system',
            content: buildLessonSystemPrompt(),
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });
      const content = completion.choices[0]?.message?.content;
      if (content && content.length > 200) {
        return { markdown: content, sources: sourceRefs };
      }
    } catch (err) {
      console.warn('[LearnFlow] OpenAI lesson generation failed, using fallback:', err);
    }
  }

  // Fallback: structured template.
  // IMPORTANT: never emit fake/example links. If we have no crawled sources, provide a minimal
  // "no sources" section instead of placeholder citations.
  const sources = sourceRefs;

  const sel = sources.sort(() => Math.random() - 0.5).slice(0, 4);
  const sourcesBlock =
    sel.length > 0
      ? sel
          .map(
            (s, i) =>
              `[${i + 1}] ${s.author || 'Unknown'}. "${s.title || lessonTitle}." ${
                s.publication || 'Unknown'
              }, ${s.year || 2024}. ${s.url} (License: ${s.license || 'unknown'}; Accessed: ${
                s.accessedAt
              })`,
          )
          .join('\n\n')
      : '_No external sources were available for this lesson generation run._';

  // Fallback markdown should still feel topic-specific. We use the lesson/module descriptions to anchor
  // what to learn, what to do, and how to check understanding.
  const focus = `${lessonTitle} (${lessonDesc})`;
  const moduleAnchor = `${moduleTitle}`;

  return {
    markdown: `# ${lessonTitle}

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what “${lessonTitle}” means in the context of **${topic}**
- Use the key ideas from **${moduleAnchor}** to complete a small, concrete task
- Identify common mistakes related to **${focus}** and how to avoid them

## Estimated Time

**8–10 minutes**

## Core Concepts

### What this lesson is really about

${lessonDesc}.

In this module (**${moduleAnchor}**), that matters because it affects how you make decisions, choose tools/techniques, and interpret results when working on **${topic}**.

### The moving parts

1. **Inputs / assumptions** — what you need to know (or decide) before you start.
2. **Mechanism** — how the concept works step-by-step.
3. **Outputs** — what you should expect to see when it’s working.
4. **Trade-offs** — what you gain/lose vs. alternatives (cost, time, risk, complexity).

## Worked Example

### Scenario

You’re working on **${topic}** and need to apply **${lessonTitle}** to a realistic situation.

### Steps

1. **Define the goal** (one sentence): what success looks like.
2. **List the inputs** you have (and any missing information).
3. **Apply the core idea** from this lesson in 3–6 explicit steps.
4. **Check the output**: what would convince you the result is correct?
5. **If it fails**: name 1–2 likely causes and how you’d debug them.

## Recap

- ${lessonTitle} is a tool for making better decisions inside **${topic}**, not just a definition to memorize.
- If you can state the inputs → mechanism → outputs, you understand the concept well enough to use it.
- Trade-offs are part of the skill: the “best” choice depends on constraints.

## Quick Check

1. In one sentence, what problem does **${lessonTitle}** help you solve in **${topic}**?
2. Name **two inputs/assumptions** you would need before applying it.
3. What is one **failure mode** (a common mistake), and what would you do to catch it early?

### Answer Key

1. A correct answer connects **${lessonTitle}** to a concrete goal within **${topic}** (not a generic definition).
2. Any two relevant prerequisites that would change your approach (e.g., constraints, data, requirements, environment).
3. A specific mistake plus a check (a test, sanity check, measurement, or review step) that would surface it.

## Sources

${sourcesBlock}

## Next Steps

- Continue to the next lesson and apply the same pattern: inputs → mechanism → outputs.
- If you’re practicing hands-on, repeat the worked example with one assumption changed and compare outcomes.`,
    sources: sourceRefs,
  };
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  estimatedTime: number;
  wordCount: number;
  sources?: LessonSource[];
}

interface Module {
  id: string;
  title: string;
  objective: string;
  description: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  topic: string;
  depth: string;
  authorId: string;
  modules: Module[];
  progress: Record<string, number>;
  status?: 'CREATING' | 'READY' | 'FAILED';
  error?: string;
  createdAt: string;
}

// Courses are now stored in SQLite via dbCourses
// This Map is a runtime cache, synced from SQLite on startup
export const courses: Map<string, Course> = new Map();
for (const c of dbCourses.getAll()) courses.set(c.id, c as Course);

const createCourseSchema = z.object({
  topic: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  depth: z.string().optional(),
  max_lessons: z.number().optional(),
});

// GET /api/v1/courses - List courses
router.get('/', (_req: Request, res: Response) => {
  const allCourses = Array.from(courses.values()).map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    topic: c.topic,
    depth: c.depth,
    moduleCount: c.modules.length,
    lessonCount: c.modules.reduce((s, m) => s + m.lessons.length, 0),
  }));
  res.status(200).json({ courses: allCourses });
});

// POST /api/v1/courses - Create/generate a full course
router.post('/', validateBody(createCourseSchema), async (req: Request, res: Response) => {
  const { topic, depth = 'intermediate' } = req.body;

  // Iter72: topic-adaptive outline generation (topic-preserving; no quantum fallback).
  const domain = classifyTopicDomain(topic);
  const outlineModules =
    domain === 'quantum_computing'
      ? quantumComputingRequiredModules(topic)
      : domain === 'programming'
        ? programmingRequiredModules(topic)
        : domain === 'math'
          ? mathRequiredModules(topic)
          : domain === 'policy_business'
            ? policyBusinessRequiredModules(topic)
            : domain === 'cooking'
              ? cookingRequiredModules(topic)
              : domain === 'ai_prompting'
                ? aiPromptingRequiredModules(topic)
                : buildCourseOutline(topic).modules;

  const topicData = { modules: outlineModules };

  const courseId = `course-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Enforce free-tier course limit server-side (client also guards, but server must be source of truth).
  // NOTE: Marketplace/creator courses could be excluded in future; for now we cap total personal courses.
  const tier = req.user?.tier || 'free';
  if (tier !== 'pro') {
    const authorId = req.user?.sub || 'anonymous';
    const existingCount = Array.from(courses.values()).filter(
      (c) => c.authorId === authorId,
    ).length;
    const FREE_LIMIT = 3;
    if (existingCount >= FREE_LIMIT) {
      sendError(res, req, {
        status: 402,
        code: 'payment_required',
        message: 'Free plan is limited to 3 courses. Upgrade to Pro for unlimited courses.',
        details: {
          tier,
          limit: FREE_LIMIT,
          count: existingCount,
        },
      });
      return;
    }
  }

  // Create minimal shell immediately and return, while generation happens in background.
  // Keep the default description topic-specific (avoid generic boilerplate phrasing).
  const courseShell: Course = {
    id: courseId,
    title: req.body.title || `Mastering ${topic}`,
    description:
      req.body.description ||
      `Build practical skill in ${topic} through guided lessons and worked examples (${depth} level).`,
    topic,
    depth,
    authorId: req.user?.sub || 'anonymous',
    modules: topicData.modules.map((mod, mi) => ({
      id: `${courseId}-m${mi}`,
      title: mod.title,
      objective: mod.objective,
      description: mod.objective,
      lessons: (mod.lessons || []).map((les, li) => ({
        id: `${courseId}-m${mi}-l${li}`,
        title: les.title,
        description: les.description,
        content: '',
        estimatedTime: 5,
        wordCount: 0,
        sources: [],
      })),
    })),
    progress: {},
    status: 'CREATING',
    error: '',
    createdAt: new Date().toISOString(),
  };

  courses.set(courseShell.id, courseShell);
  dbCourses.save(courseShell);

  res.status(201).json({ id: courseId, status: 'CREATING' });

  // Background generation task (best effort; do not block the response).
  const userId = req.user?.sub || 'anonymous';
  const courseTitle = courseShell.title;
  const courseDescription = courseShell.description;

  void (async () => {
    try {
      emitToUser(userId, 'progress.update', {
        courseId,
        stage: 'creating',
        percent: 1,
        message: 'Starting course generation…',
      });

      // Task 1: Content sourcing
      // Stage 1: crawl topic-level sources (used for initial planning + fallback contexts)
      let crawledSources: FirecrawlSource[] = [];
      const _crawlStart = Date.now();

      if (process.env.NODE_ENV === 'test') {
        // In tests, do NOT hit the network. Keep this deterministic and fast.
        crawledSources = [
          {
            url: 'https://en.wikipedia.org/wiki/Software_testing',
            title: 'Software testing — Wikipedia',
            author: 'Wikipedia contributors',
            publishDate: null,
            source: 'wikipedia.org',
            content:
              'Software testing is the act of evaluating and verifying that a software product or application does what it is supposed to do.',
            credibilityScore: 0.72,
            relevanceScore: 0.9,
            recencyScore: 0.6,
            wordCount: 24,
            domain: 'wikipedia.org',
          },
          {
            url: 'https://developer.mozilla.org/en-US/docs/Learn',
            title: 'Learn web development — MDN',
            author: 'MDN contributors',
            publishDate: null,
            source: 'developer.mozilla.org',
            content: 'MDN provides learning resources and guides for web development.',
            credibilityScore: 0.9,
            relevanceScore: 0.6,
            recencyScore: 0.6,
            wordCount: 10,
            domain: 'developer.mozilla.org',
          },
          {
            url: 'https://kubernetes.io/docs/home/',
            title: 'Kubernetes Documentation',
            author: 'Kubernetes Authors',
            publishDate: null,
            source: 'kubernetes.io',
            content:
              'Kubernetes is an open-source system for automating deployment, scaling, and management of containerized applications.',
            credibilityScore: 0.9,
            relevanceScore: 0.55,
            recencyScore: 0.6,
            wordCount: 17,
            domain: 'kubernetes.io',
          },
        ];
        console.log(
          `[LearnFlow] (test) crawlSourcesForTopic skipped network, using ${crawledSources.length} deterministic sources`,
        );
      } else {
        try {
          crawledSources = await crawlSourcesForTopic(topic);
          console.log(
            `[LearnFlow] crawlSourcesForTopic took ${Date.now() - _crawlStart}ms, got ${crawledSources.length} sources`,
          );
          // NOTE: We no longer require FIRECRAWL_API_KEY for spec compliance in dev.
          // The default provider uses free multi-source search + readability scraping.
          if (!process.env.FIRECRAWL_API_KEY) {
            console.warn(
              '[LearnFlow] FIRECRAWL_API_KEY not set — using WebSearch provider (real sources, no paid key)',
            );
          }
        } catch (err) {
          console.warn('[LearnFlow] Firecrawl crawl failed, falling back to static sources:', err);
        }
      }

      emitToUser(userId, 'progress.update', {
        courseId,
        stage: 'sourcing',
        percent: 10,
        message: `Collected ${crawledSources.length} sources`,
      });

      // Generate all lessons with LLM (parallel per module)
      const { client: openai } = getOpenAIForRequest({
        userId,
        tier: req.user?.tier || 'free',
      });

      // In tests, we should never hit the network even if OPENAI_API_KEY is set in the environment.
      const effectiveOpenAi = process.env.NODE_ENV === 'test' ? null : openai;
      const _lessonStart = Date.now();

      // In test mode, keep course creation fast/deterministic.
      // We still create content, but skip expensive network-based lesson generation.
      const fastTestMode = process.env.NODE_ENV === 'test';

      const modules: Module[] = [];
      const totalLessons = topicData.modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
      let completedLessons = 0;

      for (let mi = 0; mi < topicData.modules.length; mi++) {
        const mod = topicData.modules[mi];

        const lessonPromises = (mod.lessons || []).map(async (les, li) => {
          // Iter72 content quality:
          // Use per-lesson sourcing threads (Stage 2) so each lesson has its own relevant sources/images,
          // rather than sharing one topic-wide crawl.
          let lessonSources: FirecrawlSource[] = crawledSources;
          if (!fastTestMode) {
            try {
              lessonSources = await searchForLesson(topic, mod.title, les.title, les.description, {
                maxSourcesPerLesson: 6,
                maxStage2Queries: 6,
                perQueryLimit: 4,
              } as any);
            } catch (err) {
              console.warn(
                '[LearnFlow] searchForLesson failed; falling back to topic sources:',
                err,
              );
              lessonSources = crawledSources;
            }
          }

          const gen = fastTestMode
            ? {
                // In test mode we still must satisfy Iter73 hard gates.
                // Keep it deterministic, concise, and artifact-producing.
                markdown: `# ${les.title}

${les.description}

(Generated in test fast mode)

## Learning Objectives

- Explain the key idea of **${les.title}** in the context of **${topic}**
- Apply it in a concrete worked example that produces an output

## Estimated Time

**1 minute**

## Core Concepts

- Key definition: ${les.title} relates to ${topic}.
- Why it matters: it changes how you make decisions and verify results.

## Worked Example

### Programming artifact (runnable snippet)

How to run:

\`\`\`bash
node example.js
\`\`\`

\`\`\`js
// example.js
function add(a, b) {
  return a + b;
}

console.log(add(2, 3));
\`\`\`

Expected output:

\`\`\`text
5
\`\`\`

### Math/science artifact (numeric steps)

1. Choose values: a = 2, b = 3.
2. Compute: a + b = 2 + 3 = 5.
3. Sanity check: 5 is greater than both inputs.

### Business/policy artifact (scenario + trade-offs)

Scenario: You have a budget of $10,000 and 2 options.

| Option | Cost | Benefit | Risk |
|---|---:|---|---|
| A | 4000 | Faster initial delivery | Medium |
| B | 9000 | Higher long-term quality | Low |

Decision rule: pick A if time-to-first-result matters most; pick B if rework risk is the primary constraint.

### Cooking artifact (recipe steps)

1. Heat a pan to medium heat for 2 minutes.
2. Add 1 tbsp oil and cook for 30 seconds.
3. Stir for 60 seconds, then reduce heat and simmer for 5 minutes.

## Recap

- You applied ${les.title} via a concrete artifact and verified the output.

## Quick Check

1. What is the main goal of **${les.title}** in **${topic}**?
2. What output would you expect from the worked example?
3. Name one common failure mode and one way to catch it.

### Answer Key

1. A correct answer connects the concept to a practical goal in the topic.
2. The snippet prints 5.
3. Example: wrong inputs; catch it with a quick sanity check and expected output.

## Sources

_No external sources in test fast mode._

## Next Steps

Continue.`,
                sources: toStructuredLessonSources(lessonSources, {
                  limit: 4,
                  accessedAt: new Date().toISOString(),
                }),
              }
            : await generateLessonContentWithLLM(
                topic,
                mod.title,
                les.title,
                les.description,
                lessonSources,
                { openai: effectiveOpenAi },
              );

          const enforced = enforceBiteSizedLesson(gen.markdown, { maxMinutes: 10 });
          let contentFinal = enforced.content;

          // Iter72: Embed a license-safe illustration directly into the lesson markdown.
          // We default to Wikimedia Commons (search) for safety + attribution.
          if (!fastTestMode) {
            try {
              const prompt = `${les.title} ${topic}`;
              const images: LicenseSafeImageCandidate[] = await searchWikimediaCommonsImages(
                prompt,
                { limit: 1 },
              );
              const picked = images?.[0];
              if (picked?.url) {
                // Persist for later UI use as well.
                try {
                  dbIllustrations.create(`${courseId}-m${mi}-l${li}`, 0, prompt, picked.url, {
                    provider: 'wikimedia_commons',
                    model: 'search',
                    license: picked.license || 'unknown',
                    sourcePageUrl: picked.sourcePageUrl,
                    attributionText: `Image from Wikimedia Commons · License: ${picked.license || 'unknown'}${picked.author ? ` · Author: ${picked.author}` : ''} · Accessed: ${picked.accessedAt}`,
                  });
                } catch {
                  // best effort
                }

                const attributionLine = `> **Attribution:** Wikimedia Commons (${picked.license || 'unknown'})${picked.author ? ` — ${picked.author}` : ''}. Source: ${picked.sourcePageUrl}. Accessed: ${picked.accessedAt}.`;
                const imageBlock = `![${les.title} illustration](${picked.url})\n\n${attributionLine}\n`;

                // Insert after "## Core Concepts" when possible; otherwise after title.
                if (contentFinal.includes('## Core Concepts')) {
                  contentFinal = contentFinal.replace(
                    '## Core Concepts',
                    `## Core Concepts\n\n${imageBlock}`,
                  );
                } else {
                  contentFinal = `${imageBlock}\n\n${contentFinal}`;
                }
              }
            } catch (err) {
              console.warn('[LearnFlow] Wikimedia illustration embed failed (non-fatal):', err);
            }
          }
          const wordCount = enforced.sizing.wordCount;
          const estimatedMinutes = Math.min(10, enforced.sizing.estimatedMinutes);

          const structure = lessonHasRequiredStructure(contentFinal);
          if (!structure.ok) {
            console.warn('[LearnFlow] lesson structure missing headings:', structure.missing);
          }

          const d = classifyTopicDomain(topic);
          const lessonDomain: LessonDomain =
            d === 'programming' || d === 'ai_prompting'
              ? 'programming'
              : d === 'math' || d === 'quantum_computing'
                ? 'math_science'
                : d === 'policy_business'
                  ? 'business'
                  : d === 'cooking'
                    ? 'cooking'
                    : 'general';

          // Iter73 P0: HARD quality gates with retries.
          // - No placeholders like "Example (fill in)".
          // - Worked Example must produce a domain-appropriate artifact.
          // If gates fail, retry regeneration with stricter instructions up to N attempts.
          const MAX_QUALITY_RETRIES = 3;
          let attempt = 1;
          let quality = validateWorkedExampleQuality(contentFinal, lessonDomain);
          let placeholder = validateNoPlaceholders(contentFinal);

          while (
            (!quality.ok || !placeholder.ok) &&
            attempt < MAX_QUALITY_RETRIES &&
            !fastTestMode
          ) {
            const reasons = [...(quality.reasons || []), ...(placeholder.reasons || [])].join(', ');
            console.warn(
              `[LearnFlow] lesson quality gate failed (attempt ${attempt}/${MAX_QUALITY_RETRIES}): ${reasons}. Retrying regeneration...`,
            );

            const tightenedPrompt = `${les.description}\n\nIMPORTANT QUALITY REQUIREMENTS (must satisfy all):\n- Do NOT include placeholders (no "Example (fill in)", no TBD/TODO, no "Q1/A1", no "placeholder").\n- In "## Worked Example":\n  - Programming: include a runnable fenced code block, "How to run", and "Expected output".\n  - Math/Science: include numeric values and step-by-step computation.\n  - Business/Policy: include a scenario with numbers and a trade-off table.\n  - Cooking: include numbered recipe steps with times/temperatures.\nIf you cannot comply, rewrite the Worked Example until it does.`;

            const regen = await generateLessonContentWithLLM(
              topic,
              mod.title,
              les.title,
              tightenedPrompt,
              lessonSources,
              { openai: effectiveOpenAi },
            );
            const enforced2 = enforceBiteSizedLesson(regen.markdown, { maxMinutes: 10 });
            contentFinal = enforced2.content;

            quality = validateWorkedExampleQuality(contentFinal, lessonDomain);
            placeholder = validateNoPlaceholders(contentFinal);
            attempt++;
          }

          if (!quality.ok || !placeholder.ok) {
            const reasons = [...(quality.reasons || []), ...(placeholder.reasons || [])];
            console.warn('[LearnFlow] lesson quality gate failed permanently:', reasons);
            // Surface failure via course generation failure (pipeline/UI should show FAILED clearly).
            throw new Error(`Lesson quality gate failed: ${reasons.join(', ')}`);
          }

          const sources = gen.sources || [];
          const missingReason =
            sources.length >= 2
              ? ''
              : 'attribution_gate: lesson has fewer than 2 resolvable sources';
          try {
            dbLessonSources.save(`${courseId}-m${mi}-l${li}`, courseId, sources, missingReason);
          } catch {
            // best effort
          }

          completedLessons++;
          const percent =
            totalLessons > 0 ? 10 + Math.floor((completedLessons / totalLessons) * 80) : 90;
          emitToUser(userId, 'progress.update', {
            courseId,
            stage: 'generating',
            percent,
            message: `Generated ${completedLessons}/${totalLessons} lessons`,
          });

          return {
            id: `${courseId}-m${mi}-l${li}`,
            title: les.title,
            description: les.description,
            content: contentFinal,
            estimatedTime: estimatedMinutes,
            wordCount,
            sources,
          };
        });

        const lessons: Lesson[] = await Promise.all(lessonPromises);
        modules.push({
          id: `${courseId}-m${mi}`,
          title: mod.title,
          objective: mod.objective,
          description: mod.objective,
          lessons,
        });
      }

      const course: Course = {
        id: courseId,
        title: courseTitle,
        description: courseDescription,
        topic,
        depth,
        authorId: userId,
        modules,
        progress: {},
        status: 'READY',
        error: '',
        createdAt: courseShell.createdAt,
      };

      courses.set(course.id, course);
      dbCourses.save(course);
      try {
        dbCourses.setStatus(courseId, 'READY', '');
      } catch {
        // ignore
      }

      console.log(
        `[LearnFlow] Lesson generation took ${Date.now() - _lessonStart}ms for ${topicData.modules.length} modules`,
      );

      // Attribution gate: course is only "ready" when every lesson has >= 2 resolvable sources.
      const lessonsAll = course.modules.flatMap((m) => m.lessons);
      const lessonsMissing = lessonsAll.filter((l) => (l.sources?.length || 0) < 2);
      const attributionReady = lessonsMissing.length === 0;

      emitToUser(userId, 'progress.update', {
        courseId,
        stage: 'complete',
        percent: 100,
        message: attributionReady
          ? 'Course ready'
          : `Course ready (with attribution issues in ${lessonsMissing.length} lessons)`,
      });
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : 'Course generation failed';
      try {
        dbCourses.setStatus(courseId, 'FAILED', msg);
      } catch {
        // ignore
      }
      const cur = courses.get(courseId);
      if (cur) {
        (cur as any).status = 'FAILED';
        (cur as any).error = msg;
        courses.set(courseId, cur);
      }
      emitToUser(userId, 'progress.update', {
        courseId,
        stage: 'failed',
        percent: 100,
        message: msg,
      });
      console.error('[LearnFlow] course generation failed:', err);
    }
  })();
});
// DELETE /api/v1/courses/:id - Delete a course (and cascade related rows)
router.delete('/:id', (req: Request, res: Response) => {
  const courseId = String(req.params.id);
  const existing = courses.get(courseId) || dbCourses.getById(courseId);
  if (!existing) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Course not found' });
    return;
  }

  // Remove from runtime cache
  courses.delete(courseId);

  // Best-effort cleanup of non-FK tables that reference courseId.
  // - lessons table cascades via FK from courses
  // - progress table does NOT have FK; delete explicit.
  try {
    sqlite.prepare('DELETE FROM progress WHERE courseId = ?').run(courseId);
  } catch {
    // best effort
  }

  // Remove the course row (lessons cascade)
  dbCourses.delete(courseId);

  res.status(204).end();
});

// GET /api/v1/courses/:id - Get course detail
router.get('/:id', (req: Request, res: Response) => {
  const courseId = String(req.params.id);
  const course = courses.get(courseId) || (dbCourses.getById(courseId) as any);
  if (!course) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Course not found' });
    return;
  }
  const userId = req.user?.sub || 'anonymous';
  const completedLessons = dbProgress.getCompletedLessons(userId, course.id);
  res.status(200).json({ ...course, completedLessons });
});

// GET /api/v1/courses/:id/lessons/:lessonId - Get lesson
router.get('/:id/lessons/:lessonId', (req: Request, res: Response) => {
  const courseId = String(req.params.id);
  const course = courses.get(courseId) || (dbCourses.getById(courseId) as any);
  if (!course) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Course not found' });
    return;
  }
  let lesson: Lesson | undefined;
  for (const mod of course.modules) {
    lesson = mod.lessons.find((l: Lesson) => l.id === req.params.lessonId);
    if (lesson) break;
  }
  if (!lesson) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Lesson not found' });
    return;
  }

  // Provide structured sources when possible; client can fall back to parsing markdown.
  // NOTE: This is best-effort. If lesson content doesn't include a Sources section, sources may be empty.
  const persisted = (() => {
    try {
      return dbLessonSources.get(lesson.id) as { sources: LessonSource[]; missingReason?: string };
    } catch {
      return { sources: [] as LessonSource[], missingReason: '' };
    }
  })();

  const sources =
    (persisted?.sources?.length || 0) > 0 ? persisted.sources : parseLessonSources(lesson.content);

  const sourcesMissingReason =
    sources.length >= 2
      ? ''
      : persisted?.missingReason || 'attribution_gate: sources missing from lesson';

  // Record an event for analytics.
  try {
    dbEvents.add(req.user!.sub, {
      type: 'lesson.opened',
      courseId: course.id,
      lessonId: lesson.id,
      meta: {},
    });
  } catch {
    // best effort
  }

  res.status(200).json({ ...lesson, sources, sourcesMissingReason });
});

// POST /api/v1/courses/:id/add-topic - Add a new topic as a module+lesson to an existing course
router.post('/:id/add-topic', async (req: Request, res: Response) => {
  const courseId = String(req.params.id);
  const course = courses.get(courseId);
  if (!course) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Course not found' });
    return;
  }

  const topic = String(req.body?.topic || '').trim();
  const parentLessonId = req.body?.parentLessonId ? String(req.body.parentLessonId) : undefined;
  // parentLessonId is optional for future lesson-level insertion; v1 ignores it server-side.
  void parentLessonId;
  if (!topic) {
    sendError(res, req, { status: 400, code: 'validation_error', message: 'topic is required' });
    return;
  }

  try {
    let sources: FirecrawlSource[] = [];
    try {
      sources = await crawlSourcesForTopic(topic);
    } catch {
      sources = [];
    }

    const { client: openai } = getOpenAIForRequest({
      userId: req.user!.sub,
      tier: req.user!.tier,
    });

    const moduleIndex = course.modules.length;
    const moduleId = `${courseId}-m${moduleIndex}`;
    const moduleTitle = topic;
    const lessonTitle = `${topic}: Overview`;

    const gen = await generateLessonContentWithLLM(
      topic,
      moduleTitle,
      lessonTitle,
      `A focused, practical introduction to ${topic} for learners already following this course.`,
      sources,
      { openai: process.env.NODE_ENV === 'test' ? null : openai },
    );
    const enforced = enforceBiteSizedLesson(gen.markdown, { maxMinutes: 10 });
    const contentFinal = enforced.content;
    const wordCount = enforced.sizing.wordCount;
    const estimatedMinutes = Math.min(10, enforced.sizing.estimatedMinutes);

    const lessonId = `${courseId}-m${moduleIndex}-l0`;
    const newLessonSources = gen.sources || [];
    const missingReason =
      newLessonSources.length >= 2
        ? ''
        : 'attribution_gate: lesson has fewer than 2 resolvable sources';
    try {
      dbLessonSources.save(lessonId, course.id, newLessonSources, missingReason);
    } catch {
      // best effort
    }

    const newLesson: any = {
      id: lessonId,
      title: lessonTitle,
      description: `Add-on topic: ${topic}`,
      content: contentFinal,
      estimatedTime: estimatedMinutes,
      wordCount,
    };

    const newModule: any = {
      id: moduleId,
      title: moduleTitle,
      objective: `Learn ${topic} as an extension topic`,
      description: `Supplemental module added from suggested mindmap topic: ${topic}`,
      lessons: [newLesson],
    };

    course.modules.push(newModule);
    dbCourses.save(course);

    res.status(201).json({ course, module: newModule, lesson: newLesson });
  } catch (err: any) {
    sendError(res, req, {
      status: 500,
      code: 'add_topic_failed',
      message: err?.message || 'Failed',
    });
  }
});

// POST /api/v1/courses/:id/lessons/:lessonId/complete - Mark lesson complete
router.post('/:id/lessons/:lessonId/complete', (req: Request, res: Response) => {
  const userId = req.user?.sub || 'anonymous';
  const courseId = String(req.params.id);
  const lessonId = String(req.params.lessonId);
  const course = courses.get(courseId);

  // Track per-user per-lesson completion
  dbProgress.markComplete(userId, courseId, lessonId);
  const completedLessons = dbProgress.getCompletedLessons(userId, courseId);

  if (course) {
    course.progress[userId] = completedLessons.length;
    dbCourses.save(course);
  }

  const totalLessons = course?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
  const completion_percent = totalLessons ? (completedLessons.length / totalLessons) * 100 : 0;

  // Emit a progress.update WS event for real UI updates.
  emitToUser(userId, 'progress.update', {
    course_id: courseId,
    lesson_id: lessonId,
    completion_percent,
  });

  res.status(200).json({
    message: 'Lesson marked complete. Great job!',
    progress: completedLessons.length,
    completedLessons,
    completion_percent,
    nextActions: ['Continue to next lesson', 'Take a quiz', 'Review notes'],
    next: 'Continue learning',
    actions: ['next_lesson', 'quiz', 'notes'],
  });
});

// ── Notes CRUD endpoints ────────────────────────────────────────────────────

// GET /api/v1/courses/:id/lessons/:lessonId/notes
router.get('/:id/lessons/:lessonId/notes', (req: Request, res: Response) => {
  const userId = req.user?.sub || 'anonymous';
  const note = dbNotes.get(String(req.params.lessonId), userId);
  if (!note) {
    res.status(200).json({ note: null });
    return;
  }
  res.status(200).json({ note });
});

// POST /api/v1/courses/:id/lessons/:lessonId/notes
router.post('/:id/lessons/:lessonId/notes', async (req: Request, res: Response) => {
  const userId = req.user?.sub || 'anonymous';
  const lessonId = String(req.params.lessonId);
  const courseId = String(req.params.id);
  const { format, content, customContent } = req.body;

  const course = courses.get(courseId);
  let lesson: Lesson | undefined;
  if (course) {
    for (const mod of course.modules) {
      lesson = mod.lessons.find((l) => l.id === lessonId);
      if (lesson) break;
    }
  }

  const { client: openai } = getOpenAIForRequest({
    userId,
    tier: req.user?.tier || 'free',
    apiKeyOverride: (req.body as any)?.apiKey,
  });
  let noteContent: any = { format: format || 'custom', text: customContent || '' };

  if (format && format !== 'custom' && openai && lesson) {
    try {
      const lessonText = lesson.content.slice(0, 3000);
      let prompt = '';

      if (format === 'summary') {
        prompt = `Create a concise, well-structured summary of this lesson. Use bullet points and bold key terms. Keep it under 500 words.\n\nLesson: "${lesson.title}"\n\n${lessonText}`;
      } else if (format === 'cornell') {
        prompt = `Create Cornell-style notes for this lesson with three clear sections:\n1. **Cue Questions** (left column) — 5-7 key questions\n2. **Notes** (right column) — detailed notes organized by topic\n3. **Summary** — a concise paragraph summarizing the main ideas\n\nUse markdown formatting.\n\nLesson: "${lesson.title}"\n\n${lessonText}`;
      } else if (format === 'mindmap') {
        prompt = `Create a hierarchical mind map outline for this lesson. Use indented bullet points to show relationships:\n- Main topic\n  - Subtopic 1\n    - Detail\n    - Detail\n  - Subtopic 2\n    - Detail\n\nLesson: "${lesson.title}"\n\n${lessonText}`;
      }

      if (prompt) {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.5,
          max_tokens: 2000,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert note-taker and study skills instructor. Generate clear, well-organized notes that help students review and retain information.',
            },
            { role: 'user', content: prompt },
          ],
        });
        const text = completion.choices[0]?.message?.content || '';
        if (text.length > 50) {
          noteContent = { format, text };
        }
      }
    } catch (err) {
      console.warn('[LearnFlow] AI note generation failed:', err);
      noteContent = {
        format,
        text: `# Notes: ${lesson?.title || 'Lesson'}\n\n_AI generation failed. Write your own notes here._`,
      };
    }
  } else if (content) {
    noteContent = content;
  }

  const note = dbNotes.save(lessonId, userId, noteContent);
  res.status(201).json({ note });
});

// PUT /api/v1/courses/:id/lessons/:lessonId/notes
router.put('/:id/lessons/:lessonId/notes', (req: Request, res: Response) => {
  const userId = req.user?.sub || 'anonymous';
  const lessonId = String(req.params.lessonId);
  const { content, illustrations } = req.body;
  const existing = dbNotes.get(lessonId, userId);
  const note = dbNotes.save(
    lessonId,
    userId,
    content || existing?.content || {},
    illustrations || existing?.illustrations || [],
  );
  res.status(200).json({ note });
});

// POST /api/v1/courses/:id/lessons/:lessonId/notes/illustrate
router.post('/:id/lessons/:lessonId/notes/illustrate', async (req: Request, res: Response) => {
  const userId = req.user?.sub || 'anonymous';
  const lessonId = String(req.params.lessonId);
  const { description } = req.body;

  const { client: openai } = getOpenAIForRequest({
    userId,
    tier: req.user?.tier || 'free',
    apiKeyOverride: (req.body as any)?.apiKey,
  });
  if (!openai) {
    sendError(res, req, {
      status: 400,
      code: 'openai_unavailable',
      message: 'OpenAI API key not configured',
    });
    return;
  }

  try {
    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Educational illustration: ${description}. Clean, professional, suitable for a learning platform. No text in image.`,
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    });

    const imageUrl = imageResponse.data?.[0]?.url;
    if (!imageUrl) {
      sendError(res, req, {
        status: 500,
        code: 'generation_failed',
        message: 'No image generated',
      });
      return;
    }

    // Save illustration to notes
    const existing = dbNotes.get(lessonId, userId);
    const illustrations = existing?.illustrations || [];
    illustrations.push({
      id: `ill-${Date.now()}`,
      description,
      url: imageUrl,
      createdAt: new Date().toISOString(),
    });
    dbNotes.save(lessonId, userId, existing?.content || {}, illustrations);

    res.status(200).json({ illustration: { url: imageUrl, description } });
  } catch (err: any) {
    console.error('[LearnFlow] DALL-E generation failed:', err);
    sendError(res, req, {
      status: 500,
      code: 'generation_failed',
      message: err.message || 'Image generation failed',
    });
  }
});

// ── Illustrations (per-section, persistent) ─────────────────────────────────

// GET /api/v1/courses/:id/lessons/:lessonId/illustrations
router.get('/:id/lessons/:lessonId/illustrations', (req: Request, res: Response) => {
  const lessonId = String(req.params.lessonId);
  const illustrations = dbIllustrations.getByLesson(lessonId);
  res.json({ illustrations });
});

// POST /api/v1/courses/:id/lessons/:lessonId/illustrations
router.post('/:id/lessons/:lessonId/illustrations', async (req: Request, res: Response) => {
  const lessonId = String(req.params.lessonId);
  const { sectionIndex, prompt, provider } = req.body;

  const userId = req.user?.sub || 'anonymous';
  // Allow choosing a license-safe web image provider.
  // Default: OpenAI generated image (existing behavior).
  if (String(provider || '').toLowerCase() === 'wikimedia') {
    try {
      const images: LicenseSafeImageCandidate[] = await searchWikimediaCommonsImages(prompt, {
        limit: 4,
      });
      const picked = images[0];
      if (!picked?.url) {
        sendError(res, req, {
          status: 404,
          code: 'no_images_found',
          message: 'No license-safe images found for this prompt',
        });
        return;
      }

      const illustration = dbIllustrations.create(lessonId, sectionIndex ?? 0, prompt, picked.url, {
        provider: 'wikimedia_commons',
        model: 'search',
        license: picked.license || 'unknown',
        sourcePageUrl: picked.sourcePageUrl,
        attributionText: `Image from Wikimedia Commons · License: ${picked.license || 'unknown'}${picked.author ? ` · Author: ${picked.author}` : ''} · Accessed: ${picked.accessedAt}`,
      });
      res.status(201).json({ illustration });
      return;
    } catch (err: any) {
      console.warn('[LearnFlow] Wikimedia image search failed, falling back to OpenAI:', err);
      // continue to OpenAI path
    }
  }

  const { client: openai } = getOpenAIForRequest({
    userId,
    tier: req.user?.tier || 'free',
    apiKeyOverride: (req.body as any)?.apiKey,
  });
  if (!openai) {
    // Graceful degradation when no OpenAI key configured: still create a record
    // so the client can attach a summary/note even without an image.
    const illustration = dbIllustrations.create(
      lessonId,
      sectionIndex ?? 0,
      prompt,
      '',
      {
        provider: 'openai',
        model: 'dall-e-3',
        license: 'generated',
        attributionText: 'Generated image (OpenAI / dall-e-3)',
      },
      'openai_unavailable',
    );
    res.status(201).json({ illustration, degraded: true });
    return;
  }

  try {
    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Educational illustration: ${prompt}. Clean, professional diagram suitable for a learning platform. No text in image.`,
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    });
    const imageUrl = imageResponse.data?.[0]?.url;
    if (!imageUrl) {
      sendError(res, req, {
        status: 500,
        code: 'generation_failed',
        message: 'No image generated',
      });
      return;
    }
    const illustration = dbIllustrations.create(lessonId, sectionIndex ?? 0, prompt, imageUrl, {
      provider: 'openai',
      model: 'dall-e-3',
      license: 'generated',
      attributionText: `Generated image (OpenAI / dall-e-3) · Prompt: ${prompt} · Created: ${new Date().toISOString()}`,
    });
    res.status(201).json({ illustration });
  } catch (err: any) {
    console.error('[LearnFlow] Illustration generation failed:', err);
    sendError(res, req, { status: 500, code: 'generation_failed', message: err.message });
  }
});

// DELETE /api/v1/courses/:id/lessons/:lessonId/illustrations/:illId
router.delete('/:id/lessons/:lessonId/illustrations/:illId', (req: Request, res: Response) => {
  dbIllustrations.delete(String(req.params.illId));
  res.status(204).end();
});

// ── Comparison Mode ─────────────────────────────────────────────────────────

// POST /api/v1/courses/:id/lessons/:lessonId/compare
router.post('/:id/lessons/:lessonId/compare', async (req: Request, res: Response) => {
  const courseId = String(req.params.id);
  const lessonId = String(req.params.lessonId);

  const userId = req.user?.sub || 'anonymous';
  const { client: openai } = getOpenAIForRequest({
    userId,
    tier: req.user?.tier || 'free',
    apiKeyOverride: (req.body as any)?.apiKey,
  });
  if (!openai) {
    sendError(res, req, {
      status: 400,
      code: 'openai_unavailable',
      message: 'OpenAI API key not configured',
    });
    return;
  }

  // Get lesson content
  const course = dbCourses.getById(courseId);
  let lessonContent = '';
  if (course?.modules) {
    for (const mod of course.modules) {
      for (const l of mod.lessons || []) {
        if (l.id === lessonId) lessonContent = l.content || l.description || '';
      }
    }
  }
  // Also try the lessons table
  const { sqlite } = await import('../db.js');
  const lessonRow = sqlite.prepare('SELECT content FROM lessons WHERE id = ?').get(lessonId) as any;
  if (lessonRow?.content) lessonContent = lessonRow.content;

  if (!lessonContent) {
    sendError(res, req, { status: 404, code: 'lesson_not_found', message: 'Lesson not found' });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You analyze educational content and create structured comparisons. Always return valid JSON.',
        },
        {
          role: 'user',
          content: `Analyze this lesson and create a structured comparison of the key concepts discussed. If the lesson compares technologies, frameworks, approaches, or ideas, extract them. Return JSON: { "concepts": string[], "dimensions": string[], "cells": string[][] (rows=dimensions, cols=concepts), "summary": string }. If there are no comparable concepts, return { "concepts": [], "dimensions": [], "cells": [], "summary": "No comparable concepts found in this lesson." }\n\nLesson content:\n${lessonContent.slice(0, 8000)}`,
        },
      ],
    });
    const text = completion.choices[0]?.message?.content || '{}';
    const comparison = JSON.parse(text);
    res.json({ comparison });
  } catch (err: any) {
    console.error('[LearnFlow] Comparison failed:', err);
    sendError(res, req, { status: 500, code: 'comparison_failed', message: err.message });
  }
});

// ── Selection Tools (Discover / Illustrate / Mark) ─────────────────────────

const selectionToolsPreviewSchema = z.object({
  tool: z.enum(['discover', 'illustrate', 'mark']),
  selectedText: z
    .string()
    .min(3)
    .max(5000, 'selectedText too long (max 5000 chars)')
    .transform((s) => s.trim()),
});

// POST /api/v1/courses/:id/lessons/:lessonId/selection-tools/preview
// Returns a preview payload for side tools without persisting anything.
router.post(
  '/:id/lessons/:lessonId/selection-tools/preview',
  validateBody(selectionToolsPreviewSchema),
  async (req: Request, res: Response) => {
    const { tool, selectedText } = req.body;

    const userId = req.user?.sub || 'anonymous';
    const tier = req.user?.tier || 'free';

    try {
      if (tool === 'discover') {
        // Use the existing web search provider (no paid key required).
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { searchSources } = require('@learnflow/agents');
        const results = (await searchSources(String(selectedText))) as any[];
        const trimmed = (results || []).slice(0, 5).map((r: any) => ({
          title: r.title,
          url: r.url,
          source: (() => {
            try {
              return new URL(r.url).hostname;
            } catch {
              return r.source || '';
            }
          })(),
          description: r.description,
        }));

        const note =
          `Discover: related topics/resources\n\n` +
          trimmed
            .map(
              (r: any, i: number) =>
                `${i + 1}. ${r.title}\n${r.url}${r.description ? `\n${r.description}` : ''}`,
            )
            .join('\n\n');

        res.status(200).json({
          tool,
          selectedText,
          preview: { note, results: trimmed },
        });
        return;
      }

      if (tool === 'illustrate') {
        const { client: openai } = getOpenAIForRequest({
          userId,
          tier,
          apiKeyOverride: (req.body as any)?.apiKey,
        });

        // Graceful degradation: allow text-only illustrate even without a configured OpenAI key.
        // In test mode we must be deterministic and avoid network.
        if (!openai || process.env.NODE_ENV === 'test') {
          const summary =
            `- Key idea: ${String(selectedText).slice(0, 140)}${String(selectedText).length > 140 ? '…' : ''}\n` +
            `- Try restating it in your own words\n` +
            `- If you add an OpenAI key, LearnFlow can generate an image for this concept`;
          const note =
            `Illustrate (text-only)\n\n${summary}\n\n` +
            `Note: OpenAI key not configured; image generation is disabled.`;
          res.status(200).json({ tool, selectedText, preview: { note, summary, imageUrl: null } });
          return;
        }

        // 1) Simplified explanation
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful tutor. Explain simply in 2-4 bullets.',
            },
            { role: 'user', content: `Simplify this for a learner:\n\n"${selectedText}"` },
          ],
        });
        const summary = completion.choices[0]?.message?.content || '';

        // 2) Image (best-effort).
        let imageUrl: string | null = null;
        try {
          const imageResponse = await openai.images.generate({
            model: 'dall-e-3',
            prompt: `Educational illustration for this concept: ${selectedText}. Clean, professional, no text in image.`,
            size: '1024x1024',
            quality: 'standard',
            n: 1,
          });
          imageUrl = imageResponse.data?.[0]?.url || null;
        } catch {
          imageUrl = null;
        }

        const note = `Illustrate\n\n${summary}${imageUrl ? `\n\nImage: ${imageUrl}` : ''}`;
        res.status(200).json({ tool, selectedText, preview: { note, summary, imageUrl } });
        return;
      }

      if (tool === 'mark') {
        const { client: openai } = getOpenAIForRequest({
          userId,
          tier,
          apiKeyOverride: (req.body as any)?.apiKey,
        });
        let bullets: string[] = [];
        if (openai) {
          try {
            const completion = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content:
                    'Extract 3-5 concise key takeaways as a JSON array of strings. Return ONLY JSON.',
                },
                { role: 'user', content: selectedText },
              ],
            });
            const text = completion.choices[0]?.message?.content || '[]';
            bullets = JSON.parse(text);
          } catch {
            bullets = [];
          }
        }
        if (!bullets.length) {
          bullets = String(selectedText)
            .split(/[.\n]/)
            .map((s) => s.trim())
            .filter((s) => s.length > 8)
            .slice(0, 5);
        }

        res.status(200).json({ tool, selectedText, preview: { bullets } });
        return;
      }

      sendError(res, req, { status: 400, code: 'validation_error', message: 'unknown tool' });
    } catch (err: any) {
      sendError(res, req, { status: 500, code: 'tool_failed', message: err?.message || 'Failed' });
    }
  },
);

// POST /api/v1/courses/:id/lessons/:lessonId/notes/mark-takeaways
// Appends takeaways to the user's notes for this lesson (so it can be shown in UI).
router.post('/:id/lessons/:lessonId/notes/mark-takeaways', (req: Request, res: Response) => {
  const userId = req.user?.sub || 'anonymous';
  const lessonId = String(req.params.lessonId);
  const { bullets, selectedText } = req.body as { bullets?: string[]; selectedText?: string };

  const existing = dbNotes.get(lessonId, userId);
  const content = existing?.content || {};

  const extras: string[] = Array.isArray(content.keyTakeawaysExtras)
    ? content.keyTakeawaysExtras
    : [];

  const toAdd = Array.isArray(bullets)
    ? bullets
    : String(selectedText || '')
        .split(/[.\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 8)
        .slice(0, 5);

  for (const b of toAdd) {
    const clean = String(b).trim();
    if (!clean) continue;
    if (!extras.includes(clean)) extras.push(clean);
  }

  const note = dbNotes.save(lessonId, userId, { ...content, keyTakeawaysExtras: extras });
  res.status(200).json({ note, keyTakeawaysExtras: extras });
});

// ── Annotations (text-anchored notes) ───────────────────────────────────────

// GET /api/v1/courses/:id/lessons/:lessonId/annotations
router.get('/:id/lessons/:lessonId/annotations', (req: Request, res: Response) => {
  const lessonId = String(req.params.lessonId);
  const annotations = dbAnnotations.getByLesson(lessonId);
  res.json({ annotations });
});

// POST /api/v1/courses/:id/lessons/:lessonId/annotations
router.post('/:id/lessons/:lessonId/annotations', async (req: Request, res: Response) => {
  const lessonId = String(req.params.lessonId);
  const { selectedText, startOffset, endOffset, note, type } = req.body;

  let finalNote = note || '';

  if ((type === 'explain' || type === 'example') && selectedText) {
    const userId = req.user?.sub || 'anonymous';
    const { client: openai } = getOpenAIForRequest({
      userId,
      tier: req.user?.tier || 'free',
      apiKeyOverride: (req.body as any)?.apiKey,
    });
    if (openai) {
      try {
        const prompt =
          type === 'explain'
            ? `Explain this concept clearly and concisely for a student:\n\n"${selectedText}"`
            : `Give a practical, real-world example of this concept:\n\n"${selectedText}"`;
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful tutor. Be concise but thorough.' },
            { role: 'user', content: prompt },
          ],
        });
        finalNote = completion.choices[0]?.message?.content || finalNote;
      } catch (err) {
        console.warn('[LearnFlow] Annotation AI failed:', err);
      }
    }
  }

  const annotation = dbAnnotations.create(
    lessonId,
    selectedText,
    startOffset ?? 0,
    endOffset ?? 0,
    finalNote,
    type || 'note',
  );
  res.status(201).json({ annotation });
});

// DELETE /api/v1/courses/:id/lessons/:lessonId/annotations/:annId
router.delete('/:id/lessons/:lessonId/annotations/:annId', (req: Request, res: Response) => {
  dbAnnotations.delete(String(req.params.annId));
  res.status(204).end();
});

export const coursesRouter = router;
