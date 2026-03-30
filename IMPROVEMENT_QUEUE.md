# IMPROVEMENT_QUEUE — Iter143

Status: **IN PROGRESS**

Owner: Builder

Date: 2026-03-30

Scope (per Iter143 brief)

- Read **full LearnFlow spec** and compare vs implementation (UI/API/agents)
- Inspect codepaths for adaptive loop, quiz rationales, conceptTags, quiz_gap + /daily
- Run: `npm test` + Playwright (iter136/iter137/iter138)
- Capture key screens (Playwright screenshot script)

---

## Evidence captured (this run)

### Automated tests

- `npm test` (turbo/vitest): **PASS**
- Playwright:
  - `e2e/iter136-smoke-assertions.spec.ts`: **PASS**
  - `e2e/iter137-key-screens.spec.ts`: **PASS**
  - `e2e/iter138-adaptive-loop.spec.ts`: **PASS**

### Screenshots

- `npm run screenshots` saved to:
  - `/home/aifactory/.openclaw/workspace/learnflow/learnflow/screenshots/iterunknown/run-001/desktop`
  - `/home/aifactory/.openclaw/workspace/learnflow/learnflow/screenshots/iterunknown/run-001/mobile`

---

## Brutally honest spec → implementation gaps (high-signal)

### A) Spec “future-state” vs MVP reality (expected, but should be labeled prominently)

The spec describes gRPC agent mesh, Postgres + vector DB + Redis + S3, scheduled agents, etc. The repo is explicitly a **single-node MVP** (Express + SQLite + keyword routing). That’s fine, but the spec is still written like it’s already true. This causes continuous confusion and “false non-bugs” in reviews.

**Action:** Keep the spec, but add a clear “MVP vs Planned” banner and ensure sections consistently label what is implemented.

### B) Adaptive learning loop exists, but the _core data contract is inconsistent_

- `/daily` can surface `reasonTag: 'quiz_gap'` and uses mastery `gapsJson`.
- Mastery persistence expects **normalized gap tags** (`gapTags`) to drive matching.
- Client quiz submission currently sends `meta.gaps` but **does not reliably send normalized tags**.
  - Client reducer (`SUBMIT_QUIZ`) creates `quiz.gaps` from **question text**.
  - LessonReader persists `meta.gaps: (quiz as any).gapTags || quiz.gaps || []`.
  - But `gapTags` is basically never set on the client quiz object.

Net: “quiz_gap” recommendations will often be driven by raw question strings or weak tags, not stable concept tags.

### C) Quiz rationales exist in the agent schema, but are not used end-to-end

- `ExamAgent` generates MCQs with `rationale: { correct, perOption[], commonMistake }` (Iter141).
- The UI quiz panel does not display per-option rationales; it mainly shows a score and (optionally) a gaps list.
- There’s no API contract test ensuring the quiz payload includes `rationale` consistently.

Net: the most useful learning feature (actionable feedback) is present in code but largely invisible to learners.

### D) conceptTags are generated on API responses but not meaningfully surfaced in UI

- API computes `lesson.conceptTags` via `extractConceptTagsFromLesson` and normalizes in `/daily`.
- Client doesn’t display lesson concept tags, doesn’t use them to explain recommendations, and doesn’t use them to generate gapTags after a quiz.

Net: tags exist, but they aren’t closing the loop.

---

## Iter143 P0: user-reported UX bugs (this run)

1. Mobile: button rows overflow (LessonReader floating toolbar + button groups)
   - [x] Floating selection toolbar now has `max-w-[calc(100vw-1rem)]` + horizontal scroll container.
   - [x] Toolbar button labels collapse on small screens (`hidden sm:inline`) to avoid overflow.
   - [x] Other LessonReader horizontal button groups switched to `flex-wrap`.

2. Settings upgrade: 404 when upgrading subscription / view plans
   - [x] Marked pricing links with `data-link="pricing"`.
   - [x] Added global click interceptor to redirect `/pricing` to apps/web pricing page (configurable via `VITE_WEB_ORIGIN`).

3. Illustrate UX: pick from image search (Wikimedia) OR generate via prompt
   - [x] Added provider toggle (Wikimedia vs Generate) in selection-tool preview UI.
   - [x] API `selection-tools/preview` now supports `provider` for `illustrate` and will use Wikimedia search when selected.

4. Add Dig Deeper button next to Illustrate
   - [x] Added `dig_deeper` selection tool preview route on API + UI button.
   - [x] Applies as a reversible annotation overlay (stored as an annotation note, not destructive rewrite).

---

## Iter143 improvement queue (10–15 tasks)

### P0 — Learning loop correctness (must)

