# LearnFlow Improvement Queue — Iteration 19

## Current Iteration: 19
## Status: READY FOR BUILDER
## Date: 2025-07-19
## Focus: TypeScript fix, mindmap mastery colors, swipe gestures, test coverage, code splitting, conversation polish

---

## Brutal Assessment

After 18 iterations the app is feature-complete at a prototype level. All spec screens exist, design tokens match the spec palette, framer-motion animations are in, marketing pages have proper structure, accessibility basics (skip link, aria-current, focus-visible, landmarks) are present. 29 tests pass, TypeScript has **1 error** (Confetti trigger prop missing in FirstCourse.tsx).

**What's actually broken or weak (verified):**

1. **TypeScript build is broken.** `Confetti` requires `{ trigger: boolean }` but `FirstCourse.tsx:98` passes `<Confetti />` with no props. This means production builds fail.

2. **Mindmap mastery colors are not spec-compliant.** Spec §5.2.5: "Color-coded by mastery level (not started, in progress, mastered)." Code at `MindmapExplorer.tsx:107` has a comment `// Color by mastery — Task 8` but the actual colors are based on course/module index, not mastery state. There's no legend either.

3. **Zero swipe gestures.** Spec §5.3: "swipe gestures, adaptive layouts." `grep -rn "swipe\|gesture\|touch" screens/` returns nothing. Lesson reader and onboarding are prime candidates.

4. **Only 29 tests in 1 file.** Spec §15 Testing Strategy calls for unit + integration + E2E. There's a single `__tests__/client.test.tsx`. No tests for onboarding flow, conversation, marketplace, mindmap, or any marketing pages.

5. **No code splitting / lazy loading.** All screens are eagerly imported in `App.tsx`. No `React.lazy()` or dynamic imports. With 30+ screens this hurts initial load.

6. **Conversation: no "which agent is working" indicator rendered.** The `agentInfo.activity` text exists but is only shown generically. Spec §5.2.3: "subtle animation showing which agent is currently processing" — no pulsing dot, no agent name badge during streaming.

7. **LessonReader: no estimated read time.** Spec §5.2.4: "<10 min estimated read time indicator." Not implemented.

8. **LessonReader: no "Ask Question" in bottom bar.** Spec §5.2.4: "Bottom action bar: Mark Complete, Take Notes, Quiz Me, Ask Question." Only Mark Complete exists.

9. **Dashboard: Today's Lessons section is empty-state only.** The section header exists but actual lesson cards rely on API data that never arrives in the prototype. Needs mock data or a meaningful empty state with CTA.

10. **CourseView: no inline source citations with hover-preview.** Spec §5.2.4: "Inline source citations with hover-preview." LessonReader has citation parsing but CourseView syllabus doesn't show sources.

11. **No 404 page.** The catch-all route redirects to `/` silently. Should show a proper 404 with navigation options.

12. **Marketing nav doesn't highlight active link visually.** `aria-current="page"` is set (good) but no distinct visual style (underline/bold/color) is applied based on it.

---

## Prioritized Tasks (12 items)

### 1. 🔴 CRITICAL: Fix TypeScript Error in FirstCourse.tsx

**Problem:** `src/screens/onboarding/FirstCourse.tsx:98` renders `<Confetti />` without the required `trigger` prop. `npx tsc --noEmit` fails. Production builds broken.

**Fix:**
- Line 98: change `<Confetti />` to `<Confetti trigger={true} />` or `<Confetti trigger={done} />` where `done` is the completion state boolean.

**Acceptance Criteria:**
- `npx tsc --noEmit` exits with 0 errors

---

### 2. 🔴 CRITICAL: Add React.lazy Code Splitting for All Screens

**Problem:** `App.tsx` eagerly imports 30+ screen components. No code splitting at all.

**Fix:**
- Replace static imports with `React.lazy(() => import('./screens/...'))` for all screen components
- Wrap `<Routes>` content in `<Suspense fallback={<LoadingSpinner />}>`
- Keep only lightweight components (ErrorBoundary, PageTransition, layout wrappers) as static imports

