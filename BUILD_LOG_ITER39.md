# LearnFlow — BUILD LOG (Iteration 39)

## Task 4) Pipeline UX for “Add to course” from MindmapExplorer

✅ DONE.

### What shipped

**Client (MindmapExplorer → Add to course)**

- `Add to course` now **starts a pipeline** (when available) and **navigates** to `/pipeline/:pipelineId` for live progress UI.
- Falls back to the legacy direct endpoint (`POST /courses/:id/add-topic`) if pipeline start fails.

**Client (Pipeline UI)**

- Pipeline stages already map cleanly to requested UX:
  - `scraping` → **Discovery**
  - `organizing` → **Extract**
  - `synthesizing` → **Synthesize**
  - `quality_check` → **Course update**
- `PipelineView` now surfaces:
  - **Sources discovered** (attributed links)
  - **Synthesis summary** (short “what happened” line)

**API**

- Added `POST /api/v1/pipeline/add-topic` that:
  1. Runs discovery (prefers web search)
  2. Extracts/dedupes
  3. Synthesizes a lesson
  4. Updates the existing course by adding a new module
- Re-uses course generation helper `generateLessonContentWithLLM` for consistent lesson formatting.

### Web-search preference + source hardening

- Firecrawl search can fail/402 in some environments.
- Added defensive fallback so pipelines still provide **real, resolvable sources**:
  - `packages/agents/src/content-pipeline/firecrawl-provider.ts`: if Firecrawl returns **0 results**, fall back to the free `web-search-provider`.
  - `apps/api/src/routes/pipeline.ts`: if `searchTopicTrending()` fails, fall back to importing `@learnflow/agents/dist/content-pipeline/web-search-provider.js`.

### Ports stability

- Enforced stable ports by restarting systemd user services:
  - `learnflow-api` (3000)
  - `learnflow-client` (3001)
  - `learnflow-web` (3003)

### Verification

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅
- `npx eslint .` ✅

### Runtime evidence (API)

- Verified add-topic pipeline completes and produces sources + summary + course update.

### Notes / follow-ups

- We still need Iter39 QA screenshot evidence under `evals/screenshots/iter39-*`.
- Journey test was temporarily updated to point to API 3000 for local runs.

---

## Task 5) Generate “cutting-edge” suggested nodes via web search (v1)

✅ DONE.

### Goal

Replace heuristic/stub mindmap suggestions with suggestions derived from web-search signals so they are timely (2025–2026) and vary by topic.

### What changed

**Agents**

- Added `packages/agents/src/content-pipeline/suggested-nodes.ts`:
  - Calls `searchTopicTrending(topic)` (web-search provider) to gather evidence.
  - If `OPENAI_API_KEY` is set, uses `gpt-4o-mini` to propose 2–6 adjacent “suggested nodes” with a short reason.
  - If no OpenAI key (or the call fails), falls back to a lightweight heuristic based on n-gram mining + a few sensible evergreen expansions.
- Exported from `packages/agents/src/index.ts` as:
  - `generateSuggestedMindmapNodes()`
  - `SuggestedMindmapNode` type

**API**

- Updated `apps/api/src/websocket.ts` handling for `mindmap.subscribe`:
  - Derives a seed `topic` (prefers `seedTopic`, then course title/topic, else fallback).
  - Calls `@learnflow/agents.generateSuggestedMindmapNodes(topic, { max: 5 })`.
  - Emits `mindmap.update` with `{ courseId, suggestions, nodes_added: [], edges_added: [] }`.
  - Preserves `parentLessonId` when a lesson context exists.

### Acceptance mapping

- Suggestions vary by topic: ✅ derived from `searchTopicTrending(topic)` evidence.
- Timely / 2025–2026: ✅ enforced in LLM system prompt; heuristic fallback includes a trends expansion.
- Attributable links via “Search latest”: ✅ MindmapExplorer already performs attributed web search on the suggestion label.

### Verification

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅
- `npx eslint .` ✅

---

## Task 6) Lesson-level mindmap (separate from course mindmap)

✅ DONE (v1).

### What shipped

**Client**

- Added `apps/client/src/components/LessonMindmap.tsx`:
  - Renders a lesson-focused graph (vis-network) seeded from lesson markdown headings (`#`, `##`, `###`).
  - Renders **suggested nodes as dashed** edges off the lesson root.
- Embedded in `LessonReader` behind a new **Lesson Map** button.

### Notes

- v1 is intentionally read-only. Accept/expand under the correct parent is addressed by Task 7.

### Verification

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅
- `npx eslint .` ✅

---

## Task 7) Course mindmap: accept suggested nodes should add them under correct parent

✅ DONE.

### What shipped

**Client**

- `MindmapExplorer` now attaches suggested nodes under the **origin lesson** when `suggestion.parentLessonId` is present (otherwise defaults to root).
- `Add to course` now forwards `{ parentLessonId }` when starting the add-topic pipeline / legacy add-topic endpoint.

**API**

- `POST /api/v1/pipeline/add-topic` and `POST /api/v1/courses/:id/add-topic` accept `parentLessonId` (currently ignored server-side, reserved for true lesson-level insertion).

### Verification

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅
- `npx eslint .` ✅

---

## Task 8) Sources attribution hardening

✅ DONE.

### What shipped

**API**

- Removed placeholder/fake fallback sources from lesson template generation.
- If no real crawled sources are available, lessons now include a clear note in `## Sources` instead of fake URLs.
- Improved `parseLessonSources()` to support additional reference formats so the Sources drawer can extract resolvable URLs more reliably.

### Verification

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅
- `npx eslint .` ✅

---

## Task 9) Ports stability enforcement

✅ DONE.

### What shipped

- Added `learnflow/DEV_PORTS.md` documenting the port contract and the recovery steps (kill conflict → restart systemd user services).
- Verified runtime listeners:
  - 3000 (api)
  - 3001 (client)
  - 3003 (web)

### Verification

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅
- `npx eslint .` ✅

---

## Task 10) QA + evidence + commit

✅ DONE.

### QA

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅
- `npx eslint .` ✅
- `npx tsx evals/journey-test.ts` ✅ (17/17; results saved)

### Evidence

- `evals/screenshots/iter39-lesson-reader.png`
- `evals/screenshots/iter39-mindmap.png`
- `evals/screenshots/iter39-journey-test-results.json`
