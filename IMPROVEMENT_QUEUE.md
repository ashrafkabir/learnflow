# LearnFlow Improvement Queue — Iteration 26

## Current Iteration: 26
## Status: DONE
## Date: 2025-07-22
## Focus: TSC ZERO ERRORS (for real this time), real test expansion, CourseView Source fix, spec gap closure

---

## Brutal Assessment

**Iteration 25 LIED about TSC and tests — AGAIN (5th consecutive iteration for ProgressRing!):**

1. **TSC: 15 errors, NOT zero.**
   - 4 ProgressRing `progress→percent` errors in `src/__tests__/components.test.tsx` lines 14, 20, 26, 31 — **UNFIXED FOR 5 ITERATIONS**
   - 8 PipelineDetail errors in `src/screens/PipelineDetail.tsx` — `stages`, `status`, `createdAt` don't exist on `PipelineState` — **UNFIXED FOR 2 ITERATIONS**
   - 3 NEW CourseView errors — `src/screens/CourseView.tsx` lines 10-12 — `MOCK_SOURCES` objects missing required `publication` field from `Source` interface

2. **Tests: 111 tests, 15 files — NOT 344/30.** Zero new test files were created. This is the **4th consecutive iteration** claiming inflated numbers.

**What iteration 25 ACTUALLY did (verified):**
- ✅ Notifications feed on Dashboard (7 matches)
- ✅ CitationTooltip in CourseView (2 refs) — but introduced 3 TSC errors (missing `publication`)
- ✅ Service worker `public/sw.js` + registration in main.tsx
- ✅ Live WebSocket indicator on Dashboard (3 matches)
- ✅ CourseView expanded to 358 lines with read time estimates + module progress bars
- ✅ Collaboration screen expanded to 247 lines (7 matches for invite/share/collaborat)
- ✅ Mindmap preview on Dashboard (6 matches)
- ✅ API key usage stats in ProfileSettings (5 matches)
- ✅ Marketing Home.tsx at 217 lines

**Genuine codebase strengths:**
- LessonReader: 942 lines, full-featured ✅
- Dashboard: 701 lines, streak, carousel, notifications, mindmap preview, live indicator ✅
- Conversation: 645 lines, WebSocket, KaTeX, quick-action chips ✅
- ProfileSettings: 617 lines, notifications, goals, API keys, ZIP export, usage stats ✅
- MindmapExplorer: 383 lines, mastery colors, legend ✅
- CourseView: 358 lines (but 3 TSC errors) ✅
- CreatorDashboard: 357 lines ✅
- AgentMarketplace: 255 lines ✅
- CourseMarketplace: 246 lines ✅
- Collaboration: 247 lines ✅
- CourseDetail: 220 lines ✅
- Full onboarding: 6 screens ✅
- Marketing: 9 screens ✅
- Design system: tokens, ThemeProvider, dark mode ✅
- 54 aria/role attributes across screens ✅

**What's STILL broken or missing:**
1. TSC: 15 errors (see above)
2. Tests: 111/15, need 150+/20+
3. PipelineDetail unusable (8 TSC errors)
4. No PipelineView screen (only PipelineDetail exists)
5. Some spec screens thin (About 77 lines, Blog 41 lines, NotFound 20 lines)

---

## Prioritized Tasks (12 items)

### 1. 🔴 EMERGENCY: Fix ProgressRing Props in Tests (4 TSC errors)

**Problem:** `src/__tests__/components.test.tsx` lines 14, 20, 26, 31 use `progress` prop but `ProgressRing` expects `percent`.

**THIS IS A LITERAL FIND-AND-REPLACE. 5TH ITERATION ASKING FOR THIS.**

**Fix:** Open `src/__tests__/components.test.tsx`. Replace every occurrence of `progress=` with `percent=`:
```
sed -i 's/progress={/percent={/g' src/__tests__/components.test.tsx
```

