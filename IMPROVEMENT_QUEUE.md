# LearnFlow — Improvement Queue (Iter111)

Owner: Builder  
Planner: Ash (planner subagent)  
Last updated: 2026-03-28 (Iteration 111 READY FOR BUILDER)

---

## Iteration 111 — SPEC ↔ IMPLEMENTATION PARITY AUDIT + PRIORITIZED FIX LIST

Status: **DONE**

### Planner evidence (Iter111)

Screenshots + notes captured into:

- Desktop: `learnflow/screenshots/iter111/planner-run/desktop/`
- Mobile: `learnflow/screenshots/iter111/planner-run/mobile/`
- Notes: `learnflow/screenshots/iter111/planner-run/NOTES.md`

Harness used:

- Desktop: `node screenshot-all.mjs ... --base http://localhost:3001 --iter 111`
- Mobile: `node screenshot-mobile.mjs ... --base http://localhost:3001 --iter 111`

Key evidence files/endpoints referenced below:

- Spec: `LearnFlow_Product_Spec.md` (includes explicit “MVP architecture (this repo, today)” section §3.2.0)
- UI routes (client): `apps/client/src/App.tsx` + `apps/client/src/screens/*`
- Marketing site (Next): `apps/web/src/app/*`
- API routers:
  - Update Agent: `apps/api/src/routes/update-agent.ts` + RSS runner `apps/api/src/utils/updateAgent/runTopic.ts`
  - Export: `apps/api/src/routes/export.ts`
  - Marketplace full: `apps/api/src/routes/marketplace-full.ts`
  - Marketplace agent manifest resolution: `apps/api/src/routes/marketplace-agent-manifests.ts`, `apps/api/src/lib/marketplaceAgents.ts`
  - WebSockets: `apps/api/src/websocket.ts`, orchestrator `apps/api/src/wsOrchestrator.ts`
- Core routing: `packages/core/src/orchestrator/intent-router.ts`

### Brutally honest parity summary (Iter111)

#### What’s genuinely implemented end-to-end (MVP)

- **Onboarding flow (6 screens)** exists and is screenshot-harnessed.
  - Evidence: screenshots `onboarding-1..6-*.png` + client onboarding screens.

- **Conversation screen with WebSocket streaming** exists and shows agent activity.
  - Evidence:
    - WS server: `apps/api/src/websocket.ts` (events: `response.start/chunk/end`, `agent.spawned/complete`, etc.)
    - Client handling: `apps/client/src/screens/Conversation.tsx` (`agent.spawned`, `response.chunk`, etc.)

- **Update Agent (Pro) is real as an RSS/Atom-only trust loop** with:
  - Global per-user lock and in-process guard
  - Per-source backoff via `nextEligibleAt`
  - Run history endpoint
  - Evidence:
    - `POST /api/v1/update-agent/tick` + `GET /api/v1/update-agent/runs`: `apps/api/src/routes/update-agent.ts`
    - RSS run: `apps/api/src/utils/updateAgent/runTopic.ts`
    - Scheduling docs: `apps/docs/pages/update-agent-scheduling.md`

- **Marketplace course publishing QC has improved**: server can compute QC fields if a `courseId` is provided.
  - Evidence: `apps/api/src/routes/marketplace-full.ts` publish route recomputes `lessonCount`, best-effort `attributionCount`, and `readabilityScore`.

- **Secrets hardening in production is present**.
  - Evidence: boot-time validation refuses to start in `NODE_ENV=production` if `JWT_SECRET` is fallback or `ENCRYPTION_KEY` not 64-hex: `apps/api/src/index.ts`.

#### Where the spec is “future state” vs repo reality (expected) — but still needs clearer product truth

The spec does include §3.2.0 acknowledging MVP vs future stack; however, several _user-facing_ surfaces still imply stronger capabilities than delivered:

- **Marketing metrics are fictional** (likely intended as placeholders, but they read as claims):
  - Evidence: `apps/client/src/screens/marketing/Home.tsx` hardcodes "50,000+ courses", "12,000+ learners", etc.

- **Docs contain at least one contradiction about collaboration/mindmaps**:
  - Evidence: `apps/client/src/screens/marketing/Docs.tsx` says “Real-time shared mindmaps are planned (not yet available)”, but Yjs real-time mindmap sync exists in this repo (`apps/api/src/yjsServer.ts`, client `useMindmapYjs.ts`).

- **WebSocket is a first-class product surface, but it’s not in OpenAPI**.
  - Evidence: `/ws` not present in `apps/api/openapi.yaml`; WS contract exists in `apps/api/src/websocket.ts` and tests (e.g., `apps/api/src/__tests__/ws-contract.test.ts`).

