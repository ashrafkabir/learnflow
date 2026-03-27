# LearnFlow — Improvement Queue (Iter106)

Owner: Builder  
Planner: Ash (planner subagent)  
Last updated: 2026-03-27 (Iteration 106 READY FOR BUILDER)

---

## Iteration 106 — SPEC ↔ IMPLEMENTATION PARITY AUDIT + PRIORITIZED FIX LIST

Status: **DONE**

### Summary (Iter106)

Planner label: `iter106/planner-run` (desktop + key mobile screenshots captured).

**What shipped recently**

- **Iter104 (commit a8ee923)**: server-driven subscription (remove client tier cache), shared plan definitions, `billingMode: 'mock'` boundary across subscription/checkout surfaces.
- **Iter105 (commit b8364ad)**: marketplace manifest-based routing (activation affects orchestrator intent routing) + WebSocket first-time marketplace agent disclosure + pricing copy updated to explicitly say billing is mock.

**3 biggest gaps found (brutally honest)**

1. **Spec still describes a production architecture (Postgres/Redis/S3/gRPC/Kong) but implementation is single-process Express + SQLite + WS/Yjs**. This mismatch will mislead anyone reading the spec as an implementation contract. (Spec §3, §11)
2. **Update Agent is real but only RSS/Atom “best-effort” + manual tick; Pro feature is not truly “proactive updates” in the spec sense (web monitoring + pushes)**. It creates notifications, but there’s no scheduler in repo and no breadth beyond RSS parsing. (Spec §4.2 Update Agent, §8 Proactive Updates)
3. **Conversation/Orchestrator is deterministic keyword routing (not an LLM orchestrator) and does not use BYOAI keys for actual generation in most flows**. This is fine for MVP stability, but the spec promises an LLM-driven multi-agent system with citations and adaptive behavior. (Spec §4, §10)

### Screenshot evidence (Iter106)

- Desktop: `learnflow/screenshots/iter106/planner-run/*.png`
- Mobile: `learnflow/screenshots/iter106/planner-run/mobile/*.png`
- Notes/commands: `learnflow/screenshots/iter106/planner-run/NOTES.md`

---

## Iter106 — Top tasks (10–15) READY FOR BUILDER

### P0 — Trust / spec contradictions / user-visible correctness

1. **P0 — Fix screenshot mobile harness output directory bug (blocks repeatable evidence)**

**Problem**: `node screenshot-mobile.mjs --outDir ...` ignores `--outDir` and writes to a fixed path (`evals/screenshots/iter45-mobile`). This breaks iteration evidence capture and CI-style artifact collection.

**Evidence**: Iter106 NOTES — `learnflow/screenshots/iter106/planner-run/NOTES.md`.

**Acceptance criteria**

- `screenshot-mobile.mjs --outDir <path>` actually writes to `<path>`.
- Script prints final output directory used.

**Likely files**

- `screenshot-mobile.mjs`

2. **P0 — Update Agent: align Pro gating + UI claims with actual behavior (RSS-only, manual tick)**

**Problem**: Spec says proactive updates (daily/weekly) + topic monitoring. Implementation exists (`POST /api/v1/update-agent/tick`, topics/sources CRUD) but no scheduler in repo; notifications generation is RSS-only (`runUpdateAgentForTopic`) and best-effort.

**Evidence**

- API: `apps/api/src/routes/update-agent.ts`, `apps/api/src/utils/updateAgent/runTopic.ts`
- Notifications: `apps/api/src/routes/notifications.ts`

**Acceptance criteria**

- Either (A) add a simple in-repo scheduler (dev-only + documented production cron example) that calls `/api/v1/update-agent/tick` for Pro users, OR
- (B) harden all user-facing copy to say “manual / on-demand tick; RSS-only; push notifications planned”.
- Client surface shows run history (`GET /api/v1/update-agent/runs`) and clear failure states.

**Likely files**

- `apps/client/src/screens/ProfileSettings.tsx` (or wherever Update Agent UI lives)
- `apps/api/src/routes/update-agent.ts`
- `apps/docs/pages/*` docs or `LearnFlow_Product_Spec.md`

3. **P0 — Orchestrator truth-in-advertising: disclose deterministic routing + ‘no external browsing’ mode in UI**

**Problem**: Orchestrator is keyword-based intent router (`packages/core/src/orchestrator/intent-router.ts`). Content pipeline can use network in some modes, but much behavior is deterministic/test-friendly. Spec implies full LLM agentic behavior.

**Acceptance criteria**

- In Conversation UI, add a small “System mode” disclosure: e.g., “MVP mode: deterministic routing; sources may be simulated unless you connect keys and enable browsing”.
- Docs page describing what is real today (agents, routing, marketplace mapping) vs planned.

**Likely files**

- `packages/core/src/orchestrator/intent-router.ts`
- `apps/client/src/screens/Conversation.tsx`
- `apps/docs/pages/architecture.md` / marketing docs copy

