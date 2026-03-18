# LearnFlow Improvement Queue

## Iteration: 28

**Status:** DONE  
**Date:** 2026-03-18

## Brutal Assessment (evidence-based)

### 1) Automated tests are effectively broken (not just flaky)

- Running `npm test` produces **mass failure** (log shows **128 failed tests**).
- Root cause is not app logic; it’s the “no silent crashes” console gate + noisy React/Router test warnings:
  - `Warning: The current testing environment is not configured to support act(...)` (thrown as `console.error`)
  - React Router warning treated as fatal:
    - `⚠️ React Router Future Flag Warning: ... v7_startTransition ...`
  - Evidence: `apps/client/.turbo/turbo-test.log` lines ~700–820 show failures cascading from console gate.

### 2) Screenshot coverage was incomplete / inconsistent due to auth + onboarding overlay

- There is a **blocking overlay** (`<OnboardingTooltips />`) that can intercept clicks and mislead automation.
  - Evidence: `apps/client/src/components/OnboardingTooltips.tsx` uses `fixed inset-0 ... pointer-events-auto` overlay and only stores completion in `localStorage['onboarding-tour-complete']`.
- The required “every screen” screenshot run was non-deterministic until we forced:
  - `localStorage['learnflow-token']='dev'`
  - `localStorage['onboarding-tour-complete']='true'`

### 3) Product flow gaps vs spec intent (high-level)

- App has routes/screens for many areas (marketing, onboarding, dashboard, pipelines, settings, marketplace), but the **end-to-end learning loop** (create course → pipeline → course view → lesson reader) is hard to validate automatically because:
  - dashboard interactions get blocked by overlays and state gates
  - pipeline/course creation requires API + keys/subscription logic that isn’t reliably satisfied in dev/test

### 4) Tooling quality gap: repo lacks ripgrep (`rg`) used by previous iteration scripts

- `rg` is not installed (`/bin/bash: rg: command not found`). This slows iteration and encourages sloppy grep patterns.

---

## Iteration 28 — Prioritized Tasks (10–15)

> Format: **Problem** → **Fix** → **Acceptance Criteria** (with file paths)

### P0 — Make tests actionable again

1. ✅ **Tests fail due to React Router future warnings being treated as fatal**

- **Problem:** The console gate throws on `console.warn`, and Router future warnings are emitted during route mounts.
- **Fix:**
  - Preferably: opt-in to Router future flags in test routers (MemoryRouter/createMemoryRouter) where used.
  - Alternatively: allowlist only the specific Router warning string in _one_ place to avoid hiding real issues.
- **Acceptance:** `npm test` no longer fails solely because of React Router future flag warnings.
- **Files:** `vitest.setup.ts`, `apps/client/src/test-setup.ts`, test helpers creating routers.

2. ✅ **Tests fail due to `act(...)` environment warning**

- **Problem:** React emits `Warning: The current testing environment is not configured to support act(...)`, which becomes a thrown error via console gate.
- **Fix:**
  - Ensure `@testing-library/react` + React 18 config is correct; set `globalThis.IS_REACT_ACT_ENVIRONMENT = true` in setup.
  - Remove double console-gate stacking (global + app-level) if both run.
- **Acceptance:** No `act(...)` warnings in test output; `npm test` progresses to real assertions.
- **Files:** `vitest.setup.ts`, `apps/client/src/test-setup.ts`, `apps/client/vitest.config.ts`.

3. ✅ **Two separate “console gate” implementations conflict**

- **Problem:** `vitest.setup.ts` and `apps/client/src/test-setup.ts` both override console methods; noise becomes fatal twice and makes debugging harder.
- **Fix:** Consolidate console gate into one setup (prefer root `vitest.setup.ts`) and keep app-level setup for DOM/polyfills only.
- **Acceptance:** Single source of truth for console gate; consistent allowlist; tests output is readable.
- **Files:** `vitest.setup.ts`, `apps/client/src/test-setup.ts`, `apps/client/vitest.config.ts`.

4. **Root Vitest config path resolution bug (already fixed but must be kept)**

- **Problem:** Root `vitest.config.ts` used `setupFiles: ['./vitest.setup.ts']` which breaks in workspace runs (it looks for `apps/web/vitest.setup.ts`).
- **Fix:** Keep absolute resolution via `path.resolve(__dirname,'vitest.setup.ts')`.
- **Acceptance:** `npm test` can run from repo root without missing setup file errors.
- **Files:** `vitest.config.ts`.

### P1 — Make “Create Course” and pipeline flow reliably verifiable

5. ✅ **Onboarding tooltip overlay blocks clicks & automation (and can confuse real users)**

