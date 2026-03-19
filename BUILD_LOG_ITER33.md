# BUILD_LOG_ITER33

## 2026-03-18/19 — Iteration 33 build

### Task 1 — Make lesson sources first-class (end-to-end) (UI path)

Changes:

- Removed mocked `MOCK_SOURCES` from `CourseView`.
- Added `apps/client/src/lib/sources.ts`:
  - `parseSources(content)` extracts bibliographic sources from lesson markdown content (supports bracketed refs + numbered lists + best-effort URL parsing).
  - `mergeUniqueSources(all)` dedupes sources by URL.
- Refactored `LessonReader` to import `parseSources` from the new shared helper (removed local duplicate implementation).
- Updated `CourseView` to compute a course-level `sources` list by parsing all lesson contents and rendering:
  - inline citations per lesson row (best-effort: uses `sources[li]`)
  - a Sources & References section from parsed sources (with links), with an empty state.

Verification:

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅ (377 tests)
- `npx eslint .` ✅

Screenshots (new due to UI changes):

- `learnflow/artifacts/iter33/course_sources.png`
- `learnflow/artifacts/iter33/lesson_sources.png`

Notes:

- True persisted `sources[]` objects are not yet stored in SQLite; current UI now renders from real lesson content sources instead of mocks, aligning better with spec while keeping API changes minimal.