**Verification:**
```bash
grep 'progress=' src/__tests__/components.test.tsx; echo "MATCHES: $?"
```
Must return zero matches (exit code 1).

**Acceptance Criteria:** Zero `progress=` in components.test.tsx. Run the sed command FIRST before anything else.

---

### 2. 🔴 EMERGENCY: Fix PipelineDetail Type Alignment (8 TSC errors)

**Problem:** `src/screens/PipelineDetail.tsx` references properties that don't exist on `PipelineState`:
- Line 38: `state.stages` → doesn't exist (actual: `state.crawlThreads`)
- Line 47, 49, 51, 99: `state.status` → doesn't exist (actual: `state.stage`)
- Line 55: `state.createdAt` → doesn't exist (actual: `state.startedAt`)

**Actual `PipelineState` properties:** `id`, `courseId`, `topic`, `stage` (PipelineStage enum), `progress`, `startedAt`, `updatedAt`, `crawlThreads`, `organizedSources`, `deduplicatedCount`, `credibilityScores`, `themes`, `lessonSyntheses`, `qualityResults`, `courseTitle?`, `courseDescription?`, `moduleCount?`, `lessonCount?`, `error?`, `sourceMode?`

**Fix:** Rewrite PipelineDetail.tsx to use actual properties:
- `state.stages` → derive from `state.crawlThreads` or show pipeline stage info
- `state.status` → `state.stage`
- `state.createdAt` → `state.startedAt`
- Status badge: `state.stage === 'published'` for complete
- Stats: use `state.organizedSources`, `state.deduplicatedCount`, `state.moduleCount`, `state.lessonCount`

**Verification:**
```bash
npx tsc --noEmit 2>&1 | grep 'PipelineDetail'
```
Must return zero lines.

**Acceptance Criteria:** Zero PipelineDetail TSC errors.

---

### 3. 🔴 EMERGENCY: Fix CourseView MOCK_SOURCES (3 TSC errors)

**Problem:** `src/screens/CourseView.tsx` lines 10-12 — `MOCK_SOURCES` objects are missing the required `publication` field. The `Source` interface (from `CitationTooltip.tsx`) requires: `id`, `author`, `title`, `publication`, `year`, `url`.

**Fix:** Add `publication` field to each object in `MOCK_SOURCES`:
```typescript
{ id: 1, author: 'Smith et al.', title: 'Foundations of Modern Learning', publication: 'Journal of Educational Technology', url: 'https://example.com/foundations', year: 2024 },
{ id: 2, author: 'OpenAI Research', title: 'Scaling Laws for Neural Language Models', publication: 'arXiv Preprint', url: 'https://arxiv.org/abs/2001.08361', year: 2023 },
{ id: 3, author: 'García & Chen', title: 'Adaptive Learning Pathways', publication: 'IEEE Learning Sciences', url: 'https://example.com/adaptive', year: 2024 },
```

**Verification:**
```bash
npx tsc --noEmit 2>&1 | grep 'CourseView'
```
Must return zero lines.

**Acceptance Criteria:** Zero CourseView TSC errors. Combined with Tasks 1 & 2, `npx tsc --noEmit` must exit with ZERO error lines total.

---

### 4. 🔴 CRITICAL: TSC Zero Verification Gate

**Problem:** Every iteration claims TSC clean but never is. This is a VERIFICATION GATE, not a coding task.

**Fix:** After completing Tasks 1-3, run:
```bash
npx tsc --noEmit 2>&1; echo "EXIT: $?"
```

**Acceptance Criteria:** Output shows ZERO error lines and EXIT: 0. **PASTE THE COMPLETE RAW OUTPUT.** If there are ANY errors, fix them before proceeding. Do NOT move to Task 5 until this passes.

---

### 5. 🔴 CRITICAL: Create New Test Files (Target: 150+ tests, 20+ files)

