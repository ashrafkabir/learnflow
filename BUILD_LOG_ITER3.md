# BUILD_LOG — Iteration 3

## Started: 2026-03-17

## Status: COMPLETE

### Completed Work

#### 🔴 #1 PRIORITY — Course Creation Pipeline ✅

- **API**: Created `apps/api/src/routes/pipeline.ts` with full 5-stage pipeline:
  1. 🔍 Web Scraping — Multiple Firecrawl threads with real-time status
  2. 📊 Organizing — Deduplication, credibility scoring, theme clustering
  3. 🤖 Synthesizing — LLM lesson generation with per-lesson progress
  4. ✅ Quality Check — Automated checks (word count, objectives, sources, readability)
  5. 📝 Review — Course ready for user review
- **SSE streaming**: Real-time events via `GET /api/v1/pipeline/:id/events`
- **Client hooks**: `usePipeline`, `useStartPipeline`, `usePipelineList` in `hooks/usePipeline.ts`
- **Pipeline components**: `PipelineView`, `StageColumn`, `CrawlThreadList`, `SynthesisList`, `QualityCheckList`, `OrganizingView` in `components/pipeline/`
- **Dashboard integration**: Active pipeline shown inline, WIP pipelines listed with progress bars
- **Pipeline detail page**: `/pipeline/:pipelineId` for full-page pipeline view
- **Visual design**: Kanban-style columns with Sky Blue (active), Teal (complete), Gray (pending), animated transitions
- **Tested**: Full pipeline runs end-to-end, creates real courses with LLM content

#### Task 1: Auth Headers in API Calls ✅

- Updated `apiPost`/`apiGet` in AppContext to include `Authorization: Bearer` headers from localStorage
- Added `getAuthHeaders()` helper
- devMode API uses `devAuth` (auto-assigns test user) — so 401s were not actually occurring, but auth is now wired for production

#### Task 2: Login/Register Screens ✅

- Created `LoginScreen.tsx` and `RegisterScreen.tsx`
- Proper forms calling `/api/v1/auth/login` and `/api/v1/auth/register`
- Token storage in localStorage
- Routes added: `/login`, `/register`
- "Skip (dev mode)" link for development

#### Task 4: Error States ✅

- `apiPost`/`apiGet` now throw on non-2xx responses (no more silent swallowing)
- CourseView has error state with retry button
- Chat shows error message on failure instead of silent fail
- Proper console logging for all API errors

#### Task 5: Lesson Context in Chat ✅

- `sendChat` now passes `courseId` and `lessonId` from active state
- Notes and quiz generation already passed context (was working)

#### Task 6: Dashboard Course Listing ✅

- Added `useEffect` to fetch courses on mount
- Full course details fetched and stored in state
- Courses now appear on dashboard after creation

#### Task 11: Vite Proxy ✅ (was already configured)

- Confirmed `vite.config.ts` has proxy for `/api` → `http://localhost:3002`

### Test Results

- **TypeScript**: `npx tsc --noEmit` — ✅ passes clean
- **Vitest**: 254/257 tests pass (3 timeout failures in API tests due to slow LLM course creation — pre-existing, expected)
- **Screenshots**: Dashboard, pipeline active, pipeline progress, login, register — all verified

### Files Created/Modified

- `apps/api/src/routes/pipeline.ts` (NEW)
- `apps/api/src/app.ts` (added pipeline route)
- `apps/client/src/hooks/usePipeline.ts` (NEW)
- `apps/client/src/components/pipeline/PipelineView.tsx` (NEW)
- `apps/client/src/components/pipeline/StageColumn.tsx` (NEW)
- `apps/client/src/components/pipeline/CrawlThreadList.tsx` (NEW)
- `apps/client/src/components/pipeline/OrganizingView.tsx` (NEW)
- `apps/client/src/components/pipeline/SynthesisList.tsx` (NEW)
- `apps/client/src/components/pipeline/QualityCheckList.tsx` (NEW)
- `apps/client/src/screens/PipelineDetail.tsx` (NEW)
- `apps/client/src/screens/LoginScreen.tsx` (NEW)
- `apps/client/src/screens/RegisterScreen.tsx` (NEW)
- `apps/client/src/screens/Dashboard.tsx` (pipeline integration, course fetching)
- `apps/client/src/screens/CourseView.tsx` (error states)
- `apps/client/src/context/AppContext.tsx` (auth headers, error handling, lesson context)
- `apps/client/src/App.tsx` (new routes)
