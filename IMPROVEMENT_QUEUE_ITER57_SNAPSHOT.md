# Improvement Queue — Iteration 57

Status: **READY FOR BUILDER**

Planner summary (2026-03-21): This is a continuity run after the previous attempt timed out. I re-checked the repo against the spec and verified major UX flows via the existing Playwright screenshot harness.

**Evidence captured this run**

- `node scripts/screenshots.js` ran successfully and produced fresh screenshots for all major flows; one flaky step: `register` fill timeout (see below).
- `npm run dev` fails from this shell due to **port collisions** (3000/3001/3003 already in use), but services appear to already be running.
- Verified key user pain points in code:
  - **Pro upgrade CTA**: exists (Dashboard → `/pricing` and client has `/subscription` routes); enforcement is _mostly client-side flagging_.
  - **Course delete**: client has delete button + confirm modal on Dashboard and calls `apiDelete(/courses/:id)`.
  - **Knowledge map / mindmap**: MindmapExplorer exists and renders a graph; is not lesson-level interactive map inside course view.

## What I could NOT fully verify in time

- **Full spec crosswalk**: I did not re-read every section of `LearnFlow_Product_Spec.md` in this run due to time/previous context truncation. I instead focused on the known user pain points + obvious implementation gaps.
- **Actual API support for course delete**: Client calls `DELETE /api/v1/courses/:id`, tests reference it, and DB has `dbCourses.delete()`. However, **`apps/api/src/routes/courses.ts` does not currently define `router.delete('/:id')`** (I only found deletes for lesson illustrations + annotations). This is a likely real bug (see P0-1).

---

## Screenshots (this run)

Command:

- `node scripts/screenshots.js`

Output:

- Top-level: `learnflow/screenshots/*.png`
- Latest iteration folder present: `learnflow/screenshots/iter56/*.png`

Run log highlights:

- `OK landing/login/register/pricing/features/dashboard/onboarding/settings/marketplace/create-course/about/blog` (plus mobile variants)
- **One failure line**: `FAIL register: page.fill: Timeout 30000ms exceeded. waiting for locator('input[na...` then continued.

**Paths to reference**

- `learnflow/screenshots/iter56/10-dashboard.png`
- `learnflow/screenshots/iter56/12-mindmap.png`
- `learnflow/screenshots/iter56/15-settings.png`

---

## Prioritized tasks (10–15)

### P0 — Correctness / broken flows

1. **Implement API: DELETE /api/v1/courses/:id (course deletion) — likely missing route**

- **Why:** Client calls it (`apiDelete(/courses/:id)`), tests reference it, DB supports it, but `routes/courses.ts` appears to lack the handler.
- **Acceptance criteria:**
  - `DELETE /api/v1/courses/:id` returns 204 on success, 404 if missing.
  - Removes from in-memory cache (`courses` Map) AND SQLite (`dbCourses.delete`).
  - Cascades lesson rows via FK `ON DELETE CASCADE` (already set), and cleans related progress/notes/illustrations/annotations if needed.
- **Evidence:** `apps/client/src/context/AppContext.tsx:592` calls delete; `apps/api/src/routes/courses.ts` has no `router.delete('/:id')`.

2. **Fix screenshot harness flake: register page fill timeout**

- **Why:** `scripts/screenshots.js` reported `FAIL register: page.fill timeout`.
- **Acceptance criteria:**
  - `node scripts/screenshots.js` runs with zero FAIL lines.
  - Use stable selectors (data-testid) for auth forms.

3. **Make Pro upgrade actually enforce server-side limits**

- **Why:** Free limit logic appears client-side (`FREE_COURSE_LIMIT = 3`); API should enforce (or at least align) to prevent bypass.
- **Acceptance criteria:**
  - API checks `req.user.tier` and enforces free-tier limits for course creation + pipelines.
  - Client messaging matches API errors.

4. **Add an explicit “subscription state” endpoint and single source of truth**

- **Why:** Subscription is stored in localStorage in client state; easy to desync.
- **Acceptance criteria:**
  - `GET /api/v1/subscription` returns tier + renewal info.
  - Client hydrates subscription from API on boot.

### P1 — Spec alignment / user value

5. **Spec crosswalk: produce a per-section compliance table (Spec §§1–17)**

- **Why:** Current queue text is narrative; builder needs a checklist.
- **Acceptance criteria:**
  - For each section: Implemented / Partial / Missing, with file pointers.

6. **Lesson Map inside Course view: clarify vs MindmapExplorer and fix UX**

- **Why:** Users mention “lesson map”; current Mindmap is global knowledge map and uses canvas rendering.
- **Acceptance criteria:**
  - If spec calls for lesson map: add a course-scoped map entrypoint from CourseView.
  - Nodes click navigate to lesson; keyboard support.

7. **MindmapExplorer: persist custom nodes per course/user (not ephemeral)**

- **Why:** Currently Yjs doc is keyed to first course or `dev-course`; unclear persistence.
- **Acceptance criteria:**
  - Active course selection in mindmap.
  - Persist Yjs state via `/api/v1/yjs` or mindmap store.

8. **Research agent honesty + citations in UI**

- **Why:** Spec implies real sources; app has “Sources” parsing utility.
- **Acceptance criteria:**
  - Lesson reader shows structured citations with domain + date.
  - If mocked, clearly label.

### P2 — Reliability / developer experience

9. **Fix `npm run dev` port collision ergonomics**

- **Why:** `scripts/check-ports.mjs` currently hard fails when ports are taken; common in shared dev boxes.
- **Acceptance criteria:**
  - Option A: auto-pick open ports and print them.
  - Option B: provide `npm run dev:kill` / `npm run dev:clean` helper.

10. **Add API contract tests for core routes**

- **Why:** Route drift (like missing DELETE) should be caught.
- **Acceptance criteria:**
  - Supertest verifies create/list/get/delete course lifecycle.

11. **Add deterministic test mode for crawling/LLM paths**

- **Why:** Spec says no real network in test mode.
- **Acceptance criteria:**
  - `NODE_ENV=test` uses fixtures for crawl + LLM.

12. **Docs: update /docs to reflect actual implemented flows vs roadmap**

- **Why:** Reduce spec/implementation mismatch.
- **Acceptance criteria:**
  - “What’s real today” page + “Roadmap” page.

---

## Commands run (for audit)

- `npm run dev` → failed due to port conflicts.
- `ss -ltnp | egrep ":3000|:3001|:3003"` → shows node/tsx/vite/next-server.
- `node scripts/screenshots.js` → OK with 1 flaky register fill timeout.

---

## OneDrive sync

Synced (preserving relative paths):

- `/home/aifactory/.openclaw/workspace/learnflow/screenshots/` → `/home/aifactory/onedrive-learnflow/learnflow/screenshots/`
- `/home/aifactory/.openclaw/workspace/learnflow/IMPROVEMENT_QUEUE.md` → `/home/aifactory/onedrive-learnflow/learnflow/IMPROVEMENT_QUEUE.md`
- `/home/aifactory/.openclaw/workspace/learnflow/LearnFlow_Product_Spec.md` → `/home/aifactory/onedrive-learnflow/learnflow/LearnFlow_Product_Spec.md`