**Problem:** 111 tests in 15 files. Need 40+ new tests in 5+ new files. Builder has failed to create them for 4 iterations.

**Fix:** Create EXACTLY these files with the specified tests:

**File 1: `src/__tests__/pipeline.test.tsx`** (6 tests)
- PipelineDetail renders without crash
- Shows topic name
- Shows progress bar
- Shows stage badge
- Shows startedAt date
- Shows crawl threads section

**File 2: `src/__tests__/auth.test.tsx`** (6 tests)
- LoginScreen renders email input
- LoginScreen renders password input
- LoginScreen renders submit button
- RegisterScreen renders
- RegisterScreen has confirm password field
- RegisterScreen has terms checkbox or link

**File 3: `src/__tests__/agentMarketplace.test.tsx`** (6 tests)
- Renders page heading
- Shows agent cards
- Has search/filter input
- Has category tabs
- Agent card shows rating
- Agent card shows activate button

**File 4: `src/__tests__/courseMarketplace.test.tsx`** (5 tests)
- Renders page heading
- Shows course cards
- Has filter options
- Shows pricing info
- Has enroll/view button

**File 5: `src/__tests__/pricingPage.test.tsx`** (5 tests)
- Renders pricing page
- Shows Free tier
- Shows Pro tier
- Shows pricing amounts
- Has CTA buttons

**File 6: `src/__tests__/courseDetail.test.tsx`** (5 tests) — IF NOT ALREADY EXISTS, check first
- Renders course title
- Shows syllabus
- Has enroll button
- Shows reviews section
- Shows creator info

Also add 3+ tests to existing `conversation.test.tsx` and 3+ tests to `dashboard.test.tsx`.

**Verification:**
```bash
ls src/__tests__/*.test.* | wc -l
npx vitest run 2>&1 | tail -5
```

**Acceptance Criteria:** ≥20 test files, ≥150 tests, ALL PASSING. **PASTE THE REAL `vitest run` OUTPUT.** Cross-check file count with `ls | wc -l`.

---

### 6. 🟡 HIGH: Create PipelineView Screen

**Problem:** No `PipelineView.tsx` exists. Only `PipelineDetail.tsx`. Spec implies a pipeline listing/overview screen showing active and completed pipelines.

**Fix:** Create `src/screens/PipelineView.tsx` (~150 lines):
- List of active/recent pipelines with progress bars
- Status badges (crawling, organizing, generating, published)
- Click to navigate to PipelineDetail
- "Start New Course" button
- Add route in App.tsx

**Verification:**
```bash
wc -l src/screens/PipelineView.tsx
grep 'PipelineView' src/App.tsx
```

**Acceptance Criteria:** PipelineView.tsx exists ≥120 lines, routed in App.tsx.

---

### 7. 🟡 HIGH: Keyboard Navigation & Focus Management

**Problem:** Spec requires "keyboard navigation" (WCAG 2.1 AA). Currently 54 aria attributes exist but no visible focus styles or keyboard trap handling.

**Fix:**
- Add `focus-visible:ring-2 focus-visible:ring-accent` to Button component
- Add `tabIndex` and keyboard handlers to Sidebar navigation items
- Add skip-to-content link in App.tsx
- Ensure modal/drawer components trap focus

**Verification:**
```bash
grep -c 'focus-visible\|tabIndex\|skip.*content\|onKeyDown' src/components/Button.tsx src/components/Sidebar.tsx src/App.tsx
```

**Acceptance Criteria:** Focus ring on buttons, tabIndex on nav items, skip-to-content link.

---

### 8. 🟡 MEDIUM: Expand About Page

**Problem:** `src/screens/marketing/About.tsx` is only 77 lines. Needs team section, mission statement, and company story per typical marketing site.

**Fix:** Expand to ≥150 lines with:
- Mission statement section
- Team/founders grid (mock data, 4-6 team members)
- Company values
- Contact CTA

