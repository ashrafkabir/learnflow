# Build Log — Iteration 49

Owner: learnflow-builder-49 (subagent)

## Scope

Execute ALL tasks in `learnflow/IMPROVEMENT_QUEUE.md` for Iteration 49 (P0 1–4, P1 5–9 MVP acceptable, P2 10–14).

## Log

### 2026-03-20

- Initialized Iter49 build log (this file).

### Task P0-3: Add missing data-screen attributes for Login/Register

- Added `data-screen="login"` to `LoginScreen` root `<section>`.
- Added `data-screen="register"` to `RegisterScreen` root `<section>`.
- Verified screenshot suite `e2e/iter49-screenshots.spec.ts` now captures `01-login.png` and `02-register.png` successfully.

Files changed:

- apps/client/src/screens/LoginScreen.tsx
- apps/client/src/screens/RegisterScreen.tsx

Commands:

- npm run lint:check
- npm run build
- npm test
- npx playwright test e2e/iter49-screenshots.spec.ts -g "logged-out"

### Task P0-1: Deterministic auth bypass for E2E

Problem: prior runs depended on external env/systemd for `VITE_DEV_AUTH_BYPASS`, causing non-deterministic auth redirects in Playwright.

Solution (MVP):

- Added runtime env override support via `globalThis.__LEARNFLOW_ENV__` in `apps/client/src/App.tsx`.
- Added Playwright spec `e2e/auth-guard.spec.ts` validating both bypass OFF and ON modes deterministically.

Files changed:

- apps/client/src/App.tsx
- e2e/auth-guard.spec.ts

Commands:

- npm run lint:check
- npm run build
- npm test
- npx playwright test e2e/auth-guard.spec.ts
- npx playwright test e2e/iter49-screenshots.spec.ts

Artifacts:

- Screenshots: learnflow/screenshots/iter49/\*.png
- OneDrive screenshots: /home/aifactory/onedrive-learnflow/evals/screenshots/iter49/\*.png

### Task P0-4: Unblock Settings spec compliance run

Problem: `e2e/spec-compliance.spec.ts` Settings section sometimes hit Login screen, causing false failure.

Fix (MVP, deterministic):

- In Settings compliance tests, force dev auth bypass ON via `window.__LEARNFLOW_ENV__` and clear localStorage auth state before navigation.

Result:

- `npx playwright test e2e/spec-compliance.spec.ts -g "Settings"` now passes.

Files changed:

- e2e/spec-compliance.spec.ts

Commands:

- npm run lint:check
- npm run build
- npm test
- npx playwright test e2e/spec-compliance.spec.ts -g "Settings"
- npx playwright test e2e/iter49-screenshots.spec.ts

Artifacts:

- compliance screenshots remain under evals/screenshots/\* and copied to OneDrive compliance folder.

### Task P0-2: Fix Playwright learning journey suite to match UI + avoid timeouts

Problems observed:

- Goals screen "Add" button disabled until text entered (test clicked first button -> flaky).
- Test expected onboarding step "/experience" and "/first-course" but app routes to /onboarding/ready.
- Tests depended on auth state/env.

Fix (MVP, deterministic):

- Added `beforeEach` init script to force `VITE_DEV_AUTH_BYPASS=1` via `window.__LEARNFLOW_ENV__` and clear onboarding/auth localStorage.
- Updated onboarding steps to real flow: welcome → goals → topics → api keys → subscription → ready.
- Implemented goal add by filling an input then clicking Add (or first enabled button fallback).
- After onboarding ready, click "Go to Dashboard" and assert dashboard visible.
- Split out a simple "core routes accessible" test for dashboard/settings/conversation.

Files changed:

- e2e/learning-journey.spec.ts

Commands:

- npm run lint:check
- npm run build
- npm test
- npx playwright test e2e/learning-journey.spec.ts
- npx playwright test e2e/iter49-screenshots.spec.ts

Artifacts:

- New learning-journey screenshots under evals/screenshots/learning-journey-\*.png

## Task 5 (Mindmap CRDT MVP) continuation

### Fix: Yjs websocket now served on dedicated port (3002)

- Root cause: a second `/yjs` ws path on the same HTTP server consistently returned 400 Bad Request for non-/ws upgrades in this repo.
- Change: API now starts a dedicated Yjs server on `config.yjsPort` (default 3002).
- Files: apps/api/src/config.ts, apps/api/src/index.ts

