# LearnFlow — Improvement Queue (Iter133)

Owner: Builder  
Planner: Ash (planner subagent)  
Last updated: 2026-03-28

Status: **DONE**

---

## Evidence captured (Iter133 planner run)

Screenshots + notes captured into:

- Desktop: `learnflow/screenshots/iter133/planner-run/desktop/`
- Mobile: `learnflow/screenshots/iter133/planner-run/mobile/`
- Notes: `learnflow/screenshots/iter133/planner-run/NOTES.md`

Representative screenshots to reference in PRs:

- `learnflow/screenshots/iter133/planner-run/desktop/landing-home.png`
- `learnflow/screenshots/iter133/planner-run/desktop/onboarding-4-api-keys.png`
- `learnflow/screenshots/iter133/planner-run/desktop/app-dashboard.png`
- `learnflow/screenshots/iter133/planner-run/desktop/course-create-after-click.png`
- `learnflow/screenshots/iter133/planner-run/desktop/app-conversation.png`
- `learnflow/screenshots/iter133/planner-run/desktop/app-mindmap.png`
- `learnflow/screenshots/iter133/planner-run/desktop/marketplace-courses.png`
- `learnflow/screenshots/iter133/planner-run/desktop/marketplace-agents.png`
- `learnflow/screenshots/iter133/planner-run/desktop/app-collaboration.png`
- `learnflow/screenshots/iter133/planner-run/desktop/settings-about-mvp-truth.png`

Dev runtime ports (repo convention; verified during run):

- API: http://localhost:3000 (`GET /health`)
- Client (app): http://localhost:3001
- Web/marketing (Next): http://localhost:3003

---

## Brutally honest spec ↔ implementation parity (Iter133)

### What’s real (shipped MVP capabilities)

- **Web-first MVP** with onboarding screens that match spec §5.2.1 (welcome → goals → topics → API keys → subscription choice → first course).
  - Evidence (UI): `learnflow/screenshots/iter133/planner-run/desktop/onboarding-*.png`

- **WebSocket streaming contract exists** and is documented.
  - Evidence (code): `apps/api/src/websocket.ts`
  - Evidence (docs): `apps/docs/pages/websocket-events.md`

- **Mindmap suggestions + update events exist** (but are heuristic / best-effort).
  - Evidence (code): `apps/api/src/routes/mindmap.ts` (heuristic suggestions) and `apps/api/src/websocket.ts` (`mindmap.subscribe` → `mindmap.update`)
  - Evidence (UI): `learnflow/screenshots/iter133/planner-run/desktop/app-mindmap.png`

- **Collaboration exists, but is explicitly synthetic** (matches are derived from profile topics; group chat is basic CRUD).
  - Evidence (code): `apps/api/src/routes/collaboration.ts` (`source: 'synthetic'`)
  - Evidence (UI): `learnflow/screenshots/iter133/planner-run/desktop/app-collaboration.png`

- **Subscription/billing is MOCK** and capabilities are returned by server.
  - Evidence (code): `apps/api/src/routes/subscription.ts` returns `billingMode: 'mock'` and `capabilities`
  - Evidence (UI): `learnflow/screenshots/iter133/planner-run/desktop/onboarding-5-subscription.png`

- **Marketplace endpoints exist**, but checkout is MOCK and marketplace “agents” are not third‑party code execution.
  - Evidence (code): `apps/api/src/routes/marketplace-full.ts` `/checkout` → `{ billingMode: 'mock' }`
  - Evidence (UI truth): `apps/client/src/screens/AboutMvpTruth.tsx`

### Biggest parity / trust gaps (where spec implies more than shipped)

1. **Marketing website spec §12 is “implemented twice” but neither path is cleanly canonical.**
   - The repo has a Next.js marketing app (`apps/web`, :3003) _and_ a full marketing screen set in the client (`apps/client/src/screens/marketing/*`).
   - The client router explicitly says marketing is canonical in `apps/web`, but the client still **renders** a marketing HomePage at `/` and screenshot harness captures `/features`, `/pricing`, `/download`, `/blog`, `/about`, `/docs` from the client base URL.
   - Evidence (code): `apps/client/src/App.tsx` comment says marketing is served by `apps/web`, but `PUBLIC_PAGES` in `screenshot-all.mjs` uses `BASE` (default :3001) and includes marketing routes.
   - Evidence (harness): `screenshot-all.mjs` `PUBLIC_PAGES` includes `/features` etc.