- **Export formats PDF/SCORM are still stubs**.
  - Evidence: `apps/api/src/routes/export.ts` returns 501 for `format=pdf|scorm`; UI already labels them “Coming soon” in `apps/client/src/screens/ProfileSettings.tsx`.

- **Marketplace agents are “routing manifests”, not executable third-party code** (this is disclosed in UI, which is good).
  - Evidence:
    - UI disclosure: `apps/client/src/screens/marketplace/AgentMarketplace.tsx`
    - Routing: `packages/core/src/orchestrator/intent-router.ts`
    - Manifest resolver: `apps/api/src/lib/marketplaceAgents.ts`

---

## Iter111 — Top tasks (10–15) READY FOR BUILDER

### P0 — User trust / contradictions / correctness

1. **P0 — Remove or clearly label fictional marketing metrics**

- **Problem**: Hardcoded “50,000+ courses / 12,000+ learners / 4.9 rating / 98% completion” reads like real traction claims.
- **Evidence**: `apps/client/src/screens/marketing/Home.tsx` (`METRICS` constant).
- **Acceptance**: Replace with (a) no metrics, (b) “beta” counters from real analytics, or (c) explicit “demo” labeling.

2. **P0 — Docs correctness: fix real-time mindmap/collaboration statements**

- **Problem**: Docs say real-time shared mindmaps are not available; in repo they are (Yjs).
- **Evidence**: `apps/client/src/screens/marketing/Docs.tsx` vs `apps/api/src/yjsServer.ts` + client `apps/client/src/hooks/useMindmapYjs.ts`.
- **Acceptance**: Update docs to accurately describe what is real now, and what is planned.

3. **P0 — WebSocket contract documentation: add /ws to OpenAPI (or a dedicated contract doc surfaced in Docs)**

- **Problem**: WebSocket is essential (conversation streaming + agent activity), but the main API contract file does not mention it.
- **Evidence**: `/ws` missing from `apps/api/openapi.yaml`; contract emitted at connect: `apps/api/src/websocket.ts` (sends `ws.contract`).
- **Acceptance**:
  - Either extend OpenAPI with a WS section (nonstandard but documented), OR
  - Add `/docs` page that enumerates event names, inbound/outbound shapes, requestId semantics.

4. **P0 — Update Agent: ensure “tick” is the primary UX path everywhere; keep “selected topic only” as explicitly advanced**

- **Problem**: This was a prior mismatch in Iter110; current UI now has both (good), but ensure copy and buttons align with “canonical scheduler entrypoint.”
- **Evidence**: `apps/client/src/components/update-agent/UpdateAgentSettingsPanel.tsx` uses `/update-agent/tick` for “Run now” and `/notifications/generate` for advanced.
- **Acceptance**: Keep as-is but confirm labeling + any other surfaces still calling `/notifications/generate` for main run.

5. **P0 — Export: prevent dead-end 501s from being discoverable via URL guessing (optional)**

- **Problem**: Pro users can hit `/api/v1/export?format=pdf` and get 501.
- **Evidence**: `apps/api/src/routes/export.ts`.
- **Acceptance**: Either implement minimal PDF/SCORM MVP, or return 403/404 with clearer messaging + docs, or gate behind feature flag.

### P1 — Product completeness / platform coherence

6. **P1 — Platform matrix truth: spec says native (mac/win/iOS/Android), repo is web MVP**

- **Problem**: Spec §1/§5.1 claims 4 native platforms; MVP is web-first.
- **Evidence**: spec §5.1 vs actual code: `apps/client` (React SPA) + `apps/web` (Next marketing).
- **Acceptance**: Add a prominent “MVP: web-first” disclaimer to user-facing docs/marketing (not only buried in spec §3.2.0).

7. **P1 — Marketplace Agents: tighten the taxonomy mismatch (capabilities vs taskTypes vs requiredProviders)**

- **Problem**: Agent manifests in `packages/agents/*/manifest.json` use varied fields (`capabilities`, `requiredProviders`) while marketplace routing expects `taskTypes` and `routesToAgentName`.
- **Evidence**: `packages/core/src/orchestrator/intent-router.ts` uses `taskType` matching; marketplace resolver reads `taskTypes || capabilities` in `apps/api/src/lib/marketplaceAgents.ts`.
- **Acceptance**: Standardize on one vocabulary across built-in agent manifests + marketplace manifests; document it.

