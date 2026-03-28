# LearnFlow — Improvement Queue (Iter121)

Owner: Builder  
Planner: Ash (planner subagent)  
Last updated: 2026-03-28

Status: **DONE**

## Recent shipped commits (git log -10 --oneline)

- 1fa82c5 Iter119: mark queue DONE
- 1db5d85 Iter119: MVP platform truth + onboarding Pro upgrade + subscription capabilities
- d82121a Iter118: MVP truth link + subscription flags + creator dashboard errors
- 57cddcb Iter116: remove misleading publish wording + strip demo marketplace metrics
- 451f374 Iter115: BYOAI-only truth + marketplace deactivate + OpenAPI updates
- 078ace0 Iter114: UI truth fixes + demo labels + screenshot NOTES
- 87d3e2e Iter113: fix OpenAPI parity + document notifications scheduling
- 5269ae1 Iter111 P0: remove fictional metrics; docs fixes; document WebSocket contract
- 30f1ff9 Iter110 follow-ups: tick button enable + marketplace QC hardening + notifications screen
- 4e42e09 Iter110 P0: Run now uses update-agent tick

---

## Queue hygiene (DO NOT SKIP)

1. **Never regress the header iteration.** If you touch this file, the header must remain the _current_ iteration (now: Iter121).
2. **Always set top-level Status** to one of: `READY FOR BUILDER` → `IN PROGRESS` → `DONE`.
3. **Always include "Recent shipped commits"** from `git log -10 --oneline` after each planner/builder run.
4. **Evidence-first tasks:** every task must cite at least one file, route, or screenshot.
5. **OneDrive mirror is required after edits** (copy/sync without deleting history):
   - Source: `/home/aifactory/.openclaw/workspace/learnflow/`
   - Mirror: `/home/aifactory/onedrive-learnflow/learnflow/learnflow/`

---

## Iteration 121 — Planner evidence

Screenshots + notes captured into:

- Desktop+mobile screenshots: `learnflow/screenshots/iter121/planner-run/` (72 PNGs)
- Notes: `learnflow/screenshots/iter121/planner-run/NOTES.md`

Services observed (already running; `npm run dev` aborted due to port conflicts):

- API: http://localhost:3000 (Express) — `apps/api/src/index.ts`
- Client: http://localhost:3001 (Vite) — `apps/client/package.json`
- Web: http://localhost:3003 (Next) — `apps/web/package.json`
- Yjs mindmap: ws://localhost:3002/yjs — `apps/api/src/index.ts`

Harness used:

- Desktop: `node screenshot-all.mjs --outDir screenshots/iter121/planner-run`
- Mobile: `node screenshot-mobile.mjs --outDir screenshots/iter121/planner-run/mobile`

---

## Iter121 — Brutally honest spec ↔ implementation parity audit (major sections)

### 1) Product positioning (Spec §1–2)

- **Partially aligned**: app is clearly an MVP and includes an explicit “MVP truth” panel.
  - Evidence: `apps/client/src/screens/AboutMvpTruth.tsx`
- **Spec over-claims**: spec still reads like shipped native multi-platform apps + marketplace SDK + real billing in many sections; actual is web-first MVP with mock billing + no third-party agent execution.
  - Evidence: spec §5.1 platform matrix vs marketing copy in `apps/client/src/screens/marketing/Download.tsx` (“web-first MVP”).

### 2) Architecture (Spec §3)

- **Aligned with MVP subsection**: spec’s §3.2.0 “MVP architecture (this repo)” matches reality (Express + SQLite + WS + Yjs, no gRPC/mesh).
  - Evidence: `apps/api/src/index.ts`, `apps/api/src/db.ts`, `apps/api/src/websocket.ts`, `apps/api/src/yjsServer.ts`

### 3) Multi-agent system (Spec §4, §10)

- **Implemented, but simplified**:
  - Intent routing is keyword-based (deterministic), not LLM/DAG planning beyond a small DAG.
    - Evidence: `packages/core/src/orchestrator/intent-router.ts`, `packages/core/src/orchestrator/orchestrator.ts`
  - Orchestrator can run multi-task DAG (primary + summarizer; course_builder → mindmap extension).
    - Evidence: `packages/core/src/orchestrator/orchestrator.ts`
  - Marketplace agents are **routing preferences only**, no third-party code.
    - Evidence: `apps/client/src/screens/AboutMvpTruth.tsx`; marketplace manifest routing in `packages/core/src/orchestrator/intent-router.ts`