4. **P0 — BYOAI provider selection completeness: client onboarding missing Tavily key support**

**Problem**: API key vault supports provider `tavily` (for search) (`apps/api/src/keys.ts`) but onboarding UI provider dropdown does not include Tavily.

**Acceptance criteria**

- Onboarding API Keys screen supports Tavily (label + placeholder `tvly_...`) OR
- Remove `tavily` from supported providers surfaced to user (if intentionally hidden).

**Likely files**

- `apps/client/src/screens/onboarding/ApiKeys.tsx`
- `apps/api/src/keys.ts`

5. **P0 — WebSocket spec parity: document payload deltas (completion_percent, attachments ignored)**

**Problem**: Spec §11.2 uses `completion%` (invalid identifier) but implementation uses `completion_percent` and ignores `attachments/context_overrides` (accepted but unused) in `wsOrchestrator.ts`.

**Acceptance criteria**

- Update docs/spec to show actual payload names and which fields are ignored.
- Add a WS contract test that sends attachments/context_overrides and ensures no error.

**Likely files**

- `apps/api/src/wsOrchestrator.ts`
- `apps/api/src/__tests__/ws-contract.test.ts`
- `LearnFlow_Product_Spec.md` §11.2

### P1 — Product quality + capability coherence

6. **P1 — Update `IMPLEMENTED_VS_SPEC.md` (it is stale on Update Agent + subscription/billingMode + marketplace disclosure)**

**Problem**: `IMPLEMENTED_VS_SPEC.md` is labeled Iter70 and inaccurately claims Update Agent is a stub generator; it now does RSS runs + locks + run history.

**Acceptance criteria**

- Update the doc to reflect current truth (Iter106): Update Agent routes, billingMode mock boundary, marketplace routing/disclosure semantics.

**Likely files**

- `IMPLEMENTED_VS_SPEC.md`

7. **P1 — Spec §3 architecture cleanup: add “MVP architecture” appendix + mark production stack as future**

**Acceptance criteria**

- Add a short “MVP architecture (this repo)” section: Express/WS, SQLite, Yjs, no gRPC, no Kong.
- Mark Postgres/Redis/S3/vector DB as planned.

**Likely files**

- `LearnFlow_Product_Spec.md`

8. **P1 — Export Agent consistency: agent says exports are via Settings buttons; add deep-link or action chip**

**Problem**: `packages/agents/src/export-agent/export-agent.ts` punts to Settings; Conversation action chips don’t guide user reliably.

**Acceptance criteria**

- When user asks “export”, assistant returns a UI action that navigates to Settings → Export (or triggers export endpoint selection).

**Likely files**

- `packages/agents/src/export-agent/export-agent.ts`
- `apps/client/src/screens/Conversation.tsx` (action handling)

9. **P1 — Marketplace agent disclosure copy: include mapping semantics (‘routes to built-in agent’) once per session**

**Problem**: Current disclosure says “using an activated marketplace agent”, but in reality it maps to built-in runtime agents (no third-party code loading). Spec §10 even notes this, but user-facing disclosure should be more explicit.

**Acceptance criteria**

- Disclosure: “Activated marketplace agent selected; execution is currently routed to built-in agent: X.”

**Likely files**

- `apps/api/src/wsOrchestrator.ts`
- `packages/core/src/orchestrator/intent-router.ts`

10. **P1 — Course marketplace paid flow: keep mock billing boundaries consistent across all CTAs**

**Acceptance criteria**

- Any paid/enroll CTA that implies payment must say “Mock” and never suggest real purchase.
- `billingMode` surfaced in client consistently.

**Likely files**

- `apps/client/src/screens/marketplace/CourseDetail.tsx`
- `apps/api/src/routes/marketplace-full.ts`
- shared plan defs

### P2 — Fit/finish and tests

11. **P2 — Add a regression test that `screenshot-mobile.mjs --outDir` works**

**Acceptance criteria**

- Lightweight node script test that asserts output path is respected.

12. **P2 — Add docs: “How to run screenshot harnesses” + ports**

**Acceptance criteria**

- A short markdown doc in repo root or `apps/docs` describing `node screenshot-all.mjs`, `node screenshot-mobile.mjs`, required env vars, and expected output.

13. **P2 — Mindmap collaboration truth: document what is real-time (Yjs) vs what is WS ‘suggestions’**

**Acceptance criteria**

- A small doc section that distinguishes:
  - Yjs CRDT mindmap sync
  - mindmap.update suggestion events

---

## Prior iterations (compressed)

- **Iter105 DONE** — marketplace manifest routing + WS disclosure + pricing mock copy (commit `b8364ad`).
- **Iter104 DONE** — server-driven subscription + shared plan defs + billingMode mock boundary (commit `a8ee923`).
- **Iter101 DONE** — parity audit + fix list (superseded by Iter106).
