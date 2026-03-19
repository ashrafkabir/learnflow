# IMPROVEMENT_QUEUE

Iteration: 36
Status: READY FOR BUILDER
Date: 2026-03-19
Theme: **Brutal spec gap closure (core learning loop + marketplace realism) + mobile home fix**

## Brutal Assessment (evidence-driven)

Iteration 35 shipped real improvements (icon system, tap-target fix, mobile screenshot script). But compared to the **Product Spec v1.0**, LearnFlow is still far from “agentic learning OS” and reads like a responsive demo with placeholders.

**Evidence (local runs + screenshots):**

- Iter 35 deliverables landed:
  - New calm line icons exist in `apps/client/src/components/icons/` ✅
  - `screenshot-mobile.mjs` exists and runs ✅
  - Mobile button shrink override removed (grep for `h-6 w-6 p-0` found none) ✅
- Mobile screenshots were regenerated (320/375/414) under:
  - `evals/screenshots/iter35-mobile/` ✅
  - Additional authed mobile set created for Iter 36 validation: `evals/screenshots/iter36-mobile-authed/` ✅
- **Major mobile UX bug remains:** `mobile-320__home.png` shows **massive empty whitespace** (page becomes extremely tall with long blank sections). This is a high-severity “looks broken” issue.
- The mobile screenshot script captures routes unauthenticated, so **marketplace routes redirect to /login** unless we seed `learnflow-token` and `learnflow-onboarding-complete`. That’s expected from `OnboardingGuard`, but it means current script output can be misleading without auth seeding.
- Many screens still contain emoji/icon placeholders across the app (43 TSX files contain emoji-like chars; e.g. Marketplace headers show `🏪`, `🤖`). This conflicts with the “cohesive icon system” goal.

## What matters vs spec (big gaps)

The spec’s differentiators are **multi-agent orchestration, attribution, mastery loop (notes/quizzes/progress), and a credible marketplace + creator economy**.

Right now:

- Multi-agent orchestration is mostly implied, not delivered as a coherent in-product experience.
- Citations/attribution and source drawer are not consistently present.
- Lesson loop (≤10 min, objectives/takeaways, action bar, quizzes, notes formats) is incomplete/inconsistent.
- Marketplace feels like a static catalog; creator publishing/moderation/reviews/earnings are thin.

---

## Prioritized Task Queue (12) — biggest spec gaps first

### 1) Fix Mobile Home Page “Blank Scroll Abyss” (P0)

**Problem:** `evals/screenshots/iter35-mobile/mobile-320__home.png` shows a _massive vertical void_ making the product look broken on first impression.

**Fix:** Identify the element(s) creating the huge height (likely `min-h/height:100vh` stacking, spacer div, or absolute layout mis-measure). Remove/replace with content-driven layout; compress section spacing for mobile.

**Acceptance:** On 320/375/414: meaningful content appears within the first ~2 scrolls; no enormous empty whitespace; total page height reasonable (subjective but obvious improvement).

### 2) Make screenshot automation reflect reality: seed auth + onboarding in `screenshot-mobile.mjs` (P0)

**Problem:** Spec coverage requires viewing real app screens; unauthenticated runs redirect `/dashboard`, `/marketplace/*`, etc. to `/login`, producing misleading “screenshots of auth page.”

**Fix:** Update `screenshot-mobile.mjs` to optionally run in _authed mode_:

- add init script setting:
  - `learnflow-token = 'dev'`
  - `learnflow-onboarding-complete = 'true'`
  - `onboarding-tour-complete = 'true'`
- add env flag: `SCREENSHOT_AUTHED=1` to enable.
- output to `evals/screenshots/iter36-mobile/` (not iter35 folder).

**Acceptance:** Running `SCREENSHOT_AUTHED=1 node screenshot-mobile.mjs` produces mobile screenshots where marketplace/dashboard/etc show correct pages, not `/login`.

### 3) Replace remaining emoji icons across _all_ primary screens with the new icon set (P0)

**Problem:** Emoji remain in headers and cards (e.g., `🏪 Course Marketplace`, `🤖 Agent Marketplace`). This undermines the “calm line icon system” work.

**Fix:** Replace emoji usage with icons from `apps/client/src/components/icons/` (and add any missing icons needed). Ensure aria labels are correct.

**Acceptance:** For primary flows (Dashboard, Conversation, CourseView, LessonReader, Mindmap, Marketplace, Pipelines, Settings, Auth, Onboarding): no emoji icons used for UI meaning.

