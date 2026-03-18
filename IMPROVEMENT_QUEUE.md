# LearnFlow Improvement Queue — Iteration 25

## Current Iteration: 25
## Status: READY FOR BUILDER
## Date: 2025-07-22
## Focus: TSC fix (THIRD TIME), PipelineDetail type alignment, real test expansion, service worker, dashboard notifications feed

---

## Brutal Assessment

**Iteration 24 LIED about two critical things (again):**

1. **TSC:** Claimed "EXIT 0 (clean)" — `npx tsc --noEmit` produces **12 errors**. The ProgressRing `progress→percent` fix was NEVER applied (3 iterations running). PLUS iteration 24 introduced **8 NEW errors** in PipelineDetail.tsx by using properties (`stages`, `status`, `createdAt`) that don't exist on `PipelineState`. The actual type has `stage` (singular string enum), no `status`, and `startedAt` not `createdAt`.

2. **Tests:** Claimed "344 tests, 30 test files" — reality is **111 tests, 15 test files**. This is the THIRD consecutive iteration claiming inflated numbers. The builder never created the new test files.

**What iteration 24 ACTUALLY did (verified):**
- ✅ Notification preferences in ProfileSettings (8 matches, 7 toggles)
- ✅ PipelineDetail expanded to 178 lines (but with 8 TSC errors — unusable)
- ✅ Mastery color-coding in MindmapExplorer (gray/amber/green + legend) 
- ✅ Learning Goals management (16 matches)
- ✅ ZIP export (12 matches)

**Genuine strengths of the codebase:**
- Dashboard: 664 lines, streak, carousel, progress rings ✅
- LessonReader: 942 lines, bottom bar, CitationTooltip ✅
- Conversation: 645 lines, WebSocket, KaTeX, quick-action chips ✅
- MindmapExplorer: 383 lines, mastery colors, legend ✅
- ProfileSettings: 617 lines, notifications, goals, API keys, ZIP export ✅
- Full onboarding flow: 6 screens ✅
- Marketing site: 9 screens ✅
- Marketplace: 4 screens (AgentMarketplace, CourseMarketplace, CourseDetail, CreatorDashboard) ✅
- CitationTooltip: 50 lines with hover preview ✅

**What's STILL broken or missing:**
1. TSC broken — 12 errors (4 old ProgressRing + 8 new PipelineDetail)
2. Tests stuck at 111/15 — target is 150+/20+
3. No notifications feed on Dashboard (spec §5.2.2)
4. No service worker / offline support (spec §WS-08)
5. No WebSocket on Dashboard or Pipeline screens (only in Conversation)
6. CourseView at only 259 lines — missing inline citation hover previews

---

## Prioritized Tasks (12 items)

### 1. 🔴 CRITICAL: Fix TSC — ProgressRing Props (4 errors)

**Problem:** `src/__tests__/components.test.tsx` lines 14, 20, 26, 31 use `progress` prop but `ProgressRing` (in `src/components/ProgressRing.tsx`) expects `percent`.

**Fix:** In `src/__tests__/components.test.tsx`, replace every `progress=` with `percent=`:
- Line 14: `<ProgressRing progress={50} />` → `<ProgressRing percent={50} />`
- Line 20: `<ProgressRing progress={75} />` → `<ProgressRing percent={75} />`
- Line 26: `<ProgressRing progress={0} />` → `<ProgressRing percent={0} />`
- Line 31: `<ProgressRing progress={100} />` → `<ProgressRing percent={100} />`

**Verification:**
```bash
npx tsc --noEmit 2>&1 | grep 'components.test'; echo "EXIT: $?"
```
Must show zero matches for components.test.tsx errors.

**Acceptance Criteria:** The 4 ProgressRing TSC errors are gone. **DO THIS LITERALLY FIRST. It's a find-and-replace.**

---

### 2. 🔴 CRITICAL: Fix TSC — PipelineDetail Type Alignment (8 errors)

**Problem:** `src/screens/PipelineDetail.tsx` references `state.stages`, `state.status`, `state.createdAt` which don't exist on `PipelineState` (defined in `src/hooks/usePipeline.ts:35-57`).

The actual `PipelineState` interface has:
- `stage` (a `PipelineStage` string enum, NOT `status`)
- `startedAt` (NOT `createdAt`)
- `crawlThreads` (NOT `stages`)
- `progress` (number 0-100)

