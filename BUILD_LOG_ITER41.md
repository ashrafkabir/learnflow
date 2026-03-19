# Build Log — Iteration 41 (Builder)

Date: 2026-03-19
Owner: Builder subagent (learnflow-builder-41)

## Resume context

- Loaded `learnflow/IMPROVEMENT_QUEUE.md` (Status was **READY FOR BUILDER**).
- Verified repo cleanliness and stable dev services:
  - API: 3000 (`learnflow-api.service`)
  - Client: 3001 (`learnflow-client.service`)
  - Web: 3003 (`learnflow-web.service`)

## Recovery actions (from previous timed-out attempt)

The previous attempt appeared to leave generated artifacts in the git working tree.

- Restored generated/ephemeral files back to clean state:
  - `apps/web/.next/*`
  - `apps/api/.data/learnflow.db-{wal,shm}`
- Confirmed `git status` is clean.

## Artifacts sync (required)

Copied (no delete) the following Iter41 planning artifacts to:
`/home/aifactory/onedrive-learnflow/iteration-41/`

- `learnflow/IMPROVEMENT_QUEUE.md`
- `learnflow/BUILD_LOG_ITER41.md`
- `learnflow/evals/screenshots/iter41-desktop/`
- `learnflow/evals/screenshots/iter41-mobile/`
- `learnflow/evals/screenshots/iter41-web/`

## Task 1 — Fix onboarding route mismatch (/onboarding/experience)

**Problem**: the Back button on `/onboarding/api-keys` navigated to a non-existent route (`/onboarding/experience`). Screenshot scripts also tried to capture `/onboarding/experience`.

**Changes**

- Client: `/onboarding/api-keys` Back button now routes to `/onboarding/topics`.
- Router: added a compatibility redirect `/onboarding/experience → /onboarding/subscription` (so any stale links don’t 404).
- Screenshot script: updated mobile screenshots to capture the real onboarding pages:
  - api-keys, subscription, first-course

**Verification (required)**

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅
- `npx eslint .` ✅

**Screenshots (required)**

- Updated Iter41 screenshots after change:
  - `evals/screenshots/iter41-mobile/*` ✅
  - `evals/screenshots/iter41-web/*` ✅
  - `evals/screenshots/iter41-desktop/*` ✅ (via `screenshot-all.mjs`)

## Task 2 — Hook marketplace creator dashboard + publish flow to real APIs

**Problem**: `/marketplace/creator` used only mocked data and publish flow was local-only.

**Changes**

- API
  - Restored public access to browse endpoints required by tests:
    - `/api/v1/marketplace/courses` and `/api/v1/marketplace/agents` remain public.
  - Enabled full creator endpoints behind auth:
    - `/api/v1/marketplace/creator/dashboard`
    - `POST /api/v1/marketplace/courses` (alias of `/publish`)
    - `GET /api/v1/marketplace/courses/:id` (detail)
    - `GET /api/v1/marketplace/agents/activated` (activated agent IDs)
- Client
  - Creator dashboard now loads from `/api/v1/marketplace/creator/dashboard` when available and falls back to mocks.
  - Publish flow now POSTs to `/api/v1/marketplace/courses` and refreshes dashboard on success.

**Verification (required)**

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅
- `npx eslint .` ✅

**Screenshots (required)**

- Regenerated Iter41 screenshots after change:
  - `evals/screenshots/iter41-mobile/*` ✅
  - `evals/screenshots/iter41-web/*` ✅
  - `evals/screenshots/iter41-desktop/*` ✅

## Notes

- Screenshots are ignored by git (expected), so they remain as local + OneDrive artifacts.
