# LearnFlow — Improvement Queue (Iteration 70)

Status: **DONE (iter70)**

Owner: Builder  
Planner: Ash (planner subagent)  
Date: 2026-03-23

This queue is a **brutally honest spec-vs-implementation** gap list versus `LearnFlow_Product_Spec.md` (Sections **1–17**) compared to what is actually shipping in this repo **today**.

Repo reality (what’s shipping): **React/Vite SPA client + Express API + SQLite + WebSocket chat + Yjs-backed mindmap (partial)**, plus a minimal Core Orchestrator (`packages/core`) with **keyword/regex intent routing** and a mix of deterministic + lightly LLM-wired behaviors.

---

## Evidence pack (what I ran/read in Iteration 70)

### Spec read (FULL, sections 1–17)

- Read full spec file: `/home/aifactory/.openclaw/workspace/learnflow/LearnFlow_Product_Spec.md`
  - Verified length: **1105 lines**
  - Sections 1–17 present.

### Code inspected (UI + API + Core + Agents)

- API (Express):
  - `/home/aifactory/.openclaw/workspace/learnflow/apps/api/src/app.ts`
  - `/home/aifactory/.openclaw/workspace/learnflow/apps/api/src/routes/chat.ts`
  - `/home/aifactory/.openclaw/workspace/learnflow/apps/api/src/routes/keys.ts`
  - `/home/aifactory/.openclaw/workspace/learnflow/apps/api/src/routes/profile.ts`
  - `/home/aifactory/.openclaw/workspace/learnflow/apps/api/src/routes/subscription.ts`
  - `/home/aifactory/.openclaw/workspace/learnflow/apps/api/src/routes/export.ts`
  - `/home/aifactory/.openclaw/workspace/learnflow/apps/api/src/routes/mindmap.ts`
  - `/home/aifactory/.openclaw/workspace/learnflow/apps/api/src/routes/marketplace-full.ts`
- Core orchestrator:
  - `/home/aifactory/.openclaw/workspace/learnflow/packages/core/src/orchestrator/orchestrator.ts`
  - `/home/aifactory/.openclaw/workspace/learnflow/packages/core/src/orchestrator/intent-router.ts`
  - `/home/aifactory/.openclaw/workspace/learnflow/packages/core/src/context/student-context.ts`
- Agents:
  - `/home/aifactory/.openclaw/workspace/learnflow/packages/agents/src/course-builder/course-builder-agent.ts`
  - `/home/aifactory/.openclaw/workspace/learnflow/packages/agents/src/research-agent/research-agent.ts`
  - `/home/aifactory/.openclaw/workspace/learnflow/packages/agents/src/notes-agent/notes-agent.ts`
  - `/home/aifactory/.openclaw/workspace/learnflow/packages/agents/src/exam-agent/exam-agent.ts`
  - `/home/aifactory/.openclaw/workspace/learnflow/packages/agents/src/mindmap-agent/mindmap-agent.ts`
  - `/home/aifactory/.openclaw/workspace/learnflow/packages/agents/src/collaboration-agent/collaboration-agent.ts`
  - Content pipeline pieces inspected (attribution/scoring/search):
    - `/home/aifactory/.openclaw/workspace/learnflow/packages/agents/src/content-pipeline/*`

### App boot + screenshot harness

- Ran harness from repo root:
  - `node screenshot-all.mjs --outDir screenshots/iter70`
- Screenshots captured: **27 PNGs** under:
  - Workspace: `/home/aifactory/.openclaw/workspace/learnflow/screenshots/iter70/run-1/`
  - OneDrive mirror: `/home/aifactory/onedrive-learnflow/learnflow/learnflow/learnflow/screenshots/iter70/`

Screens captured include (sample):

- `landing-home.png`, marketing pages, auth login/register, onboarding 1–6, dashboard, conversation, mindmap, pipelines, settings, marketplaces, course view, lesson reader.

---

## Brutally honest spec → implementation gap (by spec section)

### §1–2 (Vision/positioning)

