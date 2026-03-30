# IMPROVEMENT_QUEUE — Iter141

Status: **READY FOR REVIEW**

Owner: Builder

Date: 2026-03-29

Scope focus (per Iter141 brief):

- Quiz rationales
- Concept tagging
- Gap → lesson matching
- Adaptive difficulty
- Notes loop polish

---

## What’s already in good shape (verified)

- **Quiz gap surfaced in /daily and Dashboard UI**
  - API: `apps/api/src/routes/daily.ts` emits `reasonTag: 'quiz_gap'` and `reason: Focus: <tag> (from last quiz)` using recent mastery `gapsJson`.
  - Client: `apps/client/src/screens/Dashboard.tsx` renders a distinct **Quiz gap** pill (fuchsia styling).
  - Tests: `apps/api/src/__tests__/daily-quiz-gap.test.ts` covers quiz-gap recommendation + “don’t recommend completed” behavior.

- **Test suite health**
  - `npm test`: PASS
  - Playwright:
    - `e2e/iter136-smoke-assertions.spec.ts`: PASS
    - `e2e/iter137-key-screens.spec.ts`: PASS
    - `e2e/iter138-adaptive-loop.spec.ts`: PASS

- **Quick-action chips exist in Conversation** (basic notes/quiz/research loop): `apps/client/src/screens/Conversation.tsx`.

---

## Iter141 priority queue (10–15 tasks)

### P0 — Must ship (learning loop correctness)

1. **Quiz rationales: make explanations actionable, per option**
   - Current MCQ has `explanation: sentence` (single blob). Users need: why correct is correct, why each distractor is wrong.
   - Output schema for MCQ should include:
     - `rationale.correct` (2–4 sentences)
     - `rationale.perOption[]` aligned to options
     - `commonMistake` (1 line)
   - Add unit tests asserting non-empty rationales and that they reference the question keyword.

2. **Introduce normalized concept tags for both lessons and quiz gaps (single canonical format)**
   - Define a canonical tag format: lowercase, dash-separated, max length, no punctuation.
   - Store on lesson metadata: `lesson.conceptTags: string[]`.
   - Store on quiz results: `gapTags: string[]` (already hinted in `QuizResult.gapTags?`).
   - Add migration/back-compat: if missing, derive tags from titles (best-effort).

3. **Gap → lesson matching should use tags + fuzzy matching, not only title substring**
   - Current `/daily` mapping uses `titleNorm.includes(tag)` (too brittle).
   - Implement matching pipeline:
     - Primary: intersection of `lesson.conceptTags` and `gapTags`
     - Secondary: token-based match (Jaccard / cosine on bag-of-words)
     - Tertiary: title substring (current behavior)
   - Ensure deterministic ordering for testability.

4. **Add “Why am I seeing this?” interaction for daily recommendations**
   - In Dashboard “Today’s Lessons” card, add an inline expander or tooltip that shows:
     - lastSeenAt, count, lastScore for quiz gap
     - nextReviewAt for review
   - Keep it local-only; no new network calls if possible (include in API response).

5. **Adaptive difficulty: persist and apply difficulty adjustments based on quiz history**
   - Spec says: >90% increase, <60% offer prereqs/breakdown.
   - Implement per-course or per-topic difficulty scalar in Student Context / DB.
   - Apply to:
     - quiz generation difficulty (question wording, distractor strength)
     - lesson recommendations (prereq suggestions vs next lessons)

### P1 — Should ship (quality + polish)

6. **Notes loop polish: make “Take Notes” contextual to the active lesson/course automatically**
   - Today chips fire generic prompts; often loses context.
   - When user clicks “Take Notes” from Lesson Reader, send structured payload (courseId, lessonId) or inject lesson excerpt automatically.
   - Ensure the notes output is saved/linked to the lesson (so the loop closes).

7. **Surface quiz-gap callout in CourseView and LessonReader**
   - If a lesson is being opened due to quiz gap, show a small banner:
     - “Recommended because you missed: <tags>”
     - CTA: “Start 3-question micro-quiz after reading”

8. **Micro-remediation quiz (3 questions) after a quiz-gap lesson**
   - Short, targeted assessment using the gap tags.
   - Record mastery update and clear/reduce the gap signal upon success.

9. **Concept tagging for generated lesson content (MVP heuristic)**
   - Without LLM tagging, implement heuristic tagging:
     - extract keywords from headings + bold terms + glossary
     - normalize + keep top N
   - Add tests that tags are stable for same content.

10. **Improve gap signal storage: store structured entries, not just strings**

- `/daily` already supports `{tag,lastSeenAt,count,lastScore}` in `gapsJson`.
- Ensure the event ingestion always writes that richer form; add tests.

### P2 — Nice to have (UX + guardrails)

11. **Dashboard: visually separate “Review”, “Continue”, “Quiz gap” recommendations**

- Add small grouping headers or icons so users understand variety.

12. **Explainability copy and empty states**

- If no daily lessons: show “No lessons due today — want to continue or take a quiz?”
- If no quiz gaps: hide pill, avoid confusing labels.

13. **Add a compact “Concepts you’re struggling with” panel**

- Show top 3 gapTags across courses + quick jump to remediation lessons.

14. **E2E test: quiz gap appears on Dashboard**

- Existing `iter138-adaptive-loop` covers /daily review; add explicit assertion for Quiz gap pill (or a new iter141 e2e).

15. **Telemetry (local-only) for loop completion**

- Track: gap detected → recommended → lesson opened → remediation quiz passed.
- Use this to confirm the loop is working before adding heavier personalization.

---

## Screenshots captured (Iter141)

Saved via `node screenshot-all.mjs` to:

- `learnflow/screenshots/iterunknown/run-2026-03-29/`
  - Includes: `app-dashboard.png`, `course-view.png`, `lesson-reader.png`, `marketplace-*.png`, etc.

---

## Notes / risks

- The product spec is broad and “future-state”; Iter141 work should stay **local/deterministic** where possible.
- Current exam agent is heuristic and does not truly measure mastery; adding better rationales + tags is the highest-leverage improvement without needing external model calls.