2. **Spec §4.4 promises BYOAI usage tracking dashboards; MVP has BYOAI storage/validation but not real per-agent usage reporting.**
   - Evidence (spec): LearnFlow_Product_Spec.md lines ~169–179.
   - Evidence (code reality): key routes exist (`apps/api/src/routes/keys.ts`, `apps/api/src/keys.ts`), but there’s no clear token usage accounting surfaced in UI.

3. **Spec §5.2.3 promises quick-action chips + agent activity indicators + source drawer; MVP has parts, but not consistently or not wired to real sources.**
   - Evidence (spec): LearnFlow_Product_Spec.md lines ~224–237.
   - Evidence (code): `apps/client/src/components/SourceDrawer.tsx` exists, but source objects depend on orchestrator returning them.

---

## Iter133 — Evidence-first tasks (10–15)

Each task includes: priority, evidence, acceptance criteria. **Prefer removing misleading UX/copy** over shipping half-features.

### P0 — Canonical surfaces, trust, and broken nav

1. **P0 — Fix marketing split-brain by making ONE canonical marketing surface + fixing client routes accordingly.**
   - Evidence:
     - `apps/web/*` exists (Next marketing on :3003).
     - `apps/client/src/screens/marketing/*` exists (duplicate marketing UI).
     - `apps/client/src/App.tsx` says marketing should be served by `apps/web` but still mounts `HomePage` at `/`.
     - Screenshot harness captures marketing pages against :3001: `screenshot-all.mjs` `PUBLIC_PAGES` includes `/features`, `/pricing`, `/docs`, etc.
   - Acceptance:
     - Choose one canonical approach:
       - **Option A:** client app hosts all marketing routes → add `<Route path="/features" ...>` etc, and remove/disable `apps/web` (or make :3003 redirect).
       - **Option B (recommended):** `apps/web` is canonical → client app should NOT have marketing screens except a minimal “Go to app” landing; `/features` etc must not be referenced by client marketing nav.
     - Screenshot harness updated so marketing screenshots are taken from the canonical base URL (likely :3003), not :3001.

2. **P0 — Fix broken marketing navigation in the client (currently links to routes the router does not define).**
   - Evidence:
     - Client marketing navbar links: `apps/client/src/screens/marketing/MarketingLayout.tsx` NAV_LINKS `/features`, `/pricing`, `/download`, `/blog`, `/about`, `/docs`.
     - Client router has no routes for these (only `/` mounts marketing HomePage): `apps/client/src/App.tsx`.
     - Evidence (UI): `learnflow/screenshots/iter133/planner-run/desktop/marketing-*.png` exist but may represent NotFound or inconsistent routing.
   - Acceptance:
     - If client marketing stays: implement the routes.
     - If marketing moves to `apps/web`: remove NAV_LINKS usage from client and ensure `/` routes into app login/register or redirects to :3003.

3. **P0 — Ensure all purchase/subscription CTAs are explicit “MOCK billing” and cannot be interpreted as real money movement.**
   - Evidence:
     - API: `apps/api/src/routes/subscription.ts` returns `billingMode: 'mock'`.
     - Marketplace checkout confirm is mock: `apps/api/src/routes/marketplace-full.ts`.
     - UI exists: `learnflow/screenshots/iter133/planner-run/desktop/onboarding-5-subscription.png`, `marketplace-courses.png`.
   - Acceptance:
     - Every “Upgrade/Subscribe/Checkout/Buy” screen includes a visible “Mock billing” badge.
     - No UI states say “paid”, “charged”, “receipt”, “invoice” unless explicitly labeled mock.

4. **P0 — Make collaboration honesty unavoidable (synthetic matches must be labeled in UI).**
   - Evidence:
     - API returns `source: 'synthetic'`: `apps/api/src/routes/collaboration.ts`.
     - UI exists: `learnflow/screenshots/iter133/planner-run/desktop/app-collaboration.png`.
   - Acceptance:
     - Collaboration screen shows an explicit label like “Suggestions are synthetic (derived from your topics)” when `source === 'synthetic'`.
     - If/when real matching is added, the label changes automatically based on `source`.

### P1 — Spec parity that improves product reliability (not just more screens)

5. **P1 — Add progress.update WS event end-to-end validation + client handling audit.**
   - Evidence:
     - Spec §11.2 lists `progress.update`.
     - Server mentions `progress.update` in `apps/api/src/websocket.ts` comment; course completion routes exist in `apps/api/src/routes/courses.ts`.
   - Acceptance:
     - A minimal Playwright test (or WS unit test) sends a completion event and asserts the client updates dashboard progress.
     - If client does not support it, either implement support or remove spec-claiming UI.

