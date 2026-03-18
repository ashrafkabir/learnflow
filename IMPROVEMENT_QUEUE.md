# LearnFlow Improvement Queue — Iteration 16

## Current Iteration: 16
## Status: READY FOR BUILDER
## Date: 2025-07-19
## Focus: Sub-screen Button adoption, marketplace detail page, skeleton gaps, token cleanup, onboarding polish

---

## Brutal Assessment

After 15 iterations, the **main 9 screen files** are in solid shape: Button component adopted everywhere, shadow tokens applied, skeleton loading for Dashboard/CourseView, agent activity indicators, background colors per spec. TypeScript compiles clean, 262 tests pass.

**But the builder only migrated the top-level screens.** There are **49 raw `<button>` elements** across marketplace (7), onboarding (17), and marketing (25) subdirectories — completely untouched by iter 15. There are also **16 stale `shadow-sm`/`shadow-lg`/`shadow-md`** uses in those same subdirectories. The Button component and shadow token work is literally half-done.

**Key gaps vs spec:**

1. **No Marketplace Course Detail Page** (spec §5.2.7) — clicking a course card has no detail view with syllabus preview, reviews, creator profile. This was deferred from iter 15. It's a core user journey.

2. **SkeletonMarketplace exists but is NEVER imported** — component was created in Skeleton.tsx but no screen uses it. CourseMarketplace has no loading state.

3. **6 remaining `shadow-sm`** instances in main screens (Dashboard: 2, MindmapExplorer: 3, ProfileSettings: 1) that should be `shadow-card`.

4. **Onboarding Topics has no adjacent-topic suggestions** — spec §5.2.1 says "system suggests adjacent topics." Current implementation is a static grid of chips with no suggestion logic.

5. **No mobile hamburger nav** for authenticated app screens — marketing layout has one, but Dashboard/CourseView/etc. have no responsive nav. On mobile, sidebar is inaccessible.

---

## Prioritized Tasks (12 items)

### 1. 🔴 CRITICAL: Adopt Button Component in Marketplace + Onboarding + Marketing Screens

**Problem:** Iter 15 migrated only the 9 top-level `screens/*.tsx` files. There are **49 raw `<button>` elements** in subdirectories:
- `marketplace/AgentMarketplace.tsx` — 2
- `marketplace/CourseMarketplace.tsx` — 5
- `onboarding/ApiKeys.tsx` — 2
- `onboarding/FirstCourse.tsx` — 1
- `onboarding/Goals.tsx` — 5
- `onboarding/SubscriptionChoice.tsx` — 4
- `onboarding/Topics.tsx` — 4
- `onboarding/Welcome.tsx` — 1
- `marketing/BlogPost.tsx` — 3
- `marketing/Download.tsx` — 1
- `marketing/Home.tsx` — 3
- `marketing/MarketingLayout.tsx` — 15
- `marketing/Pricing.tsx` — 3

**Fix:**
- Replace all 49 `<button>` elements with `<Button>` component imports
- Use relative import path `../../components/Button` for subdirectory files
- Map variants appropriately: CTAs → `primary`, nav → `ghost`, secondary → `secondary`

**Acceptance Criteria:**
- `grep -rn "<button" apps/client/src/screens/ --include="*.tsx" | wc -l` returns 0 (recursive, all subdirs)
- All files import from `components/Button`

---

### 2. 🔴 CRITICAL: Marketplace Course Detail Page

**Problem:** Spec §5.2.7 requires "Course detail page: syllabus preview, creator profile, reviews, price." No such page exists. Clicking a course card in CourseMarketplace either enrolls immediately or does nothing — no preview.

**Fix:**
- Create `apps/client/src/screens/marketplace/CourseDetail.tsx`:
  - Course title, description, creator name + avatar
  - Syllabus preview (collapsible module/lesson list)
  - Star rating + review count
  - Price badge (Free / $X)
  - "Enroll" CTA Button (primary variant)
  - Back navigation link
- Add route in `App.tsx`: `<Route path="/marketplace/courses/:courseId" element={<CourseDetail />} />`
- Update CourseMarketplace cards to link to `/marketplace/courses/:id` instead of direct enroll

**Acceptance Criteria:**
- Route `/marketplace/courses/:courseId` renders CourseDetail
- Page shows syllabus, creator info, rating, enroll button
- Back navigation works
- Uses Button component and shadow tokens

---

