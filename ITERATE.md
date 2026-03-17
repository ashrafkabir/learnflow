# ITERATE.md — Current Iteration Plan

> **This file is mutable.** The Orchestrator modifies it during the iteration loop. Before every change, the old version is snapshotted to `iterations/iter-{N}/old-iterate.md`. The new version is snapshotted to `iterations/iter-{N}/new-iterate.md`.

---

## Current State

- **Active Sprint**: S05 (next)
- **Current Score**: —
- **Iteration Number**: 0
- **Strategy**: Continue build with MANDATORY end-to-end test execution

---

## ⚠️ GLOBAL OVERRIDE — MANDATORY E2E TEST EXECUTION

**Effective immediately for ALL sprints (S05+, and retroactive verification of S01-S04):**

Every eval cycle MUST include actually running the tests, not just checking that files exist or self-assessing assertions. Specifically:

1. **Unit tests MUST execute**: Run `npx turbo run test` (or `npx vitest run` in each package) and verify exit code 0. Paste actual test output in eval results.
2. **TypeScript MUST compile**: Run `npx tsc --noEmit` at monorepo root. Zero errors required.
3. **Integration tests MUST execute**: For sprints with integration assertions, actually start the API server (or use supertest) and make real HTTP calls.
4. **Lint MUST pass**: Run `npx eslint .` and `npx prettier --check .` — actual execution, not file existence.
5. **Docker Compose MUST validate**: Run `docker compose config --quiet` for infrastructure assertions.

**Eval results JSON must include:**

- `"test_output"`: actual stdout/stderr from test runs
- `"exit_code"`: actual process exit code
- `"command_run"`: the exact command that was executed

**If tests fail, that's a FAIL assertion — enter the iteration loop and fix the code until tests actually pass.**

Self-assessment alone (checking file exists, reading code and judging it correct) does NOT count as PASS. The code must run.

---

## ⚠️ GLOBAL OVERRIDE #2 — MANDATORY PLAYWRIGHT E2E TESTING WITH REAL TRENDING TOPICS

**This is the highest priority eval requirement. The app must ACTUALLY RUN and be tested through a browser.**

### Setup

1. Playwright is available at: `NODE_PATH=/home/aifactory/.npm-global/lib/node_modules/@executeautomation/playwright-mcp-server/node_modules`
2. Chromium is at: `/home/aifactory/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome`
3. Install Playwright test runner in the project: `npm install -D @playwright/test`
4. Create `playwright.config.ts` at monorepo root

### What Must Happen

After the API (S07) and Client (S08) are built, the system must be:

1. **Started** — `docker compose up -d` for Postgres/Redis/MinIO, then `npm run dev` for the API server and web client
2. **Tested via Playwright** — real browser automation hitting the running app
3. **Fed trending topics** — not hardcoded test data, use REAL current trending learning topics

### Trending Topics Test Data (use these 5 topics)

1. "Agentic AI and Autonomous Agents" — hottest topic in tech right now
2. "Rust Programming for Systems Development" — trending in developer education
3. "Prompt Engineering and LLM Fine-Tuning" — high demand learning topic
4. "Climate Tech and Carbon Markets" — trending in sustainability education
5. "Quantum Computing Fundamentals" — perennial STEM demand

### Playwright E2E Test Suite (`e2e/learning-journey.spec.ts`)

**Test 1: User Registration & Onboarding**

- Navigate to the app
- Register a new user
- Complete onboarding flow (set learning goals, preferred topics)
- Assert: user lands on home dashboard

**Test 2: Course Generation Quality (run for each of 5 topics)**

- Enter topic in course builder
- Wait for course generation to complete
- Assert: course has ≥5 modules visible in UI
- Assert: each module shows lesson count, estimated time, and learning objective
- Assert: lesson titles are specific (not generic like "Introduction" or "Conclusion" for every module)
- **Screenshot each generated syllabus** → save to `evals/screenshots/`
- Assert: no two modules have identical descriptions

**Test 3: Lesson Content Depth**

- Open lesson 1 of the first course
- Wait for content to render
- Assert: content area has ≥800 words (measure visible text length)
- Assert: content contains at least 1 code block OR 1 diagram OR 1 example (not just prose)
- Assert: sources/references section exists with ≥1 link
- **Screenshot the lesson** → save to `evals/screenshots/`
- Navigate to lesson 3 — repeat assertions

