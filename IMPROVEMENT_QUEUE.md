# LearnFlow — Improvement Queue (Iter119)

Owner: Builder  
Planner: Ash (planner subagent)  
Last updated: 2026-03-28 (Iteration 119 READY FOR BUILDER)

Status: **IN PROGRESS**

## Recent shipped commits (git log -10 --oneline)

- d82121a Iter118: MVP truth link + subscription flags + creator dashboard errors
- 57cddcb Iter116: remove misleading publish wording + strip demo marketplace metrics
- 451f374 Iter115: BYOAI-only truth + marketplace deactivate + OpenAPI updates
- 078ace0 Iter114: UI truth fixes + demo labels + screenshot NOTES
- 87d3e2e Iter113: fix OpenAPI parity + document notifications scheduling
- 5269ae1 Iter111 P0: remove fictional metrics; docs fixes; document WebSocket contract
- 30f1ff9 Iter110 follow-ups: tick button enable + marketplace QC hardening + notifications screen
- 4e42e09 Iter110 P0: Run now uses update-agent tick
- 1935ef4 Iter110 P0: Run now uses update-agent tick
- 485299c Iter108: parity fixes (screenshots outDir, spec limit, marketplace API)

---

## Queue hygiene (DO NOT SKIP)

1. **Never regress the header iteration.** If you touch this file, the header must remain the _current_ iteration (now: Iter119).
2. **Always set top-level Status** to one of: `READY FOR BUILDER` → `IN PROGRESS` → `DONE`.
3. **Always include "Recent shipped commits"** from `git log -10 --oneline` after each planner/builder run.
4. **Evidence-first tasks:** every task must cite at least one file, route, or screenshot.
5. **OneDrive mirror is required after edits** (copy/sync without deleting history):
   - Source: `/home/aifactory/.openclaw/workspace/learnflow/`
   - Mirror: `/home/aifactory/onedrive-learnflow/learnflow/learnflow/`

---

## Iteration 119 — SPEC ↔ IMPLEMENTATION PARITY CHECK (March 2026 spec)

### Planner evidence (Iter119)

Screenshots + notes captured into:

- Desktop: `learnflow/screenshots/iter119/planner-run/desktop/`
- Mobile: `learnflow/screenshots/iter119/planner-run/mobile/`
- Notes: `learnflow/screenshots/iter119/planner-run/NOTES.md`

Harness used:

- Desktop: `node screenshot-all.mjs learnflow/screenshots/iter119/planner-run/desktop --base http://localhost:3001`
- Mobile: `node screenshot-mobile.mjs learnflow/screenshots/iter119/planner-run/mobile --base http://localhost:3001`

### Brutally honest parity summary (Iter119)

**This repo is a web-first MVP and is fairly honest about that (spec §3.2.0), but many other spec sections still read like production (native apps, gRPC mesh, Stripe/IAP, etc.).** The implementation is strongest in:

- **Auth + profile context**: `/api/v1/auth/*` (`apps/api/src/auth.ts`), `/api/v1/profile/context` (`apps/api/src/routes/profile.ts`).
- **BYOAI API key vault**: CRUD + encryption-at-rest using AES-256-GCM (`apps/api/src/keys.ts`, `apps/api/src/crypto.ts`).
- **WebSocket streaming contract**: `/ws` server implements spec §11.2 event names (`apps/api/src/websocket.ts`, `apps/api/src/wsOrchestrator.ts`).
- **Update Agent (Pro) scheduling entrypoint**: canonical `POST /api/v1/update-agent/tick` (`apps/api/src/routes/update-agent.ts`) + UI “Run now” uses tick (`apps/client/src/components/update-agent/UpdateAgentSettingsPanel.tsx`).
- **Exports**: `GET /api/v1/export?format=md|json|zip` with Pro gating (JSON/ZIP), plus source provenance in payload (`apps/api/src/routes/export.ts`, Settings UI `apps/client/src/screens/ProfileSettings.tsx`).
- **Marketplace (MVP)**: publish/search/detail/reviews/creator dashboard, plus agent activation list (routing-preference only) (`apps/api/src/routes/marketplace-full.ts`, `apps/client/src/screens/marketplace/*`).

