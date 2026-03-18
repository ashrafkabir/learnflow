# LearnFlow Improvement Queue — Iteration 12

## Current Iteration: 12

## Status: PLANNED

## Date: 2025-07-15

## Focus: Cosmetics, Animations/Transitions, Learning Experience Enhancements

---

## Assessment Summary

After a full visual audit (desktop + mobile, all screens), the app is **functionally solid** — auth, course pipeline, lessons, dashboard, settings, marketplace all work. But it looks and _feels_ like an early beta. The main gaps:

1. **Static feel** — zero animations or transitions anywhere. Pages pop in, cards don't animate, buttons don't respond to hover/press.
2. **Inconsistent visual system** — shadows, radii, spacing, and typography weights vary between screens.
3. **Learning experience is thin** — no quizzes inline, no bookmarks, no notes UI, no spaced repetition hints, no progress celebration.
4. **Marketplace is skeletal** — only 2 hardcoded courses, no categories, no social proof.
5. **Dev artifacts visible** — "Skip (dev mode)" on login/register.

---

## Prioritized Tasks (15 items)

### 1. 🔴 CRITICAL: Global Page Transitions & Route Animations

**Problem:** Every route change is an instant swap — no fade, slide, or any visual continuity. This makes the app feel like a prototype, not a product.

**Fix:**

- Add a shared `<PageTransition>` wrapper using CSS transitions or framer-motion
- Fade-in on route enter (200ms ease-out), fade-out on route leave (150ms)
- Apply to all routes in App.tsx router

**Acceptance Criteria:**

- Every route change has a smooth fade transition (150-200ms)
- No layout shift or flash during transitions
- Works on both desktop and mobile viewports

---

### 2. 🔴 CRITICAL: Button & Interactive Element Micro-Interactions

**Problem:** Buttons, cards, and links have no hover/press/focus states beyond browser defaults. The UI feels dead.

**Fix:**

- Add to `index.css` or Tailwind config:
  - Buttons: `hover:scale-[1.02] active:scale-[0.98] transition-all duration-150`
  - Cards (course cards, dashboard cards): `hover:-translate-y-1 hover:shadow-lg transition-all duration-200`
  - Links: subtle color shift on hover
  - Inputs: `focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150`
- Add visible focus rings for keyboard accessibility (`:focus-visible` outlines)

**Acceptance Criteria:**

- All buttons scale subtly on hover/press
- All course/dashboard cards lift on hover
- All inputs have visible focus states
- Keyboard focus is visible on all interactive elements
- Transitions are 150-200ms, not jarring

---

### 3. 🔴 CRITICAL: Remove Dev-Mode Skip Links from Production

**Problem:** "Skip (dev mode) →" visible on login and register screens. Undermines trust and looks unprofessional.

**Fix:**

- Wrap skip links in `{import.meta.env.DEV && ...}` or remove entirely
- Alternatively, hide behind a keyboard shortcut (Ctrl+Shift+D) for dev convenience

**Acceptance Criteria:**

- No "dev mode" text visible in production builds
- Dev shortcut still works in dev mode if needed

---

### 4. 🔴 CRITICAL: Typographic Scale & Spacing System

**Problem:** Font sizes, weights, and spacing are inconsistent across screens. Hero uses different scale than dashboard, settings cards have different padding than marketplace cards.

**Fix:**

- Define design tokens in Tailwind config or CSS variables:
  - `--text-hero: 48px/700`, `--text-h1: 36px/700`, `--text-h2: 24px/600`, `--text-h3: 18px/600`
  - `--text-body: 16px/400 line-height 1.6`, `--text-small: 14px/400`
  - Card padding: `p-6` consistently, gap between cards: `gap-6`
  - Section spacing: `py-12` between major sections
- Audit every screen and replace ad-hoc sizes with tokens

**Acceptance Criteria:**

- All headings follow the defined scale (no random font sizes)
- Card padding is uniform across all card types
- Body text is consistently 16px with 1.5-1.6 line height
- Spacing between sections follows a consistent rhythm

---

### 5. 🟡 HIGH: Lesson Completion Celebration Animation

**Problem:** Completing a lesson has no visual reward. The user clicks "complete" and... nothing special happens. This kills motivation.

**Fix:**

- When a lesson is marked complete, show a brief celebration:
  - Confetti burst (use `canvas-confetti` library, ~3KB)
  - Green checkmark animation on the lesson card
  - "+1 streak" toast notification with animation
  - Progress bar animates smoothly to new value (not instant jump)
- XP/points counter increment animation on dashboard