6. **P1 — BYOAI: add minimal “usage transparency” panel (even if coarse) or remove the spec promise from in-app copy/docs.**
   - Evidence:
     - Spec §4.4 promises per-agent token counts.
     - Current app does key entry (`onboarding-4-api-keys.png`) but no visible usage stats.
   - Acceptance:
     - Either:
       - Implement coarse usage stats (requests count per agent/provider per day) and show in Settings/Profile, OR
       - Update docs + marketing copy to remove “usage dashboards” language.

7. **P1 — Source citations: enforce “best-effort citations” contract and show a UI state when sources are empty.**
   - Evidence:
     - Spec requires citations; marketing claims citations.
     - UI component exists: `apps/client/src/components/SourceDrawer.tsx`.
     - WebSocket response schema allows sources: `apps/docs/pages/websocket-events.md`.
   - Acceptance:
     - For any lesson/chat response, if `sources.length===0`, the UI shows a truthful badge: “No sources available (provider not configured or no results)”.
     - If sources exist, they are clickable and render in SourceDrawer.

8. **P1 — Marketplace: remove “real analytics” implication; ratings/enrollment numbers must be labeled placeholders unless backed by DB events.**
   - Evidence:
     - Marketplace list includes rating/enrollmentCount fields in `apps/api/src/routes/marketplace.ts` (and DB-backed listing can return defaults).
     - UI exists: `learnflow/screenshots/iter133/planner-run/desktop/marketplace-courses.png`.
   - Acceptance:
     - UI labels metrics as “demo” unless there is a review/enrollment event table and it’s computed.
     - If metrics are demo-only, show `isDemo` badge.

9. **P1 — Course create pipeline: show server error details clearly (no dead-end “nothing happened”).**
   - Evidence:
     - Recent commits indicate create-course pipeline issues were fixed: `c36c8b4`, `292f2ae`.
     - Evidence (UI): `course-create-after-click.png` exists; failures should be visible.
   - Acceptance:
     - If course creation fails, dashboard shows actionable error and a “View pipeline” link to `PipelineDetail` (`/pipeline/:pipelineId`).

### P2 — Cleanup + tests to prevent regression

10. **P2 — Screenshot harness must capture marketing from the correct app (and fail loudly on NotFound).**

- Evidence:
  - Harness currently screenshots marketing routes from :3001: `screenshot-all.mjs` `PUBLIC_PAGES`.
- Acceptance:
  - Add a simple “not-found detector” in harness (e.g., check for `[data-screen="not-found"]`) and fail.
  - Split runs: `--baseClient` and `--baseWeb` or equivalent.

11. **P2 — Update LearnFlow_Product_Spec.md “MVP architecture” section to explicitly call out current marketing routing decision.**

- Evidence:
  - Spec §12 defines a marketing website; repo currently has two competing implementations.
- Acceptance:
  - Spec includes one paragraph describing what is canonical in THIS repo and what is planned.

12. **P2 — Add a truth-first UI lint list for marketing claims (ban unbacked “ratings”, “App Store available”, “managed keys” etc).**

- Evidence:
  - Existing honesty tests exist for structured data: `apps/client/src/__tests__/marketing-structured-data.test.ts`.
- Acceptance:
  - Extend to scan rendered HTML for banned phrases/JSON-LD fields across both marketing surfaces.

---

## Recent shipped commits (git log -10)

c36c8b4 Surface create-course pipeline errors instead of dead list
292f2ae Fix Create Course button: pipeline hook uses apiPost/apiGet
8521846 Filter courses list to user-owned courses
d41006c Iter129: mark improvement queue done
0280d5a Iter129: standardize API calls + marketplace parity + dashboard today
3378903 Iter128: mark improvement queue done + refresh shipped commits
d78ba55 Iter128: update build log for tasks 08-12
86337a4 Iter128: add MVP truth regression test
33f1854 Iter128: show toasts for key client-side error catches
ee06955 Iter128: document screenshot harness canonical command

---

## OneDrive sync (required)

After updating this queue + adding Iter133 screenshots/notes, run a non-destructive mirror sync:

```bash
rsync -av --progress \
  --exclude node_modules --exclude .git --exclude dist --exclude .turbo --exclude .next \
  /home/aifactory/.openclaw/workspace/learnflow/ \
  /home/aifactory/onedrive-learnflow/learnflow/learnflow/
```