**Acceptance Criteria:**
- `grep "React.lazy" src/App.tsx | wc -l` returns ≥15
- `grep "Suspense" src/App.tsx | wc -l` returns ≥1
- App still boots and routes work

---

### 3. 🟡 HIGH: Mindmap Mastery-Based Color Coding

**Problem:** `MindmapExplorer.tsx:107` comments say "Color by mastery" but colors are by course index. Spec §5.2.5: "Color-coded by mastery level (not started, in progress, mastered)."

**Fix:**
- Define 3 mastery colors using design tokens: not-started (gray-400), in-progress (warning/amber), mastered (success/green)
- Color lesson nodes by completion state from `state.courses[].modules[].lessons[].completed`
- Add a legend in the top-right corner showing the 3 mastery levels
- Module nodes: blend based on % of lessons completed

**Acceptance Criteria:**
- `grep -n "mastered\|not.started\|in.progress" src/screens/MindmapExplorer.tsx | wc -l` returns ≥3
- Legend is visible in the mindmap screen

---

### 4. 🟡 HIGH: Add Estimated Read Time to LessonReader

**Problem:** Spec §5.2.4: "<10 min estimated read time indicator." Not implemented.

**Fix:**
- Calculate word count from lesson content, divide by 200 wpm, round up
- Show "~X min read" badge next to the lesson title in `LessonReader.tsx`
- Use a clock icon (🕐) prefix

**Acceptance Criteria:**
- `grep -n "min read\|readTime\|wordCount" src/screens/LessonReader.tsx | wc -l` returns ≥2

---

### 5. 🟡 HIGH: Complete LessonReader Bottom Action Bar

**Problem:** Spec §5.2.4 says "Mark Complete, Take Notes, Quiz Me, Ask Question." Only Mark Complete exists.

**Fix:**
- Add 3 more buttons to the bottom bar: "Take Notes" (opens a textarea overlay/modal), "Quiz Me" (navigates to conversation with "quiz me on this lesson" prefilled), "Ask Question" (navigates to conversation with lesson context)
- Style as secondary Button components

**Acceptance Criteria:**
- `grep -n "Take Notes\|Quiz Me\|Ask Question" src/screens/LessonReader.tsx | wc -l` returns ≥3
- All 4 buttons visible in the bottom bar

---

### 6. 🟡 HIGH: Agent Activity Indicator in Conversation

**Problem:** Spec §5.2.3: "subtle animation showing which agent is currently processing." Current implementation just shows text. Needs visual polish.

**Fix:**
- When `agentInfo` is active, show a pill badge with: pulsing dot (CSS animation) + agent name + activity text
- Use accent color for the pulsing dot
- Add framer-motion fade in/out for the badge appearance

**Acceptance Criteria:**
- `grep -n "pulse\|pulsing\|animate-pulse" src/screens/Conversation.tsx | wc -l` returns ≥1
- Agent name is visible during "thinking" state

---

### 7. 🟡 HIGH: Add Swipe Gestures for Onboarding and LessonReader

**Problem:** Spec §5.3: "swipe gestures." Zero implementation anywhere.

**Fix:**
- Create a `useSwipe` hook in `hooks/useSwipe.ts` using touch events (touchstart/touchmove/touchend)
- Apply to onboarding steps: swipe left = next, swipe right = previous
- Apply to LessonReader: swipe left = next lesson, swipe right = previous lesson
- Minimum swipe distance threshold: 50px

**Acceptance Criteria:**
- `ls src/hooks/useSwipe.ts` succeeds
- `grep -rn "useSwipe" src/screens/ --include="*.tsx" | wc -l` returns ≥2

---

### 8. 🟡 HIGH: Add Tests for Core Flows (Target: 80+ tests)

**Problem:** Only 29 tests in 1 file. Needs significantly more coverage.

**Fix:**
- Add test files:
  - `__tests__/onboarding.test.tsx` — renders each step, validates navigation
  - `__tests__/dashboard.test.tsx` — renders with mock data, streak display, course cards
  - `__tests__/conversation.test.tsx` — renders chat, sends message, shows agent activity
  - `__tests__/marketing.test.tsx` — renders Home, Features, Pricing, About, Download, Docs
  - `__tests__/marketplace.test.tsx` — renders course/agent marketplace, detail page
