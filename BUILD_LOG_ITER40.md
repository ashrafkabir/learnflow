# Build Log — Iteration 40 (Planner)

Date: 2026-03-19
Owner: Planner subagent (learnflow-planner-40)

## Objective

- Read full product spec
- Boot LearnFlow stack on stable ports (API 3000, Client 3001, Web 3003)
- Capture Playwright screenshots of every screen (desktop + mobile + web)
- Compare spec to implementation; produce Iter40 improvement queue (10–15 tasks)

## What I verified

### Runtime / services

- Ports checked: 3000/3001/3003.
- API responds at `http://localhost:3000/` and `/health` (health route exists as `/health`, not `/healthz`).
- API `createApp({ devMode: true })` injects a dev auth user when no JWT is provided.
- WS server runs at `/ws` and accepts `?token=dev` in non-production.

### Screenshots (Iter40)

Saved under:

- `learnflow/evals/screenshots/iter40-desktop/`
- `learnflow/evals/screenshots/iter40-mobile/`
- `learnflow/evals/screenshots/iter40-web/`

(Produced via repo scripts: `screenshot-all.mjs`, `screenshot-mobile.mjs`, `screenshot-web.mjs`.)

### Implementation highlights (code-level)

- UI screens exist for: onboarding flow, dashboard, conversation, course view/lesson reader, mindmap explorer, pipelines (mock), marketplace (courses/agents/creator), settings (ProfileSettings), collaboration.
- API endpoints implemented for most of spec §11.1: auth, keys, chat, courses, mindmap, marketplace, profile/context, subscription, analytics.
- WebSocket: spec-like events plus extra (`connected`, `mindmap.subscribe`).
- Mindmap suggestions: server emits `mindmap.update` with `suggestions[]` for dashed expansion nodes (client expectation).

## Brutally honest spec gaps

1. **Onboarding**: one broken back-route (`/onboarding/experience`) in `OnboardingApiKeys`.
2. **Pipeline feature**: pipeline UI is mock-only and not driven by backend pipeline state.
3. **Marketplace**: API router is minimal demo data; richer router exists (`marketplace-full.ts`) but not mounted; creator flows are not real.
4. **WS contract**: server supports most but includes non-spec events; docs admit mismatch for `completion_percent` naming.
5. **Lesson experience**: notes endpoints exist, but lesson reader experience still needs spec-grade “learn → quiz/notes → complete → next”.

## Files created/updated

- `learnflow/IMPROVEMENT_QUEUE.md`
- `learnflow/BUILD_LOG_ITER40.md`

## Next actions for main agent

- Copy Iter40 artifacts to OneDrive folder `/home/aifactory/onedrive-learnflow/`.
- Git commit the plan + logs + screenshot folders.
