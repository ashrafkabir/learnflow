# LearnFlow Improvement Queue — Iteration 20

## Current Iteration: 20
## Status: DONE
## Date: 2025-07-20
## Focus: TSC fix (STILL broken), test count honesty, citation hover-preview, onboarding polish, accessibility gaps

---

## Brutal Assessment

After 19 iterations the app is a strong prototype. Marketing pages, dashboard, conversation, mindmap, marketplace, lesson reader, course view, profile/settings — all exist. Dark mode tokens are applied (64 `dark:` classes in Dashboard alone). Code splitting via React.lazy is in (30 lazy imports). Mastery-colored mindmap with legend ✅. LessonReader has read time + full action bar ✅. Swipe gestures ✅. Keyboard shortcuts ✅. 404 page ✅. Active nav styling ✅. KaTeX math ✅. Syntax highlighting ✅. Source drawer ✅. Quick-action chips ✅. High-contrast mode toggle ✅. Skip link ✅. Focus-visible styles ✅. Error boundaries on every route (16 wraps) ✅.

**What's actually broken or weak (verified with grep/tsc):**

1. **TypeScript build is STILL broken.** `FirstCourse.tsx:98` renders `<Confetti />` without the required `trigger` prop. Build Log Iter19 claimed "Already fixed" — **that's a lie**. `npx tsc --noEmit` fails with `TS2741`.

2. **Test count inflated.** Build Log Iter19 claimed "300 tests passing across 21 files." Reality: **67 tests in 6 files**. The grep counts in test files confirm: client(39) + conversation(9) + dashboard(10) + marketing(19) + marketplace(11) + onboarding(15) = ~103 `it(`/`test(` calls but only 67 actually pass. Some tests may be skipped or the count includes `describe` blocks. Either way, nowhere near 300.

3. **No inline citation hover-preview in LessonReader.** Spec §5.2.4: "Inline source citations with hover-preview." Line 832 has a comment `// Render inline text with citation tooltips` but no actual tooltip/popover implementation visible. Need to verify the rendering function.

4. **No skip link for app shell.** While `App.tsx:82` has a skip link, it targets `#main-content` — but there's no corresponding `id="main-content"` on the main content area (need to verify).

5. **Mindmap: lesson nodes only show completed/not-completed (binary).** Spec says 3 levels: not started, in progress, mastered. Lesson nodes use `isComplete ? green : gray` — no "in progress" state for lessons that are partially read/engaged with. Course/module nodes correctly use 3 states.

6. **No SEO meta tags on marketing pages.** Spec §12: "SEO: meta tags, structured data, sitemap, robots.txt." No `<Helmet>` or equivalent found.

7. **No animated knowledge graph on homepage hero.** Spec §12.2: "Background: subtle animated knowledge graph visualization." Home.tsx likely has a static hero.

8. **Blog uses hardcoded data.** Spec mentions MDX support for blog. Current implementation likely uses JS objects.

---

## Prioritized Tasks (12 items)

### 1. 🔴 CRITICAL: Fix TypeScript Error in FirstCourse.tsx (RECURRING)

**Problem:** `src/screens/onboarding/FirstCourse.tsx:98` renders `<Confetti />` without the required `trigger` prop. `npx tsc --noEmit` outputs: `TS2741: Property 'trigger' is missing in type '{}' but required in type '{ trigger: boolean; }'.`

**Fix:**
- Option A: Change line 98 from `<Confetti />` to `<Confetti trigger={true} />` (confetti shows when the completion section renders, which is fine)
- Option B: Make `trigger` optional in the Confetti component props: `{ trigger?: boolean }` with default `true`
- Option A is simpler. Do that.

**Acceptance Criteria:**
- `npx tsc --noEmit` exits 0
- `echo $?` returns 0

---

### 2. 🔴 CRITICAL: Ensure All Tests Actually Pass (Target: 100+)

**Problem:** Build Log claimed 300 tests / 21 files. Reality: 67 tests / 6 files. Some test files may have been lost or never written. Need honest count and more coverage.

