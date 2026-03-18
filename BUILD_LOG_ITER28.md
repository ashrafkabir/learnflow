# BUILD_LOG_ITER28.md

Iteration 28 build log

## 2026-03-18

### Baseline verification (post-timeout resume)

Commands:

- `cd /home/aifactory/.openclaw/workspace/learnflow && npx vitest run`
- `cd /home/aifactory/.openclaw/workspace/learnflow && npx tsc --noEmit`
- `cd /home/aifactory/.openclaw/workspace/learnflow && npx eslint .`

Results:

- `npx vitest run`: ✅ PASS — 35/35 files, 377 tests
- `npx tsc --noEmit`: ✅ PASS
- `npx eslint .`: ✅ PASS

### Task execution

#### P0: Test harness sane again

Changes:

- Consolidated console gate in root `vitest.setup.ts` by removing the duplicate console overrides from `apps/client/src/test-setup.ts`.
- Set `globalThis.IS_REACT_ACT_ENVIRONMENT = true` early in `vitest.setup.ts`.
- Allowlisted React Router future warning and React act/suspense warnings (temporary stabilizer) in `vitest.setup.ts` so the console gate doesn’t fail runs on known harness noise.

Commands:

- `npx tsc --noEmit`
- `npx vitest run`
- `npx eslint .`

Results:

- `npx tsc --noEmit`: ✅ PASS
- `npx vitest run`: ✅ PASS — 35/35 files, 377 tests
- `npx eslint .`: ✅ PASS

#### P1: Onboarding overlay no longer blocks automation

Changes:

- `apps/client/src/components/OnboardingTooltips.tsx`
  - Added deterministic disable via query param `?tour=off`.
  - Made backdrop non-interactive (`pointer-events-none`) so it no longer intercepts clicks.
  - Repositioned tooltip card to bottom-right to avoid blocking the primary Dashboard CTA.
  - Added explicit close (✕) button.

#### P1: Dev auth bypass

Changes:

- `apps/client/src/App.tsx`
  - Added env-gated bypass: `VITE_DEV_AUTH_BYPASS=1` (also supports `DEV_AUTH_BYPASS=1`) to skip login + onboarding redirect logic.

#### P1: Subscription gate UX

Changes:

- `apps/client/src/screens/Dashboard.tsx`
  - Replaced surprise `alert()` + `nav('/settings')` with inline upgrade message + “View plans” CTA.

#### P2: Dashboard UX correctness

Changes:

- `apps/client/src/screens/Dashboard.tsx`
  - Fixed `initialLoading` so SkeletonDashboard renders while `/courses` loads.
  - Switched review queue navigation from `window.location.href` to SPA `nav(...)`.

Test stabilization add-on:

- `apps/client/src/components/Skeleton.tsx`: added `data-component="skeleton-dashboard"` marker.
- `apps/client/src/__tests__/dashboard.test.tsx`: updated “renders course cards or empty state” to wait until skeleton is gone.

### OneDrive sync

- OneDrive mount used: `/home/aifactory/onedrive-learnflow/`
- Synced: `IMPROVEMENT_QUEUE.md`, `BUILD_LOG_ITER28.md`

### Final verification

Commands:

- `cd /home/aifactory/.openclaw/workspace/learnflow && npx tsc --noEmit`
- `cd /home/aifactory/.openclaw/workspace/learnflow && npx vitest run`
- `cd /home/aifactory/.openclaw/workspace/learnflow && npx eslint .`

Results:

- ✅ Typecheck PASS
- ✅ Tests PASS (377/377)
- ✅ ESLint PASS