**Acceptance Criteria:**

- Completing a lesson triggers a 1.5s confetti animation
- Lesson card shows animated checkmark transition
- Dashboard progress bar animates when returning
- Toast notification slides in from top-right

---

### 6. 🟡 HIGH: Inline Quiz Component in Lesson Reader

**Problem:** The "Quiz Me" button in the lesson action bar exists but there's no inline quiz experience. Quizzes are the #1 retention tool and completely absent from the reading flow.

**Fix:**

- Add `<InlineQuiz>` component at the end of each lesson
- Auto-generate 3 multiple-choice questions from lesson content (via API)
- Show questions with radio buttons, submit button, immediate feedback
- Correct answer: green highlight + brief explanation
- Wrong answer: red highlight + correct answer shown
- Score summary at bottom with "Review" or "Next Lesson" CTA

**Acceptance Criteria:**

- Each lesson shows 3 quiz questions after the content
- Questions have 4 options each with radio selection
- Immediate visual feedback on answer submission
- Score displayed (e.g., "2/3 correct")
- Quiz results saved to user progress

---

### 7. 🟡 HIGH: Bookmark & Highlight System for Lessons

**Problem:** No way to save important parts of lessons. Users can't bookmark lessons or highlight text — basic features for any learning platform.

**Fix:**

- Add bookmark toggle (heart/bookmark icon) to lesson header
- Bookmarked lessons appear in a "Bookmarks" section on dashboard
- Text selection in lesson content shows a floating toolbar: "Highlight" (yellow), "Note" (opens mini note input)
- Highlights persist in localStorage (or SQLite via API)
- "My Highlights" accessible from course detail page

**Acceptance Criteria:**

- Bookmark icon toggles on/off with animation
- Bookmarked lessons appear on dashboard
- Text selection shows highlight toolbar
- Highlights persist across page reloads
- At least yellow highlight color works

---

### 8. 🟡 HIGH: Dashboard Stat Cards Animation

**Problem:** Dashboard KPI cards (Streak, Courses, Completed, Today) appear instantly with no visual interest. The "This Week" chart is empty for new users.

**Fix:**

- Animate stat numbers counting up from 0 on page load (400ms stagger between cards)
- Streak card: add subtle flame flicker animation (CSS keyframes)
- "This Week" empty state: show a faded placeholder chart outline with "Complete your first lesson to see activity here"
- Progress bars: animate width from 0 to current value on mount

**Acceptance Criteria:**

- Numbers count up with easing animation on dashboard load
- Streak flame has subtle CSS animation
- Empty chart state shows placeholder outline, not just text
- Progress bars animate smoothly

---

### 9. 🟡 HIGH: Consistent Shadow & Border Radius System

**Problem:** Cards, inputs, and buttons use inconsistent border radii (some `rounded-xl`, some `rounded-2xl`, some `rounded-lg`) and shadow depths vary randomly.

**Fix:**

- Define 3 elevation levels:
  - `shadow-sm` (cards at rest): `0 1px 3px rgba(0,0,0,0.04)`
  - `shadow-md` (cards on hover): `0 4px 12px rgba(0,0,0,0.08)`
  - `shadow-lg` (modals/dropdowns): `0 8px 24px rgba(0,0,0,0.12)`
- Standardize border radius:
  - Buttons: `rounded-lg` (8px)
  - Cards: `rounded-xl` (12px)
  - Inputs: `rounded-lg` (8px)
  - Modals: `rounded-2xl` (16px)
- Audit all components and replace ad-hoc values

**Acceptance Criteria:**

- All cards use same border radius
- All buttons use same border radius
- Shadow depth is consistent within component types
- No random `rounded-[arbitrary]` values remain

---

### 10. 🟡 HIGH: Spaced Repetition Hints & Review Reminders

**Problem:** No spaced repetition or review scheduling. Completed lessons are "done" with no mechanism for retention reinforcement.

**Fix:**

- After completing a lesson, calculate next review date using SM-2 algorithm (simple version)
- Show "Due for Review" badge on lessons that are past their review date
- Add "Review Queue" section on dashboard showing lessons due today
- Review = re-read lesson + answer 2 quiz questions
- After review, update next review interval

**Acceptance Criteria:**

- Completed lessons get a `nextReviewDate` field
- Dashboard shows "Review Queue" with count badge
- Clicking review opens lesson in review mode
- Review intervals increase: 1 day → 3 days → 7 days → 14 days → 30 days
- At minimum, the data model and UI indicators work (full SM-2 can be simplified)

---

