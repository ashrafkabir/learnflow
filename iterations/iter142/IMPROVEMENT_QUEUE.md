# Iter142 — Improvement Queue (Planner)

Status: **DONE**

Focus: Fix next-adaptive-step selection to use **lesson conceptTags** to match **quiz gaps**, instead of brittle title substring matches. Improve `/daily` relevance and determinism.

## What I verified (current state after Iter141)

- Lessons now include `conceptTags` via `extractConceptTagsFromLesson()` in `apps/api/src/routes/courses.ts` (both course shell + final READY course).
- `conceptTags` are currently derived deterministically from `{ lessonTitle, moduleTitle, courseTopic }` and canonicalized to dash-separated tags (Iter141).
- Quiz submission persists `meta.gaps` → `dbMastery.applyQuizSubmitted(...)` → stored in `mastery.gapsJson` (Iter140).
- `/api/v1/daily` currently maps quiz gaps to lessons by **titleNorm.includes(tag)** heuristic (see `apps/api/src/routes/daily.ts`), NOT by `conceptTags`.
- Tests: `npm test` passes.
- Playwright E2E passes for:
  - `e2e/iter136-smoke-assertions.spec.ts`
  - `e2e/iter137-key-screens.spec.ts`
  - `e2e/iter138-adaptive-loop.spec.ts`
- Additional run: `e2e/spec-compliance.spec.ts` fails several tests (marketing + some 60s timeouts). Not part of Iter142 acceptance but worth tracking.

## P0 (must do)

1. **Use conceptTags for quiz-gap → lesson recommendation mapping**
   - Replace `/daily` quiz-gap mapping logic:
     - Current: search uncompleted lessons in same course where `normalized(title)` includes `normalized(gapTag)`.
     - Target: search uncompleted lessons where `lesson.conceptTags` intersects gap tags (canonicalized).
   - Add fallback order:
     1) exact canonical tag match,
     2) relaxed match (e.g., `startsWith`/token overlap),
     3) final fallback to title match (existing behavior) to avoid empty results.

2. **Canonicalize gap tags the same way as concept tags**
   - Today: `exam-agent` gapTags are crude (first non-stopword token from question) and stored raw.
   - In `/daily`, canonicalize both sides with `canonicalizeConceptTag()` before matching.

3. **Update/extend tests for `/daily` quiz-gap mapping**
   - Add a new test that sets up a course with a lesson whose `conceptTags` contains a gap tag, while the lesson title does **not** contain the gap substring.
   - Ensure `/daily` returns that lesson under `reasonTag: 'quiz_gap'`.

4. **Add debug metadata for why a quiz-gap lesson was chosen**
   - Without leaking internals, include e.g. `reason: Focus: <tag> (matched concept tag '<tag>')`.

## P1 (should do)

5. **Improve exam-agent gapTags to better align with conceptTags**
   - Option A: emit gap tags from lesson’s `conceptTags` when scoring (requires passing conceptTags into exam agent / quiz context).
   - Option B: add lightweight keyword→canonical tag mapping (n-grams) so gaps look like `"spaced-repetition"` vs `"explain"`.

6. **Persist lesson conceptTags in DB (if not already in course JSON)**
   - If courses are stored as JSON blob in SQLite, confirm conceptTags survive roundtrip.
   - Add regression test for persistence integrity.

7. **Handle cross-course gap recommendations**
   - If a gap tag appears in multiple courses, prioritize:
     1) the course where the gap was detected,
     2) most recently active course,
     3) highest gap frequency.

8. **Quiz-gap age window + scoring threshold tuning**
   - Current: 7-day window; good.
   - Add weighting: recent + low lastScore should outrank recency alone.

## P2 (nice to have)

9. **Expose conceptTags in lesson API responses**
   - Ensure `/courses/:id` and `/courses/:id/lessons/:lessonId` include conceptTags so the client can display “Focus tags”.

10. **Client UX: show “Why this lesson?” chips**
   - In Daily list, show the gap tag(s) that triggered the recommendation.

11. **Backfill conceptTags for older courses (migration)**
   - For persisted courses created pre-Iter141, compute and store tags on read or via one-time migration.

12. **Spec-compliance test flake/timeouts (not Iter142 core)**
   - Several tests in `e2e/spec-compliance.spec.ts` hit 60s timeouts for `/api/v1/chat` and `/api/v1/export`.
   - Consider raising timeouts or making those endpoints deterministic/offline in test mode.

13. **Marketing content checks**
   - `spec-compliance` indicates missing keywords on pricing/download/blog and missing download CTA in hero.
   - Align marketing pages with required copy or relax test heuristics.

14. **Performance**
   - `/daily` currently scans all lessons in course(s). If course sizes grow, add simple indexes or precomputed tag→lesson lookup per course.

## Evidence / artifacts

- Playwright report: `iterations/iter142/evidence/playwright-report/`
- Screenshots + json captures: `iterations/iter142/evidence/screenshots/`

