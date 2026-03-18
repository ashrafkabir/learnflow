# LearnFlow Improvement Queue — Iteration 17

## Current Iteration: 17
## Status: READY FOR BUILDER
## Date: 2025-07-19
## Focus: Conversation mindmap panel, landing page contrast, accessibility, CourseDetail button fix, marketing Features shadow cleanup

---

## Brutal Assessment

After 16 iterations, the app has strong bones: all major screens exist, Button component is 98% adopted, design tokens mostly applied, vis-network mindmap with mastery colors, lesson reader with full spec structure (objectives, takeaways, next steps, quick check), skeleton loading on dashboard/marketplace, mobile nav drawer, dark mode support, notifications feed, streak tracker, progress rings, API key vault with usage stats, data export, privacy/GDPR deletion.

**What's actually broken or missing:**

1. **Conversation has NO mindmap side panel.** Spec §5.2.3 explicitly says "Mindmap panel: side drawer showing the evolving knowledge graph; nodes are clickable to explore." The Conversation screen just handles `mindmap.update` events but renders nothing — no drawer, no graph. This is a core interaction surface.

2. **Landing page has extremely low contrast.** Screenshot confirms washed-out text and CTAs. The hero headline, subtext, and buttons barely stand out against the background. Spec says "WCAG 2.1 AA" — this fails.

3. **1 raw `<button>` still exists** in `CourseDetail.tsx:173`. Iter 16 claimed all buttons migrated but missed this one.

4. **Marketing Features.tsx has 4 stale shadow tokens** (`shadow-lg`, `drop-shadow-sm` ×2, `shadow-sm`). These were supposed to be cleaned in iter 16 task 4 but only main screens were touched.

5. **No high-contrast mode.** Spec design principles: "high-contrast mode." Zero implementation — no CSS custom property toggle, no `prefers-contrast` media query.

6. **No keyboard navigation for mindmap.** Spec: "keyboard navigation." MindmapExplorer only has keyboard support on the add-node input. No keyboard traversal of graph nodes.

7. **No Creator Dashboard.** Spec §7.1: "Creator dashboard: publishing flow, analytics, earnings." Zero implementation.

8. **No swipe gestures.** Spec: "swipe gestures" for mobile. Zero touch gesture handling anywhere.

9. **Blog.tsx has stale `shadow-lg`** on hover cards.

10. **CitationTooltip and Toast use raw `shadow-lg`** instead of `shadow-elevated` token.

11. **Button.tsx primary variant uses `shadow-sm`** instead of `shadow-card` token (line 14).

---

## Prioritized Tasks (12 items)

### 1. 🔴 CRITICAL: Conversation Mindmap Side Panel

**Problem:** Spec §5.2.3 requires "Mindmap panel: side drawer showing the evolving knowledge graph; nodes are clickable to explore." Currently `Conversation.tsx` handles `mindmap.update` WebSocket events (line 208) but renders NO visual mindmap panel. The entire knowledge graph drawer is missing from the conversation UI.

**Fix:**
- Add a collapsible right-side drawer to `Conversation.tsx` (toggle button in conversation header)
- Import vis-network (same approach as MindmapExplorer — dynamic import)
- Render a mini knowledge graph in the drawer using current course nodes from `state.courses`
- Nodes should be clickable → navigate to related lesson
- Drawer width: ~320px on desktop, full-width overlay on mobile
- Add toggle button with 🧠 icon in conversation header

**Acceptance Criteria:**
- `grep -n "MindmapPanel\|mindmap.*drawer\|vis-network" apps/client/src/screens/Conversation.tsx` returns matches
- Clicking toggle opens/closes a side panel with interactive graph nodes
- Clicking a node navigates to lesson or course view

---

### 2. 🔴 CRITICAL: Fix Landing Page Contrast (WCAG AA)

**Problem:** Screenshot confirms the hero section has extremely low contrast — headline, supporting text, and CTAs are washed out against the light background. Spec requires WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text).

**Fix:**
- In `screens/marketing/Home.tsx`:
  - Hero headline: ensure `text-gray-900` (not any lighter shade)
  - Supporting text: at least `text-gray-600` (not `text-gray-400` or lighter)
  - "Get Started Free" CTA: ensure strong `bg-accent text-white` with sufficient contrast
  - "See How It Works" secondary CTA: ensure visible border/text contrast
  - Feature badge: verify contrast of text against badge background
- Check all marketing pages for similar issues

**Acceptance Criteria:**
- Hero headline is `text-gray-900 dark:text-white` or equivalent high-contrast color
- Body text meets 4.5:1 contrast ratio against white background
- Both CTAs clearly readable with strong visual weight

---

### 3. 🟡 HIGH: Fix Last Raw `<button>` in CourseDetail.tsx

