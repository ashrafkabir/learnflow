# LearnFlow Improvement Queue — Iteration 15

## Current Iteration: 15
## Status: DONE
## Date: 2025-07-19
## Focus: Button component adoption, radius/shadow token enforcement, skeleton loading, conversation polish

---

## Brutal Assessment

After 14 iterations, the app has good feature coverage — dashboard hero, design tokens, LLM synthesis, marketplace, mindmap, chat with KaTeX/code highlighting, data export. Color token migration to `bg-accent` classes is **done** (zero `bg-blue` or `bg-[#` in screens). CSS custom properties exist in `index.css`. The `Button` component exists.

**But three systemic problems remain that make this a prototype:**

1. **The Button component is NEVER used.** `apps/client/src/components/Button.tsx` exists with proper variants (`primary`/`secondary`/`ghost`/`danger`), but **zero screen files import it**. There are **87+ raw `<button>` elements** across 9 screen files (LessonReader: 28, Dashboard: 20, ProfileSettings: 11, Conversation: 9, MindmapExplorer: 8, CourseView: 5, etc.). Each uses ad-hoc Tailwind classes. Build log iter 14 claimed Task 8 was ✅ DONE — it was not. The component was created but never integrated.

2. **CSS custom properties (`var(--radius-*)`, `var(--shadow-*)`) are defined but NEVER referenced.** Zero occurrences of `var(--radius` or `var(--shadow` in any `.tsx` file. Border radii are a chaos of `rounded-xl`, `rounded-2xl`, `rounded-lg`, `rounded-md`, `rounded-full` (250+ instances). Shadows use Tailwind defaults. The tokens exist only on paper.

3. **No skeleton/loading states** except LessonReader. Dashboard, CourseView, Marketplace, Settings all show nothing or a plain "Loading..." while data fetches. This is the fastest way to make an app feel cheap.

---

## Prioritized Tasks (12 items)

### 1. 🔴 CRITICAL: Adopt Button Component Across ALL Screens

**Problem:** `Button.tsx` exists but is imported by exactly 0 screens. 87+ raw `<button>` elements use inconsistent ad-hoc Tailwind classes. Some are `rounded-xl`, others `rounded-lg`, `rounded-2xl`, `rounded-full`. Heights vary. This was falsely marked done in iter 14.

**Fix:**
- Replace EVERY `<button>` in these files with `<Button>` from `../components/Button`:
  - `screens/Dashboard.tsx` (20 buttons)
  - `screens/LessonReader.tsx` (28 buttons)
  - `screens/ProfileSettings.tsx` (11 buttons)
  - `screens/Conversation.tsx` (9 buttons)
  - `screens/MindmapExplorer.tsx` (8 buttons)
  - `screens/CourseView.tsx` (5 buttons)
  - `screens/LoginScreen.tsx` (2 buttons)
  - `screens/RegisterScreen.tsx` (2 buttons)
  - `screens/PipelineDetail.tsx` (2 buttons)
- Map existing styles to appropriate variant: primary CTAs → `variant="primary"`, cancel/dismiss → `variant="ghost"`, delete → `variant="danger"`, secondary actions → `variant="secondary"`
- Add `icon` variant or `size="sm"` to Button if needed for icon-only buttons (44px square)

**Acceptance Criteria:**
- `grep -rn "<button" apps/client/src/screens/ --include="*.tsx" | wc -l` returns 0
- `grep -rn "import.*Button.*from.*components/Button" apps/client/src/screens/ --include="*.tsx" | wc -l` returns ≥9
- All buttons visually consistent per variant across all screens

---

### 2. 🔴 CRITICAL: Enforce Radius Tokens via Tailwind Theme

**Problem:** 250+ instances of mixed `rounded-xl`, `rounded-2xl`, `rounded-lg`, `rounded-md`, `rounded-full` across screens. CSS custom properties `--radius-button: 12px`, `--radius-card: 16px` etc. are defined in `:root` but never consumed. Tailwind's default radius classes ignore these tokens.

**Fix:**
- Map CSS custom properties to Tailwind's `@theme` block in `index.css`:
  ```
  --radius-sm: 8px;    /* inputs, pills */
  --radius-md: 12px;   /* buttons */
  --radius-lg: 16px;   /* cards */
  --radius-xl: 20px;   /* modals */
  --radius-full: 9999px; /* chips, avatars */
  ```
- Create utility classes or simply standardize: cards → `rounded-2xl`, buttons → `rounded-xl`, inputs → `rounded-xl`, pills/chips → `rounded-full`, modals → `rounded-2xl`
- Do a single pass through ALL screen files to normalize. The Button component handles its own radius; focus on cards, inputs, containers.

