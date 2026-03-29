# LearnFlow — Improvement Queue (Iter138)

Owner: Builder  
Planner: Ash (planner subagent)  
Last updated: 2026-03-29

Status: **IN PROGRESS**

This queue is the **next 10–15 highest-leverage tasks** for Iter138, based on:

- Full spec review: `LearnFlow_Product_Spec.md` (esp. §§4–6, 10–12)
- Code inspection (client/api/agents)
- Runtime checks executed today:
  - `npm test` (PASS)
  - Playwright: `e2e/iter137-key-screens.spec.ts` (PASS)
  - Playwright: `e2e/iter136-smoke-assertions.spec.ts` (PASS)
- Screenshots captured (desktop + mobile) and synced to OneDrive:
  - `/home/aifactory/onedrive-learnflow/iter138/evidence/screenshots-desktop-run-2026-03-29/`
  - `/home/aifactory/onedrive-learnflow/iter138/evidence/screenshots-mobile-2026-03-29/`

---

## Topline assessment (brutally honest)

Iter137 improved marketplace enrollment import, BYOAI provider selection test, and sources drawer provenance UI.

However, the **core adaptive learning loop** is still mostly a _promise_, not a _system_:

- Quiz results are only persisted as an **event log** (best-effort telemetry). There is no first-class quiz model, no stable per-lesson “last score”, and no UI badges in CourseView.
- “Mastery” is still effectively **lesson completion coloring**; no mastery model, no spaced repetition, no review scheduling.
- Notes CRUD exists server-side, but the product loop (generate → edit → revisit → export with correct formats) is not convincingly surfaced as a first-class user journey.
- The pipeline is OpenAI-web-search-only in practice, but the repo still ships substantial Firecrawl/Tavily provider code + tests, which creates ongoing spec-drift risk.

Iter138 should therefore prioritize **mastery + personalization primitives** and then wire them into **Today’s Lessons**, CourseView, Mindmap semantics, and Export.

---

## P0 (must ship) — Adaptive learning loop (mastery + quiz persistence)

### 1) P0 — Create a first-class Mastery model (per concept/lesson) and derive it from events

**Problem**: Spec positions LearnFlow as mastery-based + adaptive. Today we have lesson completion + quiz telemetry events, but no durable mastery representation.

**Acceptance criteria (DONE in this builder run)**

- ✅ Added durable server-side mastery store (SQLite table `mastery`) keyed by `(userId, courseId, lessonId)` with:
  - `masteryLevel` (0–1)
  - `lastStudiedAt`, `nextReviewAt`
  - `lastQuizScore`, `lastQuizAt`
  - `gapsJson` (best-effort)
- ✅ Server derives mastery updates from existing events:
  - `lesson.completed` increments mastery and schedules review
  - `quiz.submitted` updates score/gaps and schedules review
- ✅ Added API endpoints:
  - `GET /api/v1/courses/:id/mastery`
  - `GET /api/v1/courses/:id/lessons/:lessonId/mastery`
- ✅ Added test coverage: `apps/api/src/__tests__/mastery-events.test.ts`

---

### 2) P0 — Make quiz results visible + stable in the learner UI (CourseView + LessonReader)

**Builder note (DONE in this builder run)**: Implemented mastery/quiz UI surfaces in CourseView and LessonReader.
Badges are labeled as a **learning estimate** (best-effort), not a guarantee.

**Problem**: Quizzes exist, but the product doesn’t _feel_ like it tracks learning.

**Acceptance criteria (DONE in this builder run)**

- ✅ CourseView lesson rows show:
  - `Mastery` badge (New/Learning/Solid/Mastered — learning estimate)
  - `Review due` chip (shown when nextReviewAt is within 24h — best-effort)
  - `Last quiz: 80%` (or `No quiz yet`)
  - `Next review: <date>` when present
- ✅ LessonReader shows a top-bar `Review due` banner (>=sm) when review is within 24h.
- ✅ Added client unit tests:
  - `apps/client/src/__tests__/iter138-mastery-badges.test.tsx`
  - `apps/client/src/__tests__/iter138-lesson-reader-review-banner.test.tsx`
- ✅ Added Playwright spec + screenshots:
  - `e2e/iter138-mastery-badges.spec.ts`
  - `e2e/screenshots/iter138-courseview-mastery-badges.png`
  - `e2e/screenshots/iter138-lessonreader-review-due-banner.png`

(“Saved vs not saved” for quiz persistence is still best-effort and currently only surfaced via existing quiz UI state; full explicit save-state UI is deferred.)

---

### 3) P0 — Spaced repetition scheduling (MVP) integrated into Today’s Lessons (DONE in this builder run)

**Problem**: Spec §5.2.2 “Today’s Lessons” implies a prioritized daily queue. Current logic is mostly “continue next uncompleted”.

**Acceptance criteria (DONE in this builder run)**

- ✅ Implemented MVP scheduler rule:
  - includes up to N review lessons whose `nextReviewAt <= now` (from `mastery` table)
  - includes “continue” lessons per course (next uncompleted)
  - never recommends completed lessons
  - (Quiz-gap prioritization is deferred; we only emit `review`/`continue` for now.)
- ✅ API `/api/v1/daily` returns stable items with `reasonTag` and `reason` reflecting `review` vs `continue`.

---

## P0 (must ship) — Research workflow depth + spec alignment

### 4) P0 — Lock down OpenAI web*search-only across pipeline \_and* agents package (remove ambiguous provider paths)

**Problem**: Spec §6.1.1: MVP constraint is OpenAI web_search only. Repo still contains Firecrawl/Tavily providers + tests. Even if not used at runtime, it’s drift risk.

