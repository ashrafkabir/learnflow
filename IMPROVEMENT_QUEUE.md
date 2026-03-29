# LearnFlow — Improvement Queue (Iter136)

Owner: Builder  
Planner: Ash (planner subagent)  
Last updated: 2026-03-29

Status: **READY FOR BUILDER**

This queue is the **next 10–15 highest-leverage tasks** after Iter134/135. It is intentionally **trust-first**: fix misleading/broken UX before adding new capability.

Evidence pack for this planner run:

- Desktop screenshots: `learnflow/screenshots/iter136/planner-run/*.png`
- Mobile screenshots: `learnflow/screenshots/iter136/planner-run/mobile/*`
- Notes: `learnflow/screenshots/iter136/planner-run/NOTES.md`

---

## P0 (must ship) — Trust breakers + correctness

### 1) P0 — Fix CourseView error message rendering (`[object Object]`) ✅

**Problem**: CourseView error page currently shows raw `[object Object]` in the UI, which is a credibility/trust breaker.

- Evidence (UI): `screenshots/iter136/planner-run/course-view.png`
- Evidence (code): `apps/client/src/screens/CourseView.tsx` uses `setError(e?.message || ...)` and later renders `{error}`.

**Acceptance criteria**

- CourseView error text is **always human-readable**.
- If the thrown error is not an `Error`, message falls back to:
  - server-supplied `error.message` when present
  - otherwise a generic: `"Failed to load course. Please retry."`
- Include requestId (if present from API ErrorEnvelope) in a copy-to-clipboard “Details” expander for debugging.

**Implementation hints**

- Standardize client error parsing in one helper (e.g., `toUserError(err)`), used by CourseView and LessonReader.

---

### 2) P0 — Ensure course list + course view are consistent for a fresh user ✅

**Problem**: Default screenshot run shows dashboard empty state and CourseView failure. The app should reliably support: create course → course shows → lesson opens.

- Evidence (screenshots): `app-dashboard.png`, `course-view.png`, `lesson-reader.png` (skeleton only)

**Acceptance criteria**

- Happy path works in dev with a brand-new account:
  1. Create course from dashboard
  2. User is navigated to the new course view immediately
  3. Course loads without error
  4. Clicking first lesson opens LessonReader with real content within a reasonable time (or clearly shows generation status + auto-refresh)
- If course is still generating, CourseView shows a **truthful status** (CREATING/READY/FAILED) and a “Refresh” / “Continue generating” affordance.

**Shipped (MVP)**

- Dashboard now navigates to `/courses/:courseId` after `startPipeline()` returns.
- CourseView restart/resume actions no longer write an invalid `error` state shape (prevents silent runtime issues).
- Screenshots: `learnflow/screenshots/iter136/p0-2-happy-path/{app-dashboard,course-view,lesson-reader,course-create-after-click}.png`

**Evidence pointers**

- API returns `status` on `GET /api/v1/courses/{id}` (already does).
- UI currently has pipeline screens; CourseView should not feel broken even if generation is async.

---

### 3) P0 — Remove or quarantine legacy JSON persistence fixtures that no longer match runtime ✅

**Problem**: `.data/courses.json` contained demo course data but runtime uses SQLite (`dbCourses`). This created confusion and could lead to incorrect expectations in QA and planning.

**What changed (Iter136)**

- Removed legacy, unused JSON persistence layer: `apps/api/src/persistence.ts` (no runtime imports).
- Stopped shipping legacy `.data/*` fixtures by removing them from git tracking:
  - `.data/courses.json`
  - `.data/progress.json`
  - `.data/users.json`
  - `.data/keys.json`
  - `.data/learnflow.db`
- Documented truth-first persistence behavior in `README.md` (SQLite is runtime; `.data/` is local-only).

**Evidence**

- `git ls-files | grep "^\.data/"` → (no tracked `.data/` fixtures)
- `npm test` → green (no tests rely on legacy fixtures)

**Acceptance criteria**

- (A) Delete/stop shipping `.data/*.json` fixtures and remove dead JSON persistence code ✅
- Ensure new devs do not mistake legacy fixtures for live seeded data ✅

---

### 4) P0 — Dashboard mindmap widget must not show nodes when user has 0 courses ✅

**Problem**: Dashboard shows 0 courses and “Start a course…” yet the mindmap widget renders three nodes (M/D/W).

- Evidence (UI): `screenshots/iter136/planner-run/app-dashboard.png`

**Acceptance criteria**

- When `courses.length === 0`, mindmap widget area shows only an empty-state (no nodes).
- When at least one course exists, mindmap widget renders nodes derived from that course (and clicking them navigates somewhere predictable).

---

## P1 (high value) — UX clarity + spec-aligned learning loop

### 5) P1 — Dashboard: de-duplicate CTAs and tighten IA ✅

**Problem**: Dashboard currently has multiple overlapping “create course” CTAs (hero + input + cards). This feels noisy and unintentional.

- Evidence: `app-dashboard.png`

**Acceptance criteria**

- One primary CTA (“Create course”) + one secondary CTA (“Browse marketplace”) above the fold.
- Topic chips remain as accelerators, but do not repeat the same action in 3 places.
- If “Today” is unavailable, remove the tile or replace with a truthful “Coming soon” section lower on the page.