- **Problem:** The overlay is full-screen pointer-events and appears on first Dashboard visit.
- **Fix:**
  - Add an explicit close button with clear hit target.
  - Ensure the overlay does not block the “Create Course” input/button area by positioning.
  - Add deterministic disable via query param (`?tour=off`) for eval runs.
- **Acceptance:** Creating a course is possible without dismissing the overlay; Playwright can click dashboard CTA without `force: true`.
- **Files:** `apps/client/src/components/OnboardingTooltips.tsx`, `apps/client/src/screens/Dashboard.tsx`.

6. ✅ **Dev-mode auth gating for evaluation is inconsistent**

- **Problem:** Some routes appear to redirect/behave differently without a real token; automation had to hack localStorage.
- **Fix:** Provide an explicit `DEV_AUTH_BYPASS` flag (env var) + banner, not an implicit token string.
- **Acceptance:** When `DEV_AUTH_BYPASS=1`, all app routes load without login and without server dependency.
- **Files:** `apps/client/src/App.tsx` (auth guard), auth context.

7. ✅ **Course creation blocked by subscription/courses gate in non-obvious ways**

- **Problem:** Dashboard uses `canCreateCourse = subscription==='pro' || courses.length < 3` and redirects to `/settings` on failure.
- **Fix:**
  - Make the gating UI explicit (inline message + upgrade CTA), don’t surprise-navigate.
  - In dev/evals, ensure default subscription and initial courses state don’t block creating first course.
- **Acceptance:** On a fresh profile, “✨ Create Course” stays on dashboard and starts a pipeline.
- **Files:** `apps/client/src/screens/Dashboard.tsx`, subscription persistence in app state.

8. **Pipeline detail screenshot coverage exists but must be standardized**

- **Problem:** Pipeline cards are clickable listitems (not anchors), so naive screenshot scripts miss pipeline detail.
- **Fix:** Maintain `screenshot-all.mjs` (or replace existing script) to explicitly click `[role=listitem]` and screenshot `/pipeline/:id`.
- **Acceptance:** A single script produces screenshots for: landing, login, register, onboarding (all steps), dashboard, course view, lesson reader, conversation, mindmap, marketplace (courses+agents), settings, pipelines list, pipeline detail.
- **Files:** `screenshot-all.mjs` (new), existing `screenshot.mjs` (review/merge).

### P2 — Spec alignment & UX quality

9. ✅ **Dashboard `initialLoading` is never set true**

- **Problem:** `initialLoading` defaults false; skeleton never shows even while `/courses` fetch happens.
- **Fix:** Set `setInitialLoading(true)` before the fetch; ensure it flips false finally.
- **Acceptance:** On slow network, skeleton renders; on fast network, no flicker.
- **Files:** `apps/client/src/screens/Dashboard.tsx`.

10. ✅ **Review Queue uses `window.location.href` instead of SPA navigation**

- **Problem:** Forces full page load and breaks app-state continuity.
- **Fix:** Replace with `nav(...)`.
- **Acceptance:** Clicking review item transitions client-side.
- **Files:** `apps/client/src/screens/Dashboard.tsx`.

11. **Marketing pages need a quality pass for spec compliance**

- **Problem:** Marketing routes exist but may be placeholder-heavy; need explicit checklist vs spec (hero, features, pricing, docs, etc.).
- **Fix:** Compare each marketing screen to spec; remove lorem/placeholder; ensure consistent CTA to register/download.
- **Acceptance:** Each marketing route has complete copy, CTA, and consistent nav.
- **Files:** `apps/client/src/screens/marketing/*`.

12. **Install ripgrep for faster iteration**

- **Problem:** `rg` missing; slows targeted verification.
- **Fix:** Add dev dependency or document install step in repo bootstrap.
- **Acceptance:** `rg -n "Create Course" apps/client/src` works locally.
- **Files:** `BOOTSTRAP.md` / dev docs (if present).

---

## Remaining for Future Iterations (not in 28)

- Proper auth (real JWT, refresh, roles), not localStorage dev token.
- Data model hardening: persistence layer, multi-user separation.
- True “course marketplace” publishing & rating flows.
- Mindmap correctness: semantic linking to lessons; export.
- Chat/conversation: tool use, citations, memory.

---

## Artifacts / Evidence

- Failing tests log: `apps/client/.turbo/turbo-test.log` (shows Router warnings + act warnings → thrown)
- Screenshots directory used this iteration:
  - `evals/screenshots/iter28-2026-03-18/` (public + authed routes)
- Overlay source:
  - `apps/client/src/components/OnboardingTooltips.tsx`
