# BUILD_LOG_ITER1.md — Builder Iteration 1 (auto-tracked)

## Status: 🔄 Running (25 min, gpt-5.3-codex)

## Files Modified/Created (detected from filesystem)

### New Components

- `apps/client/src/components/CitationTooltip.tsx` — Inline citation hover previews (§5.2.4)
- `apps/client/src/components/ProgressRing.tsx` — Course progress rings (§5.2.2)
- `apps/client/src/components/SourceDrawer.tsx` — Expandable source drawer (§5.2.3)

### New Onboarding Screens (§5.2.1 — was missing 3 screens)

- `apps/client/src/screens/onboarding/ApiKeys.tsx` — BYOAI key setup
- `apps/client/src/screens/onboarding/FirstCourse.tsx` — Initial course generation
- `apps/client/src/screens/onboarding/SubscriptionChoice.tsx` — Free vs Pro choice
- `apps/client/src/screens/onboarding/Ready.tsx` — Onboarding complete

### Redesigned Screens

- `apps/client/src/screens/Dashboard.tsx` — Progress rings, daily lessons
- `apps/client/src/screens/Conversation.tsx` — Markdown/syntax highlighting
- `apps/client/src/screens/LessonReader.tsx` — Citations, source drawer
- `apps/client/src/screens/MindmapExplorer.tsx` — D3.js graph (was tree view)
- `apps/client/src/screens/ProfileSettings.tsx` — Dark mode, key vault

### API

- `apps/api/src/routes/chat.ts` — Real agent routing
- `apps/api/src/routes/courses.ts` — Improved course generation

### Other

- `apps/client/src/App.tsx` — New routes for onboarding screens
- `packages/agents/src/index.ts` — Agent exports
- `apps/client/src/__tests__/client.test.tsx` — Updated tests

## Improvement Tasks (from IMPROVEMENT_QUEUE.md)

Likely completed so far (based on files created):

- ✅ Task 5: Missing onboarding screens (ApiKeys, SubscriptionChoice, FirstCourse)
- ✅ Task 6: Inline citations with hover-preview (CitationTooltip)
- ✅ Task 6: Source drawer (SourceDrawer)
- ✅ Task 10: Progress rings on dashboard (ProgressRing)
- 🔄 Task 4: D3.js mindmap (MindmapExplorer modified)
- 🔄 Task 3: Markdown/syntax highlighting (Conversation modified)

Still working on remaining tasks...
