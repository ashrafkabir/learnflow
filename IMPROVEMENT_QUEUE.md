# LearnFlow — Improvement Queue (Iteration 40)

Status: **READY FOR BUILDER**

This queue is the prioritized, build-ready backlog for Iteration 40 based on:

- Product spec: `LearnFlow_Product_Spec.md`
- Current implementation (apps/client, apps/api, packages/core, packages/agents)
- Screenshot pass (Iter40) under `learnflow/evals/screenshots/`

---

## P0 — Must ship (breaks spec or core UX)

### 1) Fix Onboarding step routing mismatch + progress labels (spec §5.2.1)

**Problem:** `OnboardingApiKeys` has a Back link to `/onboarding/experience` which does not exist. Progress indicator also shows `4/6` even though screens are: Welcome, Goals, Topics, ApiKeys, Subscription, FirstCourse (6 total).

**Build:**

- Update Back route in `apps/client/src/screens/onboarding/ApiKeys.tsx` → `/onboarding/topics`.
- Normalize step numbering across onboarding screens (1/6..6/6) to match actual route order.
- Ensure guard + localStorage completion uses the same durable API flag (`POST /api/v1/profile/onboarding/complete`) after FirstCourse completion.

**Acceptance:** No broken links in onboarding; progress display matches screen order; onboarding completion is persisted server-side.

### 2) Make Pipeline UI real (replace MOCK_PIPELINES with API) (spec §5.2.5)

**Problem:** Pipeline screens (`/pipelines`, `/pipeline/:id`) are mock-only; spec expects live pipeline state for scraping → synthesis → publish.

**Build:**

- Add real pipeline persistence in API (`dbPipelines` already exists via `pipelineRouter`): connect client to `GET /api/v1/pipeline` list + `GET /api/v1/pipeline/:id` detail.
- Wire course creation flow (course_builder) to create/update pipeline records and emit WS `progress.update`/pipeline events.

**Acceptance:** Creating a course produces a pipeline entry that progresses; pipeline screens reflect real data.

### 3) Ensure Course Builder actually uses BYOAI keys and surfaces key errors cleanly (spec §11.1, §10 error handling)

**Problem:** BYOAI key management exists (`/api/v1/keys`) but some agent paths can silently fall back; spec requires clear guidance when key invalid/exhausted.

**Build:**

- In orchestrator/agent execution, enforce: if user is free tier and no valid key present → respond with actionable UI prompt (go to Settings → API Keys) and do not attempt provider call.
- Add standardized error mapping: invalid key, rate limit, exhausted credits.
- Log error internally; UI gets friendly message.

**Acceptance:** With missing/invalid key, user sees a clear, non-technical error + next step; no raw stack traces.

### 4) Align WebSocket event contract to spec (spec §11.2)

**Problem:** Server sends `connected` + `mindmap.subscribe` (non-spec). Spec lists `message`, `response.start|chunk|end`, `agent.spawned|complete`, `mindmap.update`, `progress.update`.

**Build:**

- Keep backwards compatibility, but document and/or alias events:
  - Accept `message` as-is.
  - Add `response.start|chunk|end` emissions from orchestrator (confirm in `wsOrchestrator.ts`), and ensure payload fields match spec.
  - For mindmap: keep `mindmap.subscribe` but also allow client to request suggestions via `message` context or add spec-compliant subscribe method.
- Update `apps/web` docs page + `openapi.yaml` notes to reflect final contract.

**Acceptance:** A spec-compliant WS client can function without non-spec events; docs are accurate.

---

## P1 — High value (major spec gaps)

### 5) Mindmap: implement mastery levels + edges based on progress (spec §5.2.2)

**Problem:** Mindmap Explorer exists and supports suggestion nodes, but mastery/strengths/weaknesses are stubby and edges are limited.

**Build:**

- Compute node mastery from completed lessons + quiz scores (even if quiz scores are 0 initially).
- Persist mindmap nodes/edges per user; add edges when modules relate.
- Render mastery rings/heatmap per node; add filter to show “weak areas”.

**Acceptance:** Mindmap shows meaningful mastery differences and connections across topics; updates as lessons complete.

### 6) Lesson Reader: add quiz + notes + agent actions inline (spec §5.2.3)

**Problem:** Reader renders content and completion, but spec expects embedded quiz, notes, next-lesson CTA, and agent actions.

**Build:**

- Embed Notes panel connected to `/notes` endpoints.
- Add “Take Quiz” panel (even MVP) with scoring persisted.
- Add “Ask tutor about this lesson” deep-link to Conversation with context.

**Acceptance:** A learner can read → take quick quiz → jot notes → mark complete without leaving the lesson.

### 7) Marketplace: replace static seed data with publish/search/creator analytics (spec §7)

**Problem:** API `marketplace.ts` is minimal; richer flows exist in `marketplace-full.ts` but not wired.

**Build options:**

- (Preferred) Merge key endpoints from `marketplace-full.ts` into active router (or mount it) behind feature flag.
- Implement search facets (topic, difficulty, price), course detail, creator dashboard analytics.

**Acceptance:** Marketplace screens reflect real catalog and creator dashboard shows real stats.

### 8) Collaboration screen: verify spec parity + real-time sessions (spec §5.2.6)

**Problem:** Collaboration route exists (`/collaborate`) but needs validation against spec (live shared sessions, roles).

**Build:**

- Add session create/join, presence list, shared progress.
- WS events for collaboration updates.

**Acceptance:** Two users can join a session and see presence + shared course state.

---

## P2 — Quality / completeness

### 9) Dashboard: make streak + analytics real (spec §5.2.4)

**Build:** Pull from `/api/v1/analytics` + progress DB; remove placeholder strings.

### 10) Marketing website: meet IA + add MDX for docs/blog (spec §12)

**Build:** Convert docs/blog to MDX, add screenshots/assets, add marketplace preview search.

### 11) OpenAPI + docs: sync to actual routes (spec §13)

**Build:** Ensure `apps/api/openapi.yaml` includes all implemented endpoints (notes, pipeline, search) and matches payload fields.

### 12) Telemetry: ensure analytics events exist + privacy compliance (spec §9.3)

**Build:** Add opt-in flags, data deletion workflow hits server, and document retention.

### 13) Accessibility pass on all screens

**Build:** Verify keyboard nav, focus traps in modals, aria labels, contrast. Add automated checks.

### 14) E2E: Playwright smoke tests for every route

**Build:** Add `pnpm test:e2e`/`npm run test:e2e` that covers onboarding, dashboard, conversation, mindmap, lesson reader, marketplace, settings.

---

## Notes (brutally honest gaps)

- Pipelines are currently UI mocks; spec expects this as a core differentiator.
- Marketplace is currently a demo; spec expects it to be a product surface with creator tooling.
- Onboarding flow has at least one broken route.
- WS contract is close but not spec-clean; docs note a known mismatch (`completion_percent` vs `completion%`).
