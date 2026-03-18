# Pipeline Rebuild — Build Log

## Date: 2026-03-17

## Summary

Rebuilt the LearnFlow course creation pipeline to follow a 4-stage flow with real web research informing course planning and lesson content.

## Changes Made

### 1. `packages/agents/src/content-pipeline/firecrawl-provider.ts`

- **Added `searchTopicTrending(topic)`** — Stage 1 bulk research function
  - Runs 7 search queries (guide, best practices, tutorial, trends, research, examples, pitfalls)
  - Deduplicates results across queries
  - Returns sources from search results directly (no individual scraping) for fast, reliable course planning
  - Per-lesson scraping happens in Stage 2 via existing `searchForLesson()`

### 2. `apps/api/src/routes/pipeline.ts`

- **Stage 1 (Research & Plan)**: Now uses `searchTopicTrending()` to bulk-scrape real sources, then feeds them to `generateModulesForTopic()` so the LLM creates an INFORMED course plan based on what's actually trending
- **`generateModulesForTopic()`**: Updated to accept `scrapedSources` parameter. When sources available, includes up to 15 sources (800 chars each) in LLM prompt for informed planning. LLM now returns `courseTitle` and `courseDescription` too.
- **Stage 2**: Unchanged — per-lesson `searchForLesson()` + LLM synthesis with graceful fallback to Stage 1 sources
- **Stage 3 (Review & Edit)**: Added two new endpoints:
  - `GET /api/v1/pipeline/:id/lessons` — Returns all lessons with content for the reviewing UI
  - `POST /api/v1/pipeline/:id/lessons/:lessonId/edit` — Takes `{ prompt }`, sends current content + user instruction to LLM, returns revised lesson
- **Stage 4 (Publish)**: Existing `POST /:id/publish` and `POST /:id/personal` endpoints — unchanged, already working

### 3. `apps/client/src/components/pipeline/PipelineView.tsx`

- **Added `LessonEditCard` component**: Shows each lesson with expand/collapse content preview and inline edit button
  - Edit opens an input field for natural language instructions (e.g., "add more code examples", "simplify for beginners")
  - Submits to the edit API, updates content in-place
- **Added `ReviewingPanel` component**: Full reviewing stage UI
  - Loads all lessons from `GET /api/v1/pipeline/:id/lessons`
  - Shows scrollable list of `LessonEditCard` components
  - "Review Course →" button to view the full course
  - "🌐 Publish to Marketplace" and "🔒 Keep Personal" buttons
  - After publish/personal, redirects to course view

## Test Results

- **262 tests passed** across 16 test files
- 2 pre-existing unhandled rejection errors in client tests (URL parsing in test env, not related)
- TypeScript compiles with zero errors

## Integration Test

- Started API server, created pipeline with topic "Python Basics"
- Stage 1: Successfully ran 7 Firecrawl search queries, found 33 unique results
- LLM generated informed course plan: "Python Basics: From Fundamentals to Practical Applications" (not generic)
- Stage 2: Per-lesson Firecrawl searches hit 402 (quota exhausted), gracefully fell back to Stage 1 sources
- LLM lesson generation proceeds with fallback sources

## Known Issues

- Firecrawl API has limited quota — when exhausted (402), per-lesson searches fail and fall back to Stage 1 course-level sources. This is by design.
- Long pipelines (15+ lessons) with sequential OpenAI calls can take 3-10 minutes. Consider parallelizing lesson generation in future.
