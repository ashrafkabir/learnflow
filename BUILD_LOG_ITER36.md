# BUILD_LOG — Iteration 36 (resume #2)

Date: 2026-03-19

## Work completed

### Task 3 — Emoji removal + icon system enforcement (P0)

- Replaced remaining emoji-based UI icons across primary screens with the shared line-icon system:
  - Marketplace: `AgentMarketplace`, `CourseMarketplace`, `CourseDetail`, `CreatorDashboard`
  - Core app: `ProfileSettings`, `CourseView`, `LessonReader`, `Collaboration`
  - Onboarding: `Welcome`, `Goals`, `Topics`, `FirstCourse`, `SubscriptionChoice`
  - Marketing: `Home`, `Features`, `Pricing`, `About`, `Download`, `Docs`, `Blog`
- Removed emoji from non-UI content where applicable:
  - `apps/client/src/data/blogPosts.ts` section headers
  - `apps/client/src/__tests__/dashboard.test.tsx` regex now avoids emoji dependency
- Added/adjusted icon imports and cleaned up unused imports to satisfy ESLint.

## Verification

- `npx tsc --noEmit` ✅
- `npx eslint .` ✅
- `npx vitest run` ✅
- Confirmed no remaining emoji chars in `apps/client/src` TS/TSX via script scan ✅

## Screenshots updated

- Mobile unauth: `node screenshot-mobile.mjs` → `evals/screenshots/iter36-mobile/`
- Mobile authed: `SCREENSHOT_AUTHED=1 node screenshot-mobile.mjs` → `evals/screenshots/iter36-mobile-authed/`
- Desktop web marketing: `SCREENSHOT_DIR=evals/screenshots/iter36-web node screenshot-web.mjs` → `evals/screenshots/iter36-web/`
