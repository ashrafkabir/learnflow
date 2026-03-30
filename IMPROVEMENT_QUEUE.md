# IMPROVEMENT_QUEUE — Iter160 (Planner)

Status: P0 COMPLETE (built). P1–P2 remaining.

Date: 2026-03-30 (EDT)

Inputs used (this run):

- FULL spec: `LearnFlow_Product_Spec.md` (reviewed end-to-end; key deltas: §5.2 screens, §6 pipeline, §4.4 BYOAI, §11 WebSocket)
- Code inspection (concrete refs): `apps/api/src`, `apps/client/src`, `packages/core/src`, `packages/agents/src`
- Fresh Playwright screenshots (Iter160): `learnflow/screenshots/iter160/run-001/` (31 PNGs)

OneDrive sync (this run):

- ✅ Screenshots mirrored to: `onedrive:learnflow/screenshots/iter160/run-001/`
- ✅ `IMPROVEMENT_QUEUE.md` mirrored to: `onedrive:learnflow/IMPROVEMENT_QUEUE.md`

---

## 0) Executive summary (brutally honest)

The repo is **still demoable**, but Iter160 has a **trust-breaking regression**: the Lesson Reader can render a raw “Course not found (not_found …)” error state (`learnflow/screenshots/iter160/run-001/lesson-reader.png`). That means deep links / stored state can land users on a dead lesson, and the UI exposes backend error strings.

Against the spec, the biggest functional gaps remain:

- **BYOAI enforcement is inconsistent**. The API layer is BYOAI-only (good) (`apps/api/src/llm/openai.ts`, `apps/api/src/llm/providers.ts`), but at least one agent still calls `process.env.OPENAI_API_KEY` directly (`packages/agents/src/course-builder/course-builder-agent.ts`). That violates spec §4.4 and “MVP truth”.
- **Spec §6.1.4 “parallel lesson build (one worker per lesson)” is not real** in the pipeline implementation; lesson generation appears sequential in `apps/api/src/routes/pipeline.ts` (module/lesson loops; no explicit concurrency/worker pool).
- **Spec §6.2 lesson structure compliance is inconsistent** (Next lesson links, citations density, and bounded <10 min read are not clearly enforced from the reader + generator).

The UI side has major **data correctness** issues (dashboard duplicates + inconsistent counts) and **broken/placeholder states** (pipeline detail looks like a stuck skeleton in `pipeline-detail.png`).

---

## P0 — Fix regressions + trust breakers (do these first)

1. **P0 — Lesson Reader “Course not found” deep-link regression: make lesson fetch resilient + user-friendly** ✅ DONE (built)
   - Client: `apps/client/src/screens/LessonReader.tsx`
     - Friendly “Lesson unavailable” state with actions:
       - Retry
       - Go to Dashboard (`/dashboard`)
       - Go to Course list (`/courses`)
       - Back to course
     - Error details are opt-in via `<details>`.
   - Server: already falls back to SQLite when runtime cache misses:
     - `GET /api/v1/courses/:id` uses `courses.get(id) || dbCourses.getById(id)`
     - `GET /api/v1/courses/:id/lessons/:lessonId` uses `courses.get(id) || dbCourses.getById(id)`

2. **P0 — Pipeline Detail stuck skeleton: implement real detail payload + error state** ✅ DONE (built)
   - `apps/client/src/screens/PipelineDetail.tsx`
     - Added explicit missing-id state
     - Improved loading skeleton + hint
     - Friendly error copy + log viewer
   - API: `GET /api/v1/pipeline/:id` returns persisted pipeline state + debug.coursePlan.

3. **P0 — Dashboard duplicates + inconsistent counts: dedupe + correct source-of-truth for progress** ✅ DONE (built)
   - `apps/client/src/context/AppContext.tsx`
     - `SET_COURSES` dedupes by `course.id`.
     - `ADD_COURSE` avoids duplicates.
   - Dashboard already fetches `GET /courses` then hydrates by id; duplicates should now be suppressed.

4. **P0 — Stop leaking backend error strings into UI (global)** ✅ DONE (built)
   - Added `apps/client/src/lib/redactSecrets.ts` + tests.
   - Updated `apps/client/src/lib/toUserError.ts` to redact secret patterns.

---

## P1 — Spec compliance gaps (core product promises)

5. **P1 — BYOAI-only enforcement: remove env-key fallbacks from agents (spec §4.4, MVP truth)**
   - Evidence: `packages/agents/src/course-builder/course-builder-agent.ts` uses `process.env.OPENAI_API_KEY`.
   - Build:
     - Refactor agent creation to accept an OpenAI client from API layer (per-request override or saved key), or make the agent deterministic/offline when no user key exists.
     - Add a regression test: forbid `process.env.OPENAI_API_KEY` access in `packages/agents/src/**` except explicit test harnesses.
   - Files: `packages/agents/src/course-builder/course-builder-agent.ts`, `apps/api/src/llm/openai.ts`, `apps/api/src/llm/providers.ts`.

