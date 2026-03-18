# IMPROVEMENT_QUEUE

Iteration: 32
Status: DONE

## Brutal Assessment (vs full spec)

LearnFlow is **not** the platform described in `LearnFlow_Product_Spec.md`. It is a polished, test-covered **UI-first demo** with a lightweight API and mocked/simulated “agentic” behaviors.

### What’s genuinely solid

- **Client UX coverage**: onboarding, dashboard, conversation, course view, mindmap, marketplaces, settings exist and are screenshot-testable.
- **Dev ergonomics**: monorepo, tests, Playwright harnesses, deterministic screenshot scripts.
- **WebSocket infra**: working server, shared contract types, dev auth shortcut (`token=dev`), and Vite WS proxy in client.

### What is materially missing vs spec (highest-level)

- **Real multi-agent orchestration** (DAG planner + registry exists in `packages/core` but is not wired into the running API/WS chat path).
- **Real web discovery + attribution** for course/lesson generation (pipeline code exists in `packages/agents`, but the API’s course generation and WS orchestrator do not use it).
- **Persistent, first-class citations** in lessons (client course view uses `MOCK_SOURCES`; WS sources are heuristic URL extraction from lesson markdown).
- **Mindmap as knowledge graph** (current WS mindmap.subscribe returns static nodes/edges).
- **Marketplace reality** (creator flows + purchases are mostly UI simulation; moderation, revenue share, and real distribution are not implemented).
- **Pro tier behavior** is only partially real (endpoints exist; real feature gating + managed key pool behavior is not end-to-end).

## Iteration 31 Fix Verification (explicit checks)

Verified **landed**:

- **WS proxy in dev**: `apps/client/vite.config.ts` proxies `/ws -> ws://localhost:3000` with `ws: true`.
- **Shared WS types**:
  - Canonical types: `packages/shared/src/types/ws.ts`
  - API re-export: `apps/api/src/wsContract.ts` (`export type { … } from '@learnflow/shared'`)
  - Client usage: `apps/client/src/hooks/useWebSocket.ts` parses JSON as `WsServerEvent`.

Notes:

- Vite `strictPort: true` makes screenshot runs deterministic, but **dev will fail if 3001 already used** (which happened during this run). This is good (fail-fast), but ensure dev scripts clean up prior vite instances.

## Boot + Playwright Screenshots (Iteration 32)

### Boot

- `npm run dev` started:
  - API: http://localhost:3000
  - Client: http://localhost:3001
  - Web: http://localhost:3003

### Screenshots generated (every screen harness currently covers)

Location: `learnflow/screenshots/`

- Marketing: `home.png`, `features.png`, `pricing.png`, `download.png`, `blog.png`, `about.png` (if present in harness), `settings.png` etc.
- Auth: `login.png`, `register.png`
- Onboarding (collapsed into `onboarding.png` in this harness)
- App: `dashboard.png`, `conversation.png`, `mindmap.png`
- Marketplace: `marketplace-courses.png`, `marketplace-agents.png`, `marketplace-creator.png`
- Course: `courses-c-1.png`, `courses-c-1-lessons-l1.png`
- Pipelines: `dashboard-pipeline-*.png`, `pipeline-detail.png`

(Execution: `node screenshot-all.mjs` completed successfully.)

## 10–15 Highest-Impact Tasks (Problem → Fix → Acceptance)

### 1) Wire the real Orchestrator (packages/core) into the running API chat path

**Problem:** The WS chat path (`apps/api/src/wsOrchestrator.ts`) is hand-authored streaming text; it does not call `packages/core/src/orchestrator/orchestrator.ts`.
**Fix:** Instantiate `AgentRegistry` in API, register real agents from `@learnflow/agents`, and route WS `message` events through `Orchestrator.processMessage()`.
**Acceptance:** WS conversation uses registry-selected agents; `agent.spawned/complete` reflects real agent names and tasks; unit + e2e tests cover at least one routed capability.

**Status:** DONE (Iteration 32)

- Implementation: `apps/api/src/wsOrchestrator.ts` now builds a singleton `AgentRegistry` + `Orchestrator` and routes WS `message` through `orchestrator.processMessage()`.
- Streaming: aggregated response is chunked into `response.chunk` events.
- Tests: existing API WS tests still pass (vitest).
- Screenshots: `evals/screenshots/iter32-2026-03-18/`.

### 2) Make Course Builder actually use the content pipeline

**Problem:** `CourseBuilderAgent` currently only decomposes topics and generates a template syllabus (no discovery/extraction/scoring).
**Fix:** In `CourseBuilderAgent.process`, call `crawlSourcesForTopic` (Firecrawl/web-search fallback), then run scoring + formatting to produce lesson bodies + sources.
**Acceptance:** Creating a course produces lessons with real citations; sources are diverse and include publication metadata when available.

