# BUILD_LOG_ITER39

Iteration: 39
Date: 2026-03-19

## Task 1) Onboarding only once (not every login)

✅ DONE.

### What I changed

- **API (SQLite)**: Added durable field `users.onboardingCompletedAt`.
  - Updated schema creation to include column.
  - Updated `insertUser` / `updateUser` statements and serialization.
  - Updated `DbUser` typing + row mapping.
- **API (profile routes)**:
  - `GET /api/v1/profile/context` now returns `topics`, `experience`, and `onboardingCompletedAt`.
  - Added `POST /api/v1/profile/onboarding/complete` to set `onboardingCompletedAt` for the authenticated user.
- **API (auth responses)**:
  - `/auth/register`, `/auth/login`, and Google OAuth callback responses now include `user.onboardingCompletedAt` (nullable).
- **Client**:
  - `FirstCourse` onboarding completion step now calls `/api/v1/profile/onboarding/complete` (best-effort) in addition to setting localStorage.
  - `App.tsx` onboarding guard now treats onboarding as completed if **either**:
    - local state says completed, or
    - legacy `learnflow-onboarding-complete` localStorage is true, or
    - `learnflow-user.onboardingCompletedAt` exists.
  - `LoginScreen` routes to onboarding if the server indicates onboarding is incomplete.
  - `RegisterScreen` routes to dashboard if onboarding is already complete, else onboarding.

### Notes

- Backward compatible with the prior localStorage-only behavior.
- Durable completion requires the user to reach the final onboarding step at least once.

### Verification

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅
- `npx eslint .` ✅

## Task 2) Onboarding must not force course creation

✅ DONE.

### What I changed

- **Client**: Updated onboarding flow to avoid implying/triggering course creation.
  - `SubscriptionChoice` now routes to `/onboarding/ready` (final “ready” screen) instead of `/onboarding/first-course`.
  - Updated copy comment in `FirstCourse` to clarify no course is auto-created during onboarding.

### Acceptance check

- Onboarding captures profile/goals/topics and ends on a “You’re all set” screen.
- Users are directed to the Dashboard to create a course intentionally.

### Verification

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅
- `npx eslint .` ✅

## Task 3) Fix annotation bug: double-click heading throws errors

✅ DONE.

### What I changed

- **Client**: Hardened selection → range logic in `LessonReader`.
  - Added guard for `Selection.rangeCount` before calling `getRangeAt(0)`.
  - Wrapped `getRangeAt(0)` in `try/catch` to avoid `IndexSizeError`.
  - Validated the selection range is inside the lesson content container before computing toolbar position.

### Acceptance check

- Double-click on headings (or other text) no longer throws.
- Annotation UI still appears for valid selections inside the lesson content.

### Verification

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅
- `npx eslint .` ✅