8. **P1 — Subscription feature flags: managedApiKeys remains false even when env-managed keys exist**

- **Problem**: Subscription status response says `managedKeyAccess` false even though Pro can use env-managed keys in some deployments.
- **Evidence**: `apps/api/src/routes/subscription.ts` sets `managedApiKeys: false`; providers selection logic in `apps/api/src/llm/providers.ts` (managed keys exist when env vars provided).
- **Acceptance**: Reflect reality: if server has managed keys configured, expose that in `features` and UI.

9. **P1 — Collaboration: spec implies real-time messaging + peer matching; current is CRUD-style**

- **Problem**: Collaboration is present but not “real-time chat”; set expectations in UI.
- **Evidence**: API `apps/api/src/routes/collaboration.ts` + client `apps/client/src/screens/Collaboration.tsx`.
- **Acceptance**: Update copy + add basic realtime via WS (or explicitly label “async/groups MVP”).

### P2 — DevEx / QA / operational polish

10. **P2 — Screenshot harness: create a single command that captures both desktop+mobile to an iteration folder**

- **Problem**: We run two scripts manually.
- **Evidence**: `screenshot-all.mjs`, `screenshot-mobile.mjs`.
- **Acceptance**: Add `npm run screenshots -- --iter 111` wrapper that writes `NOTES.md` and runs both.

11. **P2 — Add a lightweight “Spec parity checklist” doc (or extend IMPLEMENTED_VS_SPEC.md)**

- **Problem**: `IMPLEMENTED_VS_SPEC.md` exists but is Iter106 and can drift.
- **Evidence**: `IMPLEMENTED_VS_SPEC.md` header says Iter106.
- **Acceptance**: Update that file per iteration, or add a new rolling parity doc with dated entries.

12. **P2 — OpenAPI parity: ensure newly added endpoints are documented (Update Agent runs, marketplace agent manifest resolve, etc.)**

- **Evidence**: OpenAPI exists; WS missing; verify update-agent runs + agent manifest resolve are present and correct.
- **Acceptance**: CI/test to block drift.

---

## Prior iterations (history — keep below)

---

# LearnFlow — Improvement Queue (Iter110)

Owner: Builder  
Planner: Ash (planner subagent)  
Last updated: 2026-03-27 (Iteration 110 READY FOR BUILDER)

---

## Iteration 110 — SPEC ↔ IMPLEMENTATION PARITY AUDIT + PRIORITIZED FIX LIST

Status: **DONE (Builder)**

### Planner evidence (Iter110)

Screenshots + notes captured into:

- Desktop: `learnflow/screenshots/iter110/planner-run/`
  - Includes `NOTES.md`
- Mobile: `learnflow/screenshots/iter110/planner-run-mobile/`

Key evidence files/endpoints referenced below:

- Spec: `LearnFlow_Product_Spec.md` (note: spec already includes an explicit “MVP architecture (this repo, today)” section §3.2.0)
- API:
  - Update Agent tick: `POST /api/v1/update-agent/tick` (Pro only) — `apps/api/src/routes/update-agent.ts`
  - Update Agent one-topic generate: `POST /api/v1/notifications/generate` — `apps/api/src/routes/notifications.ts`
  - Export: `GET /api/v1/export?format=md|json|zip|pdf|scorm` — `apps/api/src/routes/export.ts`
  - Marketplace (full): `apps/api/src/routes/marketplace-full.ts`
  - WebSocket orchestration: `apps/api/src/websocket.ts`, `apps/api/src/wsOrchestrator.ts`
- Client:
  - Update Agent panel: `apps/client/src/components/update-agent/UpdateAgentSettingsPanel.tsx`
  - Agent Marketplace: `apps/client/src/screens/marketplace/AgentMarketplace.tsx`
  - Pricing page: `apps/client/src/screens/marketing/Pricing.tsx`
  - Marketing “real web sources” copy: `apps/client/src/screens/marketing/Home.tsx`, `apps/client/src/screens/marketing/Features.tsx`
  - Delete-my-data UI: `apps/client/src/screens/ProfileSettings.tsx` → `DELETE /api/v1/delete-my-data`

### Brutally honest parity summary (Iter110)

What’s **solid/real**:

- **Onboarding flow exists** (6 screens captured) and BYOAI key storage is **encrypted at rest**.
  - Evidence: key encryption + decrypt at runtime: `apps/api/src/crypto.ts`, `apps/api/src/llm/providers.ts`, `apps/api/src/keys.ts`