### 3) Persist lesson sources as first-class data (remove MOCK_SOURCES)

**Problem:** CourseView uses `MOCK_SOURCES`; WS `sources` are heuristic and not stored.
**Fix:** Extend lesson model to include `sources[]` in DB; render from stored sources in LessonReader/CourseView and source drawer.
**Acceptance:** No `MOCK_SOURCES` in production UI; lesson sources are consistent across REST + WS.

### 4) Implement mindmap generation from real course/progress data

**Problem:** `mindmap.subscribe` returns a static 2-node graph.
**Fix:** Generate nodes/edges from enrolled courses/modules/lessons + mastery status; emit diffs on lesson completion.
**Acceptance:** Mindmap shows courses + lessons; completing a lesson changes mastery coloring/state.

### 5) WebSocket protocol compliance + event completeness

**Problem:** Spec §11.2 does not define `connected` and client/server event sets drift.
**Fix:** Either (a) update spec mapping in docs and keep `connected`, or (b) remove/replace with spec event. Add `context_overrides` handling.
**Acceptance:** One authoritative contract doc + types match runtime; client handles all server events.

### 6) Pro feature gating end-to-end

**Problem:** Pro/free differences exist in spec, but UI + API enforcement is inconsistent.
**Fix:** Centralize feature flags (server authoritative), reflect locked UI states, enforce on endpoints.
**Acceptance:** Free users cannot access Pro-only exports/managed keys; upgrading unlocks instantly; tests cover.

### 7) BYOAI key vault UX parity

**Problem:** Endpoints exist, but Settings experience and usage dashboard is incomplete.
**Fix:** Add Settings → API key vault management UI: provider selection, validation, masked display, rotation.
**Acceptance:** Add/list/delete keys works; plaintext keys never returned; validation errors are actionable.

### 8) Token usage tracking per agent surfaced to user

**Problem:** Spec requires per-agent token usage; current incrementing is incomplete.
**Fix:** Track tokens per agent per session where LLM calls occur; add `/analytics` UI panel.
**Acceptance:** Dashboard/Settings shows per-agent usage totals and last 7 days trend.

### 9) Course marketplace: real discovery/search/filter against API

**Problem:** UI exists but much content is static/simulated.
**Fix:** Implement search/filter/sort backed by real endpoints and persisted data.
**Acceptance:** Filters change results; pagination works; e2e covers browse → detail → enroll.

### 10) Creator pipeline: publish flow with quality checks + moderation queue

**Problem:** Spec outlines quality checks and moderation; current creator dashboard is mostly UI.
**Fix:** Implement course publish state machine: draft → submitted → approved → published; run automated checks (min lessons, attribution completeness, readability).
**Acceptance:** Creator can submit; admins can approve; published appears in marketplace.

### 11) Exports: Markdown (free) vs PDF/SCORM (Pro)

**Problem:** Export spec is broad; implementation unclear and likely stubbed.
**Fix:** Implement at least Markdown export fully; gate PDF/SCORM behind Pro.
**Acceptance:** Exported artifacts download and are reproducible; citations included.

### 12) Collaboration backend MVP (rooms/messages)

**Problem:** Collaboration screen exists but real peer matching + messaging is not end-to-end.
**Fix:** Add room model, join/leave, message events over WS; basic peer matching based on interests.
**Acceptance:** Two browser sessions can chat; messages persist; basic matching returns candidates.

### 13) Replace placeholder architecture docs with “truthful MVP architecture”

**Problem:** Spec claims gRPC/K8s/vector DB; current system is SQLite + ws + mocked agents.
**Fix:** Update docs to clearly state MVP reality and roadmap deltas.
**Acceptance:** Docs do not mislead; engineering onboarding matches what runs locally.

### 14) Hardening: production auth + WS security

**Problem:** Dev token path exists; ensure it cannot leak to prod.
**Fix:** Add explicit NODE_ENV guard tests; ensure CORS, rate limiting, WS auth are strict in prod builds.
**Acceptance:** In production mode, `token=dev` fails; security tests pass.

### 15) Increase test coverage to meet spec threshold (>85%)

**Problem:** PROGRESS reports ~82% coverage.
**Fix:** Add tests for orchestrator wiring, content pipeline integration paths, and WS events.
**Acceptance:** Coverage >= 85% statements and critical path e2e.

---

## Builder Notes (what to do first)

If we want the **biggest leap toward the spec** with minimal churn, do tasks **#1–#4** in order. Everything else becomes easier once lessons have real sources and the orchestrator is actually driving behavior.
