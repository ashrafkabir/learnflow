# BUILD LOG — Iter136 (Builder)

Date: 2026-03-29

## P2.11 — Dev-only App State Debug panel

### What shipped

- Added a dev-only app-state inspector panel on **Settings → Profile Settings**.
- Panel includes:
  - user id (from `localStorage.learnflow-user` if present)
  - subscription tier (`state.subscription`)
  - course count (`state.courses.length`)
  - active course id (`state.activeCourse?.id`)
  - feature flags/capabilities snapshot:
    - `devAuthBypass` from `__LEARNFLOW_ENV__.VITE_DEV_AUTH_BYPASS`
    - `updateAgent` from `state.capabilities.update_agent`
    - `advancedAnalytics` from `state.capabilities['analytics.advanced']`

### Gating / safety

- Hard-gated with `import.meta.env.DEV`.
- Added test asserting the panel does **not** render when `import.meta.env.DEV=false`.

### Files

- `apps/client/src/components/AppStateDebugPanel.tsx` (new)
- `apps/client/src/screens/ProfileSettings.tsx` (renders panel)
- `apps/client/src/__tests__/appStateDebugPanel.test.tsx` (new)

## P2.12 — Docs/spec accuracy disclaimers

### What shipped

- Added a **Roadmap** page to clearly label planned vs MVP functionality.
- Updated docs + marketing copy to avoid implying:
  - real billing
  - full semantic knowledge graph
  - adaptive quizzes (now described as planned)
  - academic paper search as a current capability

### Files

- `apps/docs/pages/roadmap.md` (new)
- `apps/docs/pages/mvp-truth.md` (links to roadmap)
- `apps/docs/pages/user-guide.md` (relabels Exam/Mindmap/Marketplace as MVP + planned)
- `apps/web/src/app/page.tsx` (homepage feature blurbs softened)
- `apps/web/src/app/pricing/page.tsx` (quizzes marked Planned)
- `apps/client/src/data/blogPosts.ts` (removes “knowledge graph” MVP claim; notes adaptive planned)

## Tests

- `npm test` ✅ (all green)
  - `npm run test --workspace apps/client` ✅ (Vitest)
  - `npm run test --workspace apps/api` ✅ (Vitest)
  - `npm run test --workspace packages/agents` ✅ (Vitest)
- `npx playwright test e2e/iter136-smoke-assertions.spec.ts` ✅ (1 passed)
- `npx playwright test e2e/iter101-screenshots.spec.ts` ✅ (after fixing routing to marketing app :3003)

## Finalization (Builder)

- Verified P2.10 smoke test exists: `e2e/iter136-smoke-assertions.spec.ts`
- Evidence tarball: `iter136-artifacts-p2_11-p2_12.tar.gz`
- Synced to OneDrive: `/home/aifactory/onedrive-learnflow/artifacts/iter136-artifacts-p2_11-p2_12.tar.gz` and `/home/aifactory/onedrive-learnflow/artifacts/iter136-p2.10-smoke-assertions.tgz`

