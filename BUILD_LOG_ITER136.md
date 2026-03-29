# BUILD LOG — Iter136

## Summary
- P2.10: Added Playwright smoke assertions + fixed pipeline course 404 by creating a minimal course shell at pipeline start.

## Changes
- `e2e/iter136-smoke-assertions.spec.ts`
  - Smoke assertions:
    - Dashboard renders (`[aria-label="Dashboard"]`).
    - Course creation works via API.
    - Course loads (`[data-screen="course-view"]`).
    - Lesson loads **or** course shows truthful generating state.
  - Fails fast with clear error body snippet when CourseView shows "Failed to load course".
  - Forces `window.__LEARNFLOW_ENV__.VITE_DEV_AUTH_BYPASS='0'` so the client will send JWT Authorization headers in environments where bypass is enabled.

- `apps/api/src/routes/pipeline.ts`
  - `POST /api/v1/pipeline` is now `async`.
  - Creates a minimal course shell immediately (status `CREATING`) and persists it so `/api/v1/courses/:id` won’t 404 while the pipeline runs.

## Verification
- `npm test` ✅
- `npx playwright test e2e/iter136-smoke-assertions.spec.ts` ✅
- `npm run screenshots` ✅ (desktop + mobile)

## Notes
- Found and mitigated an API hang in the prior dev API process by restarting the API server.
