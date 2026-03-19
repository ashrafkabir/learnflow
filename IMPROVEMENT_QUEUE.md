# LearnFlow — Improvement Queue (Iteration 41)

Status: **IN PROGRESS**

This queue is the prioritized, build-ready backlog for Iteration 41 based on:

- Product spec: `LearnFlow_Product_Spec.md`
- Current implementation (apps/client, apps/api, packages/core, packages/agents)
- Screenshot pass (Iter41): `learnflow/evals/screenshots/iter41-desktop`, `iter41-mobile`, `iter41-web`

---

## P0 — Must ship (breaks spec or blocks core UX)

### 1) Fix mobile onboarding path mismatch (spec §5.2.1)

**Problem:** `screenshot-mobile.mjs` captures `/onboarding/experience`, but the actual route set in `App.tsx` is `/onboarding/subscription` and `/onboarding/first-course`. This indicates at least one of:

- old/broken links in onboarding screens,
- stale screenshot script,
- or an unmounted screen path.

**Build:**

- Update `screenshot-mobile.mjs` pages list to match actual onboarding routes.
- Confirm onboarding screens’ Back/Next buttons use only the canonical routes:
  - `/onboarding/welcome → /onboarding/goals → /onboarding/topics → /onboarding/api-keys → /onboarding/subscription → /onboarding/first-course`
- Add a lightweight route alias if needed (e.g., `/onboarding/experience` → redirect to `/onboarding/subscription`) to avoid broken deep links.

**Acceptance:** No onboarding links lead to 404; mobile screenshots cover the true 6-step flow.

### 2) Marketplace “full” backend not wired (spec §7, §11.1)

**Problem:** A richer marketplace implementation exists (`apps/api/src/routes/marketplace-full.ts` with publish, checkout, agent submit, creator dashboard), but it is not mounted in `createApp()` — only the minimal `routes/marketplace.ts` is active. This makes client marketplace/creator screens mostly demo-only and blocks spec flows (publishing, analytics, payments mock).

**Build:**

- Mount the full router behind a feature flag, or merge endpoints into the active router:
  - `POST /api/v1/marketplace/courses` (publish + quality check)
  - `POST /api/v1/marketplace/checkout`
  - `POST /api/v1/marketplace/agents/submit`
  - `GET /api/v1/marketplace/creator/dashboard`
- Ensure route naming and payloads align with spec and with current client expectations.

**Acceptance:** Creator Dashboard pulls real data from API; course publish/search/enroll flows work end-to-end without mocks.

### 3) Orchestrator routes “export_agent” but no such agent exists (spec §10)

**Problem:** `packages/core/src/orchestrator/intent-router.ts` can route export requests to `export_agent`, and the system prompt lists `export_agent`, but `packages/agents` does not implement/register an ExportAgent. This will route to a missing agent and return “capability unavailable.”

**Build:**

- Implement a minimal `ExportAgent` in `packages/agents`:
  - Capabilities: `export`
  - Output: markdown/zip export (MVP) using existing client-side exporters as reference.
- Register it in API orchestrator registry (`apps/api/src/wsOrchestrator.ts`).
- Alternatively: remove the intent route until the agent exists.

**Acceptance:** Asking “export/download PDF/SCORM/markdown” results in a coherent flow (at least MD export works; Pro-only formats can return “coming soon / Pro” gracefully).

### 4) Lesson Reader does not meet “markdown + LaTeX + code highlighting” requirement (spec §5.2.4, §5.2.3)

**Problem:** Conversation screen uses `remark-math` + `rehype-katex`, but `LessonReader` parses content into custom “structured sections” and does not appear to render full markdown/LaTeX/code blocks equivalently. Spec requires rich lesson rendering parity.

**Build:**

- Standardize lesson rendering on a single markdown pipeline used by both Conversation and Lesson Reader:
  - markdown → syntax highlighting → KaTeX
- Ensure inline citations remain functional.

