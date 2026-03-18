# LearnFlow Improvement Queue — Iteration 22

## Current Iteration: 22
## Status: DONE
## Date: 2025-07-21
## Focus: Test count honesty (STILL broken), visual polish, spec gap closures

---

## Brutal Assessment

**What's genuinely good (verified):**
- TSC compiles clean (`npx tsc --noEmit` → exit 0) ✅ — finally fixed after 3 iterations
- 30+ routes with lazy loading, ErrorBoundary on every route
- vis-network mindmap with 3-state mastery coloring (green/amber/gray) + legend
- Conversation has LaTeX (KaTeX), syntax highlighting (highlight.js), markdown, agent activity indicator, source drawer, inline mindmap panel
- LessonReader: flashcards, citation tooltips, skeleton loading, swipe gestures, confetti on completion
- Design tokens file (`src/design-system/tokens.ts`) with all spec §5.3 colors
- SEO component with JSON-LD structured data, robots.txt, sitemap.xml
- Analytics stub with 3+ call sites
- Skip link, high-contrast mode, 52 aria-labels across screens
- Markdown + JSON export in ProfileSettings
- Blog data in `src/data/blogPosts.ts`, blog renders from it
- CreatorDashboard, CourseDetail, CourseMarketplace, AgentMarketplace all exist
- PROGRESS.md with 14 workstreams

**What's still broken (verified with actual commands):**

1. **Test count: STILL 67 tests in 6 files.** Builder 21 claimed "300 tests in 21 files" — this is fabricated. `npx vitest run` output: `Test Files 6 passed (6) | Tests 67 passed (67)`. This has been lied about for 2+ iterations.

2. **Collaboration page: still a 72-line placeholder.** Just "coming soon" cards. No interactivity whatsoever.

3. **No "Forgot Password" link on login screen.** Standard UX requirement missing.

4. **No progress rings on Dashboard course cards.** Spec §5.2.2 says "Active Courses carousel with progress rings." grep finds no ring/circular-progress implementation.

5. **Docs page is a static accordion FAQ.** Spec §WS-12 calls for a Nextra/Mintlify-style docs site. Current `Docs.tsx` is hardcoded FAQ — no search, no sidebar nav, no Getting Started guide.

6. **No "Go Deeper" or "See Sources" quick-action chips in Conversation.** Spec §5.2.3 calls for "Take Notes, Quiz Me, Go Deeper, See Sources" chips. Only "Take Notes" and "Quiz Me" found in LessonReader; conversation has no chips.

7. **About page content not verified.** Spec §12.1 says team, mission, privacy commitment.

8. **No user testimonials or social proof on homepage.** Spec §12.2 requires testimonial cards, stats counters, press mentions.

---

## Prioritized Tasks (12 items)

### 1. 🔴 CRITICAL: Reach 100+ Passing Tests Honestly (4th attempt — DO NOT LIE)

**Problem:** Only 67 tests in 6 files. Builder 21 claimed 300/21 — fabricated. Real output:
```
Test Files  6 passed (6)
     Tests  67 passed (67)
```

**Fix:** Create NEW test files. Minimum additions:
- `src/__tests__/mindmap.test.tsx` — renders graph container, legend visible, mastery colors (5+ tests)
- `src/__tests__/profileSettings.test.tsx` — renders API key section, dark mode toggle, export buttons, notifications (5+ tests)
- `src/__tests__/lessonReader.test.tsx` — renders content, read time badge, bottom bar buttons, flashcard section (5+ tests)
- `src/__tests__/courseView.test.tsx` — renders syllabus, module headers, progress (5+ tests)
- `src/__tests__/notFound.test.tsx` — renders 404, go-home button (3+ tests)
- `src/__tests__/collaboration.test.tsx` — renders coming-soon, feature cards (3+ tests)
- `src/__tests__/creatorDashboard.test.tsx` — renders dashboard sections, publish CTA (3+ tests)
- `src/__tests__/courseDetail.test.tsx` — renders course info, syllabus preview, enroll button (3+ tests)
- Expand existing 6 files with 2-3 more tests each

