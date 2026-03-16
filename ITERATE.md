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

## ⚠️ GLOBAL OVERRIDE #2 — MANDATORY CONTENT QUALITY JOURNEY TEST

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
