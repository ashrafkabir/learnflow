# BUILD LOG — Iter135 (continuation)

Date: 2026-03-29

## Summary
- Fixed **Today’s Lessons** endpoint to be consistent with persisted progress (never recommends completed lessons).
- Added deterministic API test for daily lessons recommendation.
- Tightened one piece of Dashboard copy to be more MVP-truthful (course creation).

---

## Changes

### 1) P1 Task 5 — Today’s Lessons queue respects real progress

**Problem**
- `GET /api/v1/daily` was driven only from an in-memory `courses` map and also included a “review” path that could recommend lessons the user just completed.

**Fix**
- `GET /api/v1/daily` now prefers SQLite course list (`dbCourses.getAll()`) and only recommends **next uncompleted lessons** (no completed-lesson “review” recommendations).

**Files**
- `apps/api/src/routes/daily.ts`

**Test**
- Added: `apps/api/src/__tests__/daily-lessons.test.ts`

Command:
```bash
cd apps/api
npm test -- --run src/__tests__/daily-lessons.test.ts
```
Result: PASS

### 2) P1 Task 8 (partial) — Content pipeline truth pass

- Tightened Dashboard copy to avoid implying full personalization guarantees.

File:
- `apps/client/src/screens/Dashboard.tsx`

---

## Validation

Repo checks:
```bash
npm run lint
npm test
```
Result: PASS (typecheck script does not exist in this repo; tests cover TS builds via package build steps).

---

## Evidence (screenshots)
- `artifacts/iter135/dashboard-core.png` (Playwright harness output, dashboard core screen)
- `artifacts/iter135/marketing-pages.png` (Playwright harness output, marketing pages)

---

## Notes / Follow-ups
- Live refresh of Today’s Lessons after completion is still best-effort polling/fetch-based; WS-driven refresh remains a follow-up.