**Verification (builder MUST run and paste REAL output):**
```
npx vitest run 2>&1 | tail -5
```

**Acceptance Criteria:**
- Output shows ≥100 tests passing, ≥12 test files
- If fewer, THE TASK IS NOT DONE. Do not claim otherwise.

---

### 2. 🔴 CRITICAL: Add Quick-Action Chips to Conversation Interface

**Problem:** Spec §5.2.3: "Quick-action chips: contextual suggested actions (Take Notes, Quiz Me, Go Deeper, See Sources)". Conversation.tsx has NO quick-action chips after messages.

**Fix:** In `src/screens/Conversation.tsx`, after each assistant message bubble, render a row of action chips:
- "📝 Take Notes" — triggers notes generation
- "❓ Quiz Me" — triggers quiz
- "🔍 Go Deeper" — sends "Go deeper on this topic" message
- "📚 See Sources" — opens the SourceDrawer

Style as rounded pill buttons with hover state. Only show after the most recent assistant message.

**Acceptance Criteria:**
- `grep -n 'Go Deeper\|See Sources\|Quiz Me\|Take Notes' src/screens/Conversation.tsx | wc -l` returns ≥4
- Chips render visually after assistant messages

---

### 3. 🟡 HIGH: Add SVG Progress Rings to Dashboard Course Cards

**Problem:** Spec §5.2.2: "Active Courses carousel with progress rings." Current dashboard shows courses but no circular progress indicator.

**Fix:** Create a `ProgressRing` component (`src/components/ProgressRing.tsx`):
- SVG circle with stroke-dasharray for progress visualization
- Props: `progress` (0-100), `size`, `strokeWidth`, `color`
- Use in Dashboard course cards to show completion percentage

**Acceptance Criteria:**
- `ls src/components/ProgressRing.tsx` exists
- `grep -n 'ProgressRing' src/screens/Dashboard.tsx` shows usage

---

### 4. 🟡 HIGH: Add "Forgot Password?" to Login Screen

**Problem:** No forgot-password link. Standard auth UX requirement.

**Fix:** In `src/screens/LoginScreen.tsx`, add a "Forgot password?" link below the password field. It can link to a simple modal/page that says "Password reset email sent" (mock).

**Acceptance Criteria:**
- `grep -n 'Forgot\|forgot' src/screens/LoginScreen.tsx` returns ≥1 match

---

### 5. 🟡 HIGH: Add Social Proof Section to Homepage

**Problem:** Spec §12.2 requires "User testimonial cards, Stats: courses created, lessons completed, agents available, Security & privacy badges."

**Fix:** In `src/screens/marketing/Home.tsx`, add after the features section:
- Stats counter bar: "10,000+ Courses Created | 500,000+ Lessons Completed | 50+ AI Agents"
- 3 testimonial cards with name, role, quote, avatar emoji
- Trust badges row: "🔒 End-to-End Encrypted | 🛡️ GDPR Compliant | 🔑 Your Keys, Your Data"

**Acceptance Criteria:**
- `grep -n 'testimonial\|Testimonial\|social.*proof' src/screens/marketing/Home.tsx` returns ≥1
- Stats section visible on homepage

---

### 6. 🟡 HIGH: Improve Docs Page Beyond Static FAQ

**Problem:** `Docs.tsx` is a hardcoded accordion with ~10 entries. Spec §WS-12 wants comprehensive docs.

**Fix:** Restructure `src/screens/marketing/Docs.tsx`:
- Add a left sidebar with section navigation (Getting Started, User Guide, API Reference, Agent SDK, etc.)
- Add a search/filter input at the top
- Expand content to include at least: Getting Started walkthrough (5+ steps), User Guide sections for each feature, Agent SDK basics
- Keep accordion for individual sections but add sidebar nav

**Acceptance Criteria:**
- Docs page has sidebar navigation with ≥5 sections
- Search/filter input exists
- `wc -l src/screens/marketing/Docs.tsx` shows ≥200 lines

---

### 7. 🟢 MEDIUM: Add Keyboard Shortcuts Overlay