**Acceptance criteria**

- Runtime: pipeline must not attempt Tavily/Firecrawl in non-test environments.
- Tests:
  - Remove or quarantine Firecrawl/Tavily provider tests into an explicit “future/legacy” suite, OR hard-gate them behind env (e.g., `ALLOW_NON_OPENAI_RESEARCH=1`).
  - Update `pipeline-auth-logging.test.ts`: stop implying “Force Tavily to be attempted first.” If kept, it must be explicitly labeled as **legacy logging regression** and must not drive runtime behavior.
- Add a single test asserting non-test pipeline logs always include `research.provider=openai_web_search` and never include `Tavily`/`Firecrawl`.

---

## P1 (high value) — Notes + exports become a real product loop

### 5) P1 — Notes become first-class: in-lesson editor + list/revisit surface

**Problem**: Notes API exists (`/courses/:id/lessons/:lessonId/notes`) but the user journey is easy to miss.

**Acceptance criteria**

- LessonReader has a clear “Notes” surface that supports:
  - generate (cornell/zettelkasten/flashcards/summary)
  - edit
  - auto-save + explicit save status
- CourseView lesson rows show a “Notes” indicator if notes exist.
- Add “Notes Library” (per course) OR a Settings section that lists notes by course/lesson.

---

### 6) P1 — Export completeness: ensure notes formats + flashcards JSON are exported predictably

**Problem**: Export includes `notesByLessonId`, but the notes formats are not guaranteed structured, and flashcards aren’t reliably parseable.

**Acceptance criteria**

- Define and enforce a minimal notes export schema:
  - Cornell: `{ cueQuestions: string[], notesMarkdown: string, summary: string }`
  - Flashcards: `{ cards: { front: string, back: string }[] }`
  - Keep `text` for human readability, but also include structured fields.
- Update export ZIP to include separate files:
  - `notes/lesson-<id>.md`
  - `notes/lesson-<id>.json`
  - `flashcards/course-<id>.json`

---

## P1 (high value) — Collaboration + marketplace trust and depth

### 7) P1 — Collaboration: make the current truth unmissable and add one real utility

**Problem**: Collaboration is CRUD + synthetic matching; needs clearer value without pretending it’s real-time matchmaking.

**Acceptance criteria**

- Ensure synthetic disclosure is shown in:
  - collaboration screen
  - any dashboard “collab” card/CTA
- Add one non-trivial utility:
  - “Share a course to group” (posts a course link)
  - or “Schedule a study session” (simple event object stored server-side)

---

### 8) P1 — Marketplace import: import real content (not placeholders) when available

**Problem**: Current enroll/import creates a minimal shell derived from `lessonCount`. That’s fine for Iter137, but it doesn’t deliver “course content”.

**Acceptance criteria**

- When enrolling in a marketplace course, import the full module/lesson structure + lesson content (or a truthful stub that requires regeneration with BYOAI).
- The imported course clearly shows provenance:
  - `Imported from marketplace course <id>`
  - what is copied vs what must be regenerated

---

## P2 (quality/reliability) — Harden the loop and reduce user confusion

### 9) P2 — Mindmap semantics: show mastery (not just completion) and add “review due” affordance (DONE in this builder run)

**Acceptance criteria (DONE in this builder run)**

- ✅ Mindmap lesson node coloring uses mastery store rather than only completion.
  - New: gray (#9CA3AF)
  - Learning: amber (#F59E0B)
  - Solid: blue (#2563EB)
  - Mastered: green (#16A34A)
- ✅ Lesson nodes with `nextReviewAt <= now` render as a ★ (vis-network `shape: 'star'`) and slightly larger size.
- ✅ Updated in-UI legends (header + overlay) to mastery buckets and include “★ = review due”.
- ✅ Added unit test update: `apps/client/src/__tests__/mindmap.test.tsx` asserts mastery legend labels.
- ✅ Added Playwright spec + screenshot evidence:
  - `e2e/iter138-mindmap-mastery-legend.spec.ts`
  - `e2e/screenshots/iter138-mindmap-mastery-legend.png`

(Real-time updates when mastery changes are not wired; state updates on refresh/reload, which satisfies MVP.)

---

### 10) P2 — Add a single “Learning State” diagnostics panel (dev-only)

**Acceptance criteria**

- In dev, show:
  - Today’s Lessons reason breakdown counts
  - mastery summary counts (not started / in progress / mastered)
  - nextReviewAt soonest 3 items
- Never show keys or secrets.

---

### 11) P2 — E2E: Add an Iter138 “adaptive loop” Playwright spec

**Acceptance criteria**

- `e2e/iter138-adaptive-loop.spec.ts` runs deterministic flow:
  1. create or open a known course
  2. open lesson
  3. generate quiz → submit
  4. verify CourseView shows last quiz badge
  5. verify `/daily` includes a `quiz_gap` or `review` item

---

### 12) P2 — Billing/IAP polish: keep mock flows truthful and consistent

**Acceptance criteria**

- Any paid action is clearly marked **Mock checkout**.
- Upgrade CTAs route correctly from all screens.
- Subscription tier changes are reflected immediately in UI and diagnostics.

---

## Builder sequencing recommendation

1. P0.1 mastery store + derivation from events
2. P0.2 quiz badges + stable UI
3. P0.3 spaced repetition scheduler + Today’s Lessons
4. P0.4 provider lockdown across code + tests
5. P1 notes surfaces + export hardening
6. P1 marketplace real import
7. P2 mindmap mastery semantics + adaptive-loop e2e
