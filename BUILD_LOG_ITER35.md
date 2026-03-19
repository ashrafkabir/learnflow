# BUILD_LOG_ITER35

Iteration 35: Mobile polish + calm line icon system
Date: 2026-03-19

## Summary

- Implemented calm stroke-based icon system and began replacing emoji icons across key screens.
- Mobile safety/tap targets: removed overrides that shrank icon button to 24px; uses global min 44px on coarse pointer.
- Added mobile viewport screenshot script capturing 320/375/414 viewports.

## Work log

### 1) Calm line icon system (Task 5/6)

- Added `apps/client/src/components/icons/` with consistent API + accessibility helpers:
  - `types.ts` (IconProps + ariaProps + iconStroke)
  - Icons: BrainSpark, ChatTutor, Course, Lesson, Mindmap, Marketplace, Pipeline, ProgressRing, Search, Settings, Spark, ShieldKey
  - `index.ts` barrel export

### 2) Replace icons across app (Task 7/8)

- Dashboard:
  - Replaced header + top-right icon buttons with new icons.
  - Replaced Quick Actions emoji icons with calm line icons.
  - Replaced pipelines / notifications emoji indicators with calm line icons.
  - Removed remaining emoji on Dashboard.
- Conversation:
  - Replaced hero brain emoji and suggestion cards with calm line icons.
  - Replaced mindmap + sources buttons with calm line icons and added aria-labels.
  - Updated agent activity indicator to support ReactNode icons.
  - Removed remaining emoji on Conversation.

### 3) Mobile tap-target fix (Task 3)

- Conversation: removed `h-6 w-6 p-0` from context close button that could violate 44x44.

### 4) Mobile screenshots (Task 10)

- Added `screenshot-mobile.mjs`:
  - Captures pages at 320/375/414 widths
  - Saves to `evals/screenshots/iter35-mobile/`
  - Warns on horizontal overflow (scrollWidth > innerWidth + 10)
- Ran script successfully; screenshots generated.

### 5) Quality gates (Task 11)

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅ (377 tests)
- `npx eslint .` ✅ (after fixing eslint no-undef in screenshot script)

## Pending

- Full app-wide icon replacement beyond Dashboard/Conversation.
- Review other key screens on mobile for overflow/spacing (CourseView/LessonReader/Marketplace etc.) and fix as needed.
- Update IMPROVEMENT_QUEUE status + commit.
