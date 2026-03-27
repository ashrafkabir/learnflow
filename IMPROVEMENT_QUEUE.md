# LearnFlow — Improvement Queue (Iter108)

Owner: Builder  
Planner: Ash (planner subagent)  
Last updated: 2026-03-27 (Iteration 108 READY FOR BUILDER)

---

## Iteration 108 — SPEC ↔ IMPLEMENTATION PARITY AUDIT + PRIORITIZED FIX LIST

Status: **DONE**

### Recent shipped (for continuity)

- **Iter105 (commit b8364ad)** — marketplace manifest-based routing (activation affects orchestrator intent routing) + WebSocket first-time marketplace agent disclosure + pricing copy updated to explicitly say billing is mock.
- **Iter106 (commit a19a672)** — *per prior queue note*: parity audit + fix list baseline.
- **Iter107 (commit 1cadf8e)** — shipped since last audit (see git history); include in release notes / changelog.

### Planner evidence (Iter108)

Screenshots + notes captured into:
- `learnflow/screenshots/iter108/planner-run/`
  - `NOTES.md` (includes harness anomalies + what was captured)

> Note: screenshot harness scripts appear to still write into hardcoded/date-named dirs (then we copied into iter108). This is itself a P0.

### Brutally honest: top spec gaps (Iter108)

1) **Subscription spec contradicts current implementation**: Spec §8 says **Free course creation is unlimited**, but API enforces **Free plan limited to 3 courses**.
   - Evidence: `apps/api/src/routes/pipeline.ts` and `apps/api/src/routes/courses.ts` enforce `FREE_LIMIT = 3` when `tier !== 'pro'`.
   - Impact: trust-breaker; users will hit paywall unexpectedly relative to spec.

2) **Agent Marketplace is largely “UI demo data”**: The client marketplace screen is seeded static `AGENTS` array; it does not fetch `/api/v1/marketplace/agents` submissions nor support submission/review UI.
   - Evidence: `apps/client/src/screens/marketplace/AgentMarketplace.tsx` defines `const AGENTS: Agent[] = [...]` and only calls activation endpoints.
   - Impact: spec §7.2 (submission/review/mod pipeline) is not delivered in product UX.

3) **Update Agent is real but still not “proactive”**: Implementation exists (routes + RSS parsing), and client hydrates notifications feed, but there is **no in-repo scheduler** and it is largely manual.
   - Evidence: `apps/api/src/routes/update-agent.ts`, `apps/api/src/utils/updateAgent/runTopic.ts`, UI panel `apps/client/src/components/update-agent/UpdateAgentSettingsPanel.tsx`, notification hydration in `apps/client/src/context/AppContext.tsx`.

---

## Iter108 — Top tasks (10–15) READY FOR BUILDER

### P0 — Correctness, trust, and user-visible contradictions

1) **P0 — Fix screenshot harness output directory behavior (desktop + mobile)**

- **Problem**: Iter108 capture required copying from other folders; harnesses appear to ignore the intended output dir.
- **Evidence**: `learnflow/screenshots/iter108/planner-run/NOTES.md`.
- **Acceptance**:
  - `node screenshot-all.mjs <outDir>` writes to exactly `<outDir>`.
  - `node screenshot-mobile.mjs <outDir>` writes to exactly `<outDir>`.
  - Scripts print the resolved output dir.
- **Likely files**: `screenshot-all.mjs`, `screenshot-mobile.mjs`.

2) **P0 — Resolve Spec §8 “Unlimited course creation” vs implementation “Free=3 courses”**

- **Problem**: hard contradiction.
- **Evidence**:
  - Spec: `LearnFlow_Product_Spec.md` §8 table row “Course Creation: Unlimited”.
  - Code: `apps/api/src/routes/pipeline.ts` + `apps/api/src/routes/courses.ts` (`FREE_LIMIT = 3`).
- **Acceptance (choose one)**:
  - (A) Remove/raise free limit in API, OR
  - (B) Update spec + all UI/marketing copy to reflect “Free: 3 courses” and ensure upgrade CTAs are consistent.

3) **P0 — Update Agent: make “proactive updates” truthful + add scheduler option**

- **Problem**: Feature exists but not truly proactive; spec promises daily/weekly refresh.
- **Evidence**: `apps/api/src/routes/update-agent.ts`, `apps/api/src/utils/updateAgent/runTopic.ts`, `apps/client/src/components/update-agent/UpdateAgentSettingsPanel.tsx`.
- **Acceptance**:
  - Add a minimal scheduler path (documented cron; optional dev interval) that triggers `/api/v1/update-agent/tick` for Pro users, and/or
  - Update UI + docs to clearly say “manual tick / RSS-only monitoring” until scheduler exists.

