# LearnFlow — Improvement Queue (Iter128)

Owner: Builder  
Planner: Ash (planner subagent)  
Last updated: 2026-03-28

Status: **IN PROGRESS**

## Recent shipped commits (git log -10 --oneline)

- e88d891 Iter123: update recent shipped commits
- 6080caa Iter123: add dev:status helper
- fe92930 Iter123: update improvement queue recent commits + parity notes
- a972bff Iter123: persisted bookmarks + context slices + harness fixes
- ff42a6c Iter121: mark improvement queue done
- aaa5a89 Iter121: log note about build log tracking
- 7d3ac34 Iter121: update build log
- b7fd370 Iter121 Task9: clarify pipeline publish is not marketplace publish
- f3128a1 Iter121 Task11: spec MVP truth (web-first, billing mock, native planned)
- a59a3cb Iter121 Task10: add dev:attach to bypass port checks

**Brutal note:** There are still **no commits labeled Iter124–Iter128**. If work happened but wasn’t committed, it’s not shipped.

---

## Evidence captured (Iter128 planner run)

Screenshots + notes captured into:

- Desktop: `learnflow/screenshots/iter128/planner-run/desktop/`
- Mobile: `learnflow/screenshots/iter128/planner-run/mobile/`
- Notes: `learnflow/screenshots/iter128/planner-run/NOTES.md`

Representative desktop screenshots:

- `learnflow/screenshots/iter128/planner-run/desktop/app-dashboard.png`
- `learnflow/screenshots/iter128/planner-run/desktop/app-conversation.png`
- `learnflow/screenshots/iter128/planner-run/desktop/app-mindmap.png`
- `learnflow/screenshots/iter128/planner-run/desktop/app-collaboration.png`
- `learnflow/screenshots/iter128/planner-run/desktop/marketplace-agents.png`
- `learnflow/screenshots/iter128/planner-run/desktop/marketplace-courses.png`
- `learnflow/screenshots/iter128/planner-run/desktop/app-pipelines.png`
- `learnflow/screenshots/iter128/planner-run/desktop/pipeline-detail.png`
- `learnflow/screenshots/iter128/planner-run/desktop/app-settings.png`
- `learnflow/screenshots/iter128/planner-run/desktop/settings-about-mvp-truth.png`

Dev runtime ports (expected): see `DEV_PORTS.md`.

**Mismatch to fix:** `scripts/dev-status.mjs` currently reports swapped labels (web :3000, api :3003), contradicting `DEV_PORTS.md` (API :3000, client :3001, web :3003). Evidence: `node scripts/dev-status.mjs` + `DEV_PORTS.md`.

---

## Brutally honest spec ↔ implementation parity (Iter128 spot-check)

I re-read the spec end-to-end and re-inspected current implementation.

### A) Spec is intentionally “future-state”; MVP truth is mostly present, but not consistently enforced

- The spec describes gRPC mesh, K8s agents, Postgres/vector DB, etc. (§3.1–§3.2). The spec _does_ include an explicit MVP architecture subsection (§3.2.0) that matches this repo (Express + SQLite + Yjs + external cron for Update Agent).
- The risk is not the spec file itself, but **UI + marketing** implying production-grade features when the backend is MVP.
  - Positive: “About this MVP” / “MVP truth” exists in-app.
    - Evidence: `apps/client/src/screens/AboutMvpTruth.tsx`, screenshot `.../desktop/settings-about-mvp-truth.png`.

### B) BYOAI key management is closer to spec than most areas, but has a build-time footgun

- Keys are stored server-side (SQLite) with encryption plumbing.
  - Evidence: `apps/api/src/routes/keys.ts`, `apps/api/src/keys.ts`.
- Client has **`process.env.*` usage** in `apps/client/src/context/AppContext.tsx` for Playwright/Vite base URLs.
  - Risk: Vite uses `import.meta.env`, not Node `process.env`, in browser builds. If this isn’t polyfilled, it’s a runtime crash risk.
  - Evidence: `apps/client/src/context/AppContext.tsx` lines ~463–472.