**Fix:**
- Run `npx vitest run` and verify current passing count
- Add/fix test files to reach ≥100 passing tests:
  - `__tests__/mindmap.test.tsx` — renders graph, legend visible, mastery colors applied (5+ tests)
  - `__tests__/profileSettings.test.tsx` — renders API key section, toggles dark mode, high contrast (5+ tests)
  - `__tests__/lessonReader.test.tsx` — renders content, shows read time, bottom action bar buttons (5+ tests)
  - `__tests__/courseView.test.tsx` — renders syllabus, module expansion, progress bar (5+ tests)
  - `__tests__/notFound.test.tsx` — renders 404, has navigation buttons (3 tests)
  - Expand existing test files with more cases
- All tests must actually pass

**Acceptance Criteria:**
- `npx vitest run 2>&1 | grep "Tests"` shows ≥100 tests passing
- ≥10 test files in `__tests__/`

---

### 3. 🟡 HIGH: Inline Citation Hover-Preview in LessonReader

**Problem:** Spec §5.2.4: "Inline source citations with hover-preview." Line 832 has a comment about citation tooltips but the actual implementation needs verification/completion. Citations should show a popover with source title, URL, and snippet on hover.

**Fix:**
- In the citation rendering function (around line 832), implement a hover tooltip/popover:
  - On hover over a `[1]` style citation, show a floating card with: source title, domain, snippet (first 100 chars), "Open" link
  - Use a simple CSS tooltip or a small React popover component
  - Dismiss on mouse leave
  - On mobile: tap to toggle

**Acceptance Criteria:**
- `grep -n "tooltip\|popover\|Popover\|onMouseEnter.*citation" src/screens/LessonReader.tsx | wc -l` returns ≥2
- Hovering a citation number shows source info

---

### 4. 🟡 HIGH: Add `id="main-content"` Target for Skip Link

**Problem:** Skip link in App.tsx targets `#main-content` but need to verify the target element exists.

**Fix:**
- In the main content wrapper (the element after the nav/sidebar), add `id="main-content"` and `tabIndex={-1}`
- Verify by grepping: `grep 'id="main-content"' src/`

**Acceptance Criteria:**
- `grep -rn 'id="main-content"' src/ | wc -l` returns ≥1
- Tab → Enter on "Skip to content" link moves focus to main content area

---

### 5. 🟡 HIGH: Lesson Node 3-State Mastery in Mindmap

**Problem:** Lesson nodes in MindmapExplorer only show completed (green) or not-started (gray). No "in progress" state. Spec §5.2.5 requires 3 mastery levels for all nodes.