---

### 6) P1 — Course Marketplace: show at least a seeded, truth-labeled set of courses (or a better empty state) ✅

**Problem**: Marketplace showed “No courses found” which made the feature look dead.

- Evidence (before): `screenshots/iter136/planner-run/marketplace-courses.png`

**Shipped (Iter136)**

- Implemented option **(B)**: improved empty state with a truthful explanation and clear actions.
- Added load-failure copy (“Marketplace unavailable”) when the API request fails.

**Evidence (after)**

- Screenshot: `learnflow/screenshots/iter136/p1-6-empty-marketplace/marketplace-courses.png`
- Code: `apps/client/src/screens/marketplace/CourseMarketplace.tsx`

---

### 7) P1 — LessonReader: add “generation-aware” loading state + recovery ✅

**Problem**: Lesson reader screenshot shows only skeleton state; unclear if it’s loading, generating, or broken.

- Evidence: `lesson-reader.png`

**Acceptance criteria**

- Distinguish:
  - Loading (fetching)
  - Generating (course pipeline running)
  - Failed (with actionable error)
- Provide a “Retry” + “Back to course” action when failed.

**Shipped (Iter136)**

- LessonReader now hydrates course status via `GET /courses/:id` and shows:
  - “Creating” state (generation-aware) when `status=CREATING`
  - “Failed” recovery state when `status=FAILED` or lesson fetch errors
  - Action buttons: Retry / Refresh / Back to course
- Errors are normalized with `toUserError()` to avoid raw objects.

**Evidence (after)**

- Screenshot: `learnflow/screenshots/iter136/run-lesson-convo/desktop/lesson-reader.png`
- Code: `apps/client/src/screens/LessonReader.tsx`

---

### 8) P1 — Conversation screen: reconcile “Online (preview)” vs deterministic/no-browse mode copy ✅

**Problem**: Conversation UI suggests “Online” but also states no open-web browsing unless enabled; this is confusing.

- Evidence: `app-conversation.png`

**Acceptance criteria**

- UI has one consistent, truthful status line, e.g.:
  - “Offline mode (deterministic)” OR “Online mode (web search enabled)”
- If web search is disabled, remove/avoid any wording implying browsing.
- Add a link/icon to explain what the mode means (“What can I do in this mode?”).

**Shipped (Iter136)**

- Replaced misleading “Online (preview)” pill with explicit: **“Offline mode (deterministic)”**.
- Updated the header copy to: “No open-web browsing in this screen.”

**Evidence (after)**

- Screenshot: `learnflow/screenshots/iter136/run-lesson-convo/desktop/app-conversation.png`
- Code: `apps/client/src/screens/Conversation.tsx`

---

## P2 (nice-to-have / quality) — Polish + observability

### 9) P2 — Add lightweight client-side breadcrumbs on CourseView and LessonReader ✅

**Acceptance criteria**

- Breadcrumb: Dashboard → Course title → Lesson title.
- “Back” goes to the correct prior screen (not always `/dashboard`).

**Shipped (Iter136)**

- Added breadcrumbs:
  - CourseView: Dashboard → Course title
  - LessonReader: Dashboard → Course title → Lesson title
- CourseView now passes `location.state` when navigating to LessonReader so LessonReader can render accurate breadcrumb titles.
- LessonReader top-bar back button prefers `location.state.from` and otherwise uses browser history (falls back to `nav(-1)`).

**Evidence**

- Code: `apps/client/src/screens/CourseView.tsx`, `apps/client/src/screens/LessonReader.tsx`
- Screenshots: `learnflow/screenshots/iter136/run-001/desktop/{course-view,lesson-reader}.png`

---

### 10) P2 — Make screenshots harness validate key flows (smoke assertions) ✅

**Problem**: screenshots can succeed even when core flows are broken (e.g., CourseView error).

**Acceptance criteria (met)**

- Added Playwright smoke test: `e2e/iter136-smoke-assertions.spec.ts` asserts:
  - dashboard renders
  - course creation works
  - course loads
  - lesson loads (or shows generating state)
- Fails fast with a clear reason if a core screen is broken.
- Fix included: persist a minimal `CREATING` course shell at pipeline start so `/courses/:id` won’t 404 during generation.

---

### 11) P2 — Add an “App State Debug” panel gated to dev mode

**Acceptance criteria**

- In dev only, a small panel shows:
  - active user id/tier
  - number of courses
  - activeCourse id
  - feature flags (web search enabled, dev auth bypass)
- Helps resolve planner-run ambiguity quickly.

---

### 12) P2 — Documentation: update spec-accuracy disclaimers to match MVP reality

**Acceptance criteria**

- Ensure docs + marketing pages do not imply:
  - real paid billing
  - real marketplace scale/metrics
  - full knowledge-graph semantics
  - adaptive quizzes
- Where planned, label as “Planned” and link to roadmap section.

---

## Quick “spec ↔ reality” truth summary (Iter136)

- **Onboarding** exists and matches spec structure (MVP).
- **Conversation** exists, but the capture run did not evidence rich outputs.
- **Course creation** exists, but UI must better handle async generation states.
- **Marketplace** UI exists but appears empty by default.
- **Mindmap** exists but the dashboard widget currently shows inconsistent nodes in empty state.
