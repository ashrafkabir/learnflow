# LearnFlow Improvement Queue — Iteration 23

## Current Iteration: 23
## Status: READY FOR BUILDER
## Date: 2025-07-21
## Focus: TSC fix, Creator Dashboard, Conversation polish, accessibility, remaining spec gaps

---

## Brutal Assessment

**What's genuinely good (verified):**
- 111 tests in 15 files — honest count, real improvement from 67/6
- Quick-action chips (Go Deeper, See Sources, Quiz Me, Take Notes) in Conversation ✅
- ProgressRing component exists and used in Dashboard ✅
- Forgot Password link on LoginScreen ✅
- Social proof section on Homepage (stats + trust badges) ✅
- Docs page expanded to 226 lines with sidebar nav and search ✅
- Collaboration page expanded to 185 lines with interactive elements ✅
- KeyboardShortcuts modal registered in App.tsx ✅
- Form validation on LoginScreen ✅
- Dark mode toggle in ProfileSettings ✅
- CourseMarketplace has search, filters (difficulty, topic, price) ✅
- CourseDetail has reviews, ratings, syllabus preview ✅
- Pipeline visualization with 536 LOC across 6 components ✅
- Responsive Tailwind classes throughout (sm:/md:/lg:) ✅

**What's STILL broken (verified with actual commands):**

1. **TSC BROKEN AGAIN.** `npx tsc --noEmit` fails: `Property 'progress' does not exist on type 'IntrinsicAttributes & ProgressRingProps'` in `src/__tests__/components.test.tsx:31`. ProgressRing uses `percent` prop, but test passes `progress`. Tests pass (vitest) because they don't type-check, but TSC is broken.

2. **CreatorDashboard is a 60-line placeholder.** Spec §5.2.7 says "Creator dashboard: publishing flow, analytics, earnings." Current file is just a header and 2 stat cards. No publishing flow, no earnings, no analytics charts.

3. **AgentMarketplace is only 134 lines.** Spec §5.2.6 wants "Each agent card shows: name, description, rating, usage count, required API provider. One-tap activation." Current version is basic cards without activation toggle or API provider info.

4. **No aria-live regions for dynamic content.** Only 4 `aria-live`/`role="alert"` across entire app. Screen readers won't announce conversation messages, toast notifications, or loading state changes.

5. **No service worker / offline support.** Spec §WS-08 mentions offline caching. Zero service worker code found.

6. **WebSocket only imported in 2 files** (Conversation, Docs). Pipeline and Dashboard should show real-time updates but don't use WebSocket.

---

## Prioritized Tasks (12 items)

### 1. 🔴 CRITICAL: Fix TSC Compilation Error

**Problem:** `npx tsc --noEmit` fails. `src/__tests__/components.test.tsx:31` uses `progress` prop but `ProgressRing` expects `percent`.

**Fix:** In `src/__tests__/components.test.tsx`, line 31, change `progress={75}` to `percent={75}`.

**Verification:**
```bash
npx tsc --noEmit 2>&1 | tail -3
```
Must show exit 0 with no errors.

**Acceptance Criteria:** `npx tsc --noEmit` exits cleanly.

---

### 2. 🔴 CRITICAL: Expand CreatorDashboard to Match Spec

**Problem:** 60 lines. Spec §5.2.7 requires publishing flow, analytics, earnings. Currently just 2 stat cards.

**Fix:** Expand `src/screens/marketplace/CreatorDashboard.tsx` to ≥250 lines:
- **Published Courses table** — list of creator's courses with title, status (draft/published), enrollment count, rating, revenue
- **Analytics section** — total views, enrollments this month, completion rate (mock data, styled cards)
- **Earnings section** — total earnings, pending payout, payout history table
- **Publish New Course button** — opens a multi-step form (title, description, topic, difficulty, price → "Submit for Review")
- **Draft management** — show draft courses with "Continue Editing" and "Delete" actions

**Acceptance Criteria:**
- `wc -l src/screens/marketplace/CreatorDashboard.tsx` shows ≥250
- Page has published courses table, analytics cards, earnings section, publish button

---

### 3. 🔴 CRITICAL: Expand AgentMarketplace to Match Spec

**Problem:** 134 lines. Missing: activation toggle, API provider info, usage counts, category filters.

**Fix:** Expand `src/screens/marketplace/AgentMarketplace.tsx` to ≥250 lines:
- Each agent card: name, description, ⭐ rating, usage count, required API provider badge (e.g., "Requires OpenAI"), **activation toggle switch**
- Category filter tabs: "All | Study | Research | Assessment | Creative | Productivity"
- Search input for agent name/description
- "Community" vs "Official" badge on cards
- Sort by: popularity, rating, newest

