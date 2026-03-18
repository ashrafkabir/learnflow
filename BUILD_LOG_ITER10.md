# Build Log — Iteration 10

**Date:** 2025-07-18
**Tests:** 262 pass, 0 fail (16 test files)

## Completed Tasks

### 1. 🔴 CRITICAL: Lesson Edit Persistence → DONE
- Added `dbCourses.save(course)` after edit-by-prompt in `pipeline.ts:840`
- Edits now persist to SQLite and survive API restarts

### 2. 🔴 Low-Contrast Text (WCAG AA) → DONE
- Upgraded all standalone `text-gray-400` to `text-gray-500 dark:text-gray-400` across 13 screen files
- Fixed doubled `dark:` class artifacts
- Body text now meets 4.5:1 contrast in both light and dark mode

### 3. 🔴 Test Runner Errors → DONE
- Added `vi.stubEnv('OPENAI_API_KEY', '')` to firecrawl tests so trending queries use heuristic fallback
- Made SQLite use `:memory:` in test mode (`VITEST=true`) to fix cross-test isolation
- Fixed api-layer tests to use unique emails (`Date.now()`) instead of fixed emails
- Result: 262 tests, 0 failures, 0 errors — clean exit

### 4. 🔴 Dashboard Empty State → ALREADY DONE (prior iteration)
- Full empty state with "Create your first course" heading, CTA buttons, topic suggestions

### 5. 🟡 Dashboard Relative URLs → ALREADY DONE (prior iteration)
- All fetches use `apiGet` helper

### 6. 🟡 Mindmap Renders Tiny → ALREADY DONE (prior iteration)
- Container 80vh, `fit()` on stabilization, zoom +/-/fit buttons, font sizes 14-18px

### 7. 🟡 Lesson Reader Bottom Bar → ALREADY DONE (prior iteration)
- Sticky bottom bar with Mark Complete, Take Notes, Quiz Me, Ask Question

### 8. 🟡 Onboarding Back/Skip → ALREADY DONE (prior iteration)
- Back buttons on steps 2+, Skip on Topics and Subscription

### 9. 🟡 Course Progress Visualization → ENHANCED
- Overall progress bar + circular ring were already present
- Added per-module progress bars showing X/Y lessons completed

### 10. 🟡 Pipeline Source Diversity → DEFERRED (architectural, not a quick fix)

### 11. 🟡 Conversation Empty State → DONE
- Enhanced from 3 chips to 6 categorized suggestion chips with emoji icons
- Added capability description paragraph

### 12. 🟡 Settings Page UX → ALREADY DONE (prior iteration)
- Danger zone with red tint, confirmation dialogs, consistent button styles

### 13-14. 🟠 Marketing Polish → DONE (contrast fixes applied)

### 15. 🟠 "0-day streak" Copy → ALREADY DONE (prior iteration)
- Streak=0 → "Start your streak!", Streak=1 → "Keep it going!", Streak≥2 → "Don't break the chain."

### 16. 🟠 Pipeline Timing → DEFERRED (performance optimization, not UI fix)
