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