### 3. 🔴 CRITICAL: Wire SkeletonMarketplace into CourseMarketplace

**Problem:** `SkeletonMarketplace` component exists in `Skeleton.tsx` (line 103) but is **never imported or used** by any screen. `CourseMarketplace.tsx` has no loading state — shows nothing while courses fetch.

**Fix:**
- In `apps/client/src/screens/marketplace/CourseMarketplace.tsx`:
  - Import `SkeletonMarketplace` from `../../components/Skeleton`
  - Show `<SkeletonMarketplace />` while `loading` state is true
  - Swap to real content when data arrives

**Acceptance Criteria:**
- `grep -rn "SkeletonMarketplace" apps/client/src/screens/marketplace/CourseMarketplace.tsx` returns import + usage
- Marketplace shows pulsing skeleton grid during load, not blank page

---

### 4. 🟡 HIGH: Clean Up Remaining shadow-sm/shadow-lg in Main Screens

**Problem:** 6 instances of old shadow classes remain in main screen files:
- `Dashboard.tsx:178` — `shadow-sm` on a button
- `Dashboard.tsx:208` — `shadow-sm` on a button
- `MindmapExplorer.tsx:302` — `shadow-sm`
- `MindmapExplorer.tsx:316` — `shadow-sm`
- `MindmapExplorer.tsx:329` — `shadow-sm`
- `ProfileSettings.tsx:73` — `shadow-sm`

Plus **16 instances** in marketplace/onboarding/marketing subdirectories.

**Fix:**
- Replace `shadow-sm` on card-like elements with `shadow-card`
- Replace `shadow-sm` on floating buttons/toolbars with `shadow-card` or remove if inside a card
- Do the same cleanup in subdirectory files

**Acceptance Criteria:**
- `grep -rn "shadow-sm\|shadow-lg\|shadow-md" apps/client/src/screens/ --include="*.tsx" | wc -l` returns 0 or near-0 (exceptions only for intentional non-card shadows)

---

### 5. 🟡 HIGH: Onboarding Topics — Adjacent Topic Suggestions

**Problem:** Spec §5.2.1 step 3 says "system suggests adjacent topics" based on selections. Current `Topics.tsx` (110 lines) shows a static grid of chips with no suggestion logic.

**Fix:**
- In `apps/client/src/screens/onboarding/Topics.tsx`:
  - Add an `ADJACENT_MAP` constant: `{ "Machine Learning": ["Statistics", "Python", "Neural Networks"], "Web Development": ["JavaScript", "React", "CSS"], ... }`
  - When user selects a topic, dynamically show "Suggested for you" section below with adjacent topics not yet selected
  - Animate suggestions appearing with a subtle fade-in
  - Style suggestion chips differently (outline/dashed border) to distinguish from main topics

**Acceptance Criteria:**
- Selecting "Machine Learning" shows suggested adjacent topics
- Suggestions update dynamically as selections change
- Visual distinction between main topics and suggestions

---

### 6. 🟡 HIGH: Mobile Responsive Nav for App Screens

**Problem:** Marketing layout has a hamburger menu (`MarketingLayout.tsx:58`), but authenticated app screens (Dashboard, CourseView, Conversation, etc.) have no mobile-responsive navigation. On mobile viewports, the sidebar nav is likely hidden or overflows.

**Fix:**
- Create a `components/AppShell.tsx` or `components/MobileNav.tsx`:
  - Hamburger icon in top-left on screens < 768px
  - Slide-out drawer with nav links: Dashboard, Courses, Mindmap, Marketplace, Settings
  - Overlay backdrop when open
  - Close on link click or backdrop tap
- Wrap all authenticated screens in this shell (or add to existing layout)

**Acceptance Criteria:**
- At 375px viewport width, hamburger menu visible
- Tapping hamburger opens nav drawer with all app links
- Nav works on Dashboard, CourseView, Conversation, Marketplace, Settings, MindmapExplorer

---

### 7. 🟡 HIGH: Conversation Quick-Action Chips

**Problem:** Spec §5.2.3 says "Quick-action chips: contextual suggested actions (Take Notes, Quiz Me, Go Deeper, See Sources)." Need to verify these exist and are contextual (not static).

**Fix:**
- Check `Conversation.tsx` for quick-action chips after assistant messages
- If missing or static, add contextual chip row below the latest assistant message:
  - After a lesson response: "Quiz Me", "Take Notes", "Go Deeper"
  - After a quiz: "Review Mistakes", "Next Topic"
  - After sources shown: "See Sources", "Summarize"
