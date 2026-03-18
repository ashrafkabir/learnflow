# Build Log: More Web Sources + Lesson Navigation

## Date: 2025-07-18

## Changes Made

### 1. New Source Fetchers (`packages/agents/src/content-pipeline/source-fetchers.ts`)

Added 7 new search functions:

- `redditSearch()` — Uses old.reddit.com JSON API (`/search.json`)
- `devtoSearch()` — Uses Dev.to API (`/api/articles?query=`)
- `hackerNewsSearch()` — Uses HN Algolia API (`hn.algolia.com/api/v1/search`)
- `mediumSearch()` — Google site search for medium.com
- `substackSearch()` — Google site search for substack.com
- `quoraSearch()` — Google site search for quora.com
- `theNewStackSearch()` — Google site search for thenewstack.io

All functions return `FirecrawlSearchResult[]` and fail gracefully (return empty array on error).
Google site search functions share a `googleSiteSearch()` helper that parses URLs from HTML.

### 2. Multi-Source Search Updated (`packages/agents/src/content-pipeline/web-search-provider.ts`)

- Imported all 7 new fetchers
- `multiSourceSearch()` now runs all 10 sources in parallel via `Promise.all()`
- Results are deduplicated by URL

### 3. Credibility Scores Updated (`packages/agents/src/content-pipeline/firecrawl-provider.ts`)

Added to CREDIBILITY_MAP:

- `reddit.com`: 0.55
- `substack.com`: 0.68
- `quora.com`: 0.50
- `thenewstack.io`: 0.78
- `news.ycombinator.com`: 0.60
  (medium.com and dev.to already existed)

### 4. Previous/Next Lesson Navigation (`apps/client/src/screens/LessonReader.tsx`)

- Added `useEffect` to fetch full course structure via `GET /api/v1/courses/:id`
- Flattens all modules/lessons into ordered list
- Renders Previous/Next buttons at bottom of lesson content (before action buttons)
- Buttons link to `/courses/${courseId}/lessons/${lessonId}`
- Gracefully handles first/last lessons (hides button when N/A)

## Test Results

- TypeScript compiles cleanly (both `packages/agents` and `apps/client`)
- 247/262 tests pass; 15 failures are all pre-existing (OpenAI mock issues and auth/subscription tests)
- No new failures introduced