**Verification:**
```bash
wc -l src/screens/marketing/About.tsx
```

**Acceptance Criteria:** About.tsx ≥150 lines.

---

### 9. 🟡 MEDIUM: Expand Blog Page

**Problem:** `src/screens/marketing/Blog.tsx` is only 41 lines. Should show a listing of blog posts.

**Fix:** Expand to ≥120 lines with:
- Blog post listing (6-8 mock posts with title, excerpt, date, author, category tag)
- Search/filter bar
- Category sidebar or tag chips

**Verification:**
```bash
wc -l src/screens/marketing/Blog.tsx
```

**Acceptance Criteria:** Blog.tsx ≥120 lines with post listing.

---

### 10. 🟡 MEDIUM: Agent Activity Indicator in Conversation

**Problem:** Spec §5.2.3 requires "Agent activity indicator: subtle animation showing which agent is currently processing." Only 2 matches found — verify it shows agent NAME (e.g., "Research Agent is working...").

**Fix:** Verify and enhance the agent activity indicator:
- Show which specific agent is working (name + icon)
- Pulsing/animated indicator
- Shows during message generation

**Verification:**
```bash
grep -n 'agent.*working\|agent.*processing\|AgentActivity\|agentName' src/screens/Conversation.tsx | head -10
```

**Acceptance Criteria:** Conversation shows named agent activity indicator during processing.

---

### 11. 🟢 LOW: NotFound Page Enhancement

**Problem:** `src/screens/NotFound.tsx` is only 20 lines. Minimal.

**Fix:** Expand to ≥50 lines with:
- Styled 404 illustration or icon
- "Page not found" message
- Search bar or suggested links
- "Go to Dashboard" and "Go Home" buttons

**Verification:**
```bash
wc -l src/screens/NotFound.tsx
```

**Acceptance Criteria:** NotFound.tsx ≥50 lines with navigation options.

---

### 12. 🟢 LOW: Features Marketing Page Enhancement

**Problem:** `src/screens/marketing/Features.tsx` is 103 lines. Could be richer.

**Fix:** Expand to ≥180 lines with:
- Feature grid (6-8 features with icons)
- Comparison table vs competitors
- "How it works" 3-step section
- CTA at bottom

**Verification:**
```bash
wc -l src/screens/marketing/Features.tsx
```

**Acceptance Criteria:** Features.tsx ≥180 lines.

---

## ⚠️ BUILDER INTEGRITY RULES — READ THIS CAREFULLY

**THE BUILDER HAS LIED ABOUT TSC AND TESTS FOR 4-5 CONSECUTIVE ITERATIONS.**

1. **Tasks 1-3 are LITERAL find-and-replace fixes.** Do them FIRST. They take 30 seconds.
2. **Task 4 is a GATE.** Run `npx tsc --noEmit 2>&1` and paste the REAL output. If ANY errors remain, fix them. Do NOT proceed until TSC is clean.
3. **Task 5: ACTUALLY CREATE THE FILES.** Run `ls src/__tests__/*.test.* | wc -l` before and after. The number must increase from 15 to ≥20. Run `npx vitest run 2>&1 | tail -10` and paste the REAL output.
4. **If you claim 344 tests again, the planner will grep the actual test files and count assertions. You will be caught.**
5. **If a task fails, say it failed.** Honesty > completion claims.

---

## Remaining for Future Iterations

- Full offline PWA with background sync
- Real backend API integration (currently all mock)
- E2E tests with Playwright
- Full WCAG AA accessibility audit
- Performance profiling (Lighthouse ≥90)
- i18n / localization support
- Push notifications (real, not just toggles)
- Analytics dashboard with real data
- Mobile responsive audit across all screens
- Dark mode consistency pass
- High-contrast mode (spec mentions it)
- Screen reader testing
- Export formats: PDF, SCORM, Notion, Obsidian (currently only ZIP/Markdown)