**Acceptance:** Lesson content supports headings, lists, code blocks, and LaTeX equations consistently across Conversation and Lesson Reader.

---

## P1 — High value (major spec gaps)

### 5) Make Creator Dashboard real (spec §7.1)

**Problem:** `CreatorDashboard.tsx` uses `MOCK_COURSES`, `MOCK_ANALYTICS`, and `MOCK_EARNINGS` only.

**Build:**

- Replace mocks with API calls:
  - `GET /api/v1/marketplace/creator/dashboard`
- Wire “Publish New Course” flow to `POST /api/v1/marketplace/courses`.

**Acceptance:** Creator metrics and lists are data-driven and reflect actual creator activity.

### 6) Course Marketplace: add course detail + enroll actions (spec §5.2.7)

**Problem:** Marketplace exists, but spec calls for course detail page with reviews/creator profile and “one-tap enroll”. There is a `CourseDetail` screen, but backend currently only supports a small static array.

**Build:**

- Add `GET /api/v1/marketplace/courses/:id` (or include detail in list) with:
  - syllabus preview, creator metadata, rating, price
- Implement enroll endpoint (`POST /api/v1/marketplace/courses/:id/enroll` or reuse `/checkout` for paid) and persist enrollments.

**Acceptance:** User can open a marketplace course and enroll; course appears in their dashboard/enrolled list.

### 7) “Student Context Object” is inconsistent across REST vs WS (spec §9)

**Problem:** WS path builds a rich `StudentContextObject` with many fields (including `preferredAgents`), but REST `/api/v1/profile/context` returns a smaller shape. This risks drift and UI bugs.

**Build:**

- Define a single SCO schema/type in `packages/shared` and reuse it for both REST + WS.
- Update `/api/v1/profile/context` to return the same shape (even if values are empty/default).

**Acceptance:** SCO returned by REST matches the shape used by orchestrator; fewer client-side conditionals.

### 8) Marketplace agent activation is hardcoded mapping (spec §7.2)

**Problem:** `intent-router.ts` only maps marketplace ids `ma-1/ma-2` to existing built-in agents and only for two taskTypes. This is not “capability declaration” matching.

**Build:**

- Extend marketplace agent model to include `capabilities[]` and map capabilities → agentName dynamically.
- Add “first use in session” notification requirement from spec.

**Acceptance:** Activating an agent with a declared capability results in routing for matching intents without hardcoding ids.

---

## P2 — Quality / completeness

### 9) Update Agent (Pro proactive updates) is not wired into orchestration triggers (spec §10, §8)

**Build:**

- Add a minimal server-side scheduler/cron hook (dev-only OK) to run `update_agent` for Pro users with subscribed topics.
- Surface results in dashboard notifications.

### 10) WS event contract: ensure strict spec compatibility (spec §11.2)

**Build:**

- Keep any extra events, but ensure a spec-only client works:
  - `message` → `response.start|chunk|end`
  - `agent.spawned|complete`
  - `mindmap.update`
  - `progress.update`
- Add tests validating payload keys and event names.

### 11) Remove/replace marketing docs claims that exceed implementation

**Problem:** Marketing `Docs.tsx` claims spaced repetition, “Today’s Lessons queue,” etc. Implementation is partial.

**Build:**

- Either implement the claimed features or tone down copy to match reality.

### 12) E2E: Playwright smoke tests for every route (spec §15)

**Build:**

- Add E2E tests that hit: onboarding, dashboard, conversation, mindmap, course view, lesson reader, marketplace, settings, pipelines.

---

## Brutally honest gaps summary

- Marketplace is still largely a demo because `marketplace-full.ts` isn’t mounted and the creator UI is mock-only.
- Orchestrator spec mentions `export_agent`, but the agent doesn’t exist → export intents will fail.
- Lesson Reader is not using the same markdown+LaTeX rendering pipeline as Conversation, which violates spec-level richness.
- REST vs WS Student Context Objects are drifting; this will cause long-term schema bugs.