1. **Wire normalized quiz gap tags end-to-end**
   - Goal: mastery.gaps should be stable tags, not question text.
   - Options:
     - (Preferred) When quiz is generated, include `gapTags`/`conceptTags` per question; store on client quiz state.
     - (Fallback) Derive `gapTags` client-side from question text using the same canonicalizer used server-side.
   - Acceptance:
     - `POST /events type=quiz.submitted meta.gaps` contains canonical tags (lowercase, normalized).
     - `/daily` quiz_gap logic recommends based on those tags.

2. **Make `/events` explicitly support `meta.gapTags` (and keep `meta.gaps` for back-compat)**
   - Today, server appears to treat `gapTags` separately (db helper signature suggests this), but the route layer doesn’t make it obvious.
   - Acceptance: OpenAPI + tests enforce allowed fields and behavior.

3. **Fix gap → lesson matching algorithm to prioritize lesson.conceptTags intersection**
   - If a gap tag matches lesson.conceptTags, rank it above title substring matches.
   - Keep deterministic ordering to avoid test flake.

4. **Expose quiz rationales in LessonReader UI after submission (per-option)**
   - Show:
     - why correct is correct
     - why each distractor is wrong
     - common mistake
   - Keep it compact and scannable (collapsible per question).

5. **Update mastery based on quiz score consistently (client + API)**
   - Ensure quiz score is persisted and visible in CourseView (already has last quiz badge), but also ensure gapsJson includes `lastScore` and timestamps (it does in db layer; verify route writes it for all quiz events).

### P1 — Explainability + UX (should)

6. **“Why am I seeing this?” for Today’s Lessons**
   - Dashboard should allow expanding an item to see:
     - reasonTag + reason
     - for quiz_gap: top tag(s), lastSeenAt, count, lastScore
     - for review: nextReviewAt

7. **Show lesson conceptTags somewhere user-facing (CourseView or LessonReader)**
   - Even as a small “Concepts” chip row.
   - Use it to build user trust that recommendations are grounded.

8. **Add a micro-remediation flow for quiz gaps (3-question targeted check)**
   - Trigger when opening a lesson recommended due to quiz_gap.
   - On success, reduce/remove the gap signal for that tag.

9. **Contract test: quiz payload includes rationales + consistent question ids**
   - Add a vitest test verifying `ExamAgent.generateMultipleChoiceQuestions()` outputs rationale with correct `perOption.length === options.length`.

10. **E2E test: dashboard shows Quiz gap pill when gaps exist**

- We already have Today’s Lessons reason coverage (Iter137) and adaptive loop API coverage (Iter138), but not a concrete “quiz_gap pill appears” assertion.

### P2 — Spec hygiene + maintainability (nice-to-have but high leverage)

11. **Spec doc: annotate each major section with IMPLEMENTED vs PLANNED**

- Especially §3 System Architecture, §4 Multi-Agent Architecture, §9 Behavioral Tracking.
- This reduces repeated churn and makes compliance reviews honest.

12. **Single canonical tag normalizer shared across agent + API + client**

- Today: agent uses `toTag()` heuristic; API has `canonicalizeConceptTag()`.
- Create one canonical function in `packages/shared` and import it everywhere.

13. **Telemetry (local-only) for loop completion**

- Track: quiz submitted → gap tag saved → daily recommends → lesson opened → remediation passed.
- Helps validate the loop without needing production analytics.

14. **Surface “quiz_gap” reasonTag consistently**

- UI currently renders `Quiz gap` label, but the e2e test expects raw reasonTag strings (`quiz_gap`). Align display + accessibility name.

15. **OpenAPI update + docs**

- Document `/daily` response fields: `reasonTag`, `reason`, and any explainability payload added.
- Document quiz event schema clearly.

---

## Code pointers (for builder)

- `/daily` quiz gap logic + conceptTags normalization:
  - `apps/api/src/routes/daily.ts`
  - `apps/api/src/utils/conceptTags.ts`

- Mastery persistence of gaps (stores `tag,lastSeenAt,count,lastScore`):
  - `apps/api/src/db.ts` (`applyQuizSubmitted` and gaps merge)

- Quiz generation + rationales + gapTags heuristic:
  - `packages/agents/src/exam-agent/exam-agent.ts`

- Client quiz submission to events (currently uses `quiz.gaps` fallback):
  - `apps/client/src/screens/LessonReader.tsx` (`QuizPanel.handleSubmit`)
  - `apps/client/src/context/AppContext.tsx` (`SUBMIT_QUIZ` builds gaps from question text)

---

## Bottom line

The adaptive loop is **real** and tests are green, but the product’s learning value is capped by an inconsistent data contract:

- tags exist (lesson.conceptTags, server canonicalization)
- rationales exist (ExamAgent)
- but the client does not persist normalized gaps nor show rationales

Fixing the end-to-end contract (P0 items) is the fastest path to a noticeably smarter, more trustworthy LearnFlow.
