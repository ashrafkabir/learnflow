# BUILD_LOG_ITER39

Iteration: 39
Date: 2026-03-19

## Task 1) Onboarding only once (not every login)

### What I changed

- **API (SQLite)**: Added durable field `users.onboardingCompletedAt`.
  - Updated migrations to include column.
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

- This preserves backward-compat with the prior localStorage-only behavior.
- Durable completion requires user to reach the final onboarding step (FirstCourse) at least once.

### Verification

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅
- `npx eslint .` ✅
