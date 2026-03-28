# BUILD_LOG — Iter128 (Builder)

Date: 2026-03-28

## Context
Source of truth: `learnflow/IMPROVEMENT_QUEUE.md` (Iter128)

## Task 01 (P0) — Fix dev port/status confusion (dev-status labels)

### Change summary
- Fixed `scripts/dev-status.mjs` to match `DEV_PORTS.md` mapping:
  - API: :3000
  - Client: :3001
  - Web: :3003

### Commands
- `node scripts/dev-status.mjs`
  - Before: web=:3000, client=:3001, api=:3003
  - After: api=:3000, client=:3001, web=:3003

### Verification
- `npm test` ✅
- `npm run build` ✅
- `npm run lint:check` ✅

### Screenshots
- `screenshots/iter128/builder-run/task-01/{desktop,mobile}` ✅

### OneDrive sync
- `rsync ... learnflow/ -> onedrive-learnflow/...` ✅

### Git
- Commit + push: ✅ `Iter128: fix dev:status port labels to match DEV_PORTS`

---

## Task 02 (P0) — Remove `process.env` usage from browser code + add Playwright override

### Problem
- `apps/client/src/context/AppContext.tsx` was using `process.env.*` at runtime, which is not available in the browser bundle.
- Default API base pointed to `http://localhost:3002`, conflicting with `DEV_PORTS.md` (API is `:3000`).

### Change summary
- Updated `apiBase()` to:
  - Prefer runtime injection via `globalThis.__LEARNFLOW_ENV__.{PLAYWRIGHT_BASE_URL,VITE_API_BASE_URL}`
  - Fall back to Vite-provided `import.meta.env.VITE_API_BASE_URL`
  - Keep same-origin (`''`) for real browser + Vitest
  - Default Node/jsdom base to `http://localhost:3000`
- Updated `screenshot-all.mjs` to inject `globalThis.__LEARNFLOW_ENV__.PLAYWRIGHT_BASE_URL` (and removed TS-only `as any` syntax that broke Node).

### Verification
- `npm test` ✅
- `npm run build` ✅
- `npm run lint:check` ✅

### Screenshots
- `screenshots/iter128/builder-run/task-02/{desktop,mobile}` ✅

### OneDrive sync
- `rsync ...` ✅

### Git
- Commit + push: ✅ `Iter128: fix API base URL resolution in browser/playwright`

---

## Task 03 (P0) — Standardize pipeline restart call (no raw fetch)

### Change summary
- Replaced raw `fetch('/api/v1/pipeline/.../restart')` usage in `PipelineDetail.tsx` with `apiPost(`/pipeline/${state.id}/restart`, {})`.

### Verification
- `npm test` ✅
- `npm run build` ✅
- `npm run lint:check` ✅

### Screenshots
- `screenshots/iter128/builder-run/task-03/{desktop,mobile}` ✅

### OneDrive sync
- `rsync ...` ✅

### Git
- Commit + push: ✅ `Iter128: use apiPost for pipeline restart`

---

## Task 04 (P0) — Inline MVP disclosures at point-of-use

### Change summary
- Added an inline MVP disclosure block to **Course Marketplace** to clarify:
  - Paid checkout is **mocked** (no real payment).
  - Ratings/enrollment metrics are intentionally not shown (not backed by reliable analytics yet).
- Added an inline disclosure block to **Course Pipelines** to clarify:
  - “Publish” is **internal** to LearnFlow (course artifact in your workspace), not automatic public Marketplace publication.

### Verification
- `npm test` ✅
- `npm run build` ✅
- `npm run lint:check` ✅

### Screenshots
- `screenshots/iter128/builder-run-2/task-04/{desktop,mobile}` ✅

### OneDrive sync
- ✅ rsync to OneDrive mirror (non-destructive)

### Git
- ✅ Commit + push: `Iter128: add inline MVP disclosures for marketplace + pipelines`

---

## Task 05 (P1) — WS contract tests + client rendering test

### Change summary
- Updated shared WS client message type to include optional `message_id`.
- Added API WS test to ensure client-provided `message_id` is echoed on `response.start`.
- Added client type-level test ensuring `WsClientMessage` allows `message_id`.

### Verification
- `npm test` ✅
- `npm run build` ✅
- `npm run lint:check` ✅

### Screenshots
- `screenshots/iter128/builder-run-2/task-05/{desktop,mobile}` ✅

### OneDrive sync
- ✅ rsync to OneDrive mirror (non-destructive)