### Client: connect to Yjs port in localhost dev

- Default Yjs ws origin for localhost is now ws(s)://localhost:3002/yjs (override supported via globalThis.**LEARNFLOW_ENV**.VITE_YJS_WS_ORIGIN).
- File: apps/client/src/hooks/useMindmapYjs.ts

### E2E: CRDT sync assertion

- Playwright test updated to assert via a dev-only escape hatch exposing the Yjs nodes array on window (canvas rendering makes DOM assertions flaky).
- Files: apps/client/src/screens/MindmapExplorer.tsx, e2e/mindmap-crdt.spec.ts

### Verification

- Ran: npm run lint:check; npm run build; npm test (all pass)
- Ran: PLAYWRIGHT_BASE_URL=http://localhost:3011 npx playwright test e2e/mindmap-crdt.spec.ts (pass)
- Screenshots copied to: learnflow/screenshots/iter49/test-finished-\*.png

## Task 1 (Auth bypass determinism) verification

- Ran: PLAYWRIGHT_BASE_URL=http://localhost:3011 npx playwright test e2e/auth-guard.spec.ts (pass)

## Task 4 (Settings compliance) verification

- Ran: PLAYWRIGHT_BASE_URL=http://localhost:3011 npx playwright test e2e/spec-compliance.spec.ts -g "Settings" (pass)

## Task 6 (Pipeline→Course integration + deterministic tests)

### Changes

- API devAuth default tier is now FREE (closer to product posture): apps/api/src/app.ts
- In tests (NODE_ENV=test):
  - Course creation uses deterministic offline sources (no network) and skips expensive lesson generation: apps/api/src/routes/courses.ts
  - Research agent returns deterministic sources (no network): apps/api/src/routes/chat.ts
- WebSearch provider crawl breadth reduced (2 queries) for runtime; but tests now avoid network at API layer entirely.

### Verification

- Ran: npm test -w apps/api (PASS)
- Ran: npm run lint:check; npm run build; npm test (PASS)

### UI E2E

- Ran: PLAYWRIGHT_BASE_URL=http://localhost:3011 npx playwright test e2e/learning-journey.spec.ts (PASS)
- Screenshots: learnflow/screenshots/iter49/learning-journey-\*.png

### Playwright screenshot suite

- Ran: PLAYWRIGHT_BASE_URL=http://localhost:3011 npx playwright test e2e/iter49-screenshots.spec.ts (PASS)
- Key rollups: learnflow/screenshots/iter49/iter49-{logged-out,onboarding,core,marketing}.png

## Task 7-14 status

- Not completed in this continuation.
- Stopped long-running dev servers (api/client) to avoid cron timeouts.

## Task 6 (Test stability)

### Fix: make API tests deterministic + fast

- Set devMode default user tier to free (apps/api/src/app.ts)
- In NODE_ENV=test: course creation now uses deterministic sources and skips network crawl + LLM lesson generation (apps/api/src/routes/courses.ts)
- Bounded WebSearch crawl loop depth to reduce latency in non-test environments (packages/agents/src/content-pipeline/web-search-provider.ts)

### Verification

- Ran full suite: npm test (all packages pass)
- Playwright mindmap CRDT: requires client dev server running on 3011; ran and passed after starting vite on 3011

## Task 6 (Fix flaky timeouts / network in tests)

### Changes

- Made devAuth default tier FREE (closer to product posture): apps/api/src/app.ts
- Ensured course generation is fast/deterministic in NODE_ENV=test (no network calls, stub sources + stub lesson content): apps/api/src/routes/courses.ts
- Bounded WebSearch crawl breadth in default provider (production can increase): packages/agents/src/content-pipeline/web-search-provider.ts

### Verification

- Ran: npm test -w apps/api (pass)
- Ran: npm run lint:check; npm run build; npm test (all pass)

## Task 8 (Stripe/Billing sandbox entitlements MVP)

### Changes

- Settings 'Upgrade to Pro' now routes to /pricing (no more local-only tier toggle).
- Pricing Pro CTA now calls POST /api/v1/subscription {action:'subscribe',plan:'pro'} (sandbox) then navigates to /settings.
- Settings downgrade/cancel now call POST /api/v1/subscription {action:'downgrade'|'cancel'} (sandbox) and update client state.