4) **P0 — Agent Marketplace: stop shipping static demo agents as “real marketplace”**

- **Problem**: Marketplace agents list is hardcoded; spec calls for submissions/review.
- **Evidence**: `apps/client/src/screens/marketplace/AgentMarketplace.tsx`.
- **Acceptance**:
  - Client fetches from `GET /api/v1/marketplace/agents` and renders returned agents, and
  - Add “Submit Agent” flow calling `POST /api/v1/marketplace/agents/submit` (even if admin review is manual).

5) **P0 — BYOAI key setup parity: add Tavily to onboarding UI or remove it from “supported providers”**

- **Evidence**:
  - API supports `tavily`: `apps/api/src/keys.ts`.
  - Onboarding UI currently focused on OpenAI/Anthropic/Gemini: `apps/client/src/screens/onboarding/ApiKeys.tsx`.
- **Acceptance**: Tavily is either (A) selectable in onboarding with correct placeholder/validation, or (B) explicitly “advanced / later” with docs.

### P1 — Capability completeness and cohesion

6) **P1 — Agent Marketplace: wire “activation affects orchestrator tools” end-to-end**

- **Problem**: activation persists (`/marketplace/agents/:id/activate`) but UI does not show what actually changes at runtime.
- **Evidence**:
  - API: `apps/api/src/routes/marketplace-full.ts` activation routes.
  - Orchestrator mapping: `packages/core/src/orchestrator/intent-router.ts` (intent routing).
- **Acceptance**:
  - After activation, Conversation UI shows “Available agents” list updated, and
  - One-time disclosure clarifies whether execution is built-in vs 3rd-party (current reality).

7) **P1 — Marketplace course publishing: connect real course content + QC inputs (not placeholders)**

- **Problem**: CreatorDashboard publishes with placeholder `lessonCount/attributionCount/readabilityScore`.
- **Evidence**: `apps/client/src/screens/marketplace/CreatorDashboard.tsx` posts static QC inputs.
- **Acceptance**:
  - Compute QC inputs from actual course in DB, or require selecting a course to publish.
  - QC “review vs publish” status is understandable and consistent.

8) **P1 — Subscription/billing mock boundaries: ensure every paid CTA is labeled “mock”**

- **Evidence**: paid enroll route returns `billingMode: 'mock'` in `apps/api/src/routes/marketplace-full.ts`; client surfaces vary by screen.
- **Acceptance**:
  - All pricing/enroll/payout surfaces include consistent “Mock billing” label.

9) **P1 — Notifications/Update feed: add “mark read” and “view all” UX**

- **Problem**: Dashboard shows top 5; no clear “see all / mark all read”.
- **Evidence**: `apps/client/src/screens/Dashboard.tsx` notifications section; API `apps/api/src/routes/notifications.ts`.
- **Acceptance**:
  - Add route/UI for pagination and mark-read actions, or clearly explain limitations.

10) **P1 — Spec alignment doc update: refresh `IMPLEMENTED_VS_SPEC.md`**

- **Problem**: parity doc is stale relative to marketplace/update-agent/subscription realities.
- **Acceptance**:
  - Update with precise references to actual endpoints/screens and explicitly list “mock/demo vs real”.

### P2 — Quality, documentation, and tests

11) **P2 — Add WS contract tests for payload names + ignored fields**

- **Evidence**: REST chat accepts `attachments/context_overrides/apiKey/provider` in `apps/api/src/routes/chat.ts`; WS has its own schema in `apps/api/src/wsOrchestrator.ts`.
- **Acceptance**:
  - Tests cover `completion_percent` naming, ignored fields behavior, and no-crash guarantee.

12) **P2 — Documentation: “What’s real today” page**

- **Acceptance**:
  - A short doc page listing current MVP architecture (Express + SQLite + WS/Yjs) vs spec’s future architecture.

13) **P2 — Course limit messaging: match server enforcement in all client flows**

- **Evidence**: client has FREE_COURSE_LIMIT=3 in `apps/client/src/screens/Dashboard.tsx`, but other creation entry points may not warn.
- **Acceptance**:
  - Any create-course entry point warns and links to Pricing.

---

## Prior iterations (history — keep below)

- **Iter107 DONE** — commit `1cadf8e` (see git for shipped items).

- **Iter106 DONE** — parity audit + fix list baseline (commit `a19a672`).
  - Note: Iter106 tasks may still apply; Iter108 supersedes priority ordering.