**Acceptance Criteria:**
- Cards consistently use ONE radius value (pick `rounded-2xl`)
- Inputs consistently use ONE radius value (pick `rounded-xl`)
- No `rounded-md` or `rounded-lg` on cards (those are too small per the design)
- Modals/dialogs use `rounded-2xl`

---

### 3. 🔴 CRITICAL: Enforce Shadow Tokens

**Problem:** `--shadow-card`, `--shadow-card-hover`, `--shadow-modal` defined in `:root` but never used. Screens use a mix of Tailwind `shadow-sm`, `shadow-lg`, `shadow-accent/20`, and no shadow at all on cards.

**Fix:**
- Add to Tailwind `@theme` in `index.css`:
  ```
  --shadow-card: 0 1px 3px rgba(0,0,0,0.04);
  --shadow-card-hover: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-modal: 0 8px 30px rgba(0,0,0,0.12);
  ```
- These should map to `shadow-card`, `shadow-card-hover`, `shadow-modal` Tailwind utilities
- Replace all card `shadow-*` classes with `shadow-card hover:shadow-card-hover`
- Replace modal overlays with `shadow-modal`
- Dark mode variants already defined in `.dark`

**Acceptance Criteria:**
- All card elements use `shadow-card` (or the Tailwind class mapped to the token)
- Hover states on interactive cards use `shadow-card-hover`
- Modals/drawers use `shadow-modal`
- `grep -rn "shadow-sm\|shadow-lg\|shadow-md" apps/client/src/screens/ --include="*.tsx"` returns minimal results (only non-card elements)

---

### 4. 🔴 CRITICAL: Skeleton Loading for Dashboard, CourseView, Marketplace

**Problem:** `Skeleton.tsx` component exists but is only used in `LessonReader.tsx`. Dashboard shows raw empty states while fetching analytics/courses. CourseView shows "Loading course..." text. Marketplace has no loading state.

**Fix:**
- Create skeleton variants in `components/Skeleton.tsx`:
  - `SkeletonDashboard`: hero placeholder + 4 stat cards + course list placeholders
  - `SkeletonCourseView`: syllabus sidebar + lesson area placeholder
  - `SkeletonMarketplace`: filter bar + 6 card grid placeholders
- Use pulsing `animate-pulse bg-gray-200 dark:bg-gray-800 rounded-xl` blocks
- Show skeletons while data is loading, swap to real content when ready
- In Dashboard: show skeleton until both courses and analytics have loaded

**Acceptance Criteria:**
- Dashboard shows skeleton on first load, not blank space
- CourseView shows skeleton, not "Loading course..." text
- CourseMarketplace shows skeleton grid, not empty page
- Skeletons match the shape/layout of actual content

---

### 5. 🟡 HIGH: Conversation Agent Activity Indicator

**Problem:** Spec §5.2.3 says "Agent activity indicator: subtle animation showing which agent is currently processing." Current implementation has a generic "is working..." / "Thinking..." text (lines 472-477 of Conversation.tsx). No agent name shown, no subtle animation.

**Fix:**
- When receiving agent activity via WebSocket, display: "🔍 Research Agent is finding sources..." or "📝 Course Builder is synthesizing..." with the actual agent name
- Add a subtle dot-pulse animation (3 dots bouncing) next to the agent name
- Show agent icon/emoji based on type (research=🔍, builder=📝, quiz=🧠, tutor=👨‍🏫)

**Acceptance Criteria:**
- Agent name visible during processing (not just "Thinking...")
- Animated indicator (pulse or bouncing dots)
- Different agents show different labels

---

### 6. 🟡 HIGH: Course View — Mark Complete, Quiz Me, Take Notes Action Bar

**Problem:** Spec §5.2.4 requires "Bottom action bar: Mark Complete, Take Notes, Quiz Me, Ask Question" on lesson view. LessonReader has some of these but CourseView (the syllabus screen) has no lesson-level quick actions.

**Fix:**
- In `CourseView.tsx`, when a lesson is expanded/selected, show a bottom action bar with:
  - "Mark Complete" (toggle) — accent button
  - "Quiz Me" — ghost button, navigates to conversation with quiz prompt
  - "Take Notes" — ghost button, navigates to conversation with notes prompt
- Bar should be sticky at bottom, visible only when a lesson is selected

**Acceptance Criteria:**
- Selecting a lesson in CourseView shows bottom action bar
- Mark Complete toggles lesson completion status
- Quiz Me / Take Notes navigate to Conversation with appropriate prompt

---

### 7. 🟡 HIGH: Background Color Per Spec — `#F8FAFC` not pure white

**Problem:** Spec §5.3 says Background light mode = `#F8FAFC`. Body currently uses `bg-white` (line in index.css: `@apply bg-white`). The spec's background is a warm off-white that reduces eye strain.

