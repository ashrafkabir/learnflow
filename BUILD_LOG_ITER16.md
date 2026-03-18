# Build Log — Iteration 16

## Summary

All 12 tasks from IMPROVEMENT_QUEUE.md completed. 262/262 tests pass, TypeScript clean.

## Tasks Completed

### Task 1: Button Adoption (P0)

- **Files modified:** All 8 files in `screens/marketplace/` and `screens/onboarding/` + 5 files in `screens/marketing/`
- All raw `<button>` elements replaced with `<Button>` component from `../../components/Button.js`
- Proper variant/size props applied: primary, secondary, ghost, icon sizes

### Task 2: CourseDetail Page (P0)

- **Created:** `screens/marketplace/CourseDetail.tsx`
- Full detail page with: title/meta card, syllabus accordion, reviews section, enroll CTA
- Fallback sample data for 4 courses
- Route added: `/marketplace/courses/:courseId`
- CourseMarketplace cards now navigate to detail page instead of opening modal

### Task 3: SkeletonMarketplace Wiring (P0)

- CourseMarketplace now imports and uses `SkeletonMarketplace` during loading state
- CourseDetail also uses it as loading placeholder

### Task 4: Shadow Cleanup (P1)

- Replaced `shadow-sm` with `shadow-card` in Dashboard, ProfileSettings, MindmapExplorer
- Replaced `shadow-lg` with `shadow-elevated` in marketplace featured cards
- Added `@utility shadow-card` and `@utility shadow-elevated` to index.css using CSS custom properties

### Task 5: Adjacent Topic Suggestions (P1)

- **File:** `screens/onboarding/Topics.tsx`
- Added `ADJACENT_MAP` mapping each topic to 3 related topics
- Computed suggestions with `useMemo` based on current selections
- Renders dashed-border pill buttons below the grid with fade-in animation

### Task 6: Mobile Nav for App Screens (P1)

- **Created:** `components/MobileNav.tsx` — slide-out drawer with hamburger trigger
- Shows on mobile only (`md:hidden`) for authenticated app paths
- `AppMobileNav` wrapper in App.tsx conditionally renders based on route path
- Items: Dashboard, Conversation, Mind Map, Marketplace, Settings

### Task 7: Conversation Quick-Action Chips (P1)

- **Already implemented** in prior iteration — `getContextChips()` with "Take Notes", "Quiz Me", "Go Deeper" chips

### Task 8: Citation Hover Tooltips (P1)

- **Already implemented** — `CitationTooltip` component used in LessonReader

### Task 9: SubscriptionChoice Upgrade Modal (P2)

- Added pro upgrade modal with email capture
- "Pro Coming Soon!" messaging with email input
- Falls back to free plan if user cancels

### Task 10: Dashboard Mindmap Widget (P2)

- Added Knowledge Map preview card to Dashboard
- SVG visualization showing course nodes connected to center
- "Explore →" button linking to /mindmap
- Empty state when no courses exist

### Task 11: Notification Preferences (P2)

- Expanded ProfileSettings notification toggles from 1 to 5:
  - Push notifications, Course completion alerts, Daily learning reminders
  - Marketplace recommendations, Agent activity updates

### Task 12: FirstCourse Progress Animation (P2)

- Replaced static completion screen with 4-stage animated progress
- Stages: Research → Syllabus → Lessons → Polish with emoji + progress bar
- Stage indicators show completed/current/upcoming
- Confetti + completion CTA after all stages finish

## Test Results

- **TypeScript:** 0 errors
- **Vitest:** 262/262 passed
- **No regressions**

## Files Changed

- `apps/client/src/App.tsx` — route + MobileNav
- `apps/client/src/components/MobileNav.tsx` — NEW
- `apps/client/src/screens/marketplace/AgentMarketplace.tsx` — Button adoption
- `apps/client/src/screens/marketplace/CourseMarketplace.tsx` — Button + skeleton
- `apps/client/src/screens/marketplace/CourseDetail.tsx` — NEW
- `apps/client/src/screens/onboarding/ApiKeys.tsx` — Button adoption
- `apps/client/src/screens/onboarding/FirstCourse.tsx` — Button + progress animation
- `apps/client/src/screens/onboarding/Goals.tsx` — Button adoption
- `apps/client/src/screens/onboarding/SubscriptionChoice.tsx` — Button + modal
- `apps/client/src/screens/onboarding/Topics.tsx` — Button + adjacent suggestions
- `apps/client/src/screens/onboarding/Welcome.tsx` — Button adoption
- `apps/client/src/screens/marketing/Home.tsx` — Button adoption
- `apps/client/src/screens/marketing/Download.tsx` — Button adoption
- `apps/client/src/screens/marketing/Pricing.tsx` — Button adoption
- `apps/client/src/screens/marketing/BlogPost.tsx` — Button adoption
- `apps/client/src/screens/marketing/MarketingLayout.tsx` — Button adoption
- `apps/client/src/screens/Dashboard.tsx` — shadow + mindmap widget
- `apps/client/src/screens/ProfileSettings.tsx` — shadow + notifications
- `apps/client/src/screens/MindmapExplorer.tsx` — shadow cleanup
- `apps/client/src/index.css` — shadow/animation utilities