- **WebSocket streaming contract exists** (`response.start/chunk/end`, `agent.spawned/complete`).
  - Evidence: `apps/api/src/wsOrchestrator.ts`
- **Update Agent exists** as RSS/Atom-only trust loop with locks + backoff.
  - Evidence: `apps/api/src/utils/updateAgent/runTopic.ts`, `apps/api/src/routes/update-agent.ts`
- **Privacy deletion exists** (“Delete My Data”) and telemetry can be disabled.
  - Evidence: `apps/api/src/routes/delete-my-data.ts`, `apps/api/src/routes/events.ts`, `apps/api/src/routes/profile.ts`

What’s **materially not as promised / confusing**:

- **Marketing copy implies broader “real web sources / paste a URL”** behavior than the current pipeline credibly supports.
  - Evidence: marketing copy in `Home.tsx` / `Features.tsx` vs pipeline implementation concentrated in `apps/api/src/routes/pipeline.ts`.
- **Update Agent UX mismatch**: UI “Run now” triggers `POST /api/v1/notifications/generate` (single-topic) rather than the canonical `POST /api/v1/update-agent/tick` “scheduler entrypoint.”
  - Evidence: `UpdateAgentSettingsPanel.tsx` calls `/notifications/generate`.
- **Marketplace agents are not truly executed**: activation influences routing, but runtime still maps to built-in agents; disclosure says so.
  - Evidence: routing: `packages/core/src/orchestrator/intent-router.ts`; disclosure: `apps/api/src/wsOrchestrator.ts`.
- **Export formats PDF/SCORM are stubbed** (501).
  - Evidence: `apps/api/src/routes/export.ts`

---

## Iter110 — Top tasks (10–15) READY FOR BUILDER

### P0 — Trust, correctness, and user-visible contradictions

1. **P0 — Update Agent: unify “Run now” with canonical tick + clarify semantics**

- **Problem**: There are two ways to run checks:
  - `/api/v1/update-agent/tick` = global per-user scheduler entrypoint (iterates enabled topics/sources)
  - `/api/v1/notifications/generate` = checks one topic by name
    UI currently uses the latter, which doesn’t match spec wording and doesn’t exercise the real “tick” trust loop.
- **Evidence**:
  - UI: `apps/client/src/components/update-agent/UpdateAgentSettingsPanel.tsx` → `apiPost('/notifications/generate', { topic })`
  - API tick: `apps/api/src/routes/update-agent.ts` (`POST /tick`)
- **Acceptance**:
  - “Run now” calls `POST /api/v1/update-agent/tick` (preferred), and
  - UI can still optionally offer “Run selected topic only” as an advanced action (if desired), but label it clearly.

2. **P0 — Marketing honesty pass: remove/qualify “paste a URL” + “real web sources” claims where untrue**

- **Problem**: Marketing pages promise URL-based learning and broad web research; current pipeline behavior looks more like best-effort curated/source-list + synthesis and is not clearly “paste any URL.”
- **Evidence**:
  - `apps/client/src/screens/marketing/Features.tsx` Step 1: “Enter any topic or paste a URL…”
  - `apps/client/src/screens/marketing/Home.tsx`: “sourced from the real web”
- **Acceptance (choose one)**:
  - (A) Implement URL ingestion end-to-end (URL input → scrape/extract → course), OR
  - (B) Adjust copy to match MVP: “enter a topic” and “best-effort sources,” with explicit MVP limitations.

3. **P0 — Secrets hardening: fail fast if ENCRYPTION_KEY/JWT_SECRET are defaults in non-dev**

- **Problem**: `apps/api/src/config.ts` has dev fallbacks (`JWT_SECRET`, `ENCRYPTION_KEY = 'a'.repeat(64)`). Spec promises strong key handling.
- **Evidence**: `apps/api/src/config.ts`
- **Acceptance**:
  - In `NODE_ENV=production` (and/or when `LEARNFLOW_DEV_AUTH` is not enabled), refuse to boot if secrets are defaults.
  - Add a clear startup error message listing missing/unsafe env vars.

4. **P0 — Export: handle PDF/SCORM promised surfaces without dead-end 501s**

- **Problem**: Spec and UI messaging mention future formats; API currently returns 501 for pdf/scorm.
- **Evidence**: `apps/api/src/routes/export.ts`
- **Acceptance**:
  - Either implement minimal PDF (even “print-to-pdf” style) and a basic SCORM stub package, OR
  - Hide PDF/SCORM options everywhere + ensure messaging consistently says “planned.”

5. **P0 — Agent Marketplace: enforce spec-consistent access rules + user disclosure**