### Verification

- Ran: npm run lint:check; npm run build; npm test (all pass)

### Notes

- This is still sandbox (no Stripe Checkout/webhooks), but entitlements now flow via API rather than purely client mocks.

### Screenshots

- Ran: PLAYWRIGHT_BASE_URL=http://localhost:3011 npx playwright test e2e/learning-journey.spec.ts (generated learning-journey-\*.png)
- Ran: PLAYWRIGHT_BASE_URL=http://localhost:3011 npx playwright test e2e/iter49-screenshots.spec.ts -g "marketing" (generated 20-home..26-about incl 22-pricing.png)

## Task 7 (Pipeline → course integration) partial

- Verified: pipeline already builds/saves a course to DB on stage 'reviewing' and Dashboard fetches /courses when reviewing.
- Minor UX fix: Dashboard 'View plans' now routes to /pricing (not /settings).
- Still pending: integration test explicitly asserting pipeline completion creates course entity + UI auto-routes.

## Task 9 (Marketplace activation affects orchestrator routing)

### Fix

- Marketplace-full activation + activated list now persist via dbMarketplace (SQLite) for real routing.
- Activation supports seeded ids (ma-1/ma-2) and keeps legacy in-memory map for marketplace-full tests.
- marketplaceRouter reverted to public browse only (activation handled in marketplace-full).

### Verification

- Ran: npm run lint:check; npm run build; npm test (all pass)
- Manual WS check: activated ma-2, then WS chat 'research ...' produced agent.complete agent_name=research_agent

## Task 10 (A11y keyboard nav smoke)

- Added: e2e/keyboard-nav.spec.ts (welcome→goals + settings API keys focusable)
- Ran: npx playwright test e2e/keyboard-nav.spec.ts (pass)
- Screenshots: learnflow/screenshots/iter49/keyboard-nav-\*

## Task 11 (Citations & sources surfaced + structured extraction)

### Change

- Server: makeSourcesFromLesson now uses utils/parseLessonSources for structured reference extraction (not just URLs).

### Verification

- Ran: npm run lint:check; npm run build; npm test (all pass)

## Task 12 (Analytics event-based metrics MVP)

### Changes

- DB: added learning_events table + statements + dbEvents helper
- Progress: markComplete now records lesson.completed event
- Courses: GET lesson now records lesson.opened event
- Analytics: weeklyProgress derived from events + returns recentEvents list

### Verification

- Ran: npm run lint:check; npm run build; npm test (all pass)

## Task 13 (Docs: make them real + synced with routes)

### Changes

- Updated marketing Docs page content to point to real markdown docs under apps/docs/pages (api-reference, agent-sdk, architecture).

### Verification

- Ran: npm run lint:check; npm run build; npm test (all pass)

## Task 14 (Stabilize Playwright artifact output paths)

### Changes

- Playwright outputDir now repo-relative: learnflow/screenshots/playwright
- E2E suites using hardcoded OneDrive paths now use LEARNFLOW_E2E_OUT env var fallback to repo paths:
  - e2e/spec-compliance.spec.ts
  - e2e/course-quality.spec.ts
- Iter49 screenshot suite keeps OneDrive copy but OUT_OD now overridable via LEARNFLOW_E2E_OUT_OD

### Verification

- Ran: npm run lint:check; npm run build; npm test (all pass)

## Task 14 (Lesson plan side tools: Discover / Illustrate / Mark)

### Changes

- API: added selection tools endpoints
  - POST /api/v1/courses/:id/lessons/:lessonId/selection-tools/preview (discover/illustrate/mark preview)
  - POST /api/v1/courses/:id/lessons/:lessonId/notes/mark-takeaways (persist takeaways extras)
- Client: LessonReader text selection toolbar now includes Discover/Illustrate/Mark
  - opens preview modal → Attach (annotation or takeaways) or Discard
  - Discover uses web-search provider to return related links
  - Illustrate produces simplified bullets + best-effort image URL (OpenAI if configured)
  - Mark extracts bullets and appends to user note keyTakeawaysExtras

### Verification

- Ran: npm run lint:check; npm run build; npm test (all pass)
- Ran: Playwright screenshot suite: e2e/iter49-screenshots.spec.ts (pass; updated screenshots in repo + OneDrive)
