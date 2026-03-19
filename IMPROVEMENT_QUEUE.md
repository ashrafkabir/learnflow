# IMPROVEMENT_QUEUE

Iteration: 39
Status: READY FOR BUILDER
Date: 2026-03-19
Theme: Mindmap expansions v1 (lesson+course), pipeline UX, onboarding sanity, annotation stability

## Carry-forward context

- Iteration 38 delivered: structured sources plumbing, LessonReader hero-ish blocks, mindmap focus + suggested nodes (dashed), MindmapExplorer actions (Search latest + Add to course), and `/api/v1/search` endpoint.
- Rule: keep standard ports stable (API 3000, client 3001, web 3003). Kill conflicts vs hopping ports.

## Prioritized Task Queue (10)

### 1) Onboarding only once (not every login)

**Fix:** Persist a durable flag (e.g., `onboardingCompletedAt`) and skip onboarding on subsequent logins.
**Acceptance:** Fresh profile sees onboarding once; returning user lands on Dashboard/Conversation without onboarding.

**Status:** DONE ✅

### 2) Onboarding must not force course creation

**Fix:** Ensure onboarding flow captures profile/goals/topics without auto-creating a course.
**Acceptance:** After onboarding, user can browse/explore or start a course intentionally (via Create Course / suggestions), but onboarding itself does not create one.

**Status:** DONE ✅

### 3) Fix annotation bug: double-click heading throws errors

**Fix:** Reproduce and patch the annotation handler (likely selection/range/DOM mismatch on double-click).
**Acceptance:** Double-click headings (and other text) does not throw; annotations still function.

**Status:** DONE ✅

### 4) Pipeline UX for “Add to course”

**Status:** DONE ✅ (Iter39)

- Add-to-course now starts `POST /api/v1/pipeline/add-topic` and navigates to `/pipeline/:pipelineId`.
- Pipeline UI shows stages (Discovery → Extract → Synthesize → Course update) plus attributed **sources discovered** and **synthesis summary**.
- Web-search fallback added for environments where Firecrawl search fails/402.

### 5) Generate “cutting-edge” suggested nodes via web search (v1)

**Fix:** Instead of heuristic stub suggestions, generate suggestions using web search signals:

- For a lesson/topic, run web search for “<topic> 2025 2026 research trends” etc.
- Derive 2–5 adjacent topics (short labels) and return as `mindmap.update` suggestions.
  **Acceptance:** Suggestions are timely and vary by topic; links are attributable via Search latest.

### 6) Lesson-level mindmap (separate from course mindmap)

**Fix:** Add lesson mindmap view embedded in LessonReader (or routed) that focuses on lesson nodes.

- Seed graph from lesson sections/key points.
- Include suggested nodes (dashed) sourced from Task 5.
  **Acceptance:** Each lesson has its own mindmap; can focus/expand similarly to course.

### 7) Course mindmap: accept suggested nodes should add them under correct parent

**Fix:** Ensure suggested nodes connect to the currently focused lesson/module node when accepted.
**Acceptance:** Accepted nodes appear in the right place in the course graph (not only as custom root-linked nodes).

### 8) Sources attribution hardening

**Fix:** Ensure Sources drawer always uses real, resolvable links; never shows “examples” labels.

- When generating new content, require structured `sources[]`.
  **Acceptance:** No fake links; citations/sources are consistent across lessons.

### 9) Ports stability enforcement

**Fix:** Add a dev helper or doc note: if ports conflict, kill conflicts and restart systemd services.
**Acceptance:** `learnflow-api/client/web` are reliably on 3000/3001/3003.

### 10) QA + evidence (Iter39)

**Acceptance:** After each task: `npx tsc --noEmit`, `npx vitest run`, `npx eslint .`.

- Screenshots: desktop + mobile authed + web, saved under `evals/screenshots/iter39-*`.
- Update `BUILD_LOG_ITER39.md`, sync to OneDrive, mark queue DONE, commit.