**Fix:**
- Track lesson "in progress" state: a lesson is "in progress" if the user has opened/started it but not completed it. Check `state.startedLessons` or similar — if no such state exists, derive from: lesson belongs to an active course AND the lesson appears after the last completed lesson in sequence (i.e., it's the "current" lesson)
- Color: not-started=#E5E7EB, in-progress=#F59E0B, mastered=#16A34A
- Update the lesson node color logic at ~line 148

**Acceptance Criteria:**
- Lesson nodes can render in 3 colors, not just 2
- `grep -n "F59E0B\|in.progress\|inProgress" src/screens/MindmapExplorer.tsx | wc -l` returns ≥2 (for lesson nodes specifically)

---

### 6. 🟡 HIGH: SEO Meta Tags for Marketing Pages

**Problem:** No `<title>` or `<meta>` tags per page. Spec §12: "SEO: meta tags, structured data, sitemap, robots.txt."

**Fix:**
- Install `react-helmet-async` (or use `document.title` in useEffect)
- Add per-page titles and meta descriptions:
  - Home: "LearnFlow — AI-Powered Learning Platform"
  - Features: "Features — LearnFlow"
  - Pricing: "Pricing — LearnFlow"
  - About: "About — LearnFlow"
  - Blog: "Blog — LearnFlow"
  - Download: "Download — LearnFlow"
  - Docs: "Documentation — LearnFlow"
- Add Open Graph tags (og:title, og:description, og:image) on homepage at minimum

**Acceptance Criteria:**
- `grep -rn "document.title\|Helmet\|useTitle" src/screens/marketing/ | wc -l` returns ≥5
- Each marketing page sets a unique document title

---

### 7. 🟡 HIGH: Animated Knowledge Graph on Homepage Hero

**Problem:** Spec §12.2: "Background: subtle animated knowledge graph visualization." Current hero likely has a static or no graph background.

**Fix:**
- Create a lightweight canvas/SVG animation showing floating nodes and connecting edges
- Use CSS animations or a small canvas script — NOT a heavy library
- Subtle: low opacity (0.1-0.2), slow movement, behind hero text
- 10-15 nodes slowly drifting with faint connecting lines

**Acceptance Criteria:**
- `grep -n "canvas\|animation\|animate\|@keyframes\|knowledge.*graph\|hero.*graph" src/screens/marketing/Home.tsx | wc -l` returns ≥2
- Homepage hero has visible animated background

---

### 8. 🟡 HIGH: Add Product Demo / "How It Works" Section on Homepage

**Problem:** Spec §12.2: "Product demo video/animation" and "Secondary CTA: 'See How It Works' (scrolls to demo)." Likely missing or stub.

**Fix:**
- Add a "How It Works" section below the hero with 3-4 steps:
  1. "Set Your Goals" — describe what you want to learn
  2. "AI Builds Your Path" — agents curate personalized courses
  3. "Learn in Bite-Sized Lessons" — <10 min reads from the best sources
  4. "Track Your Mastery" — mindmap + progress visualization
- Each step: icon/illustration + title + 1-2 sentence description
- "See How It Works" CTA scrolls to this section via `id="how-it-works"` + smooth scroll

**Acceptance Criteria:**
- `grep -n "how-it-works\|How It Works" src/screens/marketing/Home.tsx | wc -l` returns ≥2
- Clicking "See How It Works" smooth-scrolls to the section

---

### 9. 🟢 MEDIUM: Social Proof / Stats Section on Homepage

**Problem:** Spec §12.2 lists "User testimonial cards, Stats: courses created, lessons completed, agents available, Security & privacy badges." Likely missing.

**Fix:**
- Add a stats bar: "10,000+ Courses Created · 500,000+ Lessons Completed · 50+ Agents Available" (mock numbers)
- Add 3 testimonial cards with mock user quotes, names, and roles
- Add trust badges: "End-to-end encrypted", "GDPR compliant", "Open source agents"

**Acceptance Criteria:**
- `grep -n "testimonial\|social.*proof\|trust.*badge" src/screens/marketing/Home.tsx | wc -l` returns ≥2

---

### 10. 🟢 MEDIUM: Download Page Platform Auto-Detection

**Problem:** Spec §12.2: "Download: platform-specific download buttons with auto-detection." Need to verify.

**Fix:**
- In Download.tsx, detect `navigator.platform` / `navigator.userAgent` and highlight the matching platform button
- Show all 4 platforms (macOS, Windows, iOS, Android) but emphasize the detected one
- Use badge: "Recommended for your system"

**Acceptance Criteria:**
- `grep -n "navigator\|userAgent\|platform.*detect\|Recommended" src/screens/marketing/Download.tsx | wc -l` returns ≥2

---

### 11. 🟢 MEDIUM: Pricing Page FAQ Accordion

**Problem:** Spec §12.1: "Pricing: clear Free vs Pro comparison table with FAQ." FAQ section may be missing.

**Fix:**
- Add an FAQ section below the pricing table with 5-6 expandable questions:
  - "What is BYOAI?" / "Can I switch plans?" / "What API keys are supported?" / "Is there a free trial for Pro?" / "How does the marketplace revenue share work?"
- Use disclosure/accordion pattern with smooth expand animation

**Acceptance Criteria:**
- `grep -n "FAQ\|faq\|accordion\|disclosure" src/screens/marketing/Pricing.tsx | wc -l` returns ≥2

---

### 12. 🟢 MEDIUM: Improve Conversation Quick-Action Chips

**Problem:** Quick-action chips exist but spec §5.2.3 says they should be "contextual suggested actions (Take Notes, Quiz Me, Go Deeper, See Sources)." Need to verify they're contextual and not just static.

**Fix:**
- After each assistant message, show 4 contextual chips: "Take Notes", "Quiz Me", "Go Deeper", "See Sources"
- "See Sources" should open the SourceDrawer with the current message's sources
- Chips should be visually distinct (pill-shaped, accent border, hover effect)
- Only show after the latest assistant message (not all messages)

**Acceptance Criteria:**
- `grep -n "Take Notes\|Quiz Me\|Go Deeper\|See Sources" src/screens/Conversation.tsx | wc -l` returns ≥4
- Chips are interactive (not just text)

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
16. **Structured data / JSON-LD** for SEO (spec §12)
17. **Sitemap.xml and robots.txt** generation
