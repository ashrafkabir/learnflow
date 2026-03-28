# BUILD LOG — Iteration 121 (Builder)

Date: 2026-03-28
Builder: subagent learnflow-builder-121

## Global requirements checklist
- [x] Set IMPROVEMENT_QUEUE.md status → IN PROGRESS
- [ ] For each task: implement + run tests (vitest, tsc, eslint) + screenshots (desktop+mobile) + log results
- [ ] OneDrive rsync after each task
- [ ] Final: full test suite + full screenshots + queue status DONE + recent shipped commits + OneDrive synced

---

## Task 1 — P0: Remove silent mock fallbacks for Firecrawl (require opt-in env)

### Changes
- Updated Firecrawl provider to **no longer silently return mock results** when `FIRECRAWL_API_KEY` is missing.
- New behavior:
  - If `FIRECRAWL_API_KEY` missing and **ALLOW_MOCK_SOURCES not enabled**, throw a clear error instructing user to configure Firecrawl.
  - Mock/demo sources are only allowed when:
    - `ALLOW_MOCK_SOURCES=1`, OR
    - `NODE_ENV=test`, OR
    - `VITEST=true`

### Files touched
- `packages/agents/src/content-pipeline/firecrawl-provider.ts`

### Verification
- Build (tsc via turbo): `npx turbo run build --filter=@learnflow/agents` ✅
- Lint: `npx turbo run lint --filter=@learnflow/agents` ✅
- Tests: `npx turbo run test --filter=@learnflow/agents` ✅ (77 passed)

### Notes
- Root `npm run tsc` does not exist; repo uses Turbo package-level `tsc`.

---

## Task 2 — Expose mock-vs-real sources in lesson attribution UX (and stop blaming user)

### Changes
- API: `GET /courses/:courseId/lessons/:lessonId` now returns `sourceMode: 'real'|'mock'` computed from persisted missingReason / provider markers.
- API: softened `sourcesMissingReason` fallback copy to avoid implying user error when demo/mock mode is active.
- Client: extended `Lesson` type with `sourcesMissingReason` + `sourceMode` (best-effort).
- Client: AttributionDrawer accepts `sourceMode` and shows a small “Demo mode” banner when `mock`.

Files touched:
- apps/api/src/routes/courses.ts
- apps/client/src/context/AppContext.tsx
- apps/client/src/screens/LessonReader.tsx
- apps/client/src/components/AttributionDrawer.tsx

### Verification
- Lint: `npx eslint .` (pass)
- Tests: `npm test` (turbo run test) (pass)
- Build/tsc: `npm run build` (turbo run build) (pass)

### Screenshots
- `node scripts/screenshots.mjs --iter 121 --outDir screenshots/iter121/builder-run/task-02 --base http://localhost:3001`
  - Desktop + mobile captured under `screenshots/iter121/builder-run/task-02/{desktop,mobile}`.

### OneDrive sync
- NOTE: /home/aifactory/OneDrive GVFS mount missing; using repo-standard mirror: `/home/aifactory/onedrive-learnflow/`.
- `rsync -av screenshots/iter121/ /home/aifactory/onedrive-learnflow/learnflow/screenshots/iter121/`
- `rsync -av BUILD_LOG_ITER121.md /home/aifactory/onedrive-learnflow/learnflow/BUILD_LOG_ITER121.md`
- `rsync -av IMPROVEMENT_QUEUE.md /home/aifactory/onedrive-learnflow/learnflow/IMPROVEMENT_QUEUE.md`

## Task 3 — Align spec onboarding language with actual MVP behavior (no auto course generation)

### Changes
- Updated spec §5.2.1 step 6 to reflect MVP behavior: staged progress animation + preferences saved; user creates first course from dashboard.

Files touched:
- LearnFlow_Product_Spec.md

### Verification
- Tests: `npm test` (turbo run test) (pass)
- Lint: `npx eslint .` (pass)
- Build/tsc: `npm run build` (turbo run build) (pass)

### Screenshots
- `node scripts/screenshots.mjs --iter 121 --outDir screenshots/iter121/builder-run/task-03 --base http://localhost:3001`

### OneDrive sync
- `rsync -av screenshots/iter121/builder-run/task-03/ /home/aifactory/onedrive-learnflow/learnflow/screenshots/iter121/builder-run/task-03/`

## Task 4 — Marketplace activation: repeat the truth at moment of activation (routing-only)

### Changes
- Agent Marketplace activation toast now includes explicit MVP truth: activation affects routing preference only; no third-party agent code runs.

Files touched:
- apps/client/src/screens/marketplace/AgentMarketplace.tsx

