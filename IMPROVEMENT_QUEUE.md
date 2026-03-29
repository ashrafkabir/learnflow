# Iter140 Improvement Queue (Planner)

Owner: Builder  
Planner: Ash (planner subagent)  
Last updated: 2026-03-29

Status: **IN PROGRESS**

This queue is the next 10–15 highest-leverage tasks for Iter140.

Scope focus (per directive):

- **Server-side quiz_gap persistence + /daily integration + UI reasons**
- **Exam Agent question quality + rationale**

Evidence run (planner, today)

- ✅ `npm test` (PASS)
- ✅ Playwright: `e2e/iter136-smoke-assertions.spec.ts` (PASS)
- ✅ Playwright: `e2e/iter137-key-screens.spec.ts` (PASS)
- ✅ Playwright: `e2e/iter138-adaptive-loop.spec.ts` (PASS)
- 📸 Screenshots available in repo under `screenshots/iter136/planner-run/` and synced to OneDrive under `onedrive-learnflow/iter140/evidence/`.

---

## Topline assessment (brutally honest)

Iter139 improved MCQ distractors and introduced `gapTags` emission (normalized concept tags) during scoring. But the adaptive loop is still incomplete in the exact place users feel it:

- We **capture gaps**, but we do not yet **use them to drive daily recommendations** (`reasonTag='quiz_gap'` exists as a type but is never emitted).
- We persist quiz gaps only as a **string array** in `mastery.gapsJson` with no recency/priority model and no linkage to actual lesson concepts.
- ExamAgent still generates MCQs from naive sentence slicing; distractors are better, but **question stems and rationales** are often low-signal.

Iter140 should turn quiz gaps into a first-class scheduling signal and make quiz feedback feel “smart” (actionable, concept-linked, and confidence-building).

---

## P0 (must ship)

### P0.1 — Quiz gap → Daily recommendations (end-to-end)

**Goal:** A weak quiz result should change what the learner sees next, with a clear reason.

**Work**

1. **Persist normalized gap tags server-side** on `quiz.submitted`.
   - Today: client sends `meta.gaps` as `(quiz as any).gapTags || quiz.gaps || []`.
   - Server: `events.ts` reads `meta.gaps` and stores into mastery `gapsJson`.
   - Gap: we don’t treat these as normalized tags vs freeform strings; and no recency.

2. Extend mastery storage to support gap recency/priority.
   - Minimal: store `{ tag, lastSeenAt, count, lastScore }[]` (JSON) instead of `string[]`.
   - Or introduce a new table `quiz_gaps(userId, courseId, lessonId, tag, createdAt, score)`.

3. Update `/api/v1/daily` selection algorithm to emit `reasonTag='quiz_gap'`.
   - When there are recent gaps (e.g., last 7 days), recommend:
     - a lesson in the same course whose title/metadata matches the gap tag, or
     - a review-due lesson that also addresses the gap.
   - If no match exists, still emit a quiz-gap item with a safe fallback and explicit reason (“No exact match; recommending foundational review”).

4. Update Dashboard UI copy to render quiz gap reasons distinctly.
   - E.g., “Focus: ${tag} (from last quiz)” rather than generic “Continue”.

**Acceptance criteria**

- Daily endpoint can return at least 1 lesson with `reasonTag='quiz_gap'` in a deterministic test.
- UI surfaces that reason text.
- Add/adjust tests:
  - API: new test verifying quiz gap affects `/daily` ordering.
  - Client: snapshot/unit test verifying the reason chip/text renders.

---

### P0.2 — ExamAgent: higher-quality questions + rationales

**Goal:** Questions should be concept-checks, not “did you read this exact sentence?”

**Work**

1. Improve keyword/concept extraction.
   - Use title-case phrases / noun-phrase-ish heuristics.
   - Avoid generic stems (“What is true about …?”) when possible.

2. Add rationale quality guardrails.
   - Explanation should tell the learner _why_ the correct choice is correct and why others are wrong (briefly).
   - Add a unit test ensuring rationale length > N chars and contains at least one causal cue (“because”, “therefore”, “this means”, etc.) OR references the key concept.

3. Add “difficulty” parameter support.
   - Use `task.params.difficulty` to tune distractor subtlety and question style.

**Acceptance criteria**

- Unit tests prevent reintroduction of placeholder/garbage distractors.
- At least one new test asserts rationale quality.

---

## P1 (should ship)

### P1.1 — Gap tags in CourseView / LessonReader (actionable loop)

- Show a small “Needs review: {tags}” badge on LessonReader when mastery has gaps.
- In CourseView, show per-lesson badges (e.g., “Review due”, “Quiz gap”) alongside mastery level.

### P1.2 — Better gap matching (tag → lesson)

- Implement a lightweight mapping from `gapTag` to lesson candidates:
  - normalized string match against lesson title
  - optionally also search within lesson headings/summary (if available)
- Keep deterministic + local-only.

### P1.3 — Limit thrash: debounced daily refresh

- Dashboard currently refetches `/daily` on `state.courses.length` and `completedLessons.size` changes.
- Add a short debounce to avoid flicker during pipeline completion bursts.

### P1.4 — Persist quiz question set (auditability)

- Store last quiz questions/answers (redacted) per lesson for debugging and future “review your mistakes” UI.
- Minimal: store in events meta (already) but add structured retrieval endpoint.

---

## P2 (nice to have)

### P2.1 — Reason taxonomy cleanup

- Today `reasonTag` includes `new` and `other` but API never emits them.
- Either implement or remove to avoid dead UI states.

### P2.2 — /daily multi-item composition

- Allow mixing: 1 quiz_gap + 1 review + 1 continue (instead of pure priority order), to feel more human.

### P2.3 — Mindmap gap visualization

- If gaps exist for a lesson, tint the corresponding node/edge or add an icon.

---

## Known gaps vs spec (FYI)

From `LearnFlow_Product_Spec.md`:

- Full agent mesh / K8s / vector DB are future-state; MVP is correctly single-node.
- API spec lists `/api/v1/analytics` but MVP may not implement it fully; keep focus on mastery loop rather than broadening surface area.
