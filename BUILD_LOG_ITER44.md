# BUILD_LOG_ITER44

**Iteration:** 44
**Owner:** Planner (Ash)
**Date:** 2026-03-19

## Goal

Run the LearnFlow Continuous Improvement Loop for Iteration 44:

- Read full product spec
- Inspect implementation (UI/API/agents)
- Verify stable dev ports/services (3000/3001/3003)
- Capture Playwright screenshots for all screens
- Compare spec vs reality (brutally honest)
- Produce updated improvement queue (READY FOR BUILDER)
- Sync artifacts to OneDrive and commit queue+log

## What I did

### 1) Read spec

- Reviewed `learnflow/LearnFlow_Product_Spec.md` (v1.0, March 2026).

### 2) Verified running stack (ports + services)

- Checked listeners on ports **3000 / 3001 / 3003**.
- Confirmed systemd user services exist:
  - `~/.config/systemd/user/learnflow-api.service` (API dev)
  - `~/.config/systemd/user/learnflow-client.service` (Vite dev on 3001)
  - `~/.config/systemd/user/learnflow-web.service` (Next dev)
- Note: units currently do not include explicit health-gated readiness or port-conflict handling.

### 3) Captured screenshots (Playwright)

- Ran:
  - `node screenshot.mjs`
  - `node screenshot-mobile.mjs`
  - `node screenshot-web.mjs`
- Output collected under `learnflow/evals/screenshots/`.
- Iter44 folders created:
  - `learnflow/evals/screenshots/iter44-desktop/`
  - `learnflow/evals/screenshots/iter44-mobile/`
  - `learnflow/evals/screenshots/iter44-web/`

### 4) Code inspection highlights (spec vs implementation)

**API**

- `apps/api/src/app.ts` uses dev auth when `devMode:true` and provides default `pro` user if no token is present.
- WebSocket server (`/ws`) supports token=dev in non-production.
- WS orchestrator routes messages through Core `Orchestrator` and streams `response.start/chunk/end` events.
- `response.end.sources` are derived via **heuristic URL extraction** from lesson content (`makeSourcesFromLesson()`) and fabricate metadata.

**Core Orchestrator**

- `packages/core/src/orchestrator/intent-router.ts` is **regex keyword routing**.
- System prompt is included verbatim, but runtime behavior does not fully enforce spec constraints.

**Client**

- Onboarding screens exist (6 screens), but API key step does not call server.
- Subscription screen blocks Pro with “Pro Coming Soon” modal.
- Route canonicalization exists (`/courses/:courseId`) with back-compat redirects.

## Brutally honest gaps observed

- Claims of “real web sources + citations” are not guaranteed end-to-end.
- API key onboarding is UI-only; does not validate/store.
- Subscription/billing is stubbed.
- Lesson structure/length/citation requirements are not enforced by a hard validator.
- Mindmap is present but not demonstrably concept/mastery-based.

## Outputs

- Updated `IMPROVEMENT_QUEUE.md` for Iteration 44 (Status: READY FOR BUILDER)
- This log: `BUILD_LOG_ITER44.md`
- Screenshots: `learnflow/evals/screenshots/iter44-*`

## Next actions (for Builder)

Implement P0 items from `IMPROVEMENT_QUEUE.md` in order, starting with:

1. Structured sources + citations pipeline
2. API key validation + storage
3. Subscription flow / entitlement gating
