# IMPROVEMENT_QUEUE

Iteration: 35
Status: READY FOR BUILDER
Date: 2026-03-18
Theme: Mobile polish + calm “new-age learning + AI” icon system (line icons)

## Brutal Assessment (evidence)

The app is usable on desktop, but on mobile it still _feels like a responsive web prototype_:

- Some screens exhibit **layout distortion** (overflow/stacking issues), inconsistent safe-area handling, and tap targets below 44px.
- Iconography is **generic/ordinary**, not cohesive, and doesn’t communicate an “AI learning OS” brand.

This iteration focuses on high-ROI UX fundamentals:

1. fix mobile distortion across key flows; 2) replace ordinary icons with a cohesive calm line icon set.

## Prioritized Task Queue (12)

### 1) Mobile overflow hard-stop (≥320px)

**Problem:** Horizontal overflow / clipped content distorts browsing on mobile.
**Fix:** Add global overflow guards + fix offending flex/grid containers.
**Acceptance:** At widths 320/375/414: **no horizontal scroll**; `document.documentElement.scrollWidth === window.innerWidth` in Playwright.

### 2) Safe-area + sticky elements correctness

**Problem:** Bottom inputs/actions can collide with iOS safe area.
**Fix:** Use `env(safe-area-inset-bottom)` padding for sticky footers/chat input; ensure headers don’t cover content.
**Acceptance:** On mobile viewport, chat input and bottom action bars are always visible and not obscured.

### 3) Tap target minimums

**Problem:** Icon buttons/controls are sometimes too small.
**Fix:** Enforce `min-w/min-h: 44px` for icon buttons globally.
**Acceptance:** All icon buttons meet 44x44.

### 4) Navigation/header density on mobile

**Problem:** Header rows wrap poorly and look cramped.
**Fix:** Define mobile header layout rules (wrap/stack) and spacing.
**Acceptance:** Dashboard header + course creation row stack cleanly on 320–375px.

### 5) Create a cohesive icon system (calm line)

**Problem:** Mixed icon sources / ordinary icons.
**Fix:** Create `apps/client/src/components/icons/` with a consistent API:

- `IconProps { size?: number; className?: string; title?: string }`
- All icons are **stroke-based**, rounded caps/joins, 1.75–2px stroke.
  **Acceptance:** Single icon style used across all screens.

### 6) Generate “AI learning” icon set (12–16 icons)

**Fix:** Add icons for: BrainSpark, Course, Lesson, Mindmap, ChatTutor, Marketplace, Pipeline, Settings, Search, ProgressRing, Spark, Shield/Key.
**Acceptance:** Icons render crisp at 16/20/24/32 px; look cohesive.

### 7) Replace icons across app screens

**Fix:** Refactor screens/components to use the new icon components.
**Acceptance:** No remaining imports from prior icon sets (where feasible).

### 8) Accessibility for icons

**Fix:** Ensure icons used as buttons have `aria-label`; decorative icons `aria-hidden`.
**Acceptance:** Axe: no serious violations around icon buttons.

### 9) Update design tokens to support icon color states

**Fix:** Tokenize icon colors for primary/secondary/muted states.
**Acceptance:** Icons follow theme consistently (light/dark).

### 10) Mobile visual regression screenshots

**Fix:** Extend Playwright screenshot scripts to capture 320/375/414 for: Dashboard, Marketplace, Conversation, CourseView, LessonReader, Settings.
**Acceptance:** Screenshots saved under `evals/screenshots/iter35-mobile/`.

### 11) QA: tsc/vitest/eslint gates

**Acceptance:** `npx tsc --noEmit`, `npx vitest run`, `npx eslint .` all green.

### 12) Final polish pass (spacing/typography)

**Fix:** Reduce visual clutter on mobile (consistent padding, line-heights).
**Acceptance:** 5-screen manual review passes.