**Acceptance Criteria:**
- `wc -l src/screens/marketplace/AgentMarketplace.tsx` shows ≥250
- `grep -c 'toggle\|Toggle\|activate\|Activate' src/screens/marketplace/AgentMarketplace.tsx` ≥2
- Category filter and search exist

---

### 4. 🟡 HIGH: Add aria-live Regions for Dynamic Content

**Problem:** Only 4 `aria-live`/`role="alert"` in entire app. Conversation messages, toasts, and loading states are invisible to screen readers.

**Fix:**
- `src/screens/Conversation.tsx`: Add `aria-live="polite"` to the message list container
- `src/components/Toast.tsx`: Add `role="alert" aria-live="assertive"` to toast container
- `src/components/BrandedLoading.tsx`: Add `role="status" aria-live="polite"` to loading container
- `src/screens/Dashboard.tsx`: Add `aria-live="polite"` to notifications feed section

**Acceptance Criteria:**
- `grep -rn 'aria-live' src/ --include='*.tsx' | wc -l` returns ≥8

---

### 5. 🟡 HIGH: Add 40+ More Tests to Reach 150+

**Problem:** 111 tests is good but spec §WS-13 targets comprehensive coverage. Key untested areas: marketplace flows, pipeline components, settings mutations, dark mode toggle.

**Fix:** Add new test files:
- `src/__tests__/agentMarketplace.test.tsx` — renders cards, filter tabs, search, activation toggle (5+ tests)
- `src/__tests__/pipeline.test.tsx` — renders PipelineView stages, stage columns, crawl threads (5+ tests)
- `src/__tests__/auth.test.tsx` — login form validation, register form validation, forgot password link (5+ tests)
- `src/__tests__/docs.test.tsx` — sidebar nav, search input, section content (5+ tests)
- `src/__tests__/download.test.tsx` — platform cards render, recommended platform detection (3+ tests)
- `src/__tests__/blog.test.tsx` — blog list renders, blog post renders content (3+ tests)
- Expand existing test files with edge cases (empty states, error states) — 15+ additional tests

**Verification:**
```bash
npx vitest run 2>&1 | tail -5
```

**Acceptance Criteria:** ≥150 tests, ≥20 test files. Paste REAL output.

---

### 6. 🟡 HIGH: Add Subscription Management to ProfileSettings

**Problem:** ProfileSettings shows subscription tier but only has an "Upgrade to Pro" button. Spec §5.2.8: "Subscription management (upgrade/downgrade/cancel)."

**Fix:** In `src/screens/ProfileSettings.tsx`, expand the subscription section:
- If Free: Show feature comparison table + "Upgrade to Pro" CTA
- If Pro: Show "Current Plan: Pro", next billing date, "Downgrade to Free" button, "Cancel Subscription" button
- Add a confirmation modal for downgrade/cancel actions
- Show usage stats: "API calls this month: 1,234 / 10,000"

**Acceptance Criteria:**
- `grep -n 'downgrade\|Downgrade\|cancel.*sub\|Cancel.*Sub' src/screens/ProfileSettings.tsx | wc -l` ≥2

---

### 7. 🟡 HIGH: Add Data Export Functionality to ProfileSettings

**Problem:** Spec §5.2.8: "Export data (courses, notes, progress) in portable format." ProfileSettings has Markdown/JSON export buttons but need to verify they actually trigger downloads.

**Fix:** Ensure export buttons in ProfileSettings:
- "Export as Markdown" → generates and downloads a .md file with all course titles, notes, progress
- "Export as JSON" → generates and downloads a .json file with structured data
- Add "Export All Data (ZIP)" option that bundles everything
- Show a toast on successful export

**Acceptance Criteria:**
- `grep -n 'download\|Download\|blob\|Blob\|export.*data\|Export.*Data' src/screens/ProfileSettings.tsx | wc -l` ≥3
- Export triggers actual file download (Blob URL)

---

### 8. 🟢 MEDIUM: Add Privacy Controls & Data Deletion to ProfileSettings

**Problem:** Spec §5.2.8: "Privacy controls and data deletion." No evidence of this in ProfileSettings.

**Fix:** Add a "Privacy & Data" section to ProfileSettings:
- Toggle: "Share anonymized usage data for improving LearnFlow"
- Toggle: "Allow course recommendations based on learning history"
- "Download My Data" button (GDPR)
- "Delete My Account" button with red styling and confirmation modal ("This action is irreversible. Type DELETE to confirm.")

**Acceptance Criteria:**
- `grep -n 'Delete.*Account\|delete.*account\|privacy\|Privacy' src/screens/ProfileSettings.tsx | wc -l` ≥3