The **largest gaps vs spec** are:

- **Native apps** (spec §5.1): not implemented; marketing and onboarding correctly position “web-first MVP” in places (`apps/client/src/screens/marketing/Pricing.tsx` FAQ; spec needs stronger cross-links).
- **Billing** (spec §5.2.1 + §8): still mock. Server literally returns `billingMode: 'mock'` (`apps/api/src/routes/subscription.ts`); UI discloses mock billing (`apps/client/src/screens/marketing/Pricing.tsx`).
- **Agent marketplace “SDK + sandboxed third-party code loading”** (spec §7.2): not real; server supports agent submission + activation, but execution is routed to built-in agents with disclosure (`apps/api/src/routes/marketplace-full.ts`, `apps/api/src/wsOrchestrator.ts`).

---

## Iter119 — Top tasks (10–15) READY FOR BUILDER

### P0 — Trust & parity (users should never infer features that do not exist)

1. **P0 — Spec §5.1 platform claims vs actual web-first MVP: add prominent “MVP platform matrix” callouts in marketing + docs**

- Evidence: spec claims native apps (§5.1); marketing already says “web-first MVP” in Pricing FAQ (`apps/client/src/screens/marketing/Pricing.tsx`).
- Deliverable: add a small, consistent callout block on **Home / Download / Docs** that clarifies what’s shipping in this deployment (web only) + what is planned.
- Files: `apps/client/src/screens/marketing/Home.tsx`, `apps/client/src/screens/marketing/Download.tsx`, `apps/client/src/screens/marketing/Docs.tsx`, plus maybe `LearnFlow_Product_Spec.md` cross-link.

2. **P0 — Subscription: unify truth between `features` and `capabilities` to eliminate drift**

- Problem: `/api/v1/subscription` returns both `features` and `capabilities` (`apps/api/src/routes/subscription.ts`). UI is capability-driven in multiple places; `features` is now redundant and can contradict.
- Acceptance: Either (a) remove `features` from server response, OR (b) derive `features` entirely from `CAPABILITY_MATRIX` and document `features` as deprecated.
- Files: `apps/api/src/routes/subscription.ts`, `apps/client/src/screens/ProfileSettings.tsx`.

3. **P0 — Onboarding “Start Pro” flow doesn’t actually upgrade tier; either call upgrade API or label as “choose later”**

- Evidence: `apps/client/src/screens/onboarding/SubscriptionChoice.tsx` collects email in modal but never calls `/api/v1/subscription`.
- Acceptance: If user selects Pro in onboarding, call `POST /api/v1/subscription { action:'upgrade' }` (mock) and reflect Pro in settings/capabilities; OR rename to “Interested in Pro” and don’t imply upgrade.
- Files: `apps/client/src/screens/onboarding/SubscriptionChoice.tsx`, API: `apps/api/src/routes/subscription.ts`.

4. **P0 — Marketplace publish: reconcile “quality checks” with spec requirement for attribution compliance**

- Evidence: server QC checks are based on numeric inputs and/or best-effort computed from library course (`qualityCheck()` in `apps/api/src/routes/marketplace-full.ts`). Creator dashboard currently asks user to input QC numbers (MVP note) (`apps/client/src/screens/marketplace/CreatorDashboard.tsx`).
- Acceptance: For publish flow using `courseId`, compute QC server-side and **remove manual QC inputs** (or hide them behind “advanced/debug”).
- Files: `apps/client/src/screens/marketplace/CreatorDashboard.tsx`, `apps/api/src/routes/marketplace-full.ts`.

5. **P0 — API keys: implement usage dashboard requirements from spec §4.4 (“per-agent token counts”) or reword spec-facing copy**

