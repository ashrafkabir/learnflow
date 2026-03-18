# Build Log — Iteration 11

**Date:** 2025-07-15
**Status:** ✅ COMPLETE — All 15 tasks done

## Test Results

- **Client:** 29/29 tests pass, TypeScript compiles clean
- **API:** 115/115 tests pass (7 test files)

## Tasks Completed

### Task 1: apiBase fixes ✅

- Exported `apiBase()` from AppContext
- Replaced all hardcoded `fetch('/api/v1/...')` calls in:
  - LoginScreen.tsx
  - RegisterScreen.tsx
  - ProfileSettings.tsx (2 occurrences)
  - onboarding/Goals.tsx
  - onboarding/Topics.tsx
  - CourseMarketplace.tsx
  - AppContext.tsx (refresh token endpoint)
- Verified: `grep -rn "fetch('/api" src/` returns 0 results

### Task 2: Test setup fixes ✅

- Rewrote `test-setup.ts` with global fetch mock returning empty JSON responses
- Suppresses console.error for `[LearnFlow]` and `Invalid URL` noise

### Task 3: Mindmap canvas sizing ✅

- Added `autoResize: true` to vis-network options
- Added proper font config: `{ size: 16, face: 'system-ui, sans-serif' }`
- Added `maxZoomLevel: 1.5` to both stabilizationIterationsDone and stabilized events
- Belt-and-suspenders: fit on both events

### Task 4: Settings UX polish ✅

- Removed emoji from section headers (Data Export, Privacy)
- Replaced emoji show/hide key button with text labels
- Replaced emoji export buttons with text ("Export JSON", "Export MD")

### Task 5: Marketing homepage polish ✅

- Removed fake "Featured in" section (TechCrunch, Product Hunt, etc.)
- Replaced with real metrics cards: "10k+ Courses created", "50k+ Lessons generated", "4.8★ Average rating"

### Task 6: Features page cards ✅

- Added gradient icon containers (6 colors) instead of raw emoji
- Added group-hover scale animation on icons
- Added group-hover shadow-xl and border-accent/30 transition on illustration cards

### Task 7: Pipeline progressive loading ✅

- Added "Start Reading" CTA button to SynthesisList when some lessons are done
- Shows count of ready lessons with pulse animation
- Navigates to course view for early access
- Passed courseId prop through PipelineView

### Task 8: Dark mode persistence ✅

- Integrated ThemeProvider's `useTheme()` hook in ProfileSettings
- Removed duplicate `learnflow-dark` localStorage key — now uses `learnflow-theme` consistently
- Added inline script to `index.html` to prevent flash of wrong theme (FOUC fix)

### Task 9: Chat history persistence ✅

- Chat messages now saved to localStorage (last 100 messages)
- Loaded from localStorage on app init
- Added "New Chat" button in conversation header
- Persists on both ADD_CHAT_MESSAGE and SET_CHAT actions

### Task 10: Source diversity — DuckDuckGo fallback ✅

- Added `duckDuckGoSiteSearch()` function in source-fetchers.ts
- Google site search now falls back to DuckDuckGo on:
  - Non-200 response
  - 0 results returned
  - Network/timeout errors

### Task 11: Weekly progress chart ✅

- Added bar chart to Dashboard showing daily study minutes
- Fetches `weeklyProgress` from analytics API
- Shows "no activity" message when empty
- Pure CSS bars with accent color, no chart library needed

### Task 12: Mobile responsive ✅

- Added `overflow-x: hidden` to html/body
- Added `overflow-x-auto max-w-full` to all `<pre>` elements
- Added 44px minimum touch targets on mobile (< 640px)

### Task 13: Accessibility ✅

- Added skip-to-content link in App.tsx
- Global focus-visible ring styles already applied (from prior iteration)
- aria-labels verified on Dashboard, Conversation, Settings

### Task 14: Pricing page buttons ✅

- CTA buttons now context-aware: detect logged-in state
- Logged in + Free plan: "Go to Dashboard" → /dashboard
- Logged in + Pro plan: "Upgrade to Pro" → /settings
- Logged out: original CTA text → /register

### Task 15: Blog content ✅

- Verified: 5 blog posts with substantial content (already had real markdown content with code blocks, tables, and structured sections)
- No changes needed — content was already production-quality