---

### 9. 🟢 MEDIUM: Add Empty States Throughout

**Problem:** Many screens lack proper empty states. When a user has no courses, no notifications, no mindmap nodes, the UI should guide them — not show blank space.

**Fix:**
- Dashboard with no courses: Show onboarding CTA card ("Create your first AI-powered course →")
- Mindmap with no data: Show illustration + "Start learning to build your knowledge graph"
- Conversation with no messages: Show 3-4 suggested prompts ("Teach me about quantum computing", "Create a course on React", etc.)
- Course Marketplace with no search results: "No courses found. Try a different search."

**Acceptance Criteria:**
- `grep -rn 'empty.*state\|no.*courses\|get.*started\|No.*results' src/screens/ --include='*.tsx' | wc -l` ≥5

---

### 10. 🟢 MEDIUM: Add Agent Activity Indicator to Conversation

**Problem:** Spec §5.2.3: "Agent activity indicator: subtle animation showing which agent is currently processing." Need to verify this exists beyond a basic typing indicator.

**Fix:** In Conversation.tsx, when an agent is processing:
- Show a pill below the message input: "🔍 Research Agent is searching..." / "📝 Notes Agent is organizing..." / "🧠 Orchestrator is thinking..."
- Animate with a pulsing dot or shimmer effect
- Different agent names/icons for different processing stages

**Acceptance Criteria:**
- `grep -n 'agent.*activity\|Agent.*Activity\|processing\|is.*searching\|is.*thinking' src/screens/Conversation.tsx | wc -l` ≥3

---

### 11. 🟢 MEDIUM: Add Hover-Preview for Inline Citations in LessonReader

**Problem:** Spec §5.2.4: "Inline source citations with hover-preview." CitationTooltip component exists but need to verify it shows a rich preview (title, snippet, URL) on hover.

**Fix:** Ensure `src/components/CitationTooltip.tsx`:
- Shows on hover (not just click)
- Displays: source title, short snippet (first 100 chars), URL link, "Open in new tab" button
- Positioned above/below the citation number, doesn't overflow viewport
- Has a subtle shadow and border

**Acceptance Criteria:**
- `wc -l src/components/CitationTooltip.tsx` shows ≥40
- Component shows title + snippet + URL on hover

---

### 12. 🟢 LOW: Add Contextual Onboarding Tooltips on First Dashboard Visit

**Problem:** After onboarding flow, user lands on Dashboard with no guidance on what to do next. Spec implies progressive disclosure.

**Fix:** Create `src/components/OnboardingTooltips.tsx`:
- On first Dashboard visit (check localStorage flag), show a series of tooltip popovers:
  1. Points to "Create Course" → "Start here! Tell the AI what you want to learn."
  2. Points to Mindmap nav → "Watch your knowledge grow as you learn."
  3. Points to Marketplace nav → "Browse courses created by the community."
- "Got it" / "Next" / "Skip tour" buttons
- Set `localStorage.setItem('onboarding-tour-complete', 'true')` after completion

**Acceptance Criteria:**
- `ls src/components/OnboardingTooltips.tsx` exists
- Dashboard imports and renders it conditionally

---

## ⚠️ BUILDER INSTRUCTIONS

**TASK 1 is a ONE-LINE FIX.** Do it first, verify TSC passes, then move on.

**TASK 5 (tests):** You MUST run `npx vitest run` and paste the REAL output. Previous builders lied about counts. Current reality: 111 tests in 15 files. Your output must show ≥150/≥20.

**DO NOT shrink existing files when expanding them.** CreatorDashboard and AgentMarketplace should grow, not be rewritten smaller.

---

## Remaining for Future Iterations

- **Offline caching** (service worker / SQLite local store) — spec §WS-08
- **Full Stripe integration** for paid courses — spec §WS-10
- **Agent Marketplace SDK** with manifest.json validation — spec §7.2
- **Real-time collaboration** on mindmaps via CRDT/Yjs — spec §WS-06
- **SCORM/PDF/Notion export** for Pro tier — spec §8
- **Spaced repetition engine** — spec §7.2 agent categories
- **E2E tests** (Playwright) for top 10 user journeys — spec §WS-13
- **Cross-platform builds** (Electron/Tauri desktop, mobile) — spec §WS-08
- **Load testing** — spec §WS-07
- **Full docs site** (Nextra/Mintlify as separate app) — spec §WS-12
- **Enterprise tier** features (SSO, SCIM, admin dashboard) — spec §8
- **i18n** — spec §14.4
- **Billing management UI** — spec §WS-10
- **WebSocket integration** in Dashboard and Pipeline for real-time updates
- **Service worker** for offline support and caching