- The product story is present (marketing pages exist; onboarding exists).
- The **core differentiators are only partially true**:
  - “Multi-agent architecture” is real in code shape (registry + orchestrator), but **execution is shallow** (keyword routing, limited DAG, limited agent sophistication).
  - “Always attributed, internet-curated lessons” is **not reliably enforced** end-to-end.

### §3 (System architecture)

- Spec: gRPC, agent mesh, Postgres/Redis/S3/vector DB.
- Repo: single Express API + SQLite + some WS/Yjs.
- That’s acceptable for MVP, but it means:
  - **No agent mesh / isolation**, no vector store, no scalable data plane.
  - Many “enterprise-ready” claims in spec are not represented in shipping code.

### §4 (Multi-agent architecture)

- Orchestrator exists: `packages/core/src/orchestrator/orchestrator.ts`
  - Has a minimal DAG planner; does a “primary + optional summarizer” pattern.
  - Course builder additionally triggers mindmap extension.
- Major gaps vs spec:
  - Intent parsing is **routeIntent() keyword/regex** (not a planner that reasons about tools/capabilities).
  - “Agent transparency” UX (spawned/complete events) is not at spec bar.
  - “Update Agent (Pro)” is **missing**.

### §4.4 (BYOAI key management)

- **Implemented (MVP)**:
  - `apps/api/src/routes/keys.ts` stores keys encrypted (AES wrapper) and exposes list with masked key and usageCount/lastUsed.
  - Validates format-only at `/api/v1/keys/validate`.
- Gaps:
  - Provider routing is inconsistent across the stack; chat uses `apiKey` override to guess provider, but stored keys are not clearly used to select LLM provider per request.
  - Validation is format-only (spec allows that), but there’s no “real call” validation option.
  - “Keys never logged” needs a deliberate audit (not proven by tests).

### §5 (Client screens)

- Screens exist and are coherent.
- Several are **demo-level**:
  - Collaboration UI is explicitly “Mock / Coming soon” and uses hardcoded data (`apps/client/src/screens/Collaboration.tsx`).
  - Course marketplace shows sample data if API returns empty (fallback), which is fine for dev but undermines truthfulness.
  - Dashboard “daily lessons / mastery” does not appear fully backed by persisted behavioral tracking.

### §6 (Content pipeline + attribution)

- Content-pipeline modules exist in `packages/agents/src/content-pipeline/` (discovery/scoring/dedupe/attribution-tracker).
- However, spec-level guarantees are not enforced:
  - No hard gate ensuring every lesson includes sources.
  - No licensing/robots compliance layer.
  - No persistent attribution chain per lesson/module enforced in DB schemas.

### §7 (Marketplace)

- Backend route `marketplace-full.ts` implements qualityCheck + revenue split and persists some records via SQLite helpers.
- Major truth gap:
  - Checkout is **mocked as instant success** (`status: 'completed'`) — this must be labeled as mock in UI/API or replaced with Stripe test-mode.
  - Reviews/ratings write-path is not clearly implemented end-to-end.

### §8 (Subscription)

- Subscription routes exist (`/api/v1/subscription`) with feature flags, but:
  - It is effectively a **toggle** (set tier=pro/free) with **mock IAP receipt** validation.
  - Enforcement across endpoints (quotas, export formats, mindmap node caps) is inconsistent.

### §9 (Behavioral tracking + Student Context)

- StudentContextObject type exists in core, but server context building is minimal:
  - `apps/api/src/orchestratorShared.ts` fills many fields with defaults/empties.
  - `/api/v1/profile/context` returns a context-like object, but several fields are placeholders.
- The orchestrator is **not actually using** behavioral tracking to personalize outputs (spec expectation).

### §10 (Orchestrator prompt)

- Spec includes a large “system prompt”.
- Repo has an orchestrator system prompt file, but the functional behavior (agents + citations + proactive adaptation) is not yet there.

### §11 (API + WebSocket)

