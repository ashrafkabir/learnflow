# LearnFlow — Improvement Queue (Iter137)

Owner: Builder  
Planner: Ash (planner subagent)  
Last updated: 2026-03-29

Status: **IN PROGRESS (BUILDER)**

This queue is the **next 10–15 highest-leverage tasks** for Iter137, based on:

- Full spec review: `LearnFlow_Product_Spec.md`
- Code inspection (client/api/agents)
- Playwright smoke + screenshots

## Evidence pack (Iter137)

Primary (synced to OneDrive):

- Desktop key screens: `/home/aifactory/onedrive-learnflow/iter137/evidence/screenshots-iterunknown/run-2026-03-29/*.png`
- Mobile key screens (320/375/414): `/home/aifactory/onedrive-learnflow/iter137/evidence/screenshots-iterunknown/mobile-2026-03-29/*.png`
- Playwright artifacts: `/home/aifactory/onedrive-learnflow/iter137/evidence/playwright/*`

Runtime checks performed:

- Playwright smoke: `e2e/iter136-smoke-assertions.spec.ts` (PASS)
- Screenshot runs: `node screenshot-all.mjs`, `node screenshot-mobile.mjs` (PASS)

---

## Topline assessment (brutally honest)

The product has **many of the screen shells** described in §5.2 (dashboard, conversation, mindmap, marketplaces, settings, onboarding) and has a **solid testing harness**.

However, multiple **spec-critical loops** are still “thin” or non-evidenced end-to-end:

- Quizzes/exams: generation exists, but **persistence + mastery feedback loop** is under-specified/under-evidenced in UI.
- Notes generation: exists, but **save/revisit/export** loop is weak.
- Research: spec says **OpenAI web_search only** for MVP research pipeline; repo contains both OpenAI web_search provider and Firecrawl/Tavily legacy. Needs strict enforcement + disclosure.
- Marketplace creator flow: API tests show create→quality→publish, but UI evidence doesn’t clearly show a reliable creator publish loop.
- Mindmap: renders, but **semantics/mastery states** look mostly cosmetic; needs clear mapping from course concepts and progress.

Iter137 should focus on turning these into **credible, spec-aligned end-to-end flows** (not more screens).

---

## P0 (must ship) — Spec-critical learning loop correctness

### 1) P0 — Make quiz results persistent + visible in the learner loop

**Problem**: Spec (§4.2 Exam Agent, §5.2 Home Dashboard, §5.2 Course View) expects quiz scores feeding mastery/adaptation. Current client tracks quiz state in app context, but the end-to-end loop (generate → answer → score → persist → reflect in UI) is not clearly complete.

**Acceptance criteria**

- After completing a quiz, score + identified gaps are persisted server-side against (userId, courseId, lessonId/moduleId).
- CourseView and/or LessonReader shows a **“Last quiz score”** badge per lesson/module.
- Dashboard streak/progress includes **quiz activity** (even if mastery scoring remains “planned”, show “Quiz completed” events).
- API contract: `GET /api/v1/courses/:id` (or dedicated endpoint) returns quiz summary fields.

**Evidence pointers**

- UI screenshots show LessonReader includes a Quiz panel: `.../lesson-reader.png` (desktop/mobile).
- Code pointers: `apps/client/src/context/AppContext.tsx` (quiz state + scoring), `packages/agents/src/exam-agent/*`.

---

### 2) P0 — Notes must be saved, revisitable, and exportable (Cornell + flashcards)

**Problem**: Spec (§4.2 Notes Agent, §5.2 Profile & Settings export) implies notes are first-class artifacts. Today notes generation exists, but the “save → list → reopen → export” loop is not credibly demonstrated.

**Acceptance criteria**

- From LessonReader (or Conversation), user can generate notes and **Save** them.
- User can revisit saved notes from:
  - CourseView (lesson row)
  - Settings → Export (or a Notes library)
- Export includes notes in both:
  - Markdown (Cornell)
  - JSON (flashcards array)
- Notes are tied to stable ids and include provenance (courseId, lessonId, createdAt).

**Evidence pointers**