**Test 4: Notes Generation**

- From a lesson view, click "Take Notes" (or equivalent)
- Select Cornell format
- Wait for notes to generate
- Assert: notes panel/page shows cue column + notes + summary sections
- Assert: ≥5 cue questions visible
- Switch to Flashcard format
- Assert: ≥8 flashcards generated
- **Screenshot notes** → save to `evals/screenshots/`

**Test 5: Quiz/Exam Flow**

- Navigate to quiz for module 1
- Assert: ≥8 questions displayed
- Assert: multiple choice questions have exactly 4 options each
- Answer all questions (mix of correct and intentionally wrong)
- Submit quiz
- Assert: score is displayed
- Assert: knowledge gap analysis shows which topics need review
- **Screenshot quiz results** → save to `evals/screenshots/`

**Test 6: Research Agent**

- Open research panel
- Search for "latest developments in [topic]"
- Assert: ≥3 results displayed with titles and abstracts
- Assert: results are topically relevant (title contains topic keywords)
- **Screenshot research results**

**Test 7: Mindmap Visualization**

- Navigate to mindmap view
- Assert: course nodes are visible and connected
- Assert: nodes are interactive (clickable)
- Assert: mastery indicators visible on nodes
- **Screenshot mindmap**

**Test 8: Cross-Topic Comparison**

- Generate courses for at least 2 different topics
- Assert: syllabi are meaningfully different (not template variations)
- Compare lesson structures — different topics should have different module breakdowns
- **Screenshot both syllabi side by side if possible**

### Grading & Iteration

- Each test has multiple assertions. Total should be ≥50 assertions across all 8 tests.
- **All screenshots are saved to `evals/screenshots/` with descriptive names** for human review.
- Journey score = passed / total. **Must reach ≥0.80 (80%) to pass.**
- If score < 0.80: enter iteration loop, identify the weakest areas, fix, re-run.
- **The iteration decision is based on what the Playwright tests ACTUALLY show** — not self-assessment.

### When to Run

- **First run**: After S08 (Client) is complete — full UI + API must be running
- **Second run**: After S13 (QA) as final validation
- **Can also run after S07**: API-only tests via Playwright hitting API endpoints directly (no UI needed)

### Output

Write results to `evals/e2e-results-{timestamp}.json`:

```json
{
  "timestamp": "...",
  "topics_tested": ["Agentic AI...", "Rust...", ...],
  "tests": [
    { "name": "Course Generation - Agentic AI", "assertions": 6, "passed": 5, "failed": 1, "failures": ["lesson titles not specific enough"], "screenshot": "evals/screenshots/course-agentic-ai.png" }
  ],
  "total_assertions": 52,
  "total_passed": 44,
  "score": 0.846,
  "iteration_needed": true,
  "recommended_fixes": ["Improve lesson title specificity in course builder prompt"]
}
```

---

## ⚠️ GLOBAL OVERRIDE #3 — FIRECRAWL-POWERED CONTENT SOURCING & ATTRIBUTION

**Content must come from REAL crawled web sources, not LLM hallucinations. Every lesson must cite its sources with verifiable URLs.**

### Firecrawl Integration

The Firecrawl skill is available. API key is set in env: `FIRECRAWL_API_KEY`.
Skill docs: `/home/aifactory/.openclaw/workspace/skills/firecrawl-search/SKILL.md`

### How Content Generation Must Work

**Step 1: Topic Research via Firecrawl**
When generating a course or lesson, the content pipeline MUST:

1. Use Firecrawl to **search and scrape** real articles, documentation, tutorials, and papers related to the topic
2. Target high-quality sources:
   - Official documentation (docs.python.org, rust-lang.org, etc.)
   - Educational platforms (MIT OCW, Khan Academy, Coursera syllabus pages)
   - Technical blogs (Medium engineering blogs, dev.to, official company blogs)
   - Academic papers (arxiv.org abstracts, Google Scholar)
   - Industry reports and whitepapers
3. Extract **full markdown content** from each page (not just snippets)
4. Store crawled content in a structured format with metadata:

```json
{
  "url": "https://example.com/article",
  "title": "Understanding Quantum Entanglement",
  "author": "Dr. Jane Smith",
  "publishDate": "2025-11-15",
  "source": "MIT Technology Review",
  "content": "... full markdown ...",
  "credibilityScore": 0.92,
  "relevanceScore": 0.87,
  "wordCount": 2400
}
```

