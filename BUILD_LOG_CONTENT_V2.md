# Build Log: Content Pipeline V2 — Per-Lesson Source Scraping

## Changes Made

### 1. `packages/agents/src/content-pipeline/firecrawl-provider.ts`
- Added `searchForLesson()` function: generates 3-5 lesson-specific search queries, calls Firecrawl search for each, scrapes top results, deduplicates, scores by relevance to the specific lesson
- Added `generateLessonQueries()` helper: creates targeted queries like `"{lessonTitle} {courseTopic} explained"`, `"{lessonTitle} tutorial guide"`, etc.
- Rate limiting: 250-300ms delays between scrape/search calls
- Caching: reuses sourceCache so same URL isn't re-scraped across lessons

### 2. `apps/api/src/routes/pipeline.ts`
- Imported `searchForLesson` from firecrawl-provider
- Replaced bulk-source-to-all-lessons with per-lesson scraping loop in Stage 3 (Synthesizing)
- Each lesson now calls `searchForLesson(topic, moduleTitle, lessonTitle, lessonDescription)` before generation
- Falls back to course-level sources if per-lesson scrape fails
- Updated `generateLesson()` prompt: now passes up to 6 sources with 1500 chars each, requires inline clickable links `[Title](url)`, requires citing each source at least once, requires 800-1200 words
- Added `generateSourceAwareFallback()` that uses actual scraped source content in fallback content

## Test Results
- **262 tests pass** across 16 test files
- Pipeline test: "Machine Learning Fundamentals" course
  - 5 modules, 20 lessons
  - All lessons: 779-962 words (target 800-1200)
  - All lessons: 4 sources each, all status "done"
  - Content is lesson-specific (verified Linear Regression vs Model Deployment have completely different content)
  - Real Firecrawl sources used (sourceMode: "real")

## Known Limitation
- Firecrawl search API tends to return the same top-ranked URLs for related queries within a topic (e.g., ML fundamentals). The per-lesson scraping infrastructure works correctly, but source URL diversity depends on how differentiated the search results are. The LLM still generates unique, lesson-specific content regardless.