- API already has export tests; extend with notes inclusion.
- Spec references Export Agent packaging courses/notes/progress.

---

### 3) P0 — Enforce “OpenAI Web Search only” for the pipeline (remove/disable Firecrawl/Tavily paths in non-test)

**Problem**: Spec §6.1.1 explicitly says MVP research uses **OpenAI web_search only** and must **not** use Firecrawl/Tavily. Repo still contains Firecrawl/Tavily provider code paths and tests referencing them. Even if currently unused in runtime, this is a compliance/trust risk.

**Acceptance criteria**

- In non-test builds, pipeline discovery uses only `searchAndExtractTopic` (OpenAI web_search provider).
- Firecrawl/Tavily providers are:
  - either removed, or
  - hard-gated behind explicit env flags + UI disclosure, and **not used by default**.
- Pipeline logs explicitly record provider as `openai_web_search`.
- Add a test asserting pipeline provider selection cannot fall back to Firecrawl/Tavily in non-test.

**Evidence pointers**

- Spec constraint: `LearnFlow_Product_Spec.md` §6.1.1.
- Runtime uses OpenAI web_search in `apps/api/src/routes/pipeline.ts` (confirm + lock it down).

---

### 4) P0 — Creator publish flow must be operable end-to-end from the UI

**Problem**: Spec §7 expects: create course → quality review → publish to marketplace with creator profile. API tests show this exists, but UI evidence set doesn’t show a reliable full path.

**Acceptance criteria**

- In client UI, a creator can:
  1. create a course (or select an existing course)
  2. run a quality check
  3. publish (free or paid; paid clearly marked “mock billing”)
  4. see the published course appear in marketplace browse + detail
- The publish screen shows clear, truthful disclaimers:
  - mock billing
  - no real payouts
  - what’s visible publicly in this sandbox

**Status (builder update 2026-03-29)**

- Implemented: CreatorDashboard now loads user's library via `GET /api/v1/courses` and allows selecting a **real course** to publish (sends `courseId` in publish payload). This makes the listing grounded in actual course content instead of purely synthetic fields.
- Screenshot harness updated to capture `/marketplace/creator` on desktop + mobile.

**Evidence (OneDrive)**

- Desktop: `/home/aifactory/onedrive-learnflow/iter137/iter137/run-2026-03-29/marketplace-creator-dashboard.png`
- Mobile: `/home/aifactory/onedrive-learnflow/iter137/iter137/mobile-2026-03-29/mobile-320__marketplace-creator-dashboard.png` (also 375/414)

**Remaining gap**

- DONE in code: Added Playwright e2e `e2e/iter137-creator-publish-flow.spec.ts` covering select course → publish → marketplace shows it (deterministic via dev-only fixture gate).

**Evidence pointers**

- Screens: marketplace + creator dashboard.
- API tests: `apps/api/src/__tests__/marketplace.test.ts`.

---

### 5) P0 — Mindmap must be derived from real course concepts + show progress semantics

**Problem**: Spec §5.2.5 expects nodes=concepts and color-coded progress. Current mindmap renders, but semantic linkage to courses and progress/milestones is unclear.

**Acceptance criteria**

- On first course creation, mindmap is populated from the course outline (modules/lessons + extracted concepts).
- Node state derives from:
  - lesson completion (MVP), and
  - optionally quiz completion (bonus)
- Clicking a node navigates predictably to the related lesson(s).
- Empty state when no courses (no “mystery nodes”).

**Evidence pointers**

- Screens: `.../app-mindmap.png`, `.../app-dashboard.png`.
- Agents: `packages/agents/src/mindmap-agent/*`.

---

## P1 (high value) — Personalization + “daily lesson” loop

### 6) P1 — “Today’s lessons” must be non-placeholder and driven by an algorithmic rule

**Problem**: Spec §5.2.2 expects Today’s Lessons prioritized queue. Current UI shows a section, but the logic and persistence of a daily queue is not clearly evidenced.

**Acceptance criteria**

- API endpoint returns a stable daily list (per user) with:
  - lesson ids
  - reason tags (e.g., “continue”, “review”, “new concept”, “based on quiz gap”)