### 11. 🟠 MEDIUM: Marketplace Polish — Categories, Ratings, & More Courses

**Problem:** Marketplace shows only 2 hardcoded courses with minimal metadata. No categories, no sorting, no pagination. Looks like a placeholder.

**Fix:**

- Add at least 8-10 seed courses across different categories
- Add category filter chips at top (Programming, Data Science, DevOps, Design, Business)
- Add sort dropdown (Popular, Newest, Rating, Price)
- Course cards: add creator avatar, enrollment count, rating stars, estimated duration
- Add "Featured" banner section at top with 2-3 highlighted courses

**Acceptance Criteria:**

- At least 8 courses visible in marketplace
- Category chips filter courses
- Sort dropdown works
- Course cards show rating, enrollment, duration
- Featured section exists at top

---

### 12. 🟠 MEDIUM: Notes Panel in Lesson Reader

**Problem:** "Take Notes" button exists in lesson action bar but there's no actual notes UI. Cornell notes are mentioned in the spec and onboarding but not implemented in the reader.

**Fix:**

- Add a slide-out notes panel (right side, 320px) when "Take Notes" is clicked
- Split into Cornell-style sections: "Notes" (main), "Cues" (left margin), "Summary" (bottom)
- Auto-save notes to localStorage/API as user types
- Notes are associated with lesson ID
- Show note indicator on lesson cards that have notes

**Acceptance Criteria:**

- Notes panel slides in from right with animation
- Cornell layout with 3 sections
- Auto-saves on debounced input (500ms)
- Notes persist across page reloads
- Lesson cards show note indicator icon

---

### 13. 🟠 MEDIUM: Loading States & Skeleton Screens

**Problem:** Pages show nothing or flash briefly during data loading. No skeleton screens, no loading spinners, no progressive content appearance.

**Fix:**

- Add skeleton components for: dashboard cards, course list, lesson content
- Skeleton: gray pulsing rectangles matching the layout shape
- Use React Suspense boundaries where applicable
- Course pipeline: show progress skeleton with animated shimmer

**Acceptance Criteria:**

- Dashboard shows skeleton cards while loading
- Course list shows skeleton cards while loading
- Lesson reader shows content skeleton while loading
- Skeletons match the final layout shape
- Shimmer animation on all skeleton elements

---

### 14. 🟠 MEDIUM: Color Palette Harmony & Dark Mode Polish

**Problem:** Light mode uses a mix of blues, purples, and oranges without a clear system. Dark mode exists but likely has contrast issues and inconsistent backgrounds.

**Fix:**

- Define primary palette: Blue (#2563EB), Secondary (#7C3AED purple), Accent (#F59E0B amber), Success (#10B981), Error (#EF4444)
- Light mode: backgrounds should be `gray-50` → `white`, not random grays
- Dark mode audit: ensure all text meets WCAG AA (4.5:1 ratio), card backgrounds use `gray-800`/`gray-900` consistently, no pure black (#000)
- Fix any purple-on-purple or blue-on-blue contrast issues

**Acceptance Criteria:**

- All colors come from the defined palette (no random hex values)
- Dark mode passes WCAG AA for all text
- Card backgrounds are consistent in dark mode
- Primary actions are always the same blue across all screens

---

### 15. 🟠 MEDIUM: Onboarding Step Transitions & Progress Animation

**Problem:** Onboarding steps (Welcome → Goals → Topics → API Keys → Plan → Start) switch instantly. The step indicator at top doesn't animate.

**Fix:**

- Add slide-left/slide-right transition between onboarding steps
- Step indicator: active dot scales up and fills with color animation
- Connecting lines between dots fill progressively as steps complete
- "Get Started" button has a subtle pulse animation to draw attention

**Acceptance Criteria:**

- Moving between steps has a horizontal slide transition (200ms)
- Step indicator dots animate when step changes
- Progress line fills between completed dots
- Back navigation slides in reverse direction
- Pulse animation on primary CTA

---

## Remaining for Future Iterations (Post-12)

- PWA offline support
- Collaboration Agent peer matching UI
- Export Agent (PDF, SCORM, Notion, Obsidian)
- Playwright E2E tests for all user journeys
- Creator dashboard with real analytics and earnings
- CRDT shared mindmap (Yjs)
- Rate limiting per tier
- OpenAPI spec generation
- Agent SDK specification
- Load testing (k6)
- PostHog analytics initialization
- Documentation site build
- Flashcard deck UI (separate from inline quiz)
- Course progress email digests
- Social sharing of course completions
- Gamification: badges, levels, leaderboard