**Step 2: Source Quality Scoring**
Each crawled source must be scored on:

- **Credibility** (0-1): Academic/official > established media > blogs > forums
  - arxiv.org, .edu, .gov, official docs → 0.9-1.0
  - MIT Tech Review, Wired, Nature, IEEE → 0.8-0.9
  - Medium (verified authors), dev.to (high engagement) → 0.6-0.8
  - Random blogs, no-author pages → 0.3-0.5
  - Content farms, SEO spam → 0.0-0.2 (REJECT)
- **Recency** (0-1): Prefer content from last 2 years, decay for older content
- **Relevance** (0-1): Semantic similarity to the lesson topic
- **Minimum threshold**: Only use sources scoring ≥0.5 combined average

**Step 3: Content Synthesis (NOT Copy)**
The LLM synthesizes lesson content FROM the crawled sources:

- Paraphrases and restructures — never copies verbatim (plagiarism check)
- Combines insights from multiple sources into coherent narrative
- Adds pedagogical structure (learning objectives, examples, exercises)
- Preserves factual accuracy from source material

**Step 4: Attribution in Every Lesson**
Every lesson MUST include:

1. **Inline citations** — when a specific fact, statistic, or claim is made, cite the source: "Quantum entanglement was experimentally verified in 1982 (Aspect et al., via MIT Tech Review [1])"
2. **References section** at the bottom of every lesson:

```
## References & Further Reading
1. Smith, J. "Understanding Quantum Entanglement" MIT Technology Review, Nov 2025. https://example.com/article
2. Official Rust Documentation - Ownership. https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html
3. Chen, L. "Building Autonomous AI Agents" arXiv:2025.12345, Dec 2025. https://arxiv.org/abs/2025.12345
```

3. **Source count per lesson**: Minimum 3 sources, target 5-8 sources per lesson
4. **Source diversity**: No more than 50% of sources from a single domain

### Eval Assertions for Content Sourcing

**S04-FIRE-01**: Content pipeline calls Firecrawl for every new topic/lesson
**S04-FIRE-02**: Crawled sources are stored with full metadata (URL, title, author, date, credibility score)
**S04-FIRE-03**: Sources scoring <0.5 credibility are rejected
**S04-FIRE-04**: Every lesson has ≥3 cited sources with verifiable URLs
**S04-FIRE-05**: References section exists at the bottom of every lesson with full attribution
**S04-FIRE-06**: Inline citations appear in lesson body (at least 3 per lesson)
**S04-FIRE-07**: No single domain provides >50% of sources for a lesson
**S04-FIRE-08**: Source URLs are valid (HTTP 200 when checked)
**S04-FIRE-09**: Content is synthesized, not copied — no paragraph matches >80% similarity to any single source
**S04-FIRE-10**: Crawled content is cached locally to avoid redundant scraping

### Playwright E2E Assertions (add to existing test suite)

In the lesson content tests:

- Assert: "References" or "Sources" section visible at bottom of lesson
- Assert: ≥3 clickable source links in references
- Assert: inline citation markers visible in lesson body (e.g., [1], [2])
- Screenshot the references section → `evals/screenshots/`

### Integration with Content Pipeline

The Course Builder (S04) and Content Pipeline must be updated to:

1. Accept Firecrawl as a content source provider
2. Run Firecrawl searches before generating each lesson
3. Pass crawled content to the LLM as context for synthesis
4. Format and attach citations to the generated lesson
5. Cache crawled results in MinIO/local storage (TTL: 7 days)

This is NOT optional. Lessons without real source attribution FAIL the eval.

---

## ⚠️ GLOBAL OVERRIDE #4 — CONTENT QUALITY JOURNEY TEST (PROGRAMMATIC)

**Effective after S05 is complete (runs once S03+S04+S05 agents are all built):**

The system must pass a **Complete Learning Journey Test** that evaluates the RICHNESS and QUALITY of generated content — not just structure. This is a script that exercises the full pipeline end-to-end and grades the output.

### The Journey Test Script

Create `evals/journey-test.ts` that runs this exact flow:

**Step 1: Course Generation**