- UI shows the reason (small label) and supports one-tap start.
- Completion updates the queue.

**Evidence pointers**

- API has `daily-lessons` test; extend UI to surface reasons.

---

### 7) P1 — Research Agent: citations + provenance UI (sources drawer) must work consistently

**Problem**: Spec emphasizes attribution. LessonReader has a Sources/Attribution drawer; ensure it’s consistently populated from stored research artifacts rather than ad-hoc strings.

**Acceptance criteria**

- Sources drawer always shows structured fields when available:
  - title, url, publisher/domain, author, accessedAt/capturedAt, credibility
- Lesson body citations map to source ids.
- Export JSON includes stable source ids + timestamps (already tested; ensure UI aligns).

**Evidence pointers**

- Client has tests around credibility; reinforce runtime parity.

---

### 8) P1 — BYOAI provider selection & validation: unskip the missing test and finish the UX

**Problem**: Spec §4.4 expects provider selection, key vault, validation, and clear failure messaging. There is a skipped API test (`byoai-provider-selection.test.ts`). That’s a red flag.

**Acceptance criteria**

- Unskip and pass provider selection test:
  - stored active key provider
  - per-request override
  - provider inference for common key prefixes
- Onboarding API key step validates format and does a best-effort provider check.
- Clear UI error states when key invalid/exhausted.

**Evidence pointers**

- API route: `apps/api/src/routes/chat.ts` includes format-only validation; complete the loop with real validation endpoints.

---

### 9) P1 — Marketplace “enroll” should import into workspace with correct ownership + progress initialization

**Problem**: Spec says enroll imports the course into learner workspace. Ensure enrollment creates a real course instance tied to user, not just a marketplace id.

**Acceptance criteria**

- Clicking Enroll creates a user-owned course record with:
  - initial progress entries
  - mindmap seeding
- Course appears in dashboard carousel immediately.

---

## P2 (quality / reliability) — Make the system easier to debug and harder to mislead

### 10) P2 — Add a single “Mode & Providers” diagnostic panel (dev-only)

**Acceptance criteria**

- Dev-only panel shows:
  - web search provider actually used (`openai_web_search`)
  - mock mode flags (billingMode, sourceMode)
  - active BYOAI provider/key presence (never reveal the key)

---

### 11) P2 — Expand Playwright to capture ALL key screens (desktop + mobile) as a single Iter137 suite

**Problem**: We currently have scripts + individual specs; Iter137 should have a single named suite for “key screens” tied to this iteration.

**Acceptance criteria**

- Add `e2e/iter137-key-screens.spec.ts` that:
  - takes deterministic screenshots (dashboard/conversation/mindmap/marketplaces/settings/onboarding)
  - asserts key headings are present
  - runs on Desktop + 1 mobile viewport

---

### 12) P2 — Consolidate “marketing web” vs “app client” navigation truth

**Problem**: Repo runs a Next marketing app and a Vite app; screenshots show both. Ensure cross-links and copy are truthful and never strand users.

**Acceptance criteria**

- Marketing CTA always lands in client app (`:3001`) correctly.
- App has a clear “Back to marketing” link.
- No dead links to localhost or incorrect ports.

---

### 13) P2 — Collaboration: ensure the “synthetic match” disclosure is unavoidable and consistent

**Acceptance criteria**

- Collaboration screen clearly labels suggested partners as synthetic (until real multi-user is shipped).
- Same disclosure appears wherever collaboration is mentioned (dashboard notifications, etc.).

---

### 14) P2 — Export: add “Provenance manifest” for course + notes + sources

**Acceptance criteria**

- Export ZIP contains a `manifest.json` with:
  - exportedAt timestamp
  - course ids/titles
  - sources count and ids
  - notes count
  - pipeline provider (openai_web_search)

---

## Builder notes (sequencing)

Recommended sequence:

1. P0.3 provider enforcement (prevents spec drift)
2. P0.4 marketplace publish loop (creator value)
3. P0.1 quiz persistence + UI badges
4. P0.2 notes save/revisit/export
5. P0.5 mindmap semantics
6. P1 personalization + BYOAI polish
