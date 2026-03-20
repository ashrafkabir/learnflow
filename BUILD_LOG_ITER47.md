# BUILD_LOG — Iteration 47

**Date:** 2026-03-20  
**Builder:** subagent learnflow-builder-hotfix-delete-lesson  
**Status:** COMPLETE

## Summary

Hotfix work focused on two regressions:

1. Course deletion intermittently failed with `429 rate limit exceeded`.
2. Clicking a lesson (Start/Review) in CourseView could throw an error in some environments.

## 1) Fix: course deletion hitting rate limit (429)

### Root cause

API rate-limiter key was **too coarse** (keyed primarily by client IP + tier). In NAT/shared-IP environments this can cause unrelated user actions (including `DELETE /api/v1/courses/:id`) to unexpectedly hit the limit.

### Changes

- **Rate limiter keying updated** to be **user-scoped** when available:
  - prefer `req.user?.sub` (JWT subject) as the primary key
  - fall back to `req.ip` only when unauthenticated
- `429` responses now include:
  - `Retry-After` header
  - JSON body includes `retryAfterSeconds`

Files:

- `apps/api/src/app.ts`

### Regression test

Added API test ensuring reasonable bursts of course create+delete do **not** return 429:

- `apps/api/src/__tests__/course-delete-rate-limit.test.ts`

## 2) Client: actionable error message for 429

Client request wrapper now produces an actionable message for 429s:

- extracts retry time from `Retry-After` header or response body
- throws a clearer error string that UI surfaces via existing toast/error patterns

Files:

- `apps/client/src/context/httpErrors.ts` (new)
- `apps/client/src/context/AppContext.tsx`

## 3) Lesson click error

Could not reproduce a current crash after updating/fixing the above.

Notes:

- CourseView uses `nav(`/courses/${courseId}/lessons/${lesson.id}`)` and LessonReader supports this route.
- Legacy route `/course/:courseId/lesson/:lessonId` correctly redirects to `/courses/:courseId/lessons/:lessonId`.

If the crash persists in manual QA, next step is to capture the browser console stack trace during navigation and isolate whether it’s:

- a missing `courseId`/`lessonId` in certain CTA contexts, or
- a fetch error not being handled in LessonReader side-effects.

## 4) Verification

Ran and passed:

- `npx tsc --noEmit`
- `npx eslint .`
- `npx vitest run` (all tests)

## 5) Git

Committed:

- `Fix coarse rate-limit key; actionable 429 + regression test` (`44316f7`)