- **Trust footgun remains**: Firecrawl provider silently runs in mock mode when key absent (returns mock sources), which can produce “sources” that look real.
  - Evidence: `packages/agents/src/content-pipeline/firecrawl-provider.ts` (`if (!cfg.apiKey) return getMockSearchResults(topic);`)

### 4) BYOAI key management (Spec §4.4)

- **Core storage/encryption exists** (AES-256-GCM default; legacy CBC support).
  - Evidence: `apps/api/src/crypto.ts`, `apps/api/src/keys.ts`, boot validation in `apps/api/src/index.ts`
- **Usage dashboard exists (MVP)**.
  - Evidence: `apps/api/src/routes/usage.ts`, `apps/api/src/app.ts` mount `/api/v1/usage`

### 5) Client UX / screens (Spec §5.2)

- **Most screens exist**, but several are still thin/stub-like.
  - Evidence: screenshots `screenshots/iter121/planner-run/app-*.png`, `onboarding-*.png`
- **Spec mismatch: onboarding step 6 implies “First Course Generation”**.
  - Current code explicitly does **not** auto-create a course during onboarding.
  - Evidence: `apps/client/src/screens/onboarding/FirstCourse.tsx` comment + behavior.

### 6) API + WS contract (Spec §11)

- **Routes broadly exist and are documented in OpenAPI**.
  - Evidence: routers mounted in `apps/api/src/app.ts`; OpenAPI at `apps/api/openapi.yaml`
- **WS events exist and are emitted** (response.start/chunk/end, agent.spawned/complete, etc.).
  - Evidence: `apps/api/src/wsOrchestrator.ts`, docs at `apps/docs/pages/websocket-events.md` (mentioned in client marketing docs).

### 7) Marketplace + billing (Spec §7–8)

- Marketplace endpoints exist, but **billing is mock** and payouts are simulated.
  - Evidence: `apps/api/src/routes/marketplace-full.ts` (mock statuses), `apps/api/src/routes/subscription.ts` (`billingMode: 'mock'`), UI note in `apps/client/src/screens/marketing/Pricing.tsx`.

---

## Iter121 — Prioritized tasks (10–15) — evidence-first

### P0 — Trust & truth (stop shipping “looks real but isn’t”)

1. **P0 — Force explicit “mock mode” disclosures anywhere mock content/sources can appear**

- Evidence:
  - Firecrawl provider returns mock search + scraped content when no key: `packages/agents/src/content-pipeline/firecrawl-provider.ts`
  - Client already has a precedent for truth panels: `apps/client/src/screens/AboutMvpTruth.tsx`
  - Conversation shows “System mode (MVP)” copy: `apps/client/src/screens/Conversation.tsx` (line near the `deterministic routing` comment)
- Do:
  - Propagate `sourceMode: 'real'|'mock'` (or `isMock`) to relevant API responses (pipeline/course/lesson/research) and surface a visible banner in the same screen (Conversation, Lesson Reader, Pipelines).
- Acceptance:
  - If any lesson/research/sources were produced without live web retrieval, the UI clearly states “Demo/mock mode” and explains why.

2. **P0 — Remove the silent mock fallbacks (or make them opt-in via env) for content discovery**

- Evidence: `packages/agents/src/content-pipeline/firecrawl-provider.ts` “silently returns mock results” behavior.
- Do:
  - In non-test runtime: if Firecrawl key missing, either (a) hard-fail with a clear error instructing user to configure a provider, or (b) require `ALLOW_MOCK_SOURCES=1` to enable mock sources.
- Acceptance:
  - No “real-looking” sources are produced unless they are actually fetched from the internet OR user explicitly opted into demo mode.

3. **P0 — Align spec onboarding language OR implement real “first course generation” during onboarding**

- Evidence:
  - Spec §5.2.1 step 6 describes real-time first course generation.
  - Code says the opposite: `apps/client/src/screens/onboarding/FirstCourse.tsx`.
  - Screenshot: `screenshots/iter121/planner-run/onboarding-6-first-course.png`
- Options:
  - (A) Implement a real small starter course generation based on goal/topic selections, OR
  - (B) Update spec + in-app copy to say “preferences saved; create your first course next”.
- Acceptance:
  - No mismatch between spec, onboarding UI, and actual behavior.

4. **P0 — Marketplace “agents”: ensure every surface repeats the truth that no third-party code executes**

- Evidence:
  - Truth panel exists: `apps/client/src/screens/AboutMvpTruth.tsx`
  - Routing is manifest-based but routes to built-in agent: `packages/core/src/orchestrator/intent-router.ts`
  - WS disclosure already exists once-per-session: `apps/api/src/wsOrchestrator.ts`