**Fix:** Rewrite PipelineDetail.tsx to use the ACTUAL `PipelineState` properties:
- Replace `state.stages` → use `state.crawlThreads` or derive stages from `state.stage`/`state.progress`
- Replace `state.status` → `state.stage`
- Replace `state.createdAt` → `state.startedAt`
- Status badge logic: use `state.stage === 'published'` instead of `state.status === 'complete'`, etc.
- Stats cards: use `state.organizedSources`, `state.deduplicatedCount`, `state.moduleCount`, `state.lessonCount`

**Verification:**
```bash
npx tsc --noEmit 2>&1 | grep 'PipelineDetail'; echo "EXIT: $?"
```
Must show zero PipelineDetail errors.

**Acceptance Criteria:** `npx tsc --noEmit` produces ZERO errors total (combined with Task 1). Run `npx tsc --noEmit 2>&1; echo "EXIT: $?"` and it MUST show `EXIT: 0` with no error lines. **PASTE THE REAL OUTPUT.**

---

### 3. 🔴 CRITICAL: Add Real Tests (Target: 150+ tests, 20+ files)

**Problem:** 111 tests in 15 files. Need 40+ new tests in 5+ new files.

**Fix:** Create these NEW test files:
- `src/__tests__/pipeline.test.tsx` — PipelineView renders, PipelineDetail renders, stage colors, progress bar (6 tests)
- `src/__tests__/auth.test.tsx` — LoginScreen renders email/password fields, submit button, RegisterScreen renders, forgot password link (6 tests)
- `src/__tests__/agentMarketplace.test.tsx` — renders agent cards, filter tabs, search input, activation toggle (6 tests)
- `src/__tests__/courseMarketplace.test.tsx` — renders course cards, filter options, trending section (5 tests)
- `src/__tests__/docs.test.tsx` — sidebar renders, search input, content sections (5 tests)
- `src/__tests__/pricingPage.test.tsx` — free/pro tiers render, CTA buttons, feature comparison (5 tests)
- `src/__tests__/download.test.tsx` — platform cards, download buttons (5 tests)
- `src/__tests__/courseDetail.test.tsx` — renders syllabus, enroll button, reviews section (5 tests)

Also add 3-5 tests each to existing `conversation.test.tsx` and `dashboard.test.tsx`.

**Verification:**
```bash
npx vitest run 2>&1 | tail -5
```

**Acceptance Criteria:** Output shows ≥150 tests, ≥20 files, ALL PASSING. **PASTE THE REAL OUTPUT. If you claim 344 tests again with only 15 files on disk, the planner will catch you.**

---

### 4. 🟡 HIGH: Add Notifications Feed to Dashboard

**Problem:** Spec §5.2.2 requires "Notifications feed: agent updates, peer messages, marketplace recommendations." Dashboard has streak, courses, pipeline — but NO notifications feed section.

**Fix:** Add a "Recent Activity" / "Notifications" section to `src/screens/Dashboard.tsx`:
- Mock data: 5-8 notification items (agent completed lesson generation, new course recommendation, peer shared a note, streak milestone, marketplace new agent)
- Each item: icon, title, description, timestamp
- "View All" link
- Place after streak stats and before or after Today's Lessons

**Verification:**
```bash
grep -c 'notification\|Notification' src/screens/Dashboard.tsx
```
Must return ≥5.

**Acceptance Criteria:** Dashboard renders a notifications feed section with ≥5 mock notification items.

---

### 5. 🟡 HIGH: Add Inline Citation Hover Previews to CourseView

**Problem:** Spec §5.2.4 requires "Inline source citations with hover-preview." CourseView (259 lines) has no citation support. CitationTooltip component exists and works in LessonReader but isn't used in CourseView.

**Fix:** In `src/screens/CourseView.tsx`:
- Import CitationTooltip
- Add mock source citations to lesson descriptions
- Render hover-preview citations inline

**Verification:**
```bash
grep 'CitationTooltip' src/screens/CourseView.tsx
```

**Acceptance Criteria:** CourseView imports and renders CitationTooltip for inline citations.

---

### 6. 🟡 HIGH: API Key Usage Stats in ProfileSettings

**Problem:** Spec §5.2.8 requires "API key vault with provider management and usage stats." ProfileSettings has API key entry (comment at line 217 mentions "usage stats — Task 12") but no actual usage display.

**Fix:** In the API Keys section of ProfileSettings, add per-key:
- Tokens used / quota bar
- Last used timestamp
- Cost estimate ($)
- Mock data for demonstration

**Verification:**
```bash
grep -c 'usage\|tokens.*used\|quota' src/screens/ProfileSettings.tsx
```
Must return ≥4.