- **Problem**: Spec §8 says Free has “All marketplace agents.” Implementation has activation + routing influence, but (a) no true third-party execution, and (b) potential tier gating confusion.
- **Evidence**:
  - Client fetches `/api/v1/marketplace/agents` and falls back to demo list: `AgentMarketplace.tsx`.
  - Runtime maps activated manifest → built-in agent: `packages/core/src/orchestrator/intent-router.ts` + disclosure in `apps/api/src/wsOrchestrator.ts`.
- **Acceptance**:
  - UI should clearly label “Marketplace agents route to built-in agents in this MVP” and show what changes when activated (task types / routing).
  - Ensure Free vs Pro agent access rules match spec + pricing page.

### P1 — Cohesion, feature completeness, and UX

6. **P1 — Update Agent scheduling: add first-class “external cron” documentation + sample job**

- **Problem**: Spec states external scheduling; product should make this copy-pastable.
- **Evidence**: spec §3.2.0 + UI links `/docs/update-agent-scheduling`.
- **Acceptance**:
  - Provide a concrete example for cron/systemd/K8s hitting `/api/v1/update-agent/tick`.
  - Mention tier requirement + auth token usage.

7. **P1 — Marketplace publishing QC: compute QC fields from real course data (not placeholders)**

- **Problem**: Publish endpoint accepts `lessonCount/attributionCount/readabilityScore` from client; this is trivially spoofable and undermines “quality check.”
- **Evidence**: `apps/api/src/routes/marketplace-full.ts` publish route maps client payload.
- **Acceptance**:
  - Server computes QC based on the course in DB (courseId selection), OR
  - At minimum, server recomputes lesson count and basic readability from stored lessons.

8. **P1 — Pro managed keys: reconcile spec table with current behavior**

- **Problem**: Spec §8 table currently claims Pro “Platform-managed, high limits,” but elsewhere says “managed keys coming soon.” Implementation already supports “managed env keys” for Pro when env vars exist.
- **Evidence**:
  - LLM provider key selection: `apps/api/src/llm/providers.ts` (Pro can use env keys)
  - Spec §8 rows “API Key … managed keys: coming soon” + “Usage Limits … platform-managed, high limits”
- **Acceptance**:
  - Align spec + UI: Pro managed keys are either (A) explicitly “optional if deployment provides” or (B) “coming soon,” with feature flags.

9. **P1 — Notifications UX: add a dedicated Notifications screen (view all + mark all read)**

- **Problem**: Notifications exist via API but discovery/controls are fragmented.
- **Evidence**: `apps/api/src/routes/notifications.ts`; dashboard shows a slice.
- **Acceptance**:
  - Add a route/screen for full feed + pagination + mark-all-read.

10. **P1 — Conversation UI: clarify agent activity + marketplace disclosure in the UI, not only WS system chunks**

- **Problem**: WS emits activity events; ensure UI consistently visualizes them and preserves “marketplace agent selected but routed to built-in agent” disclosure.
- **Evidence**: WS events in `apps/api/src/wsOrchestrator.ts`.
- **Acceptance**:
  - Add/verify a stable activity indicator component for `agent.spawned/complete` and `type: 'system'` chunks.

### P2 — Tests, docs, and operational polish

11. **P2 — Screenshot harness reliability**

- **Problem**: We need this stable every iteration.
- **Acceptance**:
  - Desktop + mobile scripts always honor the output dir, and include a `NOTES.md` template with environment/base URL.
- **Likely files**: `screenshot-all.mjs`, `screenshot-mobile.mjs`.

12. **P2 — Add contract tests for Update Agent: tick vs generate**

- **Acceptance**:
  - Tests verify `tick` iterates topics/sources and respects locks/backoff.
  - Tests verify `notifications/generate` behavior and that UI uses the intended endpoint.

13. **P2 — “What’s real today” doc page**

- **Problem**: Spec contains the MVP architecture section, but product docs/marketing should mirror it.
- **Acceptance**:
  - Add a short doc in `/docs` that enumerates: Express+SQLite, WS streaming, Yjs mindmap, RSS-only update agent, mock billing.

14. **P2 — Security: ensure keys and PII never hit logs**

- **Acceptance**:
  - Audit logging middleware + error serialization (no full request bodies logged).
  - Add a test that an API key value never appears in server logs in common flows.

---

## Prior iterations (history — keep below)

### Iteration 108 — SPEC ↔ IMPLEMENTATION PARITY AUDIT + PRIORITIZED FIX LIST

Status: **DONE**

(unchanged; preserved for continuity)