- Use vitest + @testing-library/react, mock fetch/context as needed

**Acceptance Criteria:**
- `npx vitest run 2>&1 | grep "Tests"` shows ≥80 tests passing
- ≥6 test files in `__tests__/`

---

### 9. 🟢 MEDIUM: Create 404 Page

**Problem:** No 404 page. Unknown routes silently redirect to `/`.

**Fix:**
- Create `screens/NotFound.tsx` with: "404" large text, "Page not found" message, "Go Home" and "Go to Dashboard" buttons
- Replace the catch-all `<Navigate to="/" />` in App.tsx with `<Route path="*" element={<NotFound />} />`

**Acceptance Criteria:**
- `ls src/screens/NotFound.tsx` succeeds
- Navigating to `/nonexistent` shows the 404 page

---

### 10. 🟢 MEDIUM: Visual Active State for Marketing Nav Links

**Problem:** `aria-current="page"` is set but no visual distinction. Active link looks identical to inactive ones.

**Fix:**
- In `MarketingLayout.tsx`, when `aria-current="page"`, add `border-b-2 border-accent text-accent font-semibold` classes
- In `MobileNav.tsx`, active item gets `bg-accent/10 text-accent font-semibold`

**Acceptance Criteria:**
- `grep -n "aria-current.*border\|aria-current.*font-semibold\|aria-current.*text-accent" src/screens/marketing/MarketingLayout.tsx | wc -l` returns ≥1
- Active nav link is visually distinct

---

### 11. 🟢 MEDIUM: Dashboard Today's Lessons with Mock Data

**Problem:** "Today's Lessons" section always shows empty because no API provides data. Needs mock data for the prototype.

**Fix:**
- In Dashboard, if no API lessons are returned, show 3 mock lesson cards with: title, course name, estimated time, "Start" button
- Cards should link to the first lesson of the user's first course (or show as demo content)
- Include a "Based on your learning goals" subtitle

**Acceptance Criteria:**
- Dashboard shows lesson cards even without API data
- `grep -n "mock\|demo.*lesson\|today.*lesson" src/screens/Dashboard.tsx | wc -l` returns ≥2

---

### 12. 🟢 MEDIUM: Keyboard Shortcuts for Power Users

**Problem:** Spec mentions keyboard navigation for mindmap (already done). But no global shortcuts exist for common actions.

**Fix:**
- Create `hooks/useKeyboardShortcuts.ts` with:
  - `Ctrl/Cmd + K` → focus search (if exists) or navigate to conversation
  - `Ctrl/Cmd + /` → show shortcuts help modal
  - `Escape` → close any open drawer/modal
- Add a small "⌨️ Shortcuts" link in settings or help
- Show a simple shortcuts reference modal

**Acceptance Criteria:**
- `ls src/hooks/useKeyboardShortcuts.ts` succeeds
- `Ctrl+/` shows the shortcuts modal

---

## Remaining for Future Iterations

1. **Full Docs site** with MDX content, search, and comprehensive guides (spec §12, §13)
2. **PostHog analytics** integration (spec §12.3)
3. **Blog MDX support** replacing hardcoded JS data
4. **Full Collaboration features** — peer matching algorithm, real-time shared mindmaps
5. **Full Creator Dashboard** — publishing flow, analytics charts, earnings tracking, Stripe
6. **Export formats** — PDF, SCORM, Notion, Obsidian (Pro tier, spec §8)
7. **Proactive skill update notifications** (Pro tier, spec §8)
8. **Enterprise tier** — SSO, SCIM, admin dashboard
9. **Offline/PWA support** — service worker, offline lesson access
10. **Spaced repetition** integration
11. **E2E test suite** — Playwright tests for critical user journeys
12. **i18n/l10n** — internationalization
13. **Real OAuth integration** (currently stub buttons)
14. **CourseView inline citations with hover-preview** (spec §5.2.4)
15. **Performance profiling** — bundle analysis, lighthouse audit
