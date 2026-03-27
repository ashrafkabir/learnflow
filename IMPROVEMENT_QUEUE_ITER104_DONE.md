# Iteration 104 — DONE (builder evidence)

This file records the Iter104 completion status, because IMPROVEMENT_QUEUE.md is a historical log and should not be rewritten.

## What changed (Iter104)

### P0 — Subscription tier must be server-driven (no localStorage cache)

- Client no longer reads/writes `learnflow-subscription` in localStorage.
- Subscription defaults to `free` until hydrated from GET `/subscription`.

### P0 — Single source of truth for plan copy + capability matrix

- Added `packages/shared/src/plan/index.ts` with `PLAN_DEFINITIONS`.
- Client + API consume shared plan definitions for gating/copy.
- Updated copy to state "Managed API keys" are **not available in this build**.
- Added parity tests to prevent drift.

### P0 — Make mock billing boundary explicit

- API returns `billingMode: 'mock'` for subscription responses.
- Marketplace checkout responses return `billingMode: 'mock'`.
- Added tests validating this field.

### P2 — Collaboration copy parity

- Updated Collaboration screen copy to reflect shared mindmaps are available via live sync links (Yjs).

## Verification

- Tests: `npm test` PASS.
- Screenshots: `learnflow/screenshots/iter104/run-001/`
- Build log: `BUILD_LOG_ITER104.md`
- OneDrive: synced to `~/onedrive-learnflow/learnflow/`.
