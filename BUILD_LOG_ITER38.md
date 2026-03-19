# BUILD_LOG_ITER38

Iteration: 38
Date: 2026-03-19
Theme: Content quality + real attributed sources + mindmap focus/expansion + add-topic pipeline

## Plan

- Fix references regression; implement structured sources end-to-end.
- Upgrade LessonReader (hero, key points, recap, illustration).
- Mindmap focus mode + suggested nodes state & rendering.
- Add-topic pipeline (topic-specific search/synth/add lesson+module) + UI progress.
- QA: tsc/vitest/eslint + desktop/mobile authed screenshots.

## Work log

- Implemented client-side mindmap focus + suggested nodes rendering:
  - Added AppState `mindmapSuggestions` with localStorage persistence.
  - Conversation WS handler now processes `mindmap.update` events and stores suggestions.
  - MindmapExplorer now renders suggested nodes as dashed/dimmed nodes, and includes a Focus mode that filters to an N-hop neighborhood of a selected node.
  - Clicking suggested node adds it as a custom node (temporary minimal accept flow) and notifies user.
- QA: `npx tsc --noEmit` ✅, `npx vitest run` ✅, `npx eslint .` ✅

## Work log

- Located references regression source: client-side `parseSources()` truncates references before any `## Examples` section (guard in place); main remaining issue was UI labelling/section parsing.
- Added server-side structured source extraction:
  - New `apps/api/src/utils/sources.ts` with `parseLessonSources()` (best-effort from markdown).
  - `GET /api/v1/courses/:id/lessons/:lessonId` now returns `{...lesson, sources}`.
- Client now prefers structured sources when present:
  - `Lesson` type extended with optional `sources?: LessonSource[]`.
  - `LessonReader` uses `lesson.sources` when present, else falls back to `parseSources(lesson.content)`.
- LessonReader content richness:
  - Extended `parseStructuredContent()` to recognize `## Key Points`/`## Key Concepts` and `## Recap`.
  - Added UI blocks for Key Points and Recap.
- Add-topic pipeline (server-side first pass):
  - Added `POST /api/v1/courses/:id/add-topic` to append a new module+lesson based on a topic, using `crawlSourcesForTopic()` + existing LLM lesson generator.
- QA: `npx tsc --noEmit`, `npx vitest run`, `npx eslint .` all green after changes.

## Work log

- MindmapExplorer suggested nodes UX upgraded:
  - Clicking a suggested node now opens a small action panel anchored near the click.
  - Panel actions:
    - “Search latest” → calls new API `GET /api/v1/search?q=...` and lists top results with hostname attribution.
    - “Add to course” → calls `POST /api/v1/courses/:courseId/add-topic` with the topic label.
  - After add-topic success:
    - refreshes course in client state (`fetchCourse`)
    - removes the suggestion from local `mindmapSuggestions` so it becomes an active node in the graph
- Server-side search endpoint added for “Search latest”:
  - `apps/api/src/routes/search.ts` (`/api/v1/search`) powered by @learnflow/agents `searchSources()`.
  - Returns trimmed results with {title,url,description,source(hostname)}.
- Server-side mindmap suggestion generation (heuristic v0):
  - `mindmap.subscribe` now emits `mindmap.update` with `courseId`-keyed `suggestions[]` based on course/lesson context.
- QA after each major task:
  - `npx tsc --noEmit` ✅
  - `npx vitest run` ✅
  - `npx eslint .` ✅
- Screenshots (authed) captured:
  - Desktop: `evals/screenshots/iter38-desktop-authed/*`
  - Mobile: `evals/screenshots/iter38-mobile-authed/*`
  - Web: `evals/screenshots/iter38-web-authed/*`

## Partial completion (by Iter37 builder agent)

- Fixed WS chat action chips to use server-provided `actions` from `response.end`.
- WS messages now include {courseId, lessonId} for better context.
- Marketplace activation now affects runtime routing:
  - new API endpoint: GET `/api/v1/marketplace/agents/activated`
  - client marketplace loads activated ids
  - api WS context `preferredAgents` populated from activated ids
  - core intent router supports preferredAgents (simple mapping)
- Added token usage persistence for WS orchestrator path; keys endpoint returns best-effort `usageCount`.
- Added references parsing guard (don’t bleed into Examples; supports Further Reading).

QA run:

- `npx vitest run` ✅
- `npx tsc --noEmit` ✅
- `npx eslint .` ✅

Screenshots refreshed:

- `node screenshot-web.mjs` ✅
- `node screenshot.mjs` ✅
- `node screenshot-mobile.mjs` ✅