### C) Subscription/billing is explicitly mock (good), but ensure all entrypoints use API base consistently

- Billing is mock-mode and disclosed.
  - Evidence: `apps/api/src/routes/subscription.ts` (billingMode: 'mock'), `apps/client/src/screens/ProfileSettings.tsx` (UI disclosure).
- Some client fetches appear to be relative `/api/v1/...` rather than `apiPost/apiGet` (which applies auth + base URL).
  - Evidence: `apps/client/src/screens/PipelineDetail.tsx` uses `fetch('/api/v1/pipeline/.../restart')`.
  - Risk: breaks when API is not same-origin (dev ports are different) unless proxy is configured.

### D) “Update Agent” is real (RSS/Atom only), but Pro gating + scheduling story is still external

- API is implemented with locking + backoff + runs table.
  - Evidence: `apps/api/src/routes/update-agent.ts`, `apps/api/src/utils/updateAgent/runTopic.ts`.
- UI clearly discloses MVP limitations (RSS only, external cron).
  - Evidence: `apps/client/src/components/update-agent/UpdateAgentSettingsPanel.tsx`.

---

## Iter128 — Evidence-first tasks (10–15)

Each task includes priority, evidence, and acceptance criteria.

### P0 (trust + correctness)

1. **P0 — Fix dev port/status confusion (dev-status labels swapped).**
   - Evidence: `scripts/dev-status.mjs` output contradicts `DEV_PORTS.md`.
   - Do:
     - Make `dev:status` print the same mapping as `DEV_PORTS.md`, or update `DEV_PORTS.md` if the ports truly changed.
   - Acceptance:
     - `node scripts/dev-status.mjs` output matches `DEV_PORTS.md` exactly (API=3000, Client=3001, Web=3003) OR both are updated consistently.

2. **P0 — Remove `process.env` usage from browser code (Vite compatibility), replace with `import.meta.env` and a safe Playwright override.**
   - Evidence: `apps/client/src/context/AppContext.tsx` references `process.env.PLAYWRIGHT_BASE_URL` and `process.env.VITE_API_BASE_URL`.
   - Do:
     - Use `import.meta.env` for Vite.
     - For Playwright, pass base URL via `window.__PLAYWRIGHT_BASE_URL__` or `import.meta.env.VITE_PLAYWRIGHT_BASE_URL` set by harness.
   - Acceptance:
     - `npm run dev` client loads in a normal browser with **no “process is not defined”** risk.
     - Screenshot harness still works without patching global `process`.

3. **P0 — Standardize client API calls: no raw `fetch('/api/v1/...')` from the client app.**
   - Evidence: `apps/client/src/screens/PipelineDetail.tsx` uses raw `fetch` to `/api/v1/pipeline/.../restart`.
   - Do:
     - Replace with `apiPost('/pipeline/.../restart', ...)` or equivalent helper so auth headers + apiBase routing are consistent.
   - Acceptance:
     - Pipeline restart works when client and API are on different origins/ports (dev default).

4. **P0 — Ensure all “mock” / “synthetic” systems are disclosed at the point of use (not only in Settings/About).**
   - Evidence: “MVP truth” exists (`.../settings-about-mvp-truth.png`), but users can interact with marketplace/collaboration/pipelines without seeing it.
   - Do:
     - Add small inline, screen-local disclosures where relevant:
       - Marketplace paid checkout = mock
       - Collaboration matches may be synthetic/preview
       - Pipelines are not marketplace publishing
   - Acceptance:
     - In screenshots:
       - `.../desktop/marketplace-courses.png` visibly states billing/checkout is mock.
       - `.../desktop/app-collaboration.png` visibly states preview/synthetic where applicable.
       - `.../desktop/app-pipelines.png` clearly states what “publish” means.

### P1 (feature parity + UX reliability)