- Do:
  - Add a short disclosure line on Agent Marketplace + agent activation confirmation.
- Acceptance:
  - A user cannot activate an “agent” without seeing “routing preference only in MVP” language at least once.

### P1 — Spec parity & product coherence

5. **P1 — Make “agent activity indicator” truly visible and useful during chat**

- Evidence: WS emits `agent.spawned`/`agent.complete`: `apps/api/src/wsOrchestrator.ts`; client handles those events: `apps/client/src/screens/Conversation.tsx`; screenshot `screenshots/iter121/planner-run/app-conversation.png` doesn’t show an obvious indicator.
- Do:
  - Show a persistent inline status pill (agent name + kind + elapsed) while work is running.
- Acceptance:
  - When a WS message is processing, the user sees which agent is running and when it completes.

6. **P1 — Mindmap: either implement mastery coloring/legend or remove mastery language**

- Evidence:
  - Spec §5.2.5 claims mastery-coded nodes.
  - Screenshot `screenshots/iter121/planner-run/app-mindmap.png` looks like a basic graph without mastery legend.
- Acceptance:
  - UI must either (a) show mastery state (legend + colors + persisted mastery fields) or (b) be relabeled as “concept map” without mastery claims.

7. **P1 — Collaboration matches: don’t imply ML matching if it’s heuristic**

- Evidence: route comment: `apps/api/src/routes/collaboration.ts` (“MVP: … no ML matching yet”). Screenshot: `screenshots/iter121/planner-run/app-collaboration.png`.
- Do:
  - Ensure UI copy explicitly says “heuristic matches” or remove ranking/scoring UI.
- Acceptance:
  - No “smart matching” claims unless there’s real signal beyond tags.

8. **P1 — Marketplace publishing: enforce “publish ≠ paid marketplace launch” clarity**

- Evidence: API note: `apps/api/src/routes/pipeline.ts` `POST /api/v1/pipeline/:id/publish` says “does NOT publish to Marketplace”. Screenshot: `screenshots/iter121/planner-run/app-pipelines.png`, `pipeline-detail.png`.
- Acceptance:
  - Any “Publish” UI/CTA clearly states what it does and does not do in MVP.

### P2 — Engineering hygiene / operability / parity guards

9. **P2 — Fix screenshot NOTES template bug (wrong iteration value)**

- Evidence: `screenshots/iter121/planner-run/NOTES.md` originally had “Iteration: 102”; corrected manually in this run.
- Do:
  - Update screenshot harness template so it uses the passed `--outDir` or extracts the iteration folder name.
- Acceptance:
  - New screenshot runs always write correct Iter value.

10. **P2 — Add a single, reliable “start stack” command that can coexist with running services**

- Evidence: `npm run dev` fails fast on port conflicts (reported by `scripts/check-ports.mjs`). Ports were already in use: API pid 451621 (3000/3002), Vite pid 440374 (3001), Next pid 440434 (3003).
- Do:
  - Provide `npm run dev:attach` that skips port checks and prints detected running URLs, OR auto-picks free ports for the harness.
- Acceptance:
  - Planner/builder can reliably run screenshots without manual process management.

11. **P2 — OpenAPI/spec drift guard: ensure all routers mounted in `apps/api/src/app.ts` are represented in `apps/api/openapi.yaml`**

- Evidence: router mounts in `apps/api/src/app.ts`; OpenAPI exists but can drift.
- Acceptance:
  - Tests fail if a mounted `/api/v1/*` router lacks OpenAPI entries (or an explicit "MVP: undocumented" allowlist).

12. **P2 — Spec honesty pass: add “PLANNED / NOT IN MVP” callouts to sections that still read as shipped**

- Evidence: spec platform matrix §5.1 and marketplace/billing sections vs current “web-first MVP + mock billing” in `apps/client/src/screens/marketing/Download.tsx` and `apps/api/src/routes/subscription.ts`.
- Acceptance:
  - Spec cannot be read as a promise of shipped native apps / real Stripe / agent SDK unless clearly labeled as future.

---

## OneDrive sync (required)

After this planner run, sync was executed with a non-destructive mirror command:

```bash
rsync -av --progress /home/aifactory/.openclaw/workspace/learnflow/ /home/aifactory/onedrive-learnflow/learnflow/learnflow/
```

(If rsync is not available in a future environment, use `cp -R` but do NOT delete history.)
