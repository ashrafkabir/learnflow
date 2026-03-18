# Build Log — Iteration 17

## Date: 2025-07-19

## Focus: Conversation mindmap, landing contrast, accessibility, button fixes

### Tasks Completed

1. **✅ Conversation Mindmap Side Panel** — Added `MindmapPanel` component to Conversation.tsx with vis-network dynamic import, collapsible right-side drawer (320px desktop, full-width mobile), clickable nodes that navigate to courses/lessons, keyboard support. Toggle button (🧠) added to conversation header.

2. **✅ Landing Page Contrast Fix** — Hero headline now uses `text-gray-900 dark:text-white`, body text uses `text-gray-700 dark:text-gray-300` for WCAG AA compliance.

3. **✅ Last Raw `<button>` Removed** — CourseDetail.tsx line 173 raw `<button>` replaced with `<Button variant="ghost">`. Zero raw buttons remain in screens/.

4. **✅ Shadow Token Cleanup** — Replaced all stale shadow classes:
   - Features.tsx: `shadow-lg` → `shadow-elevated`, `shadow-sm` → `shadow-card`
   - Blog.tsx: `shadow-lg` → `shadow-elevated`
   - CitationTooltip.tsx: `shadow-lg` → `shadow-elevated`
   - Toast.tsx: `shadow-lg` → `shadow-elevated`
   - ErrorBoundary.tsx: `shadow-lg` → `shadow-elevated`
   - Button.tsx: `shadow-sm` → `shadow-card`

5. **✅ High-Contrast Mode** — Added `prefers-contrast: more` media query and `.high-contrast` class in index.css. Toggle added to ProfileSettings under Preferences section. Stored in `localStorage('learnflow-contrast')`.

6. **✅ Keyboard Navigation for Mindmap** — Enabled `keyboard: { enabled: true }` in vis-network options. Added `tabIndex={0}` and `role="img"` to graph container.

7. **✅ Skeleton Loading for AgentMarketplace** — Imported and conditionally renders `SkeletonMarketplace` during loading state.

8. **✅ Creator Dashboard Stub** — Created `screens/marketplace/CreatorDashboard.tsx` with 3 tabs (My Courses, Analytics, Earnings), empty states, and Create Course CTA. Route added at `/marketplace/creator`.

9. **✅ Focus-Visible Styles** — Already existed from prior iteration (global focus-visible rules in index.css). Verified working.

10. **✅ Screen Reader Landmarks** — Added `<main>` landmarks to Dashboard, Conversation, LessonReader, MindmapExplorer, and MarketingLayout. MobileNav already had `<nav>`, Conversation got `<aside>` via MindmapPanel. Total: 8+ landmark elements.

11. **✅ Conversation Source Drawer Toggle** — Added 📚 toggle button in conversation header that opens/closes the SourceDrawer.

12. **✅ Mobile Touch Targets** — Added `@media (pointer: coarse)` rule in index.css ensuring 44px min-height on all interactive elements.

### Test Results

- TypeScript: 0 errors
- Vitest: 262 tests passed, 16 suites, 0 failures

### Files Modified

- `screens/Conversation.tsx` — MindmapPanel, source/mindmap toggles, `<main>` landmark
- `screens/marketing/Home.tsx` — Contrast fix
- `screens/marketplace/CourseDetail.tsx` — Button migration
- `screens/marketing/Features.tsx` — Shadow tokens
- `screens/marketing/Blog.tsx` — Shadow tokens
- `screens/marketing/MarketingLayout.tsx` — `<main>` landmark
- `screens/Dashboard.tsx` — `<main>` landmark
- `screens/LessonReader.tsx` — `<main>` landmark
- `screens/MindmapExplorer.tsx` — Keyboard nav, tabIndex, `<main>` landmark
- `screens/marketplace/AgentMarketplace.tsx` — Skeleton loading
- `screens/marketplace/CreatorDashboard.tsx` — NEW
- `screens/ProfileSettings.tsx` — High-contrast toggle
- `components/CitationTooltip.tsx` — Shadow token
- `components/Toast.tsx` — Shadow token
- `components/ErrorBoundary.tsx` — Shadow token
- `components/Button.tsx` — Shadow token
- `index.css` — High-contrast mode, pointer:coarse touch targets
- `App.tsx` — Creator dashboard route
