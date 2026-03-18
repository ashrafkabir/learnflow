# LearnFlow Improvement Queue

## Iteration: 29

**Status:** READY FOR BUILDER  
**Date:** 2026-03-18

## Brutal Assessment (verify, don’t trust)

Overall: the repo is now **materially runnable + testable** (all tests passing), and we can generate a **repeatable screenshot set**. But spec compliance is still **largely “shape-matching”** (screens/routes exist, placeholders/mock behavior underneath) rather than a true multi-agent learning platform.

### What’s solid now (evidence)

- ✅ **Automated tests are working again**: `npm test` passes across workspaces.
  - Evidence: local run output shows `@learnflow/client` **144 passed**, `@learnflow/api` **115 passed**, `@learnflow/agents` **68 passed**.
- ✅ **Deterministic screenshots for “every screen”** are achievable with the existing script.
  - Evidence: `SCREENSHOT_DIR=evals/screenshots/iter29-2026-03-18 BASE_URL=http://localhost:3002 node screenshot-all.mjs` generated a consistent set.
  - Output dir: `evals/screenshots/iter29-2026-03-18/`.

### Biggest reality gaps vs the Product Spec

1. **Spec §11.2 WebSocket protocol is implemented, but payloads don’t match the spec.**
   - Spec expects e.g. `progress.update: { course_id, lesson_id, completion% }`.
   - Implementation sends `progress.update: { user_id, metric, value }`.
   - Evidence: `apps/api/src/websocket.ts`.

2. **Marketing website spec (§12) says Next.js 14 (App Router) + MDX docs/blog.**
   - There _is_ a Next app at `apps/web/src/app/*`, but it currently only has `/`, `/features`, `/pricing`, `/download`, `/blog`, and **no** `/docs`, `/about`, `/marketplace`.
   - Meanwhile the React client also has marketing pages (`apps/client/src/screens/marketing/*`). This is a product decision conflict.
   - Evidence: `apps/web/src/app/*`, client screenshots: `marketing-about.png`, `marketing-docs.png`.

3. **“Multi-agent orchestration” is still mostly a stubbed UX.**
   - Conversation uses a WebSocket hook, but the server’s WS handler emits canned chunks; no real orchestrator/agent mesh behavior.
   - Evidence: `apps/api/src/websocket.ts` (hardcoded chunks), client `apps/client/src/hooks/useWebSocket.ts` + `apps/client/src/screens/Conversation.tsx`.

4. **Course/lesson loop exists, but “<10 min lessons + attribution” is not strongly enforced end-to-end.**
   - Spec: bite-sized lessons (<10 min) + full attribution/provenance.
   - Implementation: lessons exist and often include references, but constraints/validation are not guaranteed at API contract level.
   - Evidence: create course route `apps/api/src/routes/courses.ts` (builder path), lesson rendering in `apps/client/src/screens/LessonReader.tsx`.

---

## Iteration 29 — Prioritized Tasks (10–15)

> Format: **Problem** → **Fix** → **Acceptance Criteria** (with evidence/file paths)

### P0 — WebSocket spec compliance (stop drifting from spec)

1. ✅ **WebSocket `progress.update` payload violates spec**

- **Problem:** Spec §11.2: `progress.update` must include `{ course_id, lesson_id, completion% }`. Implementation sends `{ user_id, metric, value }`.
- **Fix:** Align event payloads to spec and update client event handling accordingly.
- **Acceptance:** WS event `progress.update` matches spec contract; client updates course progress UI based on it.
- **Files:** `apps/api/src/websocket.ts`, `apps/client/src/hooks/useWebSocket.ts`, `apps/client/src/screens/*` (where progress is displayed).

2. ✅ **WebSocket `mindmap.update` payload drifts from spec**

- **Problem:** Spec shows `{ nodes_added[], edges_added[] }` (and implicitly consistent schema). Implementation emits `{ nodes_added, nodes_updated, edges_added }` with empty arrays only.
- **Fix:** Define a typed `MindmapNode`/`MindmapEdge` payload and implement meaningful updates (even if mocked) aligned to the spec.
- **Acceptance:** Mindmap Explorer receives at least one meaningful update event when subscribed, and renders nodes/edges.
- **Files:** `apps/api/src/websocket.ts`, `apps/client/src/screens/MindmapExplorer.tsx`.

3. ✅ **WS auth is inconsistent with dev experience**

- **Problem:** Server requires JWT via `?token=...` at `/ws`. Screenshots/evals rely on localStorage hacks and bypass.
- **Fix:** Provide a dev-only token mode or a consistent dev auth pathway (e.g., accept `token=dev` when `NODE_ENV=development`).
- **Acceptance:** In dev, authed WS connects without needing a real JWT; in prod, JWT remains required.
- **Files:** `apps/api/src/websocket.ts`, `apps/api/src/config.ts`.

### P0 — Resolve the marketing site ambiguity (two sites = two truths)

4. **Spec §12 requires Next.js website, but product currently ships marketing inside the client**

- **Problem:** Client has `/features /pricing /docs /about /blog /download` screens; Next site has only subset and no docs/about.
- **Fix:** Decide one canonical marketing surface:
  - Option A (preferred per spec): move marketing to `apps/web` and keep client strictly “app”.
  - Option B: declare `apps/web` optional and update spec/README accordingly.
- **Acceptance:** There is exactly one “source of truth” for marketing routes, nav, and copy; no duplicate/contradictory pages.
- **Files:** `apps/web/src/app/*`, `apps/client/src/screens/marketing/*`, routing in `apps/client/src/App.tsx`.