### Verification
- Tests: `npm test` (pass)
- Lint: `npx eslint apps/client/src/screens/marketplace/AgentMarketplace.tsx` (pass)
- Build/tsc: `npm run build` (pass)

### Screenshots
- `node scripts/screenshots.mjs --iter 121 --outDir screenshots/iter121/builder-run/task-04 --base http://localhost:3001`

### OneDrive sync
- `rsync -av screenshots/iter121/builder-run/task-04/ /home/aifactory/onedrive-learnflow/learnflow/screenshots/iter121/builder-run/task-04/`

## Task 5 — Screenshot harness: fix iter inference (avoid hardcoded 102)

### Changes
- `screenshot-all.mjs` now infers iteration from `--iter` when provided, else from output directory name `iter###`, else `unknown`.
- Prevents misleading NOTES.md entries that always said Iteration 102.

Files touched:
- screenshot-all.mjs

### Verification
- Tests: `npm test` (pass)
- Lint: `npx eslint .` (pass)
- Build/tsc: `npm run build` (pass)

### Screenshots
- `node scripts/screenshots.mjs --iter 121 --outDir screenshots/iter121/builder-run/task-05 --base http://localhost:3001`

### OneDrive sync
- `rsync -av screenshots/iter121/builder-run/task-05/ /home/aifactory/onedrive-learnflow/learnflow/screenshots/iter121/builder-run/task-05/`

## Task 6 — Mindmap spec honesty: mastery → progress (MVP)

### Changes
- Updated spec mindmap bullet to reflect shipped behavior: nodes are color-coded by progress (completion + inferred in-progress), not mastery scoring.

Files touched:
- LearnFlow_Product_Spec.md

### Verification
- Tests: `npm test` (pass)
- Lint: `npx eslint .` (pass)
- Build/tsc: `npm run build` (pass)

### Screenshots
- `node scripts/screenshots.mjs --iter 121 --outDir screenshots/iter121/builder-run/task-06 --base http://localhost:3001`

### OneDrive sync
- `rsync -av screenshots/iter121/builder-run/task-06/ /home/aifactory/onedrive-learnflow/learnflow/screenshots/iter121/builder-run/task-06/`

## Task 10 — Add `npm run dev:attach` to coexist with already-running services

### Changes
- Added `npm run dev:attach` which skips hard-fail port checks and prints currently bound processes + expected URLs, then runs `turbo run dev`.
- Added `scripts/attach-ports.mjs`.

Files touched:
- package.json
- scripts/attach-ports.mjs

### Verification
- Tests: `npm test` (pass)
- Lint: `npx eslint .` (pass)
- Build/tsc: `npm run build` (pass)

### Screenshots
- `node scripts/screenshots.mjs --iter 121 --outDir screenshots/iter121/builder-run/task-10 --base http://localhost:3001`

### OneDrive sync
- `rsync -av screenshots/iter121/builder-run/task-10/ /home/aifactory/onedrive-learnflow/learnflow/screenshots/iter121/builder-run/task-10/`

## Task 11 — Spec: add explicit MVP truth re: web-first, billing mock, and planned native apps

### Changes
- Added/strengthened MVP callouts in spec to avoid overselling:
  - Web-first MVP (native apps planned)
  - Platform Matrix rows marked planned/not in MVP
  - Subscription billing is mock in this build (Stripe/IAP planned)
  - Agent SDK/spec is planned (MVP uses manifests + built-in agents)

Files touched:
- LearnFlow_Product_Spec.md

### Verification
- Tests: `npm test` (pass)
- Lint: `npx eslint .` (pass)
- Build/tsc: `npm run build` (pass)

### Screenshots
- `node scripts/screenshots.mjs --iter 121 --outDir screenshots/iter121/builder-run/task-11 --base http://localhost:3001`

### OneDrive sync
- `rsync -av screenshots/iter121/builder-run/task-11/ /home/aifactory/onedrive-learnflow/learnflow/screenshots/iter121/builder-run/task-11/`

## Task 9 — Pipeline publish CTA: be explicit it does NOT publish to marketplace

### Changes
- Reviewing panel copy now explicitly says “Published” is pipeline status only, not marketplace listing.
- Button label updated: “Mark Published (personal only)”.

Files touched:
- apps/client/src/components/pipeline/PipelineView.tsx

### Verification
- Tests: `npm test` (pass)
- Lint: `npx eslint .` (pass)
- Build/tsc: `npm run build` (pass)

### Screenshots
- `node scripts/screenshots.mjs --iter 121 --outDir screenshots/iter121/builder-run/task-09 --base http://localhost:3001`

### OneDrive sync
- `rsync -av screenshots/iter121/builder-run/task-09/ /home/aifactory/onedrive-learnflow/learnflow/screenshots/iter121/builder-run/task-09/`