**Problem:** `apps/client/src/screens/marketplace/CourseDetail.tsx:173` still has a raw `<button>` element. Iter 16 claimed 100% Button adoption but missed this.

**Fix:**
- Replace the raw `<button>` at line 173 with `<Button>` component
- Add import if not already present
- Apply appropriate variant (likely `ghost` or `secondary` based on context)

**Acceptance Criteria:**
- `grep -rn "<button" apps/client/src/screens/ --include="*.tsx" | wc -l` returns **0**

---

### 4. 🟡 HIGH: Clean Shadow Tokens in Marketing, Components, and Button

**Problem:** Several files still use raw Tailwind shadow classes instead of design tokens:
- `screens/marketing/Features.tsx:69` — `shadow-lg` → `shadow-elevated`
- `screens/marketing/Features.tsx:70` — `drop-shadow-sm` (keep, it's on emoji, not a card)
- `screens/marketing/Features.tsx:86` — `drop-shadow-sm` (keep, emoji)
- `screens/marketing/Features.tsx:89` — `shadow-sm` → `shadow-card`
- `screens/marketing/Blog.tsx:25` — `shadow-lg` → `shadow-elevated`
- `components/CitationTooltip.tsx:31` — `shadow-lg` → `shadow-elevated`
- `components/Toast.tsx:45` — `shadow-lg` → `shadow-elevated`
- `components/ErrorBoundary.tsx:35` — `shadow-lg` → `shadow-elevated`
- `components/Button.tsx:14` — `shadow-sm` → `shadow-card`

**Fix:** Replace each raw shadow class with the appropriate design token. Leave `drop-shadow-*` on individual elements (emoji icons) as-is since those are filter effects, not box shadows.

**Acceptance Criteria:**
- `grep -rn "shadow-sm\|shadow-lg\|shadow-md" apps/client/src/ --include="*.tsx" | grep -v "drop-shadow\|shadow-card\|shadow-elevated\|shadow-soft\|tailwind\|node_modules" | wc -l` returns **0**

---

### 5. 🟡 HIGH: Add High-Contrast Mode Toggle

**Problem:** Spec §5.3 design principles: "Accessibility: WCAG 2.1 AA, screen reader support, high-contrast mode, keyboard navigation." No high-contrast mode exists.

**Fix:**
- Add a `prefers-contrast: more` media query in `index.css` that boosts borders, text, and interactive element contrast
- Add a manual toggle in ProfileSettings under the existing theme section
- Store preference in localStorage as `learnflow-contrast`
- When active, add `.high-contrast` class to `<html>` which:
  - Forces `text-gray-950` / `dark:text-white` on all body text
  - Increases border widths from 1px → 2px
  - Removes transparency/opacity on interactive elements
  - Ensures all buttons have visible borders

**Acceptance Criteria:**
- `grep -rn "high-contrast\|prefers-contrast" apps/client/src/ | wc -l` returns ≥3
- ProfileSettings has a "High Contrast" toggle
- Toggling it noticeably increases visual contrast across screens

---

### 6. 🟡 HIGH: Keyboard Navigation for Mindmap

**Problem:** Spec requires "keyboard navigation." MindmapExplorer has keyboard support only on the add-node input field (`onKeyDown` for Enter). The vis-network graph nodes are not keyboard-navigable — no Tab traversal, no Enter to select/expand.

**Fix:**
- vis-network supports keyboard navigation via `interaction.keyboard.enabled: true` in options
- Enable `keyboard: { enabled: true, speed: { x: 10, y: 10, zoom: 0.02 } }` in network options
- Add an off-screen instructions text: "Use arrow keys to pan, +/- to zoom, Enter on selected node"
- Add `tabIndex={0}` to the graph container div so it's focusable
- Add `role="img"` and `aria-label="Knowledge mindmap"` to container

**Acceptance Criteria:**
- `grep -n "keyboard.*enabled\|tabIndex\|aria-label.*mindmap" apps/client/src/screens/MindmapExplorer.tsx` returns matches
- Graph container is focusable with Tab
- Arrow keys pan the graph when focused

---

### 7. 🟡 HIGH: Skeleton Loading for AgentMarketplace

**Problem:** `CourseMarketplace` now has skeleton loading (iter 16 task 3), but `AgentMarketplace` has no loading state. Both marketplace screens should show skeletons during data fetch.

**Fix:**
- In `screens/marketplace/AgentMarketplace.tsx`:
  - Import `SkeletonMarketplace` from `../../components/Skeleton`
  - Show skeleton grid while loading state is true

**Acceptance Criteria:**
- `grep -n "SkeletonMarketplace\|Skeleton" apps/client/src/screens/marketplace/AgentMarketplace.tsx` returns import + usage

---

### 8. 🟢 MEDIUM: Creator Dashboard Stub (Spec §7.1)

**Problem:** Spec §7.1 describes "Creator dashboard: publishing flow, analytics, earnings." No screen exists. This is a significant spec gap. For iteration 17, create a stub page to unblock future iterations.

**Fix:**
- Create `screens/marketplace/CreatorDashboard.tsx`:
  - Header: "Creator Dashboard"
  - Tabs: "My Courses", "Analytics", "Earnings"
  - Empty state for each tab with helpful copy ("Publish your first course to see analytics here")
  - "Create Course" CTA button
- Add route: `/marketplace/creator`
- Add link from ProfileSettings or marketplace nav

**Acceptance Criteria:**
- Route `/marketplace/creator` renders CreatorDashboard
- Three tabs visible with empty states
- Uses Button component and design tokens

---

### 9. 🟢 MEDIUM: Focus-Visible Styles Across All Interactive Elements

**Problem:** Only ~15 interactive elements across all screens have explicit `focus:ring` or `focus-visible` styles. Many buttons, links, and form controls lack visible focus indicators, failing WCAG 2.1 AA keyboard accessibility.

**Fix:**
- Add a global CSS rule in `index.css`:
  ```css
  :focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  ```
- This provides a baseline for ALL focusable elements without touching individual components
- Remove redundant per-element `focus:ring-2 focus:ring-accent` where the global rule suffices

**Acceptance Criteria:**
- `grep -n "focus-visible" apps/client/src/index.css` returns the global rule
- Tabbing through any screen shows visible focus rings on all interactive elements

---

### 10. 🟢 MEDIUM: Add Screen Reader Landmarks

**Problem:** No `<main>`, `<nav>`, `<aside>`, or `role` landmarks on major screen layouts. Screen readers can't navigate by landmark.

**Fix:**
- Dashboard: wrap main content in `<main>`
- Conversation: `<main>` for chat, `<aside>` for future mindmap drawer
- All screens: ensure exactly one `<main>` landmark
- MobileNav/sidebar: `<nav aria-label="Main navigation">`
- Marketing layout: `<header>`, `<main>`, `<footer>` landmarks

**Acceptance Criteria:**
- `grep -rn "<main\|<nav\|<aside\|role=\"navigation\"\|role=\"main\"" apps/client/src/screens/ --include="*.tsx" | wc -l` returns ≥8

---

### 11. 🟢 MEDIUM: Conversation Source Drawer Toggle

**Problem:** Spec §5.2.3: "Source drawer: expandable attribution panel showing original articles/papers with links." A `SourceDrawer` component exists in `components/SourceDrawer.tsx` but it's unclear if Conversation screen uses it with a visible toggle.

**Fix:**
- Verify `SourceDrawer` is imported and rendered in Conversation
- Add a "📚 Sources" toggle button in the conversation header (next to mindmap toggle)
- Drawer should list all citations from the current conversation

**Acceptance Criteria:**
- `grep -n "SourceDrawer\|source.*drawer" apps/client/src/screens/Conversation.tsx` returns import + usage
- A visible "Sources" toggle exists in conversation UI

---

### 12. 🟢 MEDIUM: Mobile Touch Targets Minimum Size

**Problem:** Spec: "touch targets" for mobile-first design. Several clickable elements (chip buttons, nav icons, small action buttons) appear to be under 44×44px minimum touch target size.

**Fix:**
- Audit all clickable elements and ensure `min-h-[44px] min-w-[44px]` on mobile
- Key areas: onboarding topic chips, conversation quick-action chips, mindmap add-node button, lesson action bar buttons
- Use `@media (pointer: coarse)` in index.css to increase padding on touch devices

**Acceptance Criteria:**
- `grep -n "pointer.*coarse\|min-h-\[44\|touch-target" apps/client/src/index.css` returns matches
- All interactive elements on mobile have ≥44px touch target

---

## Remaining for Future Iterations

1. **Swipe gestures** (spec: "swipe gestures, adaptive layouts") — horizontal swipe between lessons, swipe to dismiss drawers
2. **Full Creator Dashboard** with actual publishing flow, analytics charts, earnings tracking
3. **Collaboration features** — peer matching, study groups (spec §7.2 agent categories)
4. **Export formats** — PDF, SCORM, Notion, Obsidian (Pro tier, spec §8)
5. **Proactive skill update notifications** (Pro tier, spec §8)
6. **Enterprise tier** — SSO, SCIM, admin dashboard
7. **Offline/PWA support** — service worker, offline lesson access
8. **Spaced repetition** — integrate with notes/exam agents for scheduled review
9. **Dark mode contrast audit** — systematic check of all dark mode colors against WCAG AA
10. **Performance optimization** — code splitting, lazy loading for marketplace/mindmap
11. **E2E test suite** — Playwright tests for critical user journeys
12. **i18n/l10n** — internationalization support