6. **P1 — Content pipeline: make §6.1.4 “parallel lesson build” real (bounded concurrency)**
   - Spec requires “one worker per lesson”; current pipeline appears sequential.
   - Build:
     - Implement concurrency (e.g., bounded Promise pool) for per-lesson generation.
     - Add per-lesson timing telemetry + surfaced in Pipeline Detail.
   - Files: `apps/api/src/routes/pipeline.ts` (lesson build loop), pipeline DB schema in `apps/api/src/db.ts` if needed.

7. **P1 — Artifact-only invariant: enforce artifact-backed lesson generation everywhere, not just in tests**
   - Good: `apps/api/src/pipeline/lesson-artifacts.ts` throws `artifacts_missing` and there’s a test (`apps/api/src/__tests__/artifact-only-lesson-generation.test.ts`).
   - Missing: end-to-end flows should never silently re-scrape or generate from thin/DB-only state.
   - Build:
     - Ensure lesson generation reads from artifacts via `loadLessonSourcesForGeneration()`.
     - When artifacts missing, surface a pipeline error with a “Re-run research” CTA.
   - Files: `apps/api/src/routes/pipeline.ts`, `apps/api/src/pipeline/lesson-artifacts.ts`, `packages/agents/src/content-pipeline/artifact-writer.ts`.

8. **P1 — Lesson structure enforcement (spec §6.2): Next lesson link + citations density + <10 min read**
   - Build:
     - Add a validator stage that checks required headings/sections and blocks “generated” status until compliant.
     - Add “Next lesson” navigation link rendering in reader if present; if missing, show auto-nav UI based on module order.
   - Files: generator in `apps/api/src/routes/pipeline.ts`, reader in `apps/client/src/screens/LessonReader.tsx`.

---

## P2 — UX parity for key screens (spec §5.2)

9. **P2 — Conversation interface: make Sources drawer consistent + bind to the active message**
   - Current: `apps/client/src/screens/Conversation.tsx` holds one `drawerSources` array; it is not clearly message-scoped.
   - Build:
     - Store sources per message id; “View Sources” should open sources for that message.
     - If no sources, show a neutral empty state (not a new assistant message).
   - Files: `apps/client/src/screens/Conversation.tsx`, `apps/api/src/wsOrchestrator.ts`, `apps/api/src/routes/chat.ts`.

10. **P2 — Agent activity indicator: stop “fake” tracing; align with WS events**

- Spec §5.2.3 expects transparency. WS emits `agent.spawned/agent.complete` (`apps/api/src/wsOrchestrator.ts`) and client listens.
- Build:
  - Show a compact “trace drawer” (optional) listing routing + agent calls with durations.
  - Ensure routing-only events don’t trigger completion toasts (partially done already).
- Files: `apps/client/src/screens/Conversation.tsx`, `apps/api/src/wsOrchestrator.ts`.

11. **P2 — Agent Marketplace activation UX: make toggles actually work (or clearly label as demo)**

- Evidence: marketplace agents show “Inactive” toggles that look disabled (`marketplace-agents.png`).
- Build:
  - Ensure toggle activates via `/marketplace/agents/:id/activate` and reflects activated count.
  - If activation is intentionally mocked, remove toggles and show “Planned” truth.
- Files: `apps/client/src/screens/marketplace/AgentMarketplace.tsx`, server: `apps/api/src/routes/marketplace.ts`.

12. **P2 — Settings: add “BYOAI key required” gating UX across pipelines + chat**

- Goal: users should never start generation that will fail later.
- Build:
  - Detect missing active key and block “Create course / Run pipeline” with a CTA to Settings → Keys.
- Files: `apps/client/src/screens/ProfileSettings.tsx`, `apps/client/src/context/AppContext.tsx`, pipeline create screen.

---

## P3 — Hygiene + guardrails

13. **P3 — Add an explicit “Spec compliance / MVP truth” test suite**

- Include:
  - Forbidden provider guardrails (no Firecrawl/Tavily in MVP).
  - No managed env-key fallback.
  - WS contract smoke test (already exists; extend fields).
- Files: `packages/agents/src/**/__tests__`, `apps/api/src/__tests__`.

14. **P3 — Screenshot harness: verify it hits every screen that matters and fails on skeleton-only pages**

- Harness: `screenshot-all.mjs`.
- Build:
  - Add assertions: Pipeline Detail must render a title/status, not only skeletons.
  - Ensure Lesson Reader screenshot is taken with a valid seeded course/lesson.

---

## Builder notes (quick starting points)

- BYOAI enforcement already exists in API: `apps/api/src/llm/openai.ts` and `apps/api/src/llm/providers.ts`.
- WS spec parity is close: `apps/api/src/wsOrchestrator.ts` emits `response.start/chunk/end` and `agent.spawned/complete`, and client consumes them in `apps/client/src/screens/Conversation.tsx`.
- Artifact-only invariant is present but needs end-to-end enforcement: `apps/api/src/pipeline/lesson-artifacts.ts` + tests.
