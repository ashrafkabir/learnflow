# LearnFlow Improvement Queue — Iteration 27

## Current Iteration: 27

## Status: DONE

## Date: 2026-03-18

## Theme: Stop lying to ourselves — make dev boot + tests + screenshots _actually_ trustworthy

---

## Brutal Assessment (evidence-based)

Iteration 26 **claimed**: “TSC zero errors” + “377 tests across 35 files” + “Playwright screenshots”.

### What I verified (and what failed)

1. **`npm test` does pass**, but the output contains **real runtime crashes** that are currently _not_ failing the test run:
   - `ReferenceError: IntersectionObserver is not defined` (Framer Motion viewport observer) — observed during Pricing/Marketing route render in tests.
   - Multiple pipeline component crashes: `TypeError: Cannot read properties of undefined (reading 'length')` in:
     - `apps/client/src/components/pipeline/CrawlThreadList.tsx:5`
     - `apps/client/src/components/pipeline/OrganizingView.tsx:20`
     - `apps/client/src/components/pipeline/SynthesisList.tsx:7`
     - `apps/client/src/components/pipeline/QualityCheckList.tsx:5`
   - Course/Lesson crashes triggered during “all screens render” style tests:
     - `CourseView.tsx:80` → `Cannot read properties of undefined (reading 'reduce')`
     - `LessonReader.tsx:54` → `Cannot read properties of undefined (reading 'match')`

   These show the app is **not robust to missing/undefined data** and that our test suite is **not configured to fail on console errors / ErrorBoundary logs**.

2. **`npm run dev` is unreliable** out of the box:
   - `@learnflow/web` (Next) and `@learnflow/client` (Vite) both try to use port **3001**.
   - API defaults to **3000**, which was already in use on this host.
   - Result: dev boots are inconsistent, with the client jumping to random ports (e.g. 3005) and turbo reporting fatal port collisions.

3. **Playwright screenshots were incomplete vs. the required screen list**.
   - Existing `screenshot.mjs` captured: home, onboarding steps, dashboard, conversation, mindmap, settings, marketplace.
   - It **did not capture** (required per planner instructions): login, register, course view, lesson reader, pipeline view/detail, marketing (about/blog/pricing), chat is only partially represented (conversation), etc.
   - I generated screenshots under `evals/screenshots/rebuild/` for the subset the script covers.

Bottom line: **Iteration 26 added a lot of UI, but we still have correctness gaps masked by weak test harness + messy dev ergonomics.**

---

## Prioritized Tasks (15)

### 1) 🔴 Make tests fail on runtime errors (console.error / ErrorBoundary)

**Problem:** Tests “pass” while ErrorBoundary catches real crashes (IntersectionObserver, undefined array access, reduce/match on undefined).

**Fix:** In client test setup (Vitest), intercept:

- `console.error` and `console.warn` (at least for React error boundary + uncaught errors)
- optionally `window.onerror` / `unhandledrejection`
  And **fail the test** unless explicitly allowed.

**Acceptance Criteria:**

- Running `npm test` fails before fixes in Tasks 2–5.
- After Tasks 2–5, `npm test` passes with **zero ErrorBoundary logs** and no “Uncaught” runtime stack traces.

---

### 2) 🔴 Polyfill `IntersectionObserver` for JSDOM tests (Framer Motion)

**Problem:** `IntersectionObserver is not defined` in JSDOM, triggered by Framer Motion viewport/in-view features.

**Fix Options (pick one):**

- Add a lightweight global polyfill/mocked implementation in the Vitest setup file, OR
- Configure/migrate components to not require IO in test env.

**Acceptance Criteria:**

- No occurrences of `IntersectionObserver is not defined` in `npm test` output.

---

### 3) 🔴 Harden pipeline UI components against undefined arrays

**Problem:** Pipeline subcomponents read `.length` on undefined props.

**Fix:** Update these components to accept safe defaults:

- `CrawlThreadList` (`threads ?? []`)
- `OrganizingView` (any arrays used for counts/lists)
- `SynthesisList`
- `QualityCheckList`

Also ensure `PipelineView` passes correct props and/or default values.

**Acceptance Criteria:**

- Rendering `/pipeline/:id` with minimal/mock `PipelineState` does not throw.
- `npm test` shows no `reading 'length'` crashes.

---

### 4) 🔴 Fix `CourseView` reduce crash for missing modules/lessons

**Problem:** `CourseView.tsx` uses `.reduce` on possibly undefined.

**Fix:** Normalize course shape at the boundary (API response parsing / mock data / component props) and guard within UI.

**Acceptance Criteria:**

- Visiting a course route with missing/empty modules shows an empty-state UI, not a crash.
- No `reading 'reduce'` runtime errors in tests.

---

### 5) 🔴 Fix `LessonReader` source parsing crash

