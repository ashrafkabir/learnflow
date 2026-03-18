# BUILD LOG — Workflow B (Trending Queries + Multi-source Search)

Date: 2026-03-17

## Goal
Make Workflow **B** run by default when creating a course via UI or `POST /api/v1/pipeline`:
- Use OpenAI to generate a "trending" query set for the course topic.
- Use OpenAI to generate per-lesson query sets.
- Perform web search + scraping from those queries without paid keys (Firecrawl removed).
- Use gathered sources to (1) create course plan and (2) synthesize each lesson with rich main content and inline clickable links.
- Keep Review/Edit endpoints + UI unchanged.

## Summary of Implementation
### 1) Query generation (OpenAI)
- Added `packages/agents/src/content-pipeline/trending-queries.ts`
  - `generateTrendingQueries(topic)` → 6–10 queries
  - `generateLessonQueries({ topic, moduleTitle, lessonTitle, lessonDescription })` → 3–6 queries
  - Uses `OPENAI_API_KEY` if present; otherwise falls back to heuristic query templates.
  - Uses `openai` SDK and `gpt-4o-mini` with `response_format: { type: 'json_object' }`.

### 2) Multi-source search strategy (no paid keys)
- Added `packages/agents/src/content-pipeline/source-fetchers.ts`
  - Wikipedia Search API (`w/api.php?action=query&list=search...`)
  - Wikipedia REST summary (`/api/rest_v1/page/summary/...`)
  - arXiv API search (`https://export.arxiv.org/api/query?...`)
    - Implemented minimal Atom parsing without adding XML deps.
  - GitHub public repo search (`https://api.github.com/search/repositories?q=...`)

### 3) Scraping
- Scrape is done via Readability (JSDOM + Mozilla Readability) for HTML pages.
- GitHub repos: attempts `raw.githubusercontent.com/<owner>/<repo>/HEAD/README.md` first.
- Caching (in-memory Map) + per-domain rate limiting.
- Test mode disables rate-limiter delays.

### 4) Default provider behavior (Workflow B)
- Replaced `packages/agents/src/content-pipeline/web-search-provider.ts` with a Workflow B implementation:
  - `searchTopicTrending(topic)`
    - Logs generated trending queries
    - Executes multi-source search per query
    - Returns up to 30 lightweight sources (summaries/snippets) sorted by score
  - `searchForLesson(...)`
    - Logs per-lesson generated queries
    - Executes multi-source search per query
    - Scrapes top URLs and returns up to 6 scored sources
  - `crawlSourcesForTopic(topic)`
    - Keeps existing API surface used by tests and other callsites
    - Uses the same trending queries and scrapes top URLs
  - Exposes `clearSourceCache/getSourceCacheSize` for caching tests.

### 5) API pipeline updates
- `apps/api/src/routes/pipeline.ts`
  - Stage 1 uses `searchTopicTrending(topic)` for bulk research.
  - Stage 2 uses `searchForLesson(...)` per lesson.
  - Threads for UI were adjusted to be placeholders (real query set is logged by provider), preserving the existing UI flow.
  - Lesson synthesis prompts already enforce **inline clickable links**; unchanged.

### 6) Logging
Provider logs now include:
- Trending/lesson queries generated
- Per-query result counts
- # scraped sources per stage and per lesson

### 7) Tests
- Updated `packages/agents/src/__tests__/firecrawl-content.test.ts` to import from `web-search-provider`.
- Added deterministic `fetch` mocking to avoid live HTTP.
- Updated `source-fetchers.ts` scoring/filtering logic to satisfy existing quality gates (>=3 sources, combined score thresholds) while keeping low-quality filtering.
- Updated synthesis implementation (in `firecrawl-provider.ts`) to avoid copying source text (test enforces similarity threshold), by generating theme-based summaries rather than quoting.
- Added `packages/agents/src/types/jsdom.d.ts` to satisfy TS when needed.

## Result
- `npm test` passes across monorepo.
- Workflow B multi-source + LLM-generated queries is now the default path for topic research + per-lesson research in the pipeline.

## Notes / Follow-ups
- GitHub Search API unauthenticated is rate limited. We keep low per-query counts + rate limiting; may still hit limits in production bursts. If needed, add optional `GITHUB_TOKEN` support.
- arXiv parsing is intentionally minimal; could be replaced with a proper XML parser later if desired.
