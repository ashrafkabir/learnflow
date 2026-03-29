# BUILD_LOG — Iteration 136

## 2026-03-29 — P1.5 Dashboard IA de-duplicate CTAs

### What changed
- **Dashboard above-the-fold CTA cleanup**:
  - Consolidated to a single primary “Create course” action (with an inline topic input).
  - Added a single secondary “Browse marketplace” action.
  - Retained topic chips as accelerators.
- **Reduced duplicate/competing empty-state prompts**:
  - Replaced the prior dashed “Create your first course” block (which repeated actions already present) with a simple, truthful “No courses yet” info card.
  - Kept the lower “Create another course” box but re-labeled it as secondary placement and aligned copy with MVP truth.
- **Copy consistency**:
  - Normalized “Create course” capitalization.
  - Used ellipsis “Starting…” consistently.

### Files touched
- `apps/client/src/screens/Dashboard.tsx`
- `apps/client/src/__tests__/client.test.tsx` (made the “create course input” test resilient to copy tweaks)
- `apps/client/src/screens/Collaboration.tsx` (minor whitespace tweak to avoid JSX text-node warnings)

### Tests
- `npm test` (turbo) — client/docs/shared/web/core/agents passed; api had a one-off Vitest `EnvironmentTeardownError` during the turbo run.
- Re-ran `npm -w @learnflow/api test` — **PASS** (error did not reproduce).

### Screenshots
- Ran `npm run dev` then `npm run screenshots`.
- New captures saved to:
  - `learnflow/screenshots/iterunknown/run-001/desktop/app-dashboard.png`
  - `learnflow/screenshots/iterunknown/run-001/desktop/course-create-after-click.png`
  - (full run also generated desktop+mobile suite under `learnflow/screenshots/iterunknown/run-001/`)

### Notes / follow-ups
- Screenshot harness currently writes to `iterunknown` when no iteration is specified; consider wiring Iter136 into `scripts/screenshots.mjs` for consistent evidence folders.

---

## 2026-03-29 — P1.6 Marketplace empty state improvement (truthful)

### What changed
- **Marketplace empty state now explains the situation in dev/local** instead of the generic “check back later.”
- Added clear actions when empty:
  - **Create a course** (back to Dashboard)
  - **Creator dashboard** (where publishing happens)
  - **Refresh**
- Added a distinct “Marketplace unavailable” header when the course list request fails (best-effort from client-side error message).

### Files touched
- `apps/client/src/screens/marketplace/CourseMarketplace.tsx`

### Tests
- `npm test` (turbo) — ran; API had a one-off Vitest `EnvironmentTeardownError` during turbo run.
- Re-ran `npm -w @learnflow/api test` — **PASS**.

### Screenshots
- Ran `npm run dev`, then captured full suite to ensure Marketplace and LessonReader screens are recorded:
  - `learnflow/screenshots/iter136/p1-6-empty-marketplace/marketplace-courses.png`
  - `learnflow/screenshots/iter136/p1-6-empty-marketplace/lesson-reader.png`

### Notes / follow-ups
- Next in queue: **P1.7 LessonReader generation-aware loading state + recovery**.
