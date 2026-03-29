# BUILD LOG — Iter136

Date: 2026-03-29
Builder: subagent (learnflow-builder-136-1)

## Scope
- P0.1 Fix CourseView error message rendering (`[object Object]`)

---

## Work completed

### P0.1 — Fix CourseView error message rendering (`[object Object]`)

Implemented a standard helper to coerce unknown thrown values into a human readable message, and updated CourseView to use it.

**Key changes**
- Added `apps/client/src/lib/toUserError.ts` with `toUserError(err, fallback)`
  - Handles `Error`, `string`, plain objects.
  - Extracts `requestId` + `error.message` from the shared API `ErrorEnvelope` shape when present.
- Updated `apps/client/src/screens/CourseView.tsx`
  - `error` state is now `{ message, requestId? } | null`.
  - All error rendering uses `error.message` (no accidental object stringification).
  - If `requestId` exists, shows a `<details>` expander with Request ID + Copy-to-clipboard button.
- Added unit tests: `apps/client/src/__tests__/toUserError.test.ts`.

**Commands run**
```bash
# tests (full suite)
npm test

# targeted test
npx vitest run apps/client/src/__tests__/toUserError.test.ts

# dev server (background)
npm run dev

# playwright screenshots
node screenshot-all.mjs --iter 136 --outDir learnflow/screenshots/iter136/p0-1-courseview-error
```

**Test result**
- `npm test` ✅ (turbo vitest suite)
- `toUserError.test.ts` ✅

**Screenshots captured**
- `learnflow/screenshots/iter136/p0-1-courseview-error/course-view.png`
- `learnflow/screenshots/iter136/p0-1-courseview-error/lesson-reader.png`
- plus full run set in that folder.

---

## Notes / follow-ups
- We now extract `requestId` only if the thrown value includes it. Today `apiGet/apiPost` throw `Error(message)` strings, so `requestId` will appear mainly if a call site throws a parsed envelope object directly.
  - If we want requestId to always be available, we should enhance `apiGet/apiPost` to attach `requestId` from server error bodies to the thrown error (future task).

---

### P0.4 — Dashboard mindmap empty state

Updated Dashboard mindmap preview so it does not render placeholder nodes when the user has 0 courses.

**Key changes**
- `apps/client/src/screens/Dashboard.tsx`
  - Mindmap preview now shows an empty-state message when `state.courses.length === 0`.
  - When courses exist, renders up to 3 nodes based on real course titles.

**Commands run**
```bash
npx vitest run apps/client/src/__tests__/dashboard.test.tsx
node screenshot-all.mjs --iter 136 --outDir learnflow/screenshots/iter136/p0-4-dashboard-mindmap-empty
```

**Test result**
- `dashboard.test.tsx` ✅

**Screenshots captured**
- `learnflow/screenshots/iter136/p0-4-dashboard-mindmap-empty/app-dashboard.png`
