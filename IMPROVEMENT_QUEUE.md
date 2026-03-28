# LearnFlow — Improvement Queue (Iter114)

Owner: Builder  
Planner: Ash (planner subagent)  
Last updated: 2026-03-28 (Iteration 114 READY FOR BUILDER)

---

## Iteration 114 — SPEC ↔ IMPLEMENTATION PARITY AUDIT + PRIORITIZED FIX LIST

Status: **DONE**

### Planner evidence (Iter114)

Screenshots + notes captured into:

- Desktop: `learnflow/screenshots/iter114/planner-run/`
- Mobile: `learnflow/screenshots/iter114/planner-run/mobile/`
- Notes: `learnflow/screenshots/iter114/planner-run/NOTES.md`

Harness used:

- Desktop: `node screenshot-all.mjs screenshots/iter114/planner-run --base http://localhost:3001`
- Mobile: `node screenshot-mobile.mjs screenshots/iter114/planner-run/mobile --base http://localhost:3001`

Key evidence files/endpoints referenced below:

- Spec: `LearnFlow_Product_Spec.md` (explicit MVP disclosure exists in §3.2.0, but many other sections still read as future-state)
- UI routes (client): `apps/client/src/App.tsx` + `apps/client/src/screens/*`
- API routers (not exhaustive):
  - Auth + tiers: `apps/api/src/auth.ts`, `apps/api/src/routes/subscription.ts`
  - Keys vault + encryption: `apps/api/src/keys.ts`, `apps/api/src/crypto.ts`, `apps/api/src/llm/providers.ts`
  - WebSockets: `apps/api/src/websocket.ts`, `apps/api/src/wsOrchestrator.ts`, docs `apps/docs/pages/websocket-events.md`
  - Update Agent: `apps/api/src/routes/update-agent.ts` + RSS runner `apps/api/src/utils/updateAgent/runTopic.ts`
  - Export: `apps/api/src/routes/export.ts`
  - Marketplace full (mock checkout/payouts): `apps/api/src/routes/marketplace-full.ts`
  - Privacy delete: `DELETE /api/v1/delete-my-data` → `apps/api/src/routes/delete-my-data.ts`
  - Usage: `apps/api/src/routes/usage.ts`
- OpenAPI: `apps/api/openapi.yaml` (includes `x-learnflow.websocket`)

---

## Brutally honest parity summary (Iter114)

### What’s genuinely implemented end-to-end (MVP)

1. **Web-first MVP is now consistently stated in marketing docs**

- Evidence: `apps/client/src/screens/marketing/Docs.tsx` (Installation: “web-first MVP”).

2. **API key vault encryption is real (AEAD default)**

- Evidence: `apps/api/src/crypto.ts` defaults to `aes-256-gcm` (`encVersion: v2_gcm`), legacy CBC decrypt support.
- Boot validation: `apps/api/src/index.ts` refuses prod startup without proper `ENCRYPTION_KEY` and non-fallback `JWT_SECRET`.

3. **WebSocket product surface is real and documented**

- Server: `apps/api/src/websocket.ts`.
- Orchestrator streaming + activity events: `apps/api/src/wsOrchestrator.ts`.
- Docs: `apps/docs/pages/websocket-events.md`.
- OpenAPI annotation: `apps/api/openapi.yaml` includes `x-learnflow.websocket.path: /ws` and `eventsDoc`.

4. **Update Agent (Pro-only) runs exist with explicit “external cron” expectation**

- Spec acknowledges manual tick + RSS-only MVP in §3.2.0.
- Endpoint evidence: `POST /api/v1/update-agent/tick` in `apps/api/src/routes/update-agent.ts`.

5. **Privacy: delete-my-data endpoint exists**

- Evidence: `DELETE /api/v1/delete-my-data` → `apps/api/src/routes/delete-my-data.ts` and UI callsite in `apps/client/src/screens/ProfileSettings.tsx`.

6. **Free-tier course limit enforced server-side**

- Evidence: `POST /api/v1/courses` enforces FREE_LIMIT=3 for non-pro: `apps/api/src/routes/courses.ts`.

### Where spec is still “future state” (and risks user trust if mirrored in user-facing copy)

- Spec §1 + §5.1 claim macOS/Windows/iOS/Android native apps; repo is web-first MVP (though docs now say this correctly).
- Spec talks about gRPC mesh/K8s/vector DB, but MVP section already flags this (§3.2.0). The problem is not the existence of future state — it’s _how easily a reader misses the MVP constraints_.

---

## Iter114 — Top tasks (10–15) DONE

### P0 — Correctness, trust, and “don’t lie in the UI”

1. **P0 — Fix Plan/Capability mismatch: “Managed API keys” (server supports env keys, plan says not available)**

- Problem: Shared plan defs hard-disable `keys.managed`, and UI says “Managed API keys (not available in this build)”, but server can still use env-managed keys for Pro (`managed_env`) when env vars exist.
- Evidence:
  - Plan defs: `packages/shared/src/plan/index.ts` sets `'keys.managed': false` for both free/pro.
  - UI label: `apps/client/src/screens/ProfileSettings.tsx` (“Managed API keys (not available in this build)”).
  - Server behavior: `apps/api/src/llm/providers.ts` returns `{ kind: 'managed_env' }` when `tier === 'pro' && envKey`.
- Acceptance:
  - Decide product truth and implement consistently:
    - Option A (recommended): keep `keys.managed` **false** and remove/disable env fallback for Pro, OR
    - Option B: make `keys.managed` **conditional** on server config and expose it:
      - Add server capability detection (e.g., env vars present) → surface in `/api/v1/subscription` features.
      - Update UI copy to “Managed keys available on this deployment” only when true.

