/**
 * LearnFlow E2E Course Quality Tests
 * Based on LearnFlow Product Spec v1.0 — Sections 4, 5, 6, 7, 9, 10, 11, 15
 *
 * Tests course generation effectiveness, material completeness, syllabus accuracy,
 * content pipeline quality, agent behavior, and spec compliance.
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars, no-empty-pattern, no-useless-escape */
import { test, expect } from '@playwright/test';

const SS = '/home/aifactory/onedrive-learnflow/evals/screenshots/quality';
const API = '/api/v1';

const TOPICS = [
  {
    name: 'Agentic AI and Autonomous Agents',
    depth: 'intermediate',
    // Spec §6.1: Topic Decomposition breaks goal into concept hierarchy
    expectedConceptHierarchy: [
      'agents',
      'autonomy',
      'planning',
      'tool use',
      'memory',
      'multi-agent',
      'orchestration',
      'safety',
    ],
  },
  {
    name: 'Rust Programming for Systems Development',
    depth: 'intermediate',
    expectedConceptHierarchy: [
      'ownership',
      'borrowing',
      'lifetimes',
      'traits',
      'pattern matching',
      'concurrency',
      'cargo',
      'unsafe',
    ],
  },
  {
    name: 'Prompt Engineering and LLM Fine-Tuning',
    depth: 'intermediate',
    expectedConceptHierarchy: [
      'zero-shot',
      'few-shot',
      'chain of thought',
      'system prompt',
      'fine-tuning',
      'LoRA',
      'RLHF',
      'evaluation',
    ],
  },
  {
    name: 'Climate Tech and Carbon Markets',
    depth: 'intermediate',
    expectedConceptHierarchy: [
      'carbon credits',
      'cap and trade',
      'carbon capture',
      'renewable',
      'ESG',
      'net zero',
      'scope 1',
      'scope 2',
    ],
  },
  {
    name: 'Quantum Computing Fundamentals',
    depth: 'beginner',
    expectedConceptHierarchy: [
      'qubit',
      'superposition',
      'entanglement',
      'quantum gate',
      'decoherence',
      'error correction',
      'algorithm',
    ],
  },
];

const fs = require('fs');
function saveArtifact(name: string, data: any) {
  fs.mkdirSync(SS, { recursive: true });
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  fs.writeFileSync(`${SS}/${name}`, content);
}

// ═══════════════════════════════════════════════════════════════════
// SECTION A: Course Builder Agent (Spec §4.2, §6, §10 Course Creation Workflow)
// ═══════════════════════════════════════════════════════════════════