**Fix:**
- Change body background from `bg-white` to `bg-[#F8FAFC]` or use the existing `bg-surface` token
- Update the `@theme` `--color-bg` if needed (it's already `#ffffff` — should be `#F8FAFC`)
- Dark mode body should be `#020617` per spec (check current value `#111827` vs spec)

**Acceptance Criteria:**
- Light mode page background is `#F8FAFC`, not `#FFFFFF`
- Dark mode page background is `#020617` per spec
- Cards on `#F8FAFC` background use `#FFFFFF` surface (subtle lift effect)

---

### 8. 🟡 HIGH: Mindmap Color-Coding by Mastery Level

**Problem:** Spec §5.2.5 says nodes should be "Color-coded by mastery level (not started, in progress, mastered)." Need to verify if MindmapExplorer actually uses mastery-based colors.

**Fix:**
- In `MindmapExplorer.tsx`, ensure node colors reflect:
  - Not started: `gray-300` / neutral
  - In progress: `accent` / blue
  - Mastered: `success` / green
- Add a visible legend with text labels (not just color dots — accessibility)
- Ensure color tokens from design system are used, not hardcoded hex

**Acceptance Criteria:**
- Nodes visually distinguish 3 mastery states
- Legend with text labels present
- Colors use design system tokens

---

### 9. 🟠 MEDIUM: Marketplace Course Detail Page

**Problem:** Spec §5.2.7 says "Course detail page: syllabus preview, creator profile, reviews, price." Current CourseMarketplace shows cards in a grid but clicking likely just enrolls — no detail page with reviews/preview.

**Fix:**
- Create `screens/marketplace/CourseDetail.tsx` with:
  - Course title, description, creator info
  - Syllabus preview (module/lesson list)
  - Rating display with review count
  - "Enroll" CTA button
  - Price badge (Free / $X)
- Add route `/marketplace/course/:id`
- Course cards in CourseMarketplace link to this detail page

**Acceptance Criteria:**
- Clicking a course card opens detail page (not immediate enroll)
- Detail page shows syllabus, creator, rating
- Enroll button on detail page triggers enrollment
- Back navigation works

---

### 10. 🟠 MEDIUM: Notification Feed on Dashboard

**Problem:** Spec §5.2.2 includes "Notifications feed: agent updates, peer messages, marketplace recommendations." Dashboard has no notifications section.

**Fix:**
- Add a "Notifications" card/section to Dashboard below the course list
- Show recent items: "Course generation complete", "New course available in marketplace", "Quiz ready"
- Store notifications in app state (mock data for now)
- Show unread count badge on the bell icon in header

**Acceptance Criteria:**
- Dashboard shows a notifications section
- Bell icon in header shows unread count
- At least 3 mock notification types displayed

---

### 11. 🟠 MEDIUM: Onboarding Interest Mapping Screen

**Problem:** Spec §5.2.1 step 3 says "Interest Mapping: tags/chips for related domains; system suggests adjacent topics." Check if this exists in onboarding flow. `Topics.tsx` exists but need to verify it matches spec.

**Fix:**
- Verify `Topics.tsx` has:
  - Pre-populated topic chips user can select
  - System-suggested adjacent topics based on selections
  - Visual feedback on selected vs unselected chips
- If missing suggestion logic, add: when user selects "Machine Learning", suggest "Statistics", "Python", "Neural Networks"

**Acceptance Criteria:**
- Topics screen shows selectable chips
- Selecting chips triggers adjacent topic suggestions
- Selected state is visually clear (accent fill vs outline)

---

### 12. 🟠 MEDIUM: Profile Settings — API Key Usage Stats

**Problem:** Spec §5.2.8 says "API key vault with provider management and usage stats." Settings has API key entry but likely no usage stats display.

**Fix:**
- Below each API key input, show usage summary:
  - "Used X times this month"
  - "Last used: [date]"
  - Small bar chart or text indicator
- Mock data for now; wire to real analytics when backend supports it

**Acceptance Criteria:**
- Each API key section shows usage count
- Last used date displayed
- Visual indicator of usage level

---

## Remaining for Future Iterations (Post-15)

- PWA offline support & service worker
- Mobile hamburger nav for app screens
- Horizontal scroll for filter chips on mobile marketplace
- Collaboration Agent peer matching UI
- Export Agent (PDF, SCORM, Notion, Obsidian)
- Playwright E2E tests for all user journeys
- Creator dashboard with analytics
- CRDT shared mindmap (Yjs)
- Flashcard deck UI
- Course progress email digests
- Social sharing / Open Graph meta
- Gamification: badges, levels, leaderboard
- Performance audit (Lighthouse ≥90)
- Dark mode comprehensive audit
- PostHog analytics initialization
- Documentation site
- High-contrast mode (WCAG AAA)
- Screen reader audit with VoiceOver/NVDA
- Agent marketplace detail page (similar to course detail)
- Stripe/payment integration for Pro tier
- Keyboard shortcut sheet (? key)