- Input topic: "Introduction to Quantum Computing"
- Call the Course Builder agent to generate a full course
- **Assert**: Course has ≥5 modules, ≥15 lessons total
- **Assert**: Each module has a clear learning objective (not generic filler)
- **Assert**: Modules have logical prerequisite ordering (fundamentals before advanced)
- **Assert**: Syllabus covers: qubits, superposition, entanglement, quantum gates, algorithms (Shor's, Grover's), hardware, error correction, real-world applications
- **Quality check**: No two lessons have >40% content overlap (dedup score)

**Step 2: Lesson Content Depth**

- Pick 3 lessons from different modules (lesson 1, lesson 8, lesson 15)
- For each lesson, generate full content via the content pipeline
- **Assert**: Each lesson has ≥800 words of actual educational content (not boilerplate)
- **Assert**: Each lesson includes: explanation, at least 1 concrete example, at least 1 analogy
- **Assert**: Technical terms are defined on first use
- **Assert**: Each lesson references ≥2 sources with real attribution (URL, author)
- **Assert**: Reading level is appropriate (Flesch-Kincaid grade 10-14 for this topic)
- **Assert**: Content is factually accurate — key claims are verifiable (check against known facts about quantum computing)

**Step 3: Notes Generation**

- Take lesson 1's content, run Notes Agent in Cornell format
- **Assert**: Notes have: main notes section, cue column questions (≥5), summary section
- **Assert**: Cue questions are meaningful (not "What is X?" for every item — varied Bloom's taxonomy levels)
- Take lesson 8's content, run Notes Agent in Zettelkasten format
- **Assert**: Produces ≥5 atomic notes with inter-links
- Generate flashcards from lesson 1
- **Assert**: ≥10 flashcards produced
- **Assert**: Flashcards cover key concepts, not trivial facts
- **Assert**: Answer side has sufficient detail (≥20 words per answer)

**Step 4: Exam Generation**

- Generate a quiz for module 1 (after lessons 1-3)
- **Assert**: ≥10 questions total
- **Assert**: Mix of multiple-choice (≥5) and short-answer (≥3)
- **Assert**: MC questions have exactly 4 options each, with 1 correct answer
- **Assert**: Wrong MC options are plausible (not obviously absurd)
- **Assert**: Questions test comprehension and application, not just recall
- **Assert**: Questions reference content actually covered in the lessons (no questions about topics not yet taught)
- Run scoring on a set of known-correct answers
- **Assert**: Scoring correctly identifies right/wrong answers
- **Assert**: Knowledge gap analysis identifies which concepts were missed

**Step 5: Research Agent**

- Ask Research Agent to find papers related to "quantum error correction"
- **Assert**: Returns ≥3 results with title, authors, abstract, URL
- **Assert**: Results are topically relevant (not random papers)
- Synthesize findings
- **Assert**: Synthesis is ≥200 words with structured sections

**Step 6: Summarizer Agent**

- Feed a 3000-word lesson to Summarizer
- **Assert**: Output is ≤500 words
- **Assert**: Key facts from source are preserved (check ≥5 key facts)
- **Assert**: No hallucinated facts (nothing in summary that wasn't in source)

**Step 7: Full Journey Integration**

- Verify the Orchestrator can route a conversation through the entire flow:
  - "I want to learn quantum computing" → Course Builder → returns syllabus
  - "Start lesson 1" → Content Pipeline → returns rich lesson
  - "Take notes on this" → Notes Agent → returns Cornell notes
  - "Quiz me on module 1" → Exam Agent → returns quiz
  - "Summarize lesson 3" → Summarizer → returns summary
  - "Find research on quantum entanglement" → Research Agent → returns papers

### Grading

Each step has assertions. Total assertions across all 7 steps should be ≥40.
Journey score = passed / total. **Must reach ≥0.85 (85%) to pass.**

Write results to `evals/journey-test-results-{timestamp}.json` with:

- Each assertion: id, description, result (PASS/FAIL), actual_output (truncated to 500 chars)
- Overall journey score
- Sample outputs for human review (full text of: 1 lesson, 1 set of notes, 1 quiz, 1 summary)

### When to Run

- Run after S05 completes (all core agents built)
- Re-run after S07 (API layer) to verify through HTTP
- Re-run after S13 (full QA) as final validation

### Mock LLM Strategy

Since we may not have live LLM API keys, the journey test should work with BOTH:

1. **Mock mode**: Deterministic mock responses that are pre-written to be rich and realistic (not "Lorem ipsum" — actual educational content about quantum computing). The mocks themselves must be high quality.
2. **Live mode** (if OPENAI_API_KEY is set): Actually call the LLM and grade real outputs

Even in mock mode, the mock responses must be rich enough to pass all quality assertions. This forces us to write high-quality mock fixtures.

---

## Sprint-Specific Overrides

Use this section to record any deviations from the default sprint plan. When the iteration loop identifies a pattern of failures, document the corrective strategy here.

### S01 — Project Scaffolding

- **Approach**: Standard scaffold per spec workstream WS-01
- **Known risks**: None yet
- **Overrides**: None

### S02 — Authentication & Key Management

- **Approach**: Standard implementation per spec
- **Known risks**: None yet
- **Overrides**: None

### S03 — Orchestrator Agent

- **Approach**: Standard implementation per spec
- **Known risks**: LLM mock setup may require custom harness
- **Overrides**: None

### S04 — Course Builder & Content Pipeline

- **Approach**: Standard implementation per spec
- **Known risks**: Web scraping tests need reliable mock HTML fixtures
- **Overrides**: None

### S05 — Core Agents

- **Approach**: Implement all 4 agents with shared AgentInterface
- **Known risks**: Agent eval harness needs to be built in S03 first
- **Overrides**: None

### S06 — Collaboration & Mindmap

- **Approach**: Standard implementation per spec
- **Known risks**: Yjs CRDT integration complexity
- **Overrides**: None

### S07 — API Layer

- **Approach**: Standard implementation per spec
- **Known risks**: WebSocket load testing setup
- **Overrides**: None

### S08 — Client Application

- **Approach**: Flutter for cross-platform (decision made per spec)
- **Known risks**: Largest sprint by scope — may need sub-sprints
- **Overrides**: None

### S09 — Marketplace

- **Approach**: Standard implementation per spec
- **Known risks**: Stripe mock complexity
- **Overrides**: None

### S10 — Subscription & Billing

- **Approach**: Standard implementation per spec
- **Known risks**: IAP receipt validation mock
- **Overrides**: None

### S11 — Marketing Website

- **Approach**: Next.js 14 per spec
- **Known risks**: Animation performance on mobile
- **Overrides**: None

### S12 — Documentation

- **Approach**: Nextra docs site per spec
- **Known risks**: Code example extraction and compilation
- **Overrides**: None

### S13 — Testing & QA

- **Approach**: Run comprehensive suite per EVALS.md
- **Known risks**: E2E test flakiness
- **Overrides**: None

### S14 — Deployment & Launch

- **Approach**: Standard implementation per spec
- **Known risks**: Platform-specific build toolchain setup
- **Overrides**: None

---

## Iteration Strategies

When the iteration loop runs, the Orchestrator selects from these strategies based on the type of failure:

### Strategy: Fix Type Error

- **Trigger**: `types` category assertion fails
- **Action**: Read the compiler error, fix the type definition or usage
- **Scope**: Single file change

### Strategy: Add Missing Implementation

- **Trigger**: `structure` or `api` assertion fails because a file/endpoint doesn't exist
- **Action**: Create the missing file or implement the missing endpoint
- **Scope**: New file or function

### Strategy: Fix Test Failure

- **Trigger**: `unit` or `integration` assertion fails
- **Action**: Debug the test, fix the source code (not the test, unless the test is wrong)
- **Scope**: Source code fix

### Strategy: Fix Agent Output

- **Trigger**: `agent` assertion fails (wrong format, hallucination, wrong routing)
- **Action**: Adjust the agent's system prompt or output parser
- **Scope**: Prompt or parser change

### Strategy: Fix UI/UX Issue

- **Trigger**: `uiux` assertion fails (missing component, accessibility, responsiveness)
- **Action**: Add or fix the UI component
- **Scope**: Component code change

### Strategy: Fix Performance Issue

- **Trigger**: `performance` assertion fails (slow response, high memory)
- **Action**: Profile, identify bottleneck, optimize
- **Scope**: Optimization change

### Strategy: Fix Security Issue

- **Trigger**: `security` assertion fails
- **Action**: Apply security fix (input validation, encryption, auth check)
- **Scope**: Security hardening

---

## Lessons Learned

This section is populated by the Orchestrator as it learns from iterations. Pattern: "When X fails, doing Y fixed it."

_(Empty — will be populated during execution)_