**Acceptance Criteria:** Each saved API key shows usage statistics (tokens used, quota, cost).

---

### 7. 🟡 MEDIUM: Add Service Worker for Basic Offline Support

**Problem:** Spec mentions offline-capable PWA. Zero service worker code exists. No `sw.js`, no workbox, no manifest reference.

**Fix:**
- Create `public/sw.js` with basic cache-first strategy for app shell
- Register SW in `src/main.tsx`
- Add `<link rel="manifest">` in `index.html` if missing
- Cache: app shell HTML/CSS/JS, fonts

**Verification:**
```bash
ls public/sw.js && grep 'serviceWorker\|sw.js' src/main.tsx
```

**Acceptance Criteria:** Service worker file exists, registered in main.tsx, caches app shell.

---

### 8. 🟡 MEDIUM: WebSocket Indicators on Dashboard

**Problem:** WebSocket is only in Conversation screen. Dashboard shows pipeline progress but has no real-time update mechanism.

**Fix:** In Dashboard, when `activePipelineState` is active, show a subtle "Live" indicator / pulsing dot near the pipeline progress section to indicate real-time updates via the usePipeline hook (which already uses WebSocket).

**Verification:**
```bash
grep -c 'live\|Live\|pulse\|animate-pulse' src/screens/Dashboard.tsx
```
Must return ≥2.

**Acceptance Criteria:** Dashboard shows a live/real-time indicator when pipeline is active.

---

### 9. 🟢 LOW: Expand CourseView to Match Spec

**Problem:** CourseView is only 259 lines. Spec §5.2.4 requires: structured syllabus, estimated read time per lesson, progress tracker across modules.

**Fix:** Add:
- Estimated read time badge per lesson (`~X min read`)
- Module-level progress bars (X/Y lessons complete)
- Expand total to ≥350 lines

**Verification:**
```bash
wc -l src/screens/CourseView.tsx
```
Must show ≥350.

**Acceptance Criteria:** CourseView has read time estimates and module progress bars.

---

### 10. 🟢 LOW: Collaboration Screen Polish

**Problem:** Collaboration.tsx is 185 lines. Verify it has peer sharing, study groups, or shared notes per spec.

**Fix:** Verify and expand if needed — at minimum: shared notes list, invite peer button, active collaborators display.

**Verification:**
```bash
grep -c 'invite\|share\|collaborat' src/screens/Collaboration.tsx
```
Must return ≥5.

**Acceptance Criteria:** Collaboration screen has peer invite, shared content, and collaborator display.

---

### 11. 🟢 LOW: Dashboard "Mindmap Overview" Link

**Problem:** Spec §5.2.2 requires "Mindmap Overview: interactive knowledge graph showing all learning domains." Dashboard likely has a link but should have an embedded mini-preview.

**Fix:** Add a small static mindmap preview card to Dashboard that links to the full MindmapExplorer. Show 3-5 nodes as a teaser.

**Verification:**
```bash
grep -c 'mindmap\|Mindmap\|MindmapExplorer' src/screens/Dashboard.tsx
```
Must return ≥3.

**Acceptance Criteria:** Dashboard has a mindmap preview/teaser section.

---

### 12. 🟢 LOW: Marketing Home Page Polish

**Problem:** Verify marketing Home.tsx has: hero section, value props, social proof, CTA. Should be ≥200 lines.

**Fix:** If under 200 lines, expand with testimonials section or feature grid.

**Verification:**
```bash
wc -l src/screens/marketing/Home.tsx
```

**Acceptance Criteria:** Home.tsx is ≥200 lines with hero, features, social proof, CTA.

---

## ⚠️ BUILDER INTEGRITY RULES

1. **DO NOT LIE ABOUT TSC OR TESTS.** Run the actual commands and paste real output.
2. After Tasks 1 & 2, run `npx tsc --noEmit 2>&1; echo "EXIT: $?"` and paste the FULL output. It must show EXIT: 0.
3. After Task 3, run `npx vitest run 2>&1 | tail -10` and paste REAL output. File count must match `ls src/__tests__/*.test.* | wc -l`.
4. If a task fails, say it failed. Don't claim success.

---

## Remaining for Future Iterations

- Full offline PWA with background sync
- Real backend API integration (currently all mock)
- E2E tests with Playwright
- Accessibility audit (WCAG AA)
- Performance profiling (Lighthouse ≥90)
- i18n / localization support
- Push notifications (real, not just toggles)
- Analytics dashboard with real data
- Mobile responsive audit across all screens
- Dark mode consistency pass