5. **Next.js site missing required pages**

- **Problem:** Spec §12 lists Homepage/Features/Pricing/Marketplace/Docs/Blog/About/Download; Next app missing `/docs`, `/about`, `/marketplace`.
- **Fix:** Implement the missing pages in `apps/web` and add nav links.
- **Acceptance:** Next site serves all spec pages; Playwright screenshots cover them.
- **Files:** `apps/web/src/app/*`, `apps/web/src/app/layout.tsx`.

6. **Next.js metadataBase warning in build logs**

- **Problem:** Next build warns `metadataBase property ... is not set`.
- **Fix:** Set `metadataBase` in `apps/web/src/app/layout.tsx` metadata.
- **Acceptance:** `next build` runs without metadataBase warnings.
- **Files:** `apps/web/src/app/layout.tsx`.

### P1 — Core learning loop integrity (from “exists” → “works”)

7. **Conversation is not actually orchestrating agents**

- **Problem:** Server WS response is canned; doesn’t call orchestrator/agents.
- **Fix:** Route `message` WS event through the same logic as `/api/v1/chat`, or implement a minimal orchestrator that picks a handler and streams chunks.
- **Acceptance:** A user message triggers a real pipeline: agent.spawned → chunks derived from actual agent output → response.end with sources.
- **Files:** `apps/api/src/websocket.ts`, `apps/api/src/routes/chat.ts`, `packages/agents/*`.

8. **Course creation + pipelines need explicit, user-visible state**

- **Problem:** Users can create courses, but “pipeline” progress and state transitions are not clearly tied to course creation.
- **Fix:** When creating a course, create a pipeline entity with statuses; UI shows pending/running/completed states, and pipeline detail is linked from course.
- **Acceptance:** Create course produces a pipeline with at least 3 steps and timestamps; pipeline detail shows logs/results.
- **Files:** `apps/api/src/routes/courses.ts`, `apps/client/src/screens/PipelineView.tsx`, `apps/client/src/screens/PipelineDetail.tsx`.

9. **Lesson timebox (<10 min) not enforced**

- **Problem:** Spec mandates <10 minute lessons; current content can exceed (and tests include 60–90 min examples in stored data).
- **Fix:** Add server-side enforcement/validation (word count/reading time) and a formatter that splits oversized lessons.
- **Acceptance:** API guarantees each lesson meets reading-time max; UI displays “~X min” badge.
- **Files:** `packages/agents/*` formatter, `apps/api/src/routes/courses.ts`, `apps/client/src/screens/LessonReader.tsx`.

10. **Attribution/provenance is not a first-class API contract**

- **Problem:** Spec requires sources; UI/WS currently can deliver empty sources.
- **Fix:** Make sources required (min 3) for created lessons and return them in lesson responses and WS response.end.
- **Acceptance:** Every lesson response includes `sources[]` with title/url/date; LessonReader renders a References section consistently.
- **Files:** `apps/api/src/routes/courses.ts`, `apps/api/src/routes/chat.ts`, `apps/api/src/websocket.ts`, `apps/client/src/screens/LessonReader.tsx`.

### P2 — Developer ergonomics + evidence quality

11. ✅ **Screenshot automation misses Collaboration + Lesson Reader in iter29 set**

- **Problem:** `iter29-2026-03-18` screenshots do not include `/collaborate` and `lesson-reader.png` (script prints done before lesson capture depending on state).
- **Fix:** Extend `screenshot-all.mjs` to explicitly visit `/collaborate` and to always capture lesson reader (navigate directly to first lesson route if present).
- **Acceptance:** Screenshot set includes collaboration + lesson reader every run.
- **Files:** `screenshot-all.mjs`.

12. **Ripgrep (`rg`) missing; slows verification and increases risk of missing spec drift**

- **Problem:** `rg` is not installed (`/bin/bash: rg: command not found`).
- **Fix:** Document install in README/bootstrap or add a devcontainer step; alternatively vendor a simple `scripts/search.sh` that uses `grep -R` consistently.
- **Acceptance:** Repo provides a documented, working fast-search workflow.
- **Files:** `README.md` / `BOOTSTRAP.md` (if present) / `scripts/*`.

13. **Binary DB files in repo path interfere with grep and signal “stateful dev by accident”**

- **Problem:** `apps/api/.data/learnflow.db*` is present and matched by grep; it’s noisy and risks being committed.
- **Fix:** Ensure `.data/` is gitignored and provide seed scripts instead.
- **Acceptance:** No SQLite WAL/DB artifacts tracked; dev uses reproducible seeds.
- **Files:** `.gitignore`, `apps/api/.data/*`, seed scripts.

---

## Spec-to-Implementation Gap Notes (file-path evidence)

- WebSocket spec mismatch: `LearnFlow_Product_Spec.md` §11.2 vs `apps/api/src/websocket.ts`.
- Marketing website spec vs implementation:
  - Spec §12 demands Next.js + MDX docs.
  - Next app exists: `apps/web/src/app/*` but missing `/docs`, `/about`, `/marketplace`.
  - Client marketing pages exist: `apps/client/src/screens/marketing/*`.

---

## Artifacts (Iteration 29)

- Screenshots: `evals/screenshots/iter29-2026-03-18/`
  - Captured: landing, marketing features/pricing/download/blog/about/docs (client), auth login/register, onboarding (6), dashboard, conversation, mindmap, marketplace (courses+agents), settings, pipelines list, pipeline detail, course view.
  - Missing in current set: collaboration + lesson reader (see Task #11).