5. **P1 — Contract test: WebSocket event schema + client rendering (agent.spawned/complete/response.\*).**
   - Evidence: Spec §11.2; server emits these events (see `apps/api/src/wsOrchestrator.ts`), client consumes in Conversation screen.
   - Do:
     - Add a small WS contract test (server) + snapshot/unit test (client) that fails if payload keys change.
   - Acceptance:
     - Tests fail on breaking WS schema changes.

6. **P1 — Marketplace course publish/list/detail consistency; eliminate “looks published but isn’t”.**
   - Evidence: marketplace UI exists (`.../desktop/marketplace-courses.png`); API in `apps/api/src/routes/marketplace-full.ts`.
   - Do:
     - Add an end-to-end happy-path test (or Playwright script) covering: publish → list → detail → enroll.
   - Acceptance:
     - Newly published course appears in list immediately and detail page loads without manual refresh/restart.

7. **P1 — Mindmap persistence: explicit save/sync status + “what persists” copy in the explorer.**
   - Evidence: composite mindmap truth in spec §5.2.5; API snapshot in `apps/api/src/routes/mindmap.ts`; screenshot `.../desktop/app-mindmap.png`.
   - Do:
     - Add a status line: “Saved/Unsaved changes” and a short bullet list of what is derived vs stored.
   - Acceptance:
     - Users can predict what will be there after refresh/new device.

8. **P1 — Analytics dashboard honesty: ensure metrics are real or labeled demo/best-effort.**
   - Evidence: settings says “Usage is shown below (best-effort)” (`apps/client/src/screens/ProfileSettings.tsx`), server: `apps/api/src/routes/usage.ts` + `apps/api/src/routes/analytics.ts`.
   - Do:
     - Add “best-effort / demo” labels wherever synthetic or incomplete.
   - Acceptance:
     - No KPI is shown without a provenance label (real vs synthetic vs best-effort).

### P2 (engineering hygiene)

9. **P2 — Add a repo-local `./rg` wrapper npm script and update docs to avoid missing system `rg`.**
   - Evidence: system `rg` not installed; repo includes `@vscode/ripgrep`.
   - Do:
     - Add `"rg": "node node_modules/@vscode/ripgrep/bin/rg"` (or similar) to root scripts.
     - Update any docs to use `npm run rg -- <args>`.
   - Acceptance:
     - Searching works on fresh machines without installing ripgrep.

10. **P2 — Screenshot harness documentation: one canonical command + dev prerequisites.**
    - Evidence: `scripts/screenshots.mjs` exists; Iter128 screenshots captured successfully; notes in `learnflow/screenshots/iter128/planner-run/NOTES.md`.
    - Do:
      - Add a short section in a README (or `DEV_PORTS.md`) documenting the exact screenshot command used.
    - Acceptance:
      - A new contributor can reproduce Iter128 screenshots in <5 minutes.

11. **P2 — Reduce silent catches in client for key workflows; replace with toasts.**
    - Evidence: many `.catch(() => {})` patterns; e.g., Update Agent panel refresh and other screens.
    - Do:
      - For Marketplace enroll, API key save/validate, Update Agent tick: show actionable toast.
    - Acceptance:
      - User gets an error toast with next step on any failed mutation.

12. **P2 — Add a small “MVP truth regression” test suite.**
    - Evidence: critical truth copy exists (billing mock, marketplace agent non-execution, synthetic collaboration), but easy to regress.
    - Do:
      - Add smoke tests that assert the presence of:
        - billingMode mock disclosure (pricing/settings)
        - agent marketplace disclosure
        - collaboration preview/synthetic disclosure
    - Acceptance:
      - CI fails if truth labels disappear.

---

## OneDrive sync (required)

After updating this queue + adding Iter128 screenshots/notes, run a non-destructive mirror sync:

```bash
rsync -av --progress \
  --exclude node_modules --exclude .git --exclude dist --exclude .turbo --exclude .next \
  /home/aifactory/.openclaw/workspace/learnflow/ \
  /home/aifactory/onedrive-learnflow/learnflow/learnflow/
```