- Chips should use `<Button variant="ghost" size="sm">` with appropriate icons

**Acceptance Criteria:**
- Quick-action chips appear below assistant messages
- Chips are contextual (different options based on message type)
- Clicking a chip sends the corresponding prompt

---

### 8. 🟠 MEDIUM: Course View — Inline Source Citations with Hover Preview

**Problem:** Spec §5.2.4 says "Inline source citations with hover-preview." LessonReader has citation tooltip rendering (line 826), but need to verify it actually shows hover previews with source title + URL, not just a number.

**Fix:**
- Verify `LessonReader.tsx` citation rendering includes:
  - Superscript number in text
  - Hover tooltip showing: source title, author, URL (truncated)
  - Click opens source in new tab
- If only partial, enhance the tooltip component

**Acceptance Criteria:**
- Hovering a citation number shows a preview tooltip
- Tooltip includes source title and link
- Click opens the source URL

---

### 9. 🟠 MEDIUM: Onboarding SubscriptionChoice — Stripe/Upgrade Flow

**Problem:** Spec §5.2.1 step 5 says "one-tap upgrade with Stripe/App Store billing." `SubscriptionChoice.tsx` exists (4 buttons) but likely has no Stripe integration — just a static comparison.

**Fix:**
- Add a mock Stripe checkout flow:
  - "Upgrade to Pro" button triggers a modal showing "Payment integration coming soon" with email capture
  - "Continue with Free" proceeds to next step
  - Visual: clear Free vs Pro feature comparison table
- Wire real Stripe when backend supports it

**Acceptance Criteria:**
- Free vs Pro comparison clearly displayed
- Pro button shows "coming soon" modal (not a dead click)
- Free button advances onboarding

---

### 10. 🟠 MEDIUM: Dashboard — Mindmap Overview Widget

**Problem:** Spec §5.2.2 says "Mindmap Overview: interactive knowledge graph showing all learning domains and connections." Dashboard likely doesn't have an inline mindmap preview.

**Fix:**
- Add a "Knowledge Map" card to Dashboard below Today's Lessons
- Show a small, non-interactive preview of the user's mindmap (static SVG or simplified canvas)
- "Explore Full Map" link navigates to `/mindmap`
- If no courses yet, show empty state: "Start a course to build your knowledge map"

**Acceptance Criteria:**
- Dashboard shows a mindmap preview card
- Card links to full MindmapExplorer
- Empty state when no data

---

### 11. 🟠 MEDIUM: Profile Settings — Notification Preferences

**Problem:** Spec §5.2.8 says "Notification preferences." Settings likely has API keys, export, and subscription but no notification preference toggles.

**Fix:**
- Add "Notifications" section to ProfileSettings:
  - Toggle: "Course completion alerts" (on/off)
  - Toggle: "Daily learning reminders" (on/off)
  - Toggle: "Marketplace recommendations" (on/off)
  - Toggle: "Agent activity updates" (on/off)
- Store in local state / mock API for now

**Acceptance Criteria:**
- Notification preferences section visible in Settings
- Toggles are functional (persist in local state)
- Uses consistent styling (shadow-card, rounded-2xl, Button component)

---

### 12. 🟠 MEDIUM: First Course Generation — Real-Time Progress Animation

**Problem:** Spec §5.2.1 step 6 says "orchestrator builds initial course in real-time with progress animation." `FirstCourse.tsx` exists but likely shows basic loading, not a multi-step animated progress.

**Fix:**
- In `FirstCourse.tsx`, show a staged progress animation:
  - Step 1: "🔍 Researching sources..." (0-25%)
  - Step 2: "📝 Building syllabus..." (25-50%)
  - Step 3: "🧠 Creating lessons..." (50-75%)
  - Step 4: "✨ Polishing content..." (75-100%)
- Animated progress bar with step labels
- Each step transitions after a delay (or real WebSocket events)
- Completion shows confetti or success animation + "View Your Course" button

**Acceptance Criteria:**
- Progress animation shows 4 distinct stages
- Progress bar animates smoothly
- Completion state has clear CTA to view course

---

## Remaining for Future Iterations (Post-16)

- PWA offline support & service worker
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
- Stripe/payment real integration for Pro tier
- Keyboard shortcut sheet (? key)
- Privacy controls and data deletion UI
- Subscription management (upgrade/downgrade/cancel)
