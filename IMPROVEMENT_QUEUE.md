# IMPROVEMENT_QUEUE

Iteration: 34
Status: READY FOR BUILDER

## Brutal Assessment (vs full spec)

This repo is still **an impressive UI demo with a thin “agentic” backend**, not a spec-accurate platform.

What’s improved recently (Iter 33) is mostly **presentation-level spec compliance** (sources UI, citations hover previews, richer lesson reader interactions). The hard parts of the spec—**real content acquisition + attribution pipeline, true multi-agent orchestration with a real student context object, marketplace economics, and key management/usage tracking**—remain largely stubbed/synthetic.

If we pitched this as “spec implemented,” it would be misleading. If we pitch it honestly as “MVP UX + demo orchestration,” it’s strong.

### Evidence collected (Iteration 34)

- Spec read: `LearnFlow_Product_Spec.md` (full)
- Iter 33 changes verified landed:
  - `apps/client/src/lib/sources.ts` exists and is used.
  - `apps/client/src/screens/CourseView.tsx` consumes `parseSources()` + `mergeUniqueSources()` and renders Sources section.
  - `apps/client/src/screens/LessonReader.tsx` parses sources and renders inline citation tooltips.
- Screenshots captured (Playwright scripts; **no e2e suite run**):
  - App/client routes: `evals/screenshots/iter34-app-2026-03-18/` (≈ 27+ PNGs)
  - Marketing web routes: `evals/screenshots/iter34-web-2026-03-18/` (8 PNGs)
  - Total PNG count for iter34 dirs: **35**

### Boot reality (important)

- `npm run dev` (turbo) **fails** because `@learnflow/client` wants port **3001** and it was already in use:
  - Error: `Error: Port 3001 is already in use`
- Despite that, screenshots succeeded because something was already listening on `http://localhost:3001`.

This is a reliability smell: a clean boot should work without manual port policing.

---

## Spec Coverage Scorecard (high-level)

- **Client UX screens** (§5.2): ~70% present (route-level), but many are thin/stubbed.
- **Conversation + WS events** (§11.2): partial. Streaming exists, but not all payload semantics.
- **Content pipeline** (§6): ~10–20% real; mostly synthetic lessons + best-effort source parsing.
- **BYOAI key vault + usage dashboards** (§4.4, §8): partial endpoints; not end-to-end secure/validated/observable.
- **Marketplace** (§7): mostly UI scaffolding, not a two-sided economic system.
- **Multi-agent architecture** (§4, §10): orchestrator exists, but “agent mesh” behavior is not truly present.

---

## Iteration 34 — Prioritized Task Queue (10–15)

### 1) Fix dev boot determinism (ports + turbo)

**Problem:** `npm run dev` fails due to hard-coded port 3001 collisions; dev flow is brittle.
**Fix:** Make client/web/api ports configurable and auto-increment if busy (or check and fail with guidance). Update turbo pipeline to not kill the entire dev run when one workspace fails.
**Acceptance criteria:** Fresh repo + `npm run dev` succeeds on a clean machine; if a port is busy, it chooses another or prints a clear actionable message.

### 2) Make sources/citations a first-class domain model (not markdown regex)

**Problem:** Sources are extracted by regex from lesson markdown (`parseSources()`), which is fragile and loses metadata.
**Fix:** Add `Lesson.sources[]` to API + DB, store bibliographic fields (url, title, author, publication, year, accessedAt). Render UI from structured sources; keep markdown parsing as fallback only.
**Acceptance criteria:** Lesson JSON includes `sources[]`; UI renders citations + Sources drawer from structured data; no reliance on regex for normal path.

### 3) CourseView inline citation preview is logically wrong

**Problem (evidence):** In `CourseView.tsx`, inline citation preview for each lesson description uses `sources[li]` (lesson index) rather than parsing the lesson’s own citation number(s). That is incorrect and will mismatch sources.
**Fix:** Parse citation numbers inside each lesson (or attach source ids to lesson metadata) and render the matching tooltip(s).
**Acceptance criteria:** Lesson list shows correct tooltip(s) for that specific lesson; no index-based guess.

### 4) Implement the spec §10 “course creation workflow semantics” in orchestrator

**Problem:** Orchestrator is invoked, but does not reliably follow: clarify questions → build course → extend mindmap → deliver first lesson → action chips.
**Fix:** Encode explicit policy/state machine for goal-setting and course creation; ensure `response.end` includes suggested actions (3–4) every time.
**Acceptance criteria:** New goal conversation produces clarifying questions when needed; after clarification, a course is created and first lesson delivered under 1500 words; `actions[]` always populated.

