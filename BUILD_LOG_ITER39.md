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