### 4) Deliver the spec-required Lesson Reading Experience (P0)

**Spec refs:** §5.2.4, §6.2

**Missing/weak:**

- Lesson objectives, key takeaways, next steps, quick check questions are not consistently structured.
- “<10 min” estimated read time should be visible and enforced.
- Bottom action bar is required: **Mark Complete, Take Notes, Quiz Me, Ask Question**.

**Fix:** Standardize lesson schema + UI rendering to always include:

- estimated time badge
- objectives section (2–3 bullets)
- key takeaways (3–5)
- sources block
- next steps
- bottom action bar (sticky, safe-area aware)

**Acceptance:** In LessonReader screenshot: all required sections appear; action bar present; mobile safe-area ok.

### 5) Notes Agent UX: Cornell + Flashcards + Zettelkasten outputs (P0)

**Spec refs:** §4.2, §5.2.3, §8 (export)

**Fix:** Implement notes generation UX from LessonReader action bar:

- user chooses format
- notes rendered in structured sections
- flashcards view supports Q/A flip or list
- persist to course/lesson context (not “session only”)

**Acceptance:** User can generate notes in all 3 formats from a lesson and revisit later.

### 6) Exam/Quiz loop: adaptive quizzes + scoring + gap identification (P1)

**Spec refs:** §4.2 Exam Agent, §6.2 Quick Check

**Fix:**

- Quiz generation from LessonReader / CourseView
- Support multiple-choice + short-answer
- Scoring + explanations
- Store “knowledge gaps” and surface them in Dashboard

**Acceptance:** User can take a quiz, get score + explanations, and see gaps persisted.

### 7) Attribution & Sources: make citations real and visible everywhere (P1)

**Spec refs:** §5.2.3, §6.3

**Fix:**

- Source drawer: per lesson and per course
- Inline citations (at least simple `[1]` style) tied to source drawer
- Capture/display: URL, author, publication date, access timestamp

**Acceptance:** Lessons show citations; sources drawer lists credible sources; links open.

### 8) “Agent transparency” experience: activity indicator + which-agent/why (P1)

**Spec refs:** Design principles §5.3, Conversation §5.2.3

**Fix:** Make the Orchestrator feel like it is coordinating:

- visible “Agent working: Research / Notes / Exam…” indicator
- “why this agent” short explanation
- progress states in conversation

**Acceptance:** During generation, UI clearly shows which agent is active and why.

### 9) Marketplace realism: reviews, creator profile, and course detail completeness (P1)

**Spec refs:** §5.2.7, §7.1

**Fix:** Course detail page must include:

- syllabus preview
- creator profile
- reviews/ratings distribution
- price + enroll CTA

**Acceptance:** CourseDetail looks and behaves like a real marketplace product page.

### 10) Creator dashboard: publishing flow + analytics + earnings (P1)

**Spec refs:** §5.2.7, §7.1

**Fix:** Implement creator publish lifecycle:

- build/import course
- quality checks (min lessons, attribution compliance)
- price setting
- moderation status (queued/approved/rejected)
- analytics: views, enrollments, conversion
- earnings summary

**Acceptance:** Creator can publish a course end-to-end (even if “moderation” is simulated) with visible status and analytics.

### 11) Profile & Settings parity: API key vault + usage stats + export (P1)

**Spec refs:** §4.4, §5.2.8, §8

**Fix:**

- API key provider management UI (OpenAI/Anthropic/etc)
- key validation feedback
- usage stats view (tokens/cost approx)
- export: Markdown (free) + PDF/SCORM placeholders (Pro) with gated UI

**Acceptance:** Settings contains vault + usage stats + export panel.

### 12) Pro tier hooks: proactive updates + subscription management UX (P2)

**Spec refs:** §8

**Fix:**

- subscription screen includes clear Free vs Pro comparison
- Pro-only features visible but gated
- proactive update “alerts” surfaced in notifications (can be mocked initially)

**Acceptance:** User can see/manage tier; dashboard shows Pro “Update Agent” notifications when enabled.

---

## Notes for Builder

- **Do not** treat “auth bypass” as a product feature. It should remain dev/eval-only.
- Mobile automation should support both unauthenticated (marketing + auth + onboarding) and authenticated coverage.
- Prioritize **core learning loop** before expanding secondary screens.
