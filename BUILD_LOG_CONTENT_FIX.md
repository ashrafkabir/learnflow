# Build Log: Content Fix

## Issue 1: .env not loaded (Firecrawl returns mock data)

**Fix:** Added `import 'dotenv/config';` as first line of `apps/api/src/index.ts`. Also added uncaught exception/rejection handlers.
**Result:** `process.env.FIRECRAWL_API_KEY` is now set. Pipeline uses real Firecrawl search+scrape. Source mode shows "real" instead of "mock".

## Issue 2: Lesson content is hollow

**Fixes applied:**

### 1. `apps/api/src/routes/pipeline.ts` — `generateLesson()` prompt

- Rewrote system prompt to require a rich "Main Content" section (600-900 words minimum)
- Prompt now requires: summarized key points, concrete examples/code snippets, inline clickable source URLs, teaching explanations
- Structure: Title → Learning Objectives → Main Content (bulk) → Key Takeaways → Sources
- Updated source context to include full URLs for inline linking

### 2. `apps/api/src/routes/pipeline.ts` — `generateEnhancedFallback()`

- Rewrote from generic filler to structured, substantive content
- Now includes: What is X, Why It Matters, Core Principles and Techniques, Practical Example (step-by-step), Common Pitfalls
- Uses bold terms, numbered lists, real structure

### 3. `packages/agents/src/content-pipeline/firecrawl-provider.ts` — `synthesizeFromSources()`

- Changed from shallow "Overview + Key Concepts" to "Main Content" with subsections
- Added inline clickable source links `[title](url)` throughout
- Added per-source "Insights from" subsections with bullet points
- Added Key Takeaways with source links
- Fixed Jaccard similarity issue (test S04-FIRE-09) by using bullet-point format instead of raw sentence copying

## Verification

- Pipeline completed successfully with topic "Machine Learning Fundamentals"
- Source mode: **real** (Firecrawl API)
- 5 modules, 19 lessons generated
- Lesson word counts: 775-971 words (all above 500-word minimum)
- Content includes: inline source links, code examples, structured teaching content
- **17/17 firecrawl tests pass**
- **258/262 total tests pass** (4 pre-existing client test failures unrelated to our changes)

## Files Modified

1. `apps/api/src/index.ts` — dotenv import + error handlers
2. `apps/api/src/routes/pipeline.ts` — generateLesson prompt + generateEnhancedFallback
3. `packages/agents/src/content-pipeline/firecrawl-provider.ts` — synthesizeFromSources + search logging
