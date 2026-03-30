# BUILD LOG — Iter135 (continuation)

Date: 2026-03-29

## Summary
- Fixed **Today’s Lessons** endpoint to be consistent with persisted progress (never recommends completed lessons).
- Added deterministic API test for daily lessons recommendation.
- Tightened one piece of Dashboard copy to be more MVP-truthful (course creation).

---

## Changes

### 1) P1 Task 5 — Today’s Lessons queue respects real progress

**Problem**
- `GET /api/v1/daily` was driven only from an in-memory `courses` map and also included a “review” path that could recommend lessons the user just completed.

**Fix**
- `GET /api/v1/daily` now prefers SQLite course list (`dbCourses.getAll()`) and only recommends **next uncompleted lessons** (no completed-lesson “review” recommendations).

**Files**
- `apps/api/src/routes/daily.ts`

**Test**
- Added: `apps/api/src/__tests__/daily-lessons.test.ts`

Command:
```bash
cd apps/api
npm test -- --run src/__tests__/daily-lessons.test.ts
```
Result: PASS

### 2) P1 Task 8 — Content pipeline truth pass (finish)

**Goal**: remove/qualify any over-strong claims (Firecrawl, Google/Bing, Semantic Scholar, SimHash/MinHash, “no hallucinations”, “quality guarantees”, etc.). Add links to **About MVP Truth** from pipeline UI.

**What changed**
- Marketing & docs copy updated to “best-effort” language for sourcing/citations.
- Mindmap copy tightened: it’s a **course map** (course/module/lesson + progress), not a full concept knowledge graph.
- Added **Docs → MVP truth** page and linked from:
  - Pipeline Detail screen (MVP note box)
  - Settings → About MVP Truth screen
  - Marketing footer
- Updated embedded blog content (`apps/client/src/data/blogPosts.ts`) to remove “knowledge graph / quality guarantees / real web” assertions.

**Files (high-signal)**
- `apps/client/src/data/blogPosts.ts`
- `apps/client/src/screens/PipelineDetail.tsx`
- `apps/client/src/screens/AboutMvpTruth.tsx`
- `apps/client/src/screens/marketing/{Home,Features,Docs,About,MarketingLayout}.tsx`
- `apps/docs/pages/{getting-started,user-guide,course-creator-guide,architecture,blog/launch-post,mvp-truth}.md`
- `apps/web/src/app/blog/page.tsx`

**Screenshots**
Generated via harness:
```bash
npm run screenshots
```
Output:
- `learnflow/screenshots/iterunknown/run-001/desktop/pipeline-detail.png` (shows MVP truth link)
- `learnflow/screenshots/iterunknown/run-001/desktop/app-settings.png`
- `learnflow/screenshots/iterunknown/run-001/desktop/marketing-home.png`

### 3) P1 Task 7 — Usage transparency

- Added clearer “best-effort” labeling to usage section on Profile Settings.
- Added deterministic API test for `/api/v1/usage/dashboard`.

Files:
- `apps/client/src/screens/ProfileSettings.tsx`
- `apps/api/src/__tests__/usage-dashboard.test.ts`

---

## Validation

Repo checks:
```bash
npm run lint
npm test
npm run build
npm run screenshots
```
Result: PASS (repo has no `typecheck` script; TypeScript is verified in per-package builds and tests).

---

## Notes / Follow-ups
- Pipeline API still contains internal fields like `credibilityScore`; UI language now treats these as heuristic.

## Iter135 — Heartbeat + Stall Timeout (Mar 29, 2026)

Change request: implement pipeline heartbeat so long-running scraping/generation doesn't trip stall watchdog; set stall timeout to 3 hours.

### Changes
- apps/api/.env
  - Set `PIPELINE_STALL_TIMEOUT_MS=10800000` (3 hours)
- apps/api/src/routes/pipeline.ts
  - Added `startPipelineHeartbeat()` which refreshes `updatedAt` every 15s during a pipeline run
  - Heartbeat disabled in tests (`NODE_ENV=test` or `VITEST`)
  - Wrapped noisy console logs behind `NODE_ENV!==test` guards
- vitest.setup.ts
  - Silenced `console.log` to prevent Vitest `EnvironmentTeardownError` from pending user-console RPC.

### Tests
- `npm test` (turbo) — PASS

---

## Iter135 — P2 Reliability cleanup (Mar 29, 2026)

### P2 Task 9 — dev:clean (avoid duplicate dev processes)

What changed:
- Added `npm run dev:clean`.
- Enhanced `scripts/dev-clean.mjs`:
  - frees ports 3000/3001/3003 by terminating only node/vite/next listeners on those ports
  - also terminates orphaned `turbo run dev` processes started from this repo (common after terminal interruptions)

Evidence / manual checks:
```bash
node scripts/dev-status.mjs
node scripts/dev-clean.mjs
node scripts/dev-status.mjs
```

### P2 Task 10 — Playwright EPIPE robustness for list mode

Problem:
- `npx playwright test --list | head` can crash with `Error: write EPIPE` on Node 22 when the pipe is closed early.

Fix:
- Added wrapper `scripts/playwright-list.mjs` and `npm run pw:list`.

Evidence:
```bash
npm run pw:list | head -n 20
# exits 0 without EPIPE
```

Files:
- `package.json`
- `README.md`
- `scripts/dev-clean.mjs`
- `scripts/playwright-list.mjs`

Commits:
- `e6e2834` Iter135 P2: add dev:clean + robust playwright list wrapper
- `b652ab8` Iter135 P2: dev-clean also terminates orphaned turbo dev processes



### P2 Task 11 — reduce client/web marketing split-brain

Decision:
- **Chose B**: remove `apps/client/src/screens/marketing/*` entirely. Canonical marketing + pricing now live in `apps/web`.

What changed:
- Deleted the legacy client marketing screens directory.
- Replaced two removed tests with updated MVP-truth regression tests:
  - `apps/client/src/__tests__/mockBillingCopyRegression.test.tsx` now asserts web pricing page contains the mock billing disclosures/CTA.
  - `apps/client/src/__tests__/subscription-upgrade.test.tsx` now asserts the web pricing page upgrade CTA exists and is labeled mock billing.

Evidence:
```bash
find apps/client/src/screens -maxdepth 2 -type d
# no marketing folder
npm -w @learnflow/client test
npm test
```

### P2 Task 12 — docs MVP truth checklist exists and is linked

What changed:
- Added `apps/docs/pages/mvp-truth-checklist.md`.
- Linked it from `apps/docs/pages/mvp-truth.md`.
- Fixed `apps/docs/pages/user-guide.md` to link to `selection-tools.md` and updated mindmap collaboration copy to be MVP-accurate.

Evidence:
```bash
npm -w @learnflow/docs test
```