- Many REST endpoints exist.
- WebSocket event protocol described in spec is **not clearly implemented as spec** (agent.spawned, response.chunk, progress.update etc.).

### §12–13 (Marketing + docs)

- Marketing site pages exist (screenshots show them).
- Docs truthfulness needs maintenance: avoid claiming features that are mock (payments, collaboration, proactive updates).

### §15 (Testing)

- Screenshot harness exists and is working (good!).
- Need more integration tests for critical flows and “honesty” checks (e.g., never silently falling back to sample marketplace data without labeling it).

---

## Improvement Queue (Iteration 70) — prioritized tasks (10–15)

Each task has: priority, acceptance criteria, likely files, test plan, and screenshot checklist.

### P0 — Payments honesty: Stripe test-mode OR explicit “Mock Checkout” UX + state machine

**Problem:** `/api/v1/marketplace/checkout` returns `status: 'completed'` immediately (mock). This is trust-sensitive.

- **Acceptance criteria**
  - Choose one path (builder decision):
    1. **Stripe test-mode**: create Checkout Session, handle webhook to mark payment completed, enroll only after webhook.
    2. **Mock, but honest**: API returns `status: 'mock_completed'` (or similar), UI labels it “Mock checkout (dev)”, and no Stripe language exists anywhere.
  - Enrollment is only granted after a confirmed terminal payment status.
- **Likely files**
  - `apps/api/src/routes/marketplace-full.ts`
  - `apps/client/src/screens/marketplace/CourseMarketplace.tsx` (enroll flow)
  - Any course detail screen (if exists) for purchase CTA
- **Test plan**
  - Integration: POST checkout -> verify enrollment only after success state.
- **Screenshot checklist**
  - `marketplace-courses.png` + (add) course detail purchase state screenshot.

### P0 — Collaboration: replace hardcoded UI with minimal real backend (groups + messages)

**Problem:** `Collaboration.tsx` is entirely mocked.

- **Acceptance criteria**
  - Add SQLite-backed endpoints:
    - `GET /api/v1/collaboration/matches`
    - `POST /api/v1/collaboration/groups`
    - `GET /api/v1/collaboration/groups`
    - `POST /api/v1/collaboration/groups/:id/messages`
    - `GET /api/v1/collaboration/groups/:id/messages`
  - UI shows real groups + message thread.
- **Likely files**
  - `apps/api/src/routes/` (new `collaboration.ts`)
  - `apps/api/src/db.ts`
  - `apps/client/src/screens/Collaboration.tsx`
- **Test plan**
  - Integration: create group -> send message -> reload -> messages persist.
- **Screenshot checklist**
  - `app-collaboration.png` shows a real thread, not mock “coming soon”.

### P0 — Enforce “every lesson has sources” (attribution gate)

**Problem:** Spec §6 requires consistent attribution; currently best-effort.

- **Acceptance criteria**
  - Lesson persistence includes `sources[]` (>=2) OR explicit `sourcesMissingReason` field.
  - Course builder refuses to mark course “ready” unless attribution threshold met.
  - Lesson reader always renders a Sources section (even if empty state).
- **Likely files**
  - `packages/agents/src/course-builder/*`
  - `apps/api/src/routes/courses.ts`
  - `apps/api/src/utils/sources.ts` (or wherever parsing lives)
  - `apps/client/src/screens/LessonReader.tsx`
- **Test plan**
  - Integration: create course -> fetch lesson -> assert sources present.
- **Screenshot checklist**
  - `lesson-reader.png` clearly shows Sources UI populated.

### P0 — BYOAI provider selection: saved keys drive actual LLM calls (OpenAI + Anthropic + Gemini)

**Problem:** Keys vault exists, but provider routing looks inconsistent/opaque.

- **Acceptance criteria**
  - Deterministic provider selection order:
    1. per-request `apiKey` override (if provided)
    2. active saved key for selected provider
    3. Pro managed key (env) if tier=pro
  - Record usage with `{provider, agentName, tokensTotal}` for every LLM call.
