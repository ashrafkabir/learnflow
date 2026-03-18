# Build Log: Search Provider Rebuild

## Date: 2026-07-15

## Problem

Firecrawl API returned 402 (quota exhausted). All course content scraping failed.

## Solution

Created `packages/agents/src/content-pipeline/web-search-provider.ts` that replaces Firecrawl with:

1. **Wikipedia API** — REST API for summaries + MediaWiki search API for finding related articles
2. **Direct URL scraping** — Constructs URLs to known high-quality sites (GeeksforGeeks, IBM, AWS, etc.) and scrapes with `@mozilla/readability` + `jsdom`
3. **No API keys required** — Works without Brave/Google/Firecrawl API keys

### Architecture

- **Stage 1 (searchTopicTrending)**: Wikipedia search + summary API for bulk research. Fast path — no deep scraping. Returns 15-20 sources for course planning.
- **Stage 2 (searchForLesson)**: Per-lesson Wikipedia summaries + related article searches + scraping of known URLs. Returns 4-6 sources per lesson with real content.

### Dependencies Added

- `@mozilla/readability` — Mozilla's content extraction (Readability algorithm)
- `jsdom` — DOM implementation for Node.js

### Changes

- `packages/agents/src/content-pipeline/web-search-provider.ts` — New provider (replaces firecrawl-provider)
- `apps/api/src/routes/pipeline.ts` — Updated import from firecrawl-provider → web-search-provider; sourceMode always 'real'

### DuckDuckGo Note

DuckDuckGo HTML search was attempted first but blocked with CAPTCHA ("botnet" detection). Wikipedia API is the reliable alternative.

## Test Results

- Course: "Machine Learning Fundamentals"
- **24/24 lessons completed**, 0 failed
- **18,622 total words** across all lessons
- **113 total sources used** (real Wikipedia URLs + web sources)
- **24/24 quality checks passed**
- Source mode: **real** (no mock data)
- Real inline URLs in lesson content (e.g., `https://en.wikipedia.org/wiki/Support_vector_machine`)