**Problem:** `LessonReader.tsx:54` does `.match` on undefined during `parseSources`.

**Fix:** Make `parseSources` accept `string | undefined` and return `[]` for falsy input; add unit tests.

**Acceptance Criteria:**

- LessonReader renders even when `lesson.sources` (or equivalent field) is undefined.
- No `reading 'match'` runtime errors in tests.

---

### 6) 🟠 Stabilize dev ports (no collisions) across workspaces

**Problem:** Turbo dev launches multiple apps that conflict (Next + Vite on 3001; API on 3000 already used).

**Fix:** Establish a consistent port scheme and enforce it in scripts:

- API: 3000 (or 3100)
- Client (Vite): 3001
- Web (Next): 3002
  Document in README and/or `.env.example`.

**Acceptance Criteria:**

- `npm run dev` succeeds without “EADDRINUSE” on a clean machine.
- `@learnflow/client` consistently runs at the documented port.

---

### 7) 🟠 Replace/upgrade screenshot script to cover ALL required screens

**Problem:** Planner-required screenshots weren’t produced for login/register/course/lesson/pipeline/marketing pages.

**Fix:** Update `screenshot.mjs` (or create `scripts/screenshot-all.mjs`) to capture:

- Landing/home
- Login
- Register
- Onboarding screens
- Dashboard
- Course marketplace
- Agent marketplace
- Pipeline list (`/pipelines`) + pipeline detail
- Course view
- Lesson reader
- Mindmap
- Settings
- Conversation/chat
- Marketing: Pricing, About, Blog

**Acceptance Criteria:**

- A single command produces screenshots into a dated folder (e.g. `evals/screenshots/iter27/`).
- Folder contains at least 15 images matching the list above.

---

### 8) 🟠 Add pipeline view/detail routes to screenshot/test coverage

**Problem:** We have pipeline UI, but it’s brittle and not systematically covered.

**Fix:** Add at least 3 targeted tests ensuring:

- PipelineView list renders
- PipelineDetail renders “stage” + progress
- Empty/failed pipeline states render a non-crashing empty state

**Acceptance Criteria:**

- Tests fail before fixes, pass after.

---

### 9) 🟡 Remove noisy test warnings (`act(...)`) where feasible

**Problem:** Multiple tests emit React “not wrapped in act(...)” warnings.

**Fix:** Update tests to use `await` + `findBy...`/`waitFor`, or wrap state updates.

**Acceptance Criteria:**

- `npm test` output has no React act warnings.

---

### 10) 🟡 Establish a “no silent crashes” quality gate in CI

**Problem:** Current suite allows ErrorBoundary recoveries to slip.

**Fix:** Add a CI gate script (or vitest config) that:

- fails on console.error
- fails on unhandled promise rejections

**Acceptance Criteria:**

- Running `npm test` in CI mode behaves identically locally.

---

### 11) 🟡 Audit mock data consistency for routes used by tests

**Problem:** Several crashes are caused by mocks missing required shape.

**Fix:** Centralize route mock data fixtures (courses, lessons, pipeline states) to avoid drift.

**Acceptance Criteria:**

- There is a single source of truth for fixtures used in tests and demo routes.

---

### 12) 🟢 Update Iteration 26 claims in logs (optional integrity fix)

**Problem:** Iteration 26 log claims 377 tests; I observed 144 client + 115 api (total 259) on this host run.

**Fix:** If the numbers are environment-dependent, document _how_ the 377 is computed; otherwise correct the build log.

**Acceptance Criteria:**

- BUILD_LOG reflects a reproducible command and real output.

---

### 13) 🟢 Add “Login/Register” minimal UX assertions

**Problem:** Login/Register exist but are not part of the screenshot run and may be visually regressing.

**Fix:** Add basic tests: email/password fields present, submit buttons, validation message placeholder.

**Acceptance Criteria:**

- Tests and screenshots cover login/register.

---

### 14) 🟢 Improve “empty-state” UX copy for missing data

**Problem:** We keep crashing instead of presenting empty states.

**Fix:** Add consistent EmptyState component usage in CourseView, LessonReader, PipelineDetail.

**Acceptance Criteria:**

- No crashes for missing data; user sees actionable copy.

---

### 15) 🟢 Document local dev workflow (ports, commands, screenshots)

**Problem:** New contributors can’t reliably boot the stack.

**Fix:** Update `README.md` with:

- Ports
- start/stop
- screenshot command
- test expectations

**Acceptance Criteria:**

- README contains a “Getting Started” section that matches reality.

---

## Remaining for Future Iterations (not this sprint)

- E2E flows with Playwright (real navigation + assertions)
- Real backend integration for marketplace and collaboration (currently mock-heavy)
- Accessibility audit (WCAG 2.1 AA) beyond focus ring tweaks
- Performance/Lighthouse targets
- Offline/PWA: background sync + push notifications