- **Likely files**
  - `apps/api/src/routes/keys.ts`
  - `apps/api/src/llm/*`
  - `apps/api/src/routes/chat.ts` and WS orchestrator
- **Test plan**
  - Integration: save Anthropic key -> chat -> provider recorded as anthropic.
- **Screenshot checklist**
  - `app-settings.png` shows multiple keys and usage stats updating.

### P1 — Marketplace: stop silent fallback to SAMPLE_COURSES (truthfulness + empty states)

**Problem:** Client falls back to sample marketplace data if API returns empty; can mislead.

- **Acceptance criteria**
  - If API returns 0 courses, UI shows “No courses yet” and a CTA (publish/import), not sample data.
  - Sample data only appears behind explicit dev flag.
- **Likely files**
  - `apps/client/src/screens/marketplace/CourseMarketplace.tsx`
- **Test plan**
  - E2E: with empty DB, marketplace shows empty state.
- **Screenshot checklist**
  - `marketplace-courses.png` reflects real state (empty or real courses).

### P1 — Real course creation endpoint semantics (spec §11.1): POST /courses triggers course_builder and persists

**Problem:** Spec expects POST /courses triggers course_builder; validate what actually happens and make it true.

- **Acceptance criteria**
  - `POST /api/v1/courses` uses Orchestrator/CourseBuilder and persists:
    - course -> modules -> lessons
    - per-lesson sources
    - authorId/userId ownership
  - `GET /api/v1/courses` returns only the user’s courses with progress.
- **Likely files**
  - `apps/api/src/routes/courses.ts`
  - `packages/agents/src/course-builder/*`
  - `apps/api/src/db.ts`
- **Test plan**
  - Integration: POST courses -> GET returns it -> GET lesson works.
- **Screenshot checklist**
  - `course-view.png`, `course-create-after-click.png`.

### P1 — Student Context Object: persist & populate from real DB (not placeholders)

**Problem:** `buildStudentContext()` fills many fields with empty defaults; personalization is not real.

- **Acceptance criteria**
  - Persist at least:
    - enrolledCourseIds, completedLessonIds
    - quizScores
    - studyStreak + totalStudyMinutes
    - preferredAgents (already exists)
  - `/api/v1/profile/context` matches the runtime context.
- **Likely files**
  - `packages/core/src/context/student-context.ts`
  - `apps/api/src/orchestratorShared.ts`
  - `apps/api/src/db.ts` + progress tables
- **Test plan**
  - Integration: complete lesson -> profile/context updates.
- **Screenshot checklist**
  - `app-dashboard.png` shows real streak/progress numbers.

### P1 — WebSocket event protocol: implement spec-ish events (response.start/chunk/end + agent.spawned/complete)

**Problem:** Spec §11.2 expects streaming + agent transparency; current experience is mostly request/response.

- **Acceptance criteria**
  - WS sends:
    - `response.start` with message_id/agent
    - 1..N `response.chunk`
    - `response.end` with actions/sources
    - `agent.spawned`/`agent.complete` when DAG tasks run
  - Client renders agent activity indicator based on these events.
- **Likely files**
  - `apps/api/src/wsOrchestrator.ts` (or WS handler)
  - `apps/client/src/screens/Conversation.tsx`
- **Test plan**
  - E2E: message -> see indicator -> see streamed response.
- **Screenshot checklist**
  - `app-conversation.png` showing agent activity + rich response.

### P1 — Export: align with subscription matrix (Free=Markdown only, Pro=PDF/SCORM)

**Problem:** Spec §8 defines export gating; current export route returns json/md/zip for everyone.

- **Acceptance criteria**
  - Free tier: only `md/markdown`.
  - Pro tier: allow `json`, `zip`, and (stub ok) `pdf`/`scorm` with explicit “coming soon” if not implemented.
  - Error codes stable for upgrade CTA.
- **Likely files**
  - `apps/api/src/routes/export.ts`
  - `apps/api/src/routes/subscription.ts` (feature flags)
  - Client settings/export UI