2. **P0 — Settings: remove hardcoded “API calls this month 1,234 / 10,000”**

- Problem: Fake numbers in a “Subscription Management” section are user-trust poison.
- Evidence: `apps/client/src/screens/ProfileSettings.tsx` hardcodes `1,234 / 10,000`.
- Acceptance:
  - Replace with real metrics from `GET /api/v1/usage/dashboard` or remove the entire meter until real.

3. **P0 — Marketplace Creator Dashboard: remove/flag mock analytics + mock courses/earnings OR make it obviously demo**

- Problem: Creator dashboard currently uses extensive `MOCK_*` datasets and falls back silently; looks real.
- Evidence: `apps/client/src/screens/marketplace/CreatorDashboard.tsx` defines `MOCK_COURSES`, `MOCK_ANALYTICS`, `MOCK_EARNINGS` and “MVP: placeholder quality inputs”.
- Acceptance:
  - Either wire all tiles to server payload and show empty-state when none, OR add a visible “Demo data” badge + explanatory copy.

4. **P0 — Pipeline “Publish to Marketplace” is a stage flip, not a marketplace publish**

- Problem: UI lets users “Publish to Marketplace”, but API endpoint only flips pipeline stage to `published` — it does not create a marketplace course entry.
- Evidence:
  - Client: `apps/client/src/components/pipeline/PipelineView.tsx` calls `POST /api/v1/pipeline/:id/publish`.
  - API: `apps/api/src/routes/pipeline.ts` `/publish` just `updatePipeline(p, { stage: 'published' })`.
  - Real marketplace publish lives elsewhere: `apps/api/src/routes/marketplace-full.ts`.
- Acceptance:
  - Either rename button to “Mark Published” / “Finish Pipeline”, OR actually call marketplace publish and create a published course record.

5. **P0 — WebSocket docs: fix “token=dev accepted” claim to match server reality**

- Problem: Docs say `token=dev` is accepted when `LEARNFLOW_DEV_AUTH=1`, but server checks `LEARNFLOW_DEV_AUTH` _and_ `config.devMode` gates are elsewhere; users can get confused.
- Evidence:
  - Docs: `apps/docs/pages/websocket-events.md`.
  - Server: `apps/api/src/websocket.ts` dev token accepted only if `NODE_ENV!=production` and `LEARNFLOW_DEV_AUTH=1|true`.
- Acceptance:
  - Clarify exact env requirements in docs (mirror the condition precisely).

### P1 — Product coherence / gating / UX polish

6. **P1 — Subscription endpoint: surface capabilities from shared plan definitions everywhere**

- Problem: `/api/v1/subscription` returns a bespoke `FeatureFlags` shape; it partially mirrors capabilities but also hardcodes `managedApiKeys: false`.
- Evidence: `apps/api/src/routes/subscription.ts` and `apps/api/src/lib/capabilities.ts` + `packages/shared/src/plan/index.ts`.
- Acceptance:
  - Return `capabilities` (CapabilityId → boolean) and let UI derive feature tiles from that; deprecate bespoke flags.

7. **P1 — Export: reconcile spec + UI with reality (PDF/SCORM stubs)**

- Evidence: `apps/api/src/routes/export.ts` returns 501 for `format=pdf|scorm`.
- Acceptance:
  - Either implement minimal PDF/SCORM, or hide/gate endpoints and label in UI + docs as planned.

8. **P1 — Marketplace checkout/payouts: ensure all UI surfaces clearly say “mock billing”**

- Problem: API returns `billingMode: 'mock'`, but UI should consistently disclose.
- Evidence: `apps/api/src/routes/marketplace-full.ts`.
- Acceptance:
  - Add badges/copy in marketplace checkout flows and creator earnings.

9. **P1 — Usage + limits: formalize what “limits” exist for BYOAI and Pro**

- Problem: There is rate limiting + free course cap + token usage dashboards, but the product copy mixes “BYOK spend” with “platform limits”.
- Evidence:
  - Rate limiter: `apps/api/src/rateLimit.ts` + `apps/api/src/app.ts`.
  - Usage endpoints: `apps/api/src/routes/usage.ts`.
- Acceptance:
  - Make pricing page + settings show the correct constraints (course count, update agent, export, etc.) and not invented “10,000 calls”.

### P2 — DevEx / QA / iteration hygiene

10. **P2 — Screenshot harness: ensure it always writes NOTES.md automatically**

- Problem: Iter114 required manual creation of `NOTES.md`.
- Evidence: `learnflow/screenshots/iter114/planner-run/NOTES.md` was missing until created.
- Acceptance:
  - Update `screenshot-all.mjs` / `screenshot-mobile.mjs` (or wrapper script) to always create/append a run notes template.

11. **P2 — OpenAPI parity: add missing UI-used endpoints and verify docs paths**

- Problem: OpenAPI is good, but needs continuous parity with routes + WS contract doc references.
- Evidence: `apps/api/openapi.yaml` includes `x-learnflow.websocket`, but other drift tends to accumulate each iteration.
- Acceptance:
  - Add/keep CI test that diffs route registry vs openapi paths.

12. **P2 — Make “MVP truth” impossible to miss (single canonical page in-app)**

- Problem: Spec has MVP section, but user-facing clarity should live in app/marketing.
- Evidence: `apps/client/src/screens/marketing/Docs.tsx` does this partially.
- Acceptance:
  - Add a “What’s in MVP vs planned” screen in-app (Settings → About) that lists: mock billing, mock creator analytics, env-managed keys behavior, export stubs.

---

## Prior iterations (history — keep below)

---

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