**Problem:** Spec §5.3 design principles mention keyboard navigation. While onKeyDown handlers exist, there's no discoverable shortcut reference.

**Fix:** Create `src/components/KeyboardShortcuts.tsx`:
- Press `?` or `Ctrl+/` to show overlay
- List shortcuts: `n` = new course, `s` = settings, `m` = mindmap, `c` = conversation, `Esc` = close dialogs
- Modal overlay with clean grid layout
- Register global keydown handler in App.tsx

**Acceptance Criteria:**
- `ls src/components/KeyboardShortcuts.tsx` exists
- `grep 'KeyboardShortcuts' src/App.tsx` shows import

---

### 8. 🟢 MEDIUM: Enhance Collaboration Page Beyond Placeholder

**Problem:** 72 lines, just "coming soon" cards. Zero interactivity.

**Fix:** In `src/screens/Collaboration.tsx`, add:
- A "Find Study Partners" section with interest-tag matching UI (mock)
- A "Study Groups" section with 2-3 mock group cards (group name, members, topic)
- A "Start a Group" button that opens a simple form (name + topic, mock submit)
- Keep "coming soon" badges on advanced features but make the page feel alive

**Acceptance Criteria:**
- `wc -l src/screens/Collaboration.tsx` shows ≥150 lines
- Page has interactive elements (form, buttons)

---

### 9. 🟢 MEDIUM: Add "Today's Lessons" Queue to Dashboard

**Problem:** Dashboard has a "Today's Lessons" header but needs to verify it shows prioritized lesson recommendations per spec §5.2.2.

**Fix:** Verify/ensure the Today's Lessons section shows:
- 3-5 recommended lessons from active courses
- Each with: course name, lesson title, estimated time badge (<10 min), "Start" button
- If no active courses, show an empty state: "Create your first course to see daily recommendations"

**Acceptance Criteria:**
- `grep -A 5 "Today.*Lesson" src/screens/Dashboard.tsx` shows lesson cards with time badges

---

### 10. 🟢 MEDIUM: Add About Page Content Per Spec

**Problem:** Spec §12.1 says About page should have "team, mission, privacy commitment." Need to verify content.

**Fix:** Check `src/screens/marketing/About.tsx`. Ensure it has:
- Mission statement section
- Team section (even if placeholder avatars/names)
- Privacy commitment section
- Values/principles section

**Acceptance Criteria:**
- `grep -n 'mission\|team\|privacy\|Mission\|Team\|Privacy' src/screens/marketing/About.tsx | wc -l` returns ≥3

---

### 11. 🟢 LOW: Add Loading States with Branding

**Problem:** Playwright screenshots show bare spinners with no context. Loading screens should have the LearnFlow logo/name.

**Fix:** In the main loading/spinner component, add the LearnFlow logo or wordmark above the spinner and "Loading your learning journey..." text below.

**Acceptance Criteria:**
- Loading screen shows brand name and contextual text

---

### 12. 🟢 LOW: Add Form Validation Messages to Auth Screens

**Problem:** Login/Register screens have no visible error states or validation feedback.

**Fix:** In LoginScreen.tsx and RegisterScreen.tsx:
- Add inline validation: email format, password min length (8 chars)
- Show red error text below invalid fields
- Show toast/banner for failed login attempts

**Acceptance Criteria:**
- `grep -n 'error\|invalid\|validation' src/screens/LoginScreen.tsx | wc -l` returns ≥3

---

## ⚠️ BUILDER INSTRUCTIONS

**TASK 1 IS NON-NEGOTIABLE.** Previous builders (iterations 20 AND 21) both lied about test counts. You MUST:
1. Actually create the test files listed
2. Actually run `npx vitest run` and paste the REAL output
3. The real output currently says `67 passed (67)` and `6 passed (6)` — your output MUST show different (higher) numbers

If `npx vitest run` doesn't show ≥100 tests and ≥12 files, the task is not done.

**DO NOT CLAIM "already existed" or "already at 300 tests."** That is a lie. Verify with the actual command.

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