### 5) WebSocket protocol compliance: implement `context_overrides` + attachments

**Problem:** Spec WS message payload includes `{ text, attachments, context_overrides }`; current system uses non-spec ad hoc params.
**Fix:** Implement schema validation; merge overrides into Student Context Object; support basic attachments metadata in the envelope.
**Acceptance criteria:** WS messages with overrides change behavior (difficulty, lesson length, etc.); coverage tests for merge logic.

### 6) Emit `mindmap.update` from real state changes

**Problem:** Spec requires server-driven mindmap updates; current mindmap is largely derived client-side.
**Fix:** Add persisted mindmap model (nodes/edges/mastery) and emit `mindmap.update` when courses are created or lessons completed.
**Acceptance criteria:** Creating a course triggers `mindmap.update` events; Mindmap screen updates without reload.

### 7) Make “Mark Complete” consistent and real everywhere

**Problem (evidence):** `CourseView` bottom action bar has `✅ Mark Complete` button with stub comment (`/* mark complete logic */`). `LessonReader` has working `completeLesson()`.
**Fix:** Wire `CourseView` action bar to call `completeLesson` for the selected lesson; refresh progress and emit `progress.update`.
**Acceptance criteria:** Marking complete from either screen updates progress rings/percent immediately; server emits `progress.update`.

### 8) Replace LessonReader’s direct fetches with the app API layer

**Problem (evidence):** `LessonReader` calls `fetch('/api/v1/courses/...')` directly for course flattening, illustrations, annotations, notes, compare. This bypasses the central app context and makes auth/error handling inconsistent.
**Fix:** Move these calls into `AppContext` (or a typed API client), with consistent token headers, retry, and error UI.
**Acceptance criteria:** No direct `fetch('/api/v1/...')` from UI screens; all calls go through a shared client; errors render in UI (not just `console.error`).

### 9) BYOAI key vault: real validation + encryption + rotation + usage dashboard

**Problem:** Spec §4.4 requires encrypted at rest, provider validation, rotation, and usage dashboards. Current implementation appears partial.
**Fix:** Implement provider-based validation, AES-GCM encryption with per-user key, masked key display only, rotation endpoint, and usage aggregation per agent.
**Acceptance criteria:** Keys never returned in plaintext; invalid keys produce actionable errors; dashboard shows token usage per agent over last 7 days.

### 10) Real content acquisition pipeline (spec §6.1) — stop shipping synthetic lessons

**Problem:** The platform’s core claim is “real-time internet curation with attribution.” Current course/lesson generation is still largely synthetic.
**Fix:** Implement: topic decomposition → discovery (search) → extraction → scoring (authority/recency/readability) → dedupe → formatter (<1500 words) → attributions.
**Acceptance criteria:** Creating a course yields lessons with real citations including author/publication/date; stale sources are avoided or flagged.

### 11) Marketplace: convert from UI scaffolding to real browse/search/enroll

**Problem:** Marketplace views exist but are not a real two-sided marketplace.
**Fix:** Implement DB-backed course discovery (filters/sort/pagination), enroll flow importing into user workspace, ratings/reviews.
**Acceptance criteria:** Filters change results deterministically; enrolling adds the course to Dashboard; review submission persists.

### 12) Course publishing state machine + QA checks (spec §7.1)

**Problem:** Spec requires quality checks + moderation queue; creator flow is mostly presentation.
**Fix:** Implement Draft → Submitted → Approved → Published; automated checks for minimum lessons + attribution completeness + readability; moderation placeholder.
**Acceptance criteria:** Submitting a course runs checks and blocks publish with reasons if failing; approved courses appear in marketplace.

### 13) Security guardrails: dev token cannot ship

**Problem:** There is a dev localStorage token behavior used for screenshots and likely dev auth.
**Fix:** Restrict dev-token acceptance to `NODE_ENV=development`; add explicit test.
**Acceptance criteria:** In prod mode, dev token is rejected for HTTP + WS.

### 14) Align docs/spec claims with MVP reality

**Problem:** Spec claims gRPC, K8s agent mesh, vector DB, etc. MVP is Node/Express/WS + SQLite-ish.
**Fix:** Add `docs/MVP_ARCHITECTURE.md` describing what’s real vs planned; update README to avoid misleading contributors.
**Acceptance criteria:** New engineer can run the stack and understand which subsystems are mocked vs implemented.

---

## Notes for Builder

- Iter 33 UI additions in `LessonReader` (illustrations, comparison mode, annotations) are ambitious; they now require **API hardening** to be meaningful (auth, persistence, consistent error handling).
- Screenshots for iter34 exist and can be used as a baseline visual regression set.