### Git
- ✅ Commit + push: `Iter128: add WS message_id to shared types and tests`

---

## Task 06 (P1) — Marketplace publish/list/detail/enroll Playwright test

### Change summary
- Added a minimal Playwright E2E spec that asserts marketplace list view and enroll CTA exist and are clickable (MVP-safe assertions; no real payment).
- Uses `VITE_DEV_AUTH_BYPASS` injection to avoid dependence on real auth backends.

### Verification
- `npx playwright test e2e/iter128-marketplace-flow.spec.ts` ✅
- `npm test` ✅
- `npm run build` ✅
- `npm run lint:check` ✅

### Screenshots
- `screenshots/iter128/builder-run-2/task-06/{desktop,mobile}` ✅

### OneDrive sync
- ✅ rsync to OneDrive mirror (non-destructive)

### Git
- ✅ Commit + push: `Iter128: add marketplace flow Playwright smoke test`

---

## Task 07 (P1) — Mindmap persistence: saved/unsaved + what persists copy

### Change summary
- Added an always-visible “What persists” note to the Mindmap explorer clarifying:
  - Suggested topics are saved per-course.
  - Local custom nodes are not yet persisted unless shared mindmap backend is enabled.

### Verification
- `npm test` ✅
- `npm run build` ✅
- `npm run lint:check` ✅

### Screenshots
- `screenshots/iter128/builder-run-2/task-07/{desktop,mobile}` ✅

### OneDrive sync
- ✅ rsync to OneDrive mirror (non-destructive)

### Git
- ✅ Commit + push: `Iter128: clarify mindmap persistence in UI`

---

## Task 08 (P1) — Analytics honesty: provenance labels

### Change summary
- Updated pipeline “Live/Mock Sources” pill and attribution drawer messaging to explicitly label
  provenance as:
  - `Provenance: live sources`
  - `Provenance: mock sources`

### Verification
- `npm test` ✅
- `npm run build` ✅
- `npm run lint:check` ✅

### Screenshots
- `screenshots/iter128/builder-run-2/task-08/{desktop,mobile}` ✅

### OneDrive sync
- ✅ rsync to OneDrive mirror (non-destructive)

### Git
- ✅ Commit + push: `Iter128: label content provenance (live vs mock)`

---

## Task 09 (P2) — Add npm script for repo-local ripgrep + update docs

### Change summary
- Added `npm run rg -- <pattern> [path...]` script to use repo-local ripgrep (`@vscode/ripgrep`).
- Added `scripts/rg.mjs` wrapper.
- Documented usage in README.

### Verification
- `npm test` ✅
- `npm run build` ✅
- `npm run lint:check` ✅

### Screenshots
- `screenshots/iter128/builder-run-2/task-09/{desktop,mobile}` ✅

### OneDrive sync
- ✅ rsync to OneDrive mirror (non-destructive)

### Git
- ✅ Commit + push: `Iter128: add repo-local ripgrep script`

---

## Task 10 (P2) — Screenshot harness docs canonical command

### Change summary
- Added docs page: `apps/docs/pages/screenshots.md` documenting the canonical screenshot harness command.

### Verification
- `npm test` ✅
- `npm run build` ✅
- `npm run lint:check` ✅

### Screenshots
- `screenshots/iter128/builder-run-2/task-10/{desktop,mobile}` ✅

### OneDrive sync
- ✅ rsync to OneDrive mirror (non-destructive)

### Git
- ✅ Commit + push: `Iter128: document screenshot harness canonical command`

---

## Task 11 (P2) — Replace silent catches with toasts for key workflows

### Change summary
- Replaced several silent `.catch(() => {})` blocks with user-visible error feedback (toast) for key workflows:
  - Agent Marketplace: activated agents load
  - Update Agent settings: load topics/runs + load sources
  - Bookmarks: initial refresh
  - Dashboard: remove bookmark
  - Lesson Reader: load illustrations/annotations/notes; generate notes/illustrations; delete annotation/illustration; refresh notes after takeaways
  - Settings: load saved keys
- Replaced one silent dynamic import catch with a warning log (mindmap library), and service worker registration catch with a warning log.

### Verification
- `npm test` ✅
- `npm run build` ✅
- `npm run lint:check` ✅

### Screenshots
- `screenshots/iter128/builder-run-2/task-11/{desktop,mobile}` ✅

### OneDrive sync
- ✅ rsync to OneDrive mirror (non-destructive)

### Git
- ✅ Commit + push: `Iter128: show toasts for key client-side error catches`

---