- **Test plan**
  - Integration: free export zip -> 403 with code -> UI shows upgrade CTA.
- **Screenshot checklist**
  - `app-settings.png` shows export options and gating.

### P2 — Mindmap: make it actually user-owned and durable (API-backed), not just visual

**Problem:** Spec positions mindmap as core; current API returns dbMindmaps.get(userId), but UX/actionability is limited.

- **Acceptance criteria**
  - Mindmap nodes/edges persisted per user.
  - “Suggest” nodes can be accepted -> adds nodes to graph.
  - Node click drives next action (open lesson / build lesson / quiz).
- **Likely files**
  - `apps/api/src/routes/mindmap.ts`
  - `apps/client/src/screens/MindmapExplorer.tsx`
  - `apps/client/src/hooks/useMindmapYjs.ts` (if used)
- **Test plan**
  - E2E: accept suggestion -> reload -> node remains.
- **Screenshot checklist**
  - `app-mindmap.png` with accepted nodes.

### P2 — Marketplace reviews/ratings: add write path + aggregates

**Problem:** Ratings displayed, but review submission flow isn’t clearly real.

- **Acceptance criteria**
  - `POST /api/v1/marketplace/courses/:id/reviews` persists review.
  - `GET /api/v1/marketplace/courses/:id` returns reviews and computed rating.
- **Likely files**
  - `apps/api/src/routes/marketplace-full.ts`
  - `apps/api/src/db.ts`
  - Client course detail screen
- **Test plan**
  - Integration: post review -> get detail reflects updated aggregates.
- **Screenshot checklist**
  - Course detail page showing reviews.

### P2 — Update Agent (Pro): implement minimal scheduled topic monitor + notifications feed

**Problem:** Spec’s Pro value prop depends on proactive updates. Currently missing.

- **Acceptance criteria**
  - Add `update_agent` with deterministic MVP (e.g., uses existing search pipeline) producing notifications.
  - Only runs for Pro users.
  - Notifications persisted and shown on dashboard.
- **Likely files**
  - `packages/agents/src/update-agent/*` (new)
  - `apps/api/src/routes/daily.ts` or a jobs module
  - `apps/client/src/screens/Dashboard.tsx`
- **Test plan**
  - Integration: set user tier=pro -> trigger job -> notification appears.
- **Screenshot checklist**
  - `app-dashboard.png` with update notification.

### P2 — “Implemented vs Planned” doc to prevent spec drift

**Problem:** Spec is far ahead of repo reality; truthfulness debt grows each iteration.

- **Acceptance criteria**
  - Add `docs/IMPLEMENTED_VS_SPEC.md` listing per spec section:
    - implemented now
    - partially implemented
    - not implemented
    - mock/demo-only
- **Likely files**
  - `docs/IMPLEMENTED_VS_SPEC.md` (new)
- **Test plan**
  - N/A (review doc)
- **Screenshot checklist**
  - N/A

---

## Screenshot checklist (iter70)

Quick review set (all stored in iter70 folder):

- Marketing: `landing-home.png`, `marketing-features.png`, `marketing-pricing.png`, `marketing-download.png`, `marketing-docs.png`, `marketing-about.png`, `marketing-blog.png`
- Auth: `auth-login.png`, `auth-register.png`
- Onboarding: `onboarding-1-welcome.png` … `onboarding-6-first-course.png`
- App: `app-dashboard.png`, `app-conversation.png`, `app-mindmap.png`, `app-settings.png`, `app-pipelines.png`, `pipeline-detail.png`, `app-collaboration.png`
- Course: `course-view.png`, `lesson-reader.png`
- Marketplace: `marketplace-courses.png`, `marketplace-agents.png`

---

## OneDrive sync (iter70)

- Screenshots mirrored to:
  - `/home/aifactory/onedrive-learnflow/learnflow/learnflow/learnflow/screenshots/iter70/`
- This file must be mirrored to:
  - `/home/aifactory/onedrive-learnflow/learnflow/IMPROVEMENT_QUEUE.md`