- Evidence: keys list includes usageCount/lastUsed in `GET /api/v1/keys` (`apps/api/src/keys.ts`), but not per-agent tokens by key; WS usage persistence is best-effort with tokensTotal placeholder (`apps/api/src/wsOrchestrator.ts`).
- Acceptance: either produce a real usage dashboard endpoint (by provider + agent + time window) and use it in Settings, OR remove “token counts” promises from user-facing copy.
- Files: `apps/api/src/routes/usage.ts`, `apps/api/src/keys.ts`, `apps/api/src/wsOrchestrator.ts`, `apps/client/src/screens/ProfileSettings.tsx`.

### P1 — UX completeness & empty states

6. **P1 — Creator dashboard: add explicit empty state + retry; avoid silent “demo swallow” behavior**

- Evidence: `CreatorDashboard.tsx` has `loadError` state but demo mode can mask real failures.
- Acceptance: show: (a) unauth gate, (b) no courses yet, (c) error + retry button.
- Files: `apps/client/src/screens/marketplace/CreatorDashboard.tsx`.

7. **P1 — Marketplace courses: implement “filter by duration/rating/free/paid” spec subset or remove those UI affordances**

- Evidence: spec §5.2.7; current API search supports keyword/topic/difficulty/maxPrice (`apps/api/src/routes/marketplace-full.ts` searchSchema; `apps/api/src/routes/marketplace.ts`).
- Acceptance: either expand server schema and UI filters, or keep only what’s supported and document constraints in UI.
- Files: `apps/client/src/screens/marketplace/CourseMarketplace.tsx`, `apps/api/src/routes/marketplace-full.ts`.

8. **P1 — Conversation UI: add “agent activity indicator” parity with spec §5.2.3 using existing WS events**

- Evidence: server emits `agent.spawned/agent.complete` + `response.start/chunk/end` (`apps/api/src/wsOrchestrator.ts`), spec explicitly requires this (§5.2.3).
- Acceptance: show a subtle indicator listing current agent(s) working, derived from WS events.
- Files: `apps/client/src/screens/Conversation.tsx`, `apps/client/src/hooks/useWebSocket.ts`.

9. **P1 — Profile > Data: implement “view everything tracked about you” (spec §9.3) in UI**

- Evidence: spec says Profile > Data; server provides `GET /api/v1/profile/context` and `GET /api/v1/profile/data-summary` (`apps/api/src/routes/profile.ts`).
- Acceptance: add a “Data” tab in Settings that surfaces the server’s data summary in a user-auditable list.
- Files: `apps/client/src/screens/ProfileSettings.tsx`, API: `apps/api/src/routes/profile.ts`.

### P2 — Docs & engineering hygiene

10. **P2 — OpenAPI parity audit: ensure endpoints used by the client are present (or explicitly excluded)**

- Evidence: spec §11; OpenAPI file: `apps/api/openapi.yaml`; routes include keys/profile/subscription/export/marketplace/update-agent.
- Acceptance: verify all client-called endpoints are documented; if not, add or add a “not documented in MVP” section.

11. **P2 — Screenshot harness wrapper**

- Evidence: we run `screenshot-all.mjs` + `screenshot-mobile.mjs` manually; Iter119 artifacts exist (73 files) under `learnflow/screenshots/iter119/planner-run/`.
- Acceptance: add `npm run screenshots -- --iter 119 --base http://localhost:3001` wrapper that runs both scripts and updates NOTES.md.
- Files: `package.json`, `screenshot-*.mjs`.

12. **P2 — Spec hygiene: add a "MVP reality" banner at the top of future-state sections (native apps, gRPC mesh, Stripe/IAP, third-party agent sandbox)**

- Evidence: spec has an MVP disclaimer in §3.2.0, but later sections (e.g., §5.1, §8, §7.2) still read as shipped.
- Acceptance: small callouts in spec itself clarifying “planned / not in this build”.
- Files: `LearnFlow_Product_Spec.md`.

---

## Prior iterations (history — keep below)

(kept in `IMPROVEMENT_QUEUE.backup.iter118.md` for Iter118+ history retention)