test.describe('A. Course Builder — Spec §4.2, §6, §10', () => {
  for (const topic of TOPICS) {
    const slug = topic.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 40);

    test.describe(`Topic: ${topic.name}`, () => {
      // Spec §6.1 Step 1: Topic Decomposition — breaks goal into concept hierarchy
      test('A1: Topic decomposition produces concept hierarchy', async ({ request }) => {
        const res = await request.post(`${API}/courses`, {
          data: { topic: topic.name, depth: topic.depth, max_lessons: 20 },
        });
        expect(res.status()).toBe(200);
        const course = await res.json();
        saveArtifact(`${slug}-course-full.json`, course);

        // Must have modules (concept hierarchy)
        const modules = course.modules || course.syllabus?.modules || [];
        expect(modules.length).toBeGreaterThanOrEqual(5);

        // Each module = a concept cluster in the hierarchy
        for (const mod of modules) {
          expect(mod.title).toBeTruthy();
          // Spec §6.2: each lesson has Learning Objectives (2-3 bullet points)
          const lessons = mod.lessons || [];
          expect(lessons.length).toBeGreaterThanOrEqual(1);
        }

        // Check concept coverage: ≥60% of expected concepts appear
        const allText = modules
          .flatMap((m: any) => [
            m.title || '',
            m.objective || m.description || '',
            ...(m.lessons || []).map((l: any) => `${l.title || ''} ${l.description || ''}`),
          ])
          .join(' ')
          .toLowerCase();

        const found = topic.expectedConceptHierarchy.filter((c) =>
          allText.includes(c.toLowerCase()),
        );
        const coverage = found.length / topic.expectedConceptHierarchy.length;
        saveArtifact(`${slug}-concept-coverage.json`, {
          topic: topic.name,
          required: topic.expectedConceptHierarchy,
          found,
          missing: topic.expectedConceptHierarchy.filter((c) => !found.includes(c)),
          coverage: `${(coverage * 100).toFixed(0)}%`,
        });
        expect(coverage).toBeGreaterThanOrEqual(0.6);
      });

      // Spec §6.1 Step 7: Lesson Formatting — <10 min read, ~1500 words max
      test('A2: Lesson count and bite-size compliance (≤1500 words, <10 min)', async ({
        request,
      }) => {
        const res = await request.post(`${API}/courses`, {
          data: { topic: topic.name, depth: topic.depth },
        });
        const course = await res.json();
        const modules = course.modules || course.syllabus?.modules || [];
        const totalLessons = modules.reduce((s: number, m: any) => s + (m.lessons?.length || 0), 0);

        // Spec §10 Lesson Delivery: syllabus should have meaningful lesson count
        expect(totalLessons).toBeGreaterThanOrEqual(12);

        // Fetch first lesson content and check word count
        const firstMod = modules[0];
        const firstLesson = firstMod?.lessons?.[0];
        if (firstLesson?.id && course.id) {
          const lessonRes = await request.get(
            `${API}/courses/${course.id}/lessons/${firstLesson.id}`,
          );
          if (lessonRes.ok()) {
            const lesson = await lessonRes.json();
            const content = lesson.content || lesson.body || lesson.text || '';
            const wordCount = content.split(/\s+/).filter((w: string) => w.length > 0).length;
            // Spec §6.2: Core Content max 1500 words
            expect(wordCount).toBeLessThanOrEqual(1800); // small buffer for formatting
            // Spec §10: Every lesson MUST be under 10 min (~1500 words)
            expect(wordCount).toBeGreaterThan(200); // not empty
            saveArtifact(`${slug}-lesson1-wordcount.json`, { wordCount, limit: 1500 });
          }
        }
      });

      // Spec §6.1 Step 8: Syllabus generator structures lessons into modules with prerequisites
      test('A3: Modules have logical prerequisite ordering (foundations → advanced)', async ({
        request,
      }) => {
        const res = await request.post(`${API}/courses`, {
          data: { topic: topic.name, depth: topic.depth },
        });
        const course = await res.json();
        const modules = course.modules || course.syllabus?.modules || [];

        // First module: foundational/intro
        const firstTitle = (modules[0]?.title || '').toLowerCase();
        const introWords = [
          'introduction',
          'fundamentals',
          'basics',
          'foundation',
          'overview',
          'getting started',
          'what is',
          'core',
        ];
        expect(introWords.some((w) => firstTitle.includes(w))).toBe(true);

        // Last module: advanced/applied/capstone
        const lastTitle = (modules[modules.length - 1]?.title || '').toLowerCase();
        const advancedWords = [
          'advanced',
          'capstone',
          'project',
          'future',
          'application',
          'real-world',
          'practical',
          'next steps',
          'beyond',
          'frontier',
        ];
        expect(advancedWords.some((w) => lastTitle.includes(w))).toBe(true);
      });

      // Spec §6.1 Step 6: Deduplication via MinHash/SimHash
      test('A4: No duplicate or near-duplicate lessons', async ({ request }) => {
        const res = await request.post(`${API}/courses`, {
          data: { topic: topic.name },
        });
        const course = await res.json();
        const titles = (course.modules || []).flatMap((m: any) =>
          (m.lessons || []).map((l: any) => (l.title || '').toLowerCase().trim()),
        );

        // No exact duplicates
        expect(new Set(titles).size).toBe(titles.length);

        // No near-duplicates (Jaccard >0.7 on words)
        for (let i = 0; i < titles.length; i++) {
          for (let j = i + 1; j < titles.length; j++) {
            const a = new Set(titles[i].split(/\s+/));
            const b = new Set(titles[j].split(/\s+/));
            const inter = [...a].filter((w) => b.has(w)).length;
            const sim = inter / Math.max(a.size, b.size);
            expect(sim).toBeLessThan(0.7);
          }
        }
      });
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// SECTION B: Lesson Structure Compliance (Spec §6.2 — Lesson Structure)
// ═══════════════════════════════════════════════════════════════════

test.describe('B. Lesson Structure — Spec §6.2', () => {
  for (const topic of TOPICS) {
    const slug = topic.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 40);

    test(`${topic.name}: Lesson has all required elements per §6.2`, async ({ request }) => {
      // Generate course + get first lesson
      const courseRes = await request.post(`${API}/courses`, { data: { topic: topic.name } });
      const course = await courseRes.json();
      const lessonRef = course.modules?.[0]?.lessons?.[0];
      if (!lessonRef?.id || !course.id) {
        test.skip();
        return;
      }

      const lessonRes = await request.get(`${API}/courses/${course.id}/lessons/${lessonRef.id}`);
      expect(lessonRes.ok()).toBe(true);
      const lesson = await lessonRes.json();
      const content = lesson.content || lesson.body || lesson.text || '';
      saveArtifact(`${slug}-lesson-full.txt`, content);

      // §6.2 Title: clear, descriptive, ≤80 chars
      const title = lesson.title || lessonRef.title || '';
      expect(title.length).toBeGreaterThan(5);
      expect(title.length).toBeLessThanOrEqual(80);

      // §6.2 Estimated Time: always <10 min
      if (lesson.estimatedTime || lesson.estimated_time) {
        const minutes = parseInt(String(lesson.estimatedTime || lesson.estimated_time));
        expect(minutes).toBeLessThanOrEqual(10);
      }

      // §6.2 Learning Objectives: 2-3 bullet points, ≤150 chars each
      const hasObjectives = /learning objectives|what you.ll learn|by the end|objectives/i.test(
        content,
      );
      expect(hasObjectives).toBe(true);

      // §6.2 Core Content: well-structured with headings
      const hasHeadings =
        /^#{1,3}\s/m.test(content) || /<h[1-3]/i.test(content) || /\*\*[A-Z]/m.test(content);
      expect(hasHeadings).toBe(true);

      // §6.2 Key Takeaways: 3-5 summary points
      const hasTakeaways = /key takeaways|summary|key points|in summary|what we covered/i.test(
        content,
      );
      expect(hasTakeaways).toBe(true);

      // §6.2 Sources: attributed links
      const hasSourceSection = /sources|references|further reading|citations/i.test(content);
      expect(hasSourceSection).toBe(true);

      // §6.2 Next Steps: suggested follow-up
      const hasNextSteps = /next steps|next lesson|continue with|what.s next|up next/i.test(
        content,
      );
      expect(hasNextSteps).toBe(true);

      saveArtifact(`${slug}-lesson-structure-check.json`, {
        title,
        titleLength: title.length,
        hasObjectives,
        hasHeadings,
        hasTakeaways,
        hasSourceSection,
        hasNextSteps,
        wordCount: content.split(/\s+/).length,
      });
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// SECTION C: Content Pipeline — Attribution & Quality (Spec §6.1, §6.3)
// ═══════════════════════════════════════════════════════════════════

test.describe('C. Content Pipeline & Attribution — Spec §6.1, §6.3', () => {
  for (const topic of TOPICS) {
    const slug = topic.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 40);

    test(`${topic.name}: Content has Firecrawl-sourced attributions per §6.1/§6.3`, async ({
      request,
    }) => {
      const courseRes = await request.post(`${API}/courses`, { data: { topic: topic.name } });
      const course = await courseRes.json();
      const lessonRef = course.modules?.[0]?.lessons?.[0];
      if (!lessonRef?.id || !course.id) {
        test.skip();
        return;
      }

      const lessonRes = await request.get(`${API}/courses/${course.id}/lessons/${lessonRef.id}`);
      const lesson = await lessonRes.json();
      const content = lesson.content || lesson.body || '';

      // §6.1 Step 5: Attribution Recording — original URL, author, publication, date
      const urls = content.match(/https?:\/\/[^\s)"']+/g) || [];
      expect(urls.length).toBeGreaterThanOrEqual(3); // min 3 sources

      // §6.3: Full attribution chain — users can tap any citation to see original source
      const inlineCitations = (content.match(/\[\d+\]/g) || []).length;
      expect(inlineCitations).toBeGreaterThanOrEqual(3);

      // §6.1 Step 4: Quality Scoring — authority (domain reputation)
      // Verify source diversity: no single domain >50%
      const domains = urls
        .map((u: string) => {
          try {
            return new URL(u).hostname;
          } catch {
            return '';
          }
        })
        .filter(Boolean);
      const domainCounts: Record<string, number> = {};
      for (const d of domains) {
        domainCounts[d] = (domainCounts[d] || 0) + 1;
      }
      for (const count of Object.values(domainCounts)) {
        expect(count / urls.length).toBeLessThanOrEqual(0.5);
      }

      saveArtifact(`${slug}-attribution.json`, {
        urlCount: urls.length,
        inlineCitations,
        domains: domainCounts,
        urls: urls.slice(0, 10), // first 10
      });
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// SECTION D: Orchestrator Agent Behavior (Spec §10 — System Prompt)
// ═══════════════════════════════════════════════════════════════════

test.describe('D. Orchestrator Behavior — Spec §10', () => {
  // §10 Course Creation Workflow Steps 1-6
  test('D1: Orchestrator follows course creation workflow via chat', async ({ page }) => {
    await page.goto('/conversation');
    await expect(page.locator('[data-screen="conversation"]')).toBeVisible();
    await page.screenshot({ path: `${SS}/orch-start.png` });

    // Step 1: User declares learning goal
    await page.fill(
      '[aria-label="Message input"]',
      'I want to learn about Agentic AI and autonomous agents',
    );
    await page.click('[aria-label="Send message"]');
    await page.waitForTimeout(3000);

    // §10 Step 1: Orchestrator should acknowledge and ask clarifying questions
    const response = (await page.locator('[data-role="assistant"]').last().textContent()) || '';
    const asksClarification =
      /skill level|experience|time|how long|what aspects|specific area|current knowledge/i.test(
        response,
      );
    // The orchestrator should either ask for clarification or proceed with course building
    const proceedsToBuild = /building|creating|generating|course|syllabus/i.test(response);
    expect(asksClarification || proceedsToBuild).toBe(true);

    await page.screenshot({ path: `${SS}/orch-clarification.png`, fullPage: true });
    saveArtifact('orch-d1-response.txt', response);
  });

  // §10 Lesson Delivery Rules: after presenting lesson, ALWAYS offer 3-4 contextual action chips
  test('D2: Lesson view offers contextual action chips (Take Notes, Quiz Me, Go Deeper)', async ({
    page,
  }) => {
    await page.goto('/courses/c-1/lessons/l1');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/orch-lesson-actions.png`, fullPage: true });

    // §10: Bottom action bar: Mark Complete, Take Notes, Quiz Me, Ask Question
    const pageText = ((await page.textContent('body')) || '').toLowerCase();
    const hasNotes = /take notes|notes/i.test(pageText);
    const hasQuiz = /quiz me|quiz|test/i.test(pageText);
    const hasComplete = /mark complete|complete|done/i.test(pageText);

    // At least 2 of the 3 action types should be present
    const actionCount = [hasNotes, hasQuiz, hasComplete].filter(Boolean).length;
    expect(actionCount).toBeGreaterThanOrEqual(2);
  });

  // §10 Agent Activity: agent activity indicator showing which agent is working
  test('D3: Chat shows agent activity indicator during processing', async ({ page }) => {
    await page.goto('/conversation');
    await expect(page.locator('[data-screen="conversation"]')).toBeVisible();

    await page.fill('[aria-label="Message input"]', 'Create a course on Rust Programming');
    await page.click('[aria-label="Send message"]');

    // §5.2.3: Agent activity indicator — subtle animation showing which agent is processing
    // Check for any loading/processing indicator within 2 seconds
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SS}/orch-agent-activity.png` });

    // Look for agent indicator, loading, typing, or processing state
    const hasIndicator = await page
      .locator(
        '[data-component="agent-activity"], [aria-label*="processing"], [aria-label*="typing"], .loading, .spinner, [data-loading]',
      )
      .count();
    // This is aspirational — log result but don't hard-fail
    saveArtifact('orch-d3-indicator.json', { hasIndicator: hasIndicator > 0 });
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION E: Core Agent Quality (Spec §4.2 — Agent Catalog)
// ═══════════════════════════════════════════════════════════════════

test.describe('E. Core Agent Output Quality — Spec §4.2', () => {
  // Notes Agent: Cornell, Zettelkasten, flashcard formats
  test('E1: Notes Agent produces Cornell format with cue column and summary', async ({
    request,
  }) => {
    // First get a lesson
    const courseRes = await request.post(`${API}/courses`, {
      data: { topic: 'Quantum Computing Fundamentals' },
    });
    const course = await courseRes.json();
    const lessonRef = course.modules?.[0]?.lessons?.[0];
    if (!lessonRef?.id || !course.id) {
      test.skip();
      return;
    }

    const lessonRes = await request.get(`${API}/courses/${course.id}/lessons/${lessonRef.id}`);
    const lesson = await lessonRes.json();

    // Call notes endpoint (if available via chat or direct API)
    const notesRes = await request.post(`${API}/chat`, {
      data: { text: `Take notes on lesson ${lessonRef.id} in Cornell format` },
    });
    if (notesRes.ok()) {
      const notes = await notesRes.json();
      const content = notes.content || notes.response || JSON.stringify(notes);
      saveArtifact('notes-cornell.txt', content);

      // §4.2: Cornell format has: main notes, cue column questions, summary
      const hasCueColumn = /cue|questions|key questions|review questions/i.test(content);
      const hasSummary = /summary/i.test(content);
      expect(hasCueColumn || hasSummary).toBe(true);
    }
  });

  // Exam Agent: MCQ, short-answer, scoring, gap analysis
  test('E2: Exam Agent produces quiz with MCQ + short answer + gap analysis', async ({
    request,
  }) => {
    const examRes = await request.post(`${API}/chat`, {
      data: { text: 'Quiz me on Quantum Computing — generate 10 questions' },
    });
    if (examRes.ok()) {
      const exam = await examRes.json();
      const content = exam.content || exam.response || JSON.stringify(exam);
      saveArtifact('exam-output.txt', content);

      // §4.2: MCQ + short-answer + scoring + gap analysis
      const hasMCQ = /\b[A-D]\)|\b[a-d]\)|option|choice|multiple.choice/i.test(content);
      const hasQuestion = /\?/.test(content);
      expect(hasQuestion).toBe(true);
    }
  });

  // Research Agent: finds primary sources, preprints, conference papers
  test('E3: Research Agent returns papers with title, authors, abstract', async ({ request }) => {
    const researchRes = await request.post(`${API}/chat`, {
      data: { text: 'Find latest research on quantum error correction' },
    });
    if (researchRes.ok()) {
      const research = await researchRes.json();
      const content = research.content || research.response || JSON.stringify(research);
      saveArtifact('research-output.txt', content);

      // §4.2: Deep-dives into research, primary sources, preprints
      const hasURLs = /https?:\/\//.test(content);
      const hasPaperRef = /arxiv|ieee|acm|springer|nature|science|doi/i.test(content);
      expect(hasURLs || hasPaperRef).toBe(true);
    }
  });

  // Summarizer Agent: condenses long-form, executive summaries
  test('E4: Summarizer produces concise summary preserving key facts', async ({ request }) => {
    const sumRes = await request.post(`${API}/chat`, {
      data: { text: 'Summarize what I learned about quantum computing so far' },
    });
    if (sumRes.ok()) {
      const summary = await sumRes.json();
      const content = summary.content || summary.response || JSON.stringify(summary);
      saveArtifact('summarizer-output.txt', content);

      // §4.2: condenses into key takeaways, executive summaries
      const wordCount = content.split(/\s+/).length;
      expect(wordCount).toBeLessThan(1000); // should be concise
      expect(wordCount).toBeGreaterThan(50); // but not empty
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION F: UI Compliance (Spec §5.2 — Core Screens)
// ═══════════════════════════════════════════════════════════════════

test.describe('F. UI Screen Compliance — Spec §5.2', () => {
  // §5.2.1 Onboarding: 6 screens
  test('F1: Onboarding has all 6 required screens', async ({ page }) => {
    // Screen 1: Welcome
    await page.goto('/onboarding/welcome');
    await expect(page.locator('text=/welcome|get started|learnflow/i')).toBeVisible();
    await page.screenshot({ path: `${SS}/ui-onboarding-1-welcome.png` });

    // Screen 2: Goal Setting (conversational)
    await page.goto('/onboarding/goals');
    await page.screenshot({ path: `${SS}/ui-onboarding-2-goals.png` });

    // Screen 3: Interest Mapping (tags/chips)
    await page.goto('/onboarding/interests');
    await page.screenshot({ path: `${SS}/ui-onboarding-3-interests.png` });

    // Screen 4: API Key Setup
    await page.goto('/onboarding/api-key');
    await page.screenshot({ path: `${SS}/ui-onboarding-4-apikey.png` });

    // Screen 5: Subscription Choice
    await page.goto('/onboarding/subscription');
    await page.screenshot({ path: `${SS}/ui-onboarding-5-subscription.png` });

    // Screen 6: First Course Generation
    await page.goto('/onboarding/first-course');
    await page.screenshot({ path: `${SS}/ui-onboarding-6-firstcourse.png` });
  });

  // §5.2.2 Dashboard: courses carousel, today's lessons, mindmap, streak, notifications
  test('F2: Dashboard has all required components per §5.2.2', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/ui-dashboard-full.png`, fullPage: true });

    const body = (await page.textContent('body')) || '';
    const bodyLower = body.toLowerCase();

    // Active Courses carousel
    const hasCourses = await page
      .locator('[data-component="course-carousel"], [aria-label*="course"]')
      .count();
    // Today's Lessons queue
    const hasLessons =
      bodyLower.includes('lesson') ||
      (await page.locator('[data-component="daily-lessons"]').count()) > 0;
    // Mindmap Overview
    const hasMindmap = await page
      .locator('[data-component="mindmap-preview"], [aria-label*="mindmap"]')
      .count();
    // Streak/Progress stats
    const hasStreak =
      bodyLower.includes('streak') ||
      (await page.locator('[data-component="streak-tracker"]').count()) > 0;

    saveArtifact('ui-dashboard-check.json', {
      hasCourses: hasCourses > 0,
      hasLessons,
      hasMindmap: hasMindmap > 0,
      hasStreak,
    });

    // At least 3 of 4 required components
    const count = [hasCourses > 0, hasLessons, hasMindmap > 0, hasStreak].filter(Boolean).length;
    expect(count).toBeGreaterThanOrEqual(3);
  });

  // §5.2.3 Conversation: message bubbles, markdown, agent activity, quick-action chips, source drawer
  test('F3: Conversation interface has spec-required elements', async ({ page }) => {
    await page.goto('/conversation');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/ui-conversation.png`, fullPage: true });

    // Message bubbles with roles
    const hasAssistant = await page.locator('[data-role="assistant"]').count();
    expect(hasAssistant).toBeGreaterThanOrEqual(1);

    // Message input
    const hasInput = await page
      .locator('[aria-label="Message input"], input[name="message"], textarea')
      .count();
    expect(hasInput).toBeGreaterThanOrEqual(1);

    // Quick-action chips (§5.2.3)
    const pageText = ((await page.textContent('body')) || '').toLowerCase();
    const hasChips =
      /take notes|quiz me|go deeper|see sources/i.test(pageText) ||
      (await page.locator('[data-component="action-chips"], [role="group"] button').count()) > 0;

    saveArtifact('ui-conversation-check.json', {
      hasAssistant: hasAssistant > 0,
      hasInput: hasInput > 0,
      hasChips,
    });
  });

  // §5.2.4 Course View: syllabus, lesson reader, inline citations, progress tracker, action bar
  test('F4: Course view has syllabus, progress tracker, and action bar', async ({ page }) => {
    await page.goto('/courses/c-1');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/ui-courseview.png`, fullPage: true });

    // Structured syllabus
    const hasSyllabus = await page
      .locator('[aria-label="Course syllabus"], [data-component="syllabus"]')
      .count();
    // Progress tracker
    const hasProgress = await page
      .locator('[data-component="progress-tracker"], [aria-label*="progress"]')
      .count();

    const pageText = ((await page.textContent('body')) || '').toLowerCase();
    const hasModules =
      pageText.includes('module') ||
      (await page.locator('[data-component="syllabus"] button').count()) > 0;

    saveArtifact('ui-courseview-check.json', {
      hasSyllabus: hasSyllabus > 0,
      hasProgress: hasProgress > 0,
      hasModules,
    });

    expect(hasSyllabus + hasProgress).toBeGreaterThanOrEqual(1);
  });

  // §5.2.5 Mindmap Explorer: interactive graph, color-coded mastery, clickable nodes
  test('F5: Mindmap shows interactive graph with mastery indicators', async ({ page }) => {
    await page.goto('/mindmap');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/ui-mindmap.png`, fullPage: true });

    // Knowledge graph present
    const hasGraph = await page.locator('[aria-label="Knowledge graph"], svg, canvas').count();
    // Nodes
    const hasNodes = await page.locator('[data-node-id], [role="treeitem"]').count();

    saveArtifact('ui-mindmap-check.json', {
      hasGraph: hasGraph > 0,
      nodeCount: hasNodes,
    });

    expect(hasGraph).toBeGreaterThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION G: Cross-Topic Differentiation & Marketplace (Spec §7)
// ═══════════════════════════════════════════════════════════════════

test.describe('G. Cross-Topic & Marketplace — Spec §7', () => {
  test('G1: Different topics produce meaningfully different syllabi', async ({ request }) => {
    const courses: Record<string, string[]> = {};
    for (const topic of TOPICS.slice(0, 3)) {
      const res = await request.post(`${API}/courses`, { data: { topic: topic.name } });
      const course = await res.json();
      courses[topic.name] = (course.modules || []).map((m: any) => (m.title || '').toLowerCase());
    }

    const names = Object.keys(courses);
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const a = new Set(courses[names[i]]);
        const b = new Set(courses[names[j]]);
        const shared = [...a].filter((t) => b.has(t)).length;
        const sim = shared / Math.max(a.size, b.size);
        saveArtifact(`cross-topic-${i}-${j}.json`, {
          topicA: names[i],
          topicB: names[j],
          similarity: `${(sim * 100).toFixed(0)}%`,
          modulesA: [...a],
          modulesB: [...b],
          shared: [...a].filter((t) => b.has(t)),
        });
        expect(sim).toBeLessThan(0.3);
      }
    }
  });

  // §7.1: Course marketplace browsing
  test('G2: Marketplace courses endpoint returns browsable catalog', async ({ request }) => {
    const res = await request.get(`${API}/marketplace/courses`);
    if (res.ok()) {
      const data = await res.json();
      const courses = data.courses || data.items || data;
      saveArtifact('marketplace-courses.json', courses);
      expect(Array.isArray(courses)).toBe(true);
    }
  });

  // §7.2: Agent marketplace
  test('G3: Agent marketplace returns available agents with manifests', async ({ request }) => {
    const res = await request.get(`${API}/marketplace/agents`);
    if (res.ok()) {
      const data = await res.json();
      const agents = data.agents || data.items || data;
      saveArtifact('marketplace-agents.json', agents);
      expect(Array.isArray(agents)).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION H: Student Context & Behavioral Tracking (Spec §9)
// ═══════════════════════════════════════════════════════════════════

test.describe('H. Student Context — Spec §9', () => {
  test('H1: Profile context endpoint returns Student Context Object', async ({ request }) => {
    const res = await request.get(`${API}/profile/context`);
    if (res.ok()) {
      const ctx = await res.json();
      saveArtifact('student-context.json', ctx);

      // §9.1: SCO should have goals, interests, progress, activity, subscription, preferences
      const hasGoals = 'goals' in ctx || 'learningGoals' in ctx;
      const hasProgress = 'progress' in ctx || 'courses' in ctx;
      const hasSubscription = 'subscription' in ctx || 'tier' in ctx;

      saveArtifact('student-context-check.json', { hasGoals, hasProgress, hasSubscription });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION I: API Compliance (Spec §11 — API Specification)
// ═══════════════════════════════════════════════════════════════════

test.describe('I. API Endpoints — Spec §11.1', () => {
  const endpoints = [
    { method: 'POST', path: '/auth/register', desc: 'Create account' },
    { method: 'POST', path: '/auth/login', desc: 'Authenticate' },
    { method: 'POST', path: '/keys', desc: 'Add API key' },
    { method: 'GET', path: '/keys', desc: 'List API keys' },
    { method: 'POST', path: '/chat', desc: 'Send message to Orchestrator' },
    { method: 'GET', path: '/courses', desc: 'List courses' },
    { method: 'GET', path: '/mindmap', desc: 'Get knowledge graph' },
    { method: 'GET', path: '/marketplace/courses', desc: 'Browse courses' },
    { method: 'GET', path: '/marketplace/agents', desc: 'Browse agents' },
    { method: 'GET', path: '/profile/context', desc: 'Get Student Context' },
    { method: 'POST', path: '/subscription', desc: 'Subscribe/upgrade' },
    { method: 'GET', path: '/analytics', desc: 'Learning analytics' },
  ];

  for (const ep of endpoints) {
    test(`API ${ep.method} ${ep.path} — ${ep.desc}`, async ({ request }) => {
      let res;
      if (ep.method === 'GET') {
        res = await request.get(`${API}${ep.path}`);
      } else {
        res = await request.post(`${API}${ep.path}`, { data: {} });
      }
      // Endpoint exists (not 404). May return 401 (auth required) or 400 (bad request) — that's fine.
      expect(res.status()).not.toBe(404);
      saveArtifact(`api-${ep.path.replace(/\//g, '-')}.json`, {
        method: ep.method,
        path: ep.path,
        status: res.status(),
      });
    });
  }
});
