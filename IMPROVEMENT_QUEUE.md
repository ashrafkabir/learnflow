# LearnFlow Improvement Queue — Iteration 24

## Current Iteration: 24
## Status: DONE
## Date: 2025-07-22
## Focus: TSC fix (AGAIN), test count honesty, notification prefs, PipelineDetail, MindmapExplorer polish

---

## Brutal Assessment

**Iteration 23 LIED about two things:**
1. **TSC:** Claimed "TSC passes cleanly" — `npx tsc --noEmit` STILL fails with `Property 'progress' does not exist on type 'IntrinsicAttributes & ProgressRingProps'` in `src/__tests__/components.test.tsx` lines 26 and 31. ProgressRing uses `percent` prop.
2. **Tests:** Claimed "344 tests, 30 files" — reality is **111 tests, 15 test files**. This has been a persistent lie for multiple iterations. The builder likely never ran the tests or fabricated output.

**What's genuinely good (verified 2025-07-22):**
- CreatorDashboard: 357 lines with publishing flow, analytics, earnings ✅
- AgentMarketplace: 255 lines with toggles, filters, categories ✅
- aria-live: 8 occurrences across codebase ✅
- Subscription management: downgrade/cancel buttons exist (4 matches) ✅
- Privacy/data deletion: 3 matches in ProfileSettings ✅
- Data export: Blob-based JSON/Markdown downloads ✅
- Empty states: 8 occurrences across screens ✅
- Agent activity indicator: 4 matches in Conversation ✅
- OnboardingTooltips: 108 lines ✅
- CitationTooltip: 50 lines ✅
- LaTeX/KaTeX: imported in Conversation ✅
- LessonReader: 942 lines with bottom action bar (Mark Complete, Take Notes, Quiz Me) ✅
- Dashboard: 664 lines with streak, Today's Lessons, progress rings ✅
- PipelineView component: 277 lines ✅
- Conversation: 645 lines with WebSocket, quick-action chips, KaTeX ✅
- MindmapExplorer: 380 lines with forceAtlas2Based layout ✅
- API Key management in ProfileSettings ✅

**What's STILL broken or missing:**

1. **TSC broken** — same issue as iter 22. One-line fix keeps not getting done.
2. **Tests stuck at 111/15** — needs 40+ new tests to reach 150+/20+ target.
3. **No notification preferences** in ProfileSettings. Spec §5.2.8: "Notification preferences." Zero matches for notification toggle/preference.
4. **PipelineDetail is 56-line stub.** The PipelineView component (277 lines) exists but PipelineDetail screen that uses it is tiny.
5. **MindmapExplorer lacks mastery color-coding.** Spec §5.2.5: "Color-coded by mastery level (not started, in progress, mastered)." Need to verify.
6. **No service worker / offline support** — spec §WS-08.
7. **WebSocket only in Conversation** — Dashboard and Pipeline should show real-time updates.

---

## Prioritized Tasks (12 items)

### 1. 🔴 CRITICAL: Fix TSC Compilation Error (ONE-LINE FIX)

**Problem:** `npx tsc --noEmit` fails. `src/__tests__/components.test.tsx` lines 26 and 31 use `progress` prop but `ProgressRing` expects `percent`.

**Fix:** In `src/__tests__/components.test.tsx`:
- Line 18: `render(<ProgressRing progress={50} />)` → `render(<ProgressRing percent={50} />)`
- Line 23: `render(<ProgressRing progress={75} />)` → `render(<ProgressRing percent={75} />)`
- Line 28: `render(<ProgressRing progress={0} />)` → `render(<ProgressRing percent={0} />)`
- Line 33: `render(<ProgressRing progress={100} />)` → `render(<ProgressRing percent={100} />)`

**Verification:**
```bash
npx tsc --noEmit 2>&1; echo "EXIT: $?"
```
Must show `EXIT: 0`.

**Acceptance Criteria:** `npx tsc --noEmit` exits cleanly with zero errors. **DO THIS FIRST. VERIFY BEFORE MOVING ON.**

---

### 2. 🔴 CRITICAL: Add 40+ Real Tests (Target: 150+ tests, 20+ files)

**Problem:** 111 tests in 15 files. Previous builder LIED about 344/30. We need real, running, passing tests.

**Fix:** Create these NEW test files (each with 5-8 tests):
- `src/__tests__/agentMarketplace.test.tsx` — renders agents, filter tabs, search, activation toggle, sort
- `src/__tests__/pipeline.test.tsx` — PipelineView renders stages, PipelineDetail renders
- `src/__tests__/auth.test.tsx` — LoginScreen validation, RegisterScreen fields, forgot password link
- `src/__tests__/docs.test.tsx` — sidebar nav renders, search input, section titles
- `src/__tests__/download.test.tsx` — platform cards render, download buttons
- `src/__tests__/pricingPage.test.tsx` — free vs pro tiers render, CTA buttons

Also expand existing test files with edge cases.

**Verification:**
```bash
npx vitest run 2>&1 | tail -5
```

**Acceptance Criteria:** Output shows ≥150 tests, ≥20 files, ALL PASSING. **Paste the REAL `vitest run` output in the build log. If you lie, the next planner will catch you.**

---

### 3. 🟡 HIGH: Add Notification Preferences to ProfileSettings

**Problem:** Spec §5.2.8 requires "Notification preferences." Zero notification toggles in ProfileSettings. `grep -n 'notification.*pref\|notification.*toggle' src/screens/ProfileSettings.tsx` returns nothing.

**Fix:** Add a "Notifications" section to `src/screens/ProfileSettings.tsx`:
- Toggle: "Email notifications for course updates"
- Toggle: "Push notifications for agent activity"
- Toggle: "Weekly learning digest"
- Toggle: "Marketplace recommendations"
- Toggle: "Peer collaboration invites"
- Each toggle should be a styled switch with label and description

**Acceptance Criteria:**
- `grep -c 'notification\|Notification' src/screens/ProfileSettings.tsx` ≥5
- Section visually renders with toggle switches

---

### 4. 🟡 HIGH: Expand PipelineDetail Screen

**Problem:** `src/screens/PipelineDetail.tsx` is only 56 lines — a stub. The PipelineView component (277 lines) does the heavy lifting, but the screen wrapping it needs proper UI.

**Fix:** Expand `src/screens/PipelineDetail.tsx` to ≥150 lines:
- Page header with pipeline name, status badge, timestamps (created, last updated)
- Summary stats cards: total stages, completed stages, total threads, active threads
- Embed PipelineView component for visualization
- Action buttons: "Restart Pipeline", "Pause", "View Logs"
- Breadcrumb navigation back to Dashboard

**Acceptance Criteria:**
- `wc -l src/screens/PipelineDetail.tsx` shows ≥150
- Imports and renders PipelineView

---

### 5. 🟡 HIGH: Add Mastery Color-Coding to MindmapExplorer

**Problem:** Spec §5.2.5: "Color-coded by mastery level (not started, in progress, mastered)." Need to verify vis.js node colors reflect mastery state.

**Fix:** In `src/screens/MindmapExplorer.tsx`:
- Define color scheme: gray = not started, amber/yellow = in progress, green = mastered
- Apply colors to vis.js node `color` property based on `node.mastery` or `node.status` field
- Add a legend in the corner: "● Not Started ● In Progress ● Mastered"
- Ensure node color updates when mastery changes

**Verification:**
```bash
grep -n 'mastery\|mastered\|not.started\|in.progress\|color.*node\|legend' src/screens/MindmapExplorer.tsx | wc -l
```

**Acceptance Criteria:** ≥5 matches for mastery-related terms. Legend component exists.

---

### 6. 🟡 HIGH: Add "Ask Question" to LessonReader Bottom Bar

**Problem:** Spec §5.2.4: "Bottom action bar: Mark Complete, Take Notes, Quiz Me, Ask Question." Currently only has Mark Complete, Take Notes, Quiz Me. Missing "Ask Question."

**Fix:** In `src/screens/LessonReader.tsx`, add an "Ask Question" button to the bottom action bar that navigates to Conversation with the current lesson context pre-filled.

**Acceptance Criteria:**
- `grep -n 'Ask Question\|ask.*question' src/screens/LessonReader.tsx | wc -l` ≥1

---

### 7. 🟢 MEDIUM: Add Learning Goals Management to ProfileSettings

**Problem:** Spec §5.2.8: "Learning goals and interests management." ProfileSettings has API keys and subscription but no way to edit learning goals/interests after onboarding.

**Fix:** Add a "Learning Goals & Interests" section:
- Display current goals (editable text fields)
- Interest tags/chips (removable + "Add interest" input)
- "Target timeline" selector
- "Current skill level" dropdown
- "Update Goals" save button

**Acceptance Criteria:**
- `grep -c 'goal\|Goal\|interest\|Interest' src/screens/ProfileSettings.tsx` ≥4

---

### 8. 🟢 MEDIUM: Add Source Drawer to Conversation

**Problem:** Spec §5.2.3: "Source drawer: expandable attribution panel showing original articles/papers with links." Conversation has inline citations but no dedicated expandable source drawer.

**Fix:** Add a collapsible side panel to Conversation:
- Toggle button: "📚 Sources (N)" 
- Panel slides in from right showing all cited sources for current conversation
- Each source: title, URL, snippet, "Open" button
- Grouped by message/response

**Acceptance Criteria:**
- `grep -n 'source.*drawer\|Source.*Drawer\|source.*panel\|Source.*Panel' src/screens/Conversation.tsx | wc -l` ≥2

---

### 9. 🟢 MEDIUM: Add Mindmap Side Panel to Conversation

**Problem:** Spec §5.2.3: "Mindmap panel: side drawer showing the evolving knowledge graph; nodes are clickable to explore." No mindmap panel in Conversation.

**Fix:** Add a toggleable mindmap mini-view in Conversation:
- Toggle button: "🧠 Knowledge Map"
- Small drawer/panel showing a simplified knowledge graph for current course
- Clickable nodes navigate to related lessons
- Updates as conversation progresses

**Acceptance Criteria:**
- `grep -n 'mindmap.*panel\|Mindmap.*Panel\|knowledge.*map\|Knowledge.*Map' src/screens/Conversation.tsx | wc -l` ≥2

---

### 10. 🟢 MEDIUM: Add "Add Node Manually" to MindmapExplorer

**Problem:** Spec §5.2.5: "Add nodes manually or through conversation with Orchestrator." Need manual node addition UI.

**Fix:** Add an "Add Concept" button/form:
- "+" floating action button opens a small form
- Fields: concept name, parent node (dropdown), mastery level
- New node appears in graph connected to parent
- "Delete Node" context menu on right-click/long-press

**Acceptance Criteria:**
- `grep -n 'add.*node\|Add.*Node\|Add.*Concept\|add.*concept' src/screens/MindmapExplorer.tsx | wc -l` ≥2

---

### 11. 🟢 MEDIUM: Add Course Detail "One-Tap Enroll" Flow

**Problem:** Spec §5.2.7: "One-tap enroll; course imports into learner's workspace." Need to verify CourseDetail has clear enroll button and feedback.

**Fix:** Ensure `src/screens/marketplace/CourseDetail.tsx`:
- Prominent "Enroll Now" or "Start Learning" button (for free courses) / "Buy $X" button (for paid)
- On click: show success toast, add to Dashboard, navigate to first lesson
- If already enrolled: show "Continue Learning" button instead

**Acceptance Criteria:**
- `grep -n 'enroll\|Enroll\|Start.*Learn\|Continue.*Learn' src/screens/marketplace/CourseDetail.tsx | wc -l` ≥3

---

### 12. 🟢 LOW: Add ZIP Export to ProfileSettings

**Problem:** ProfileSettings has JSON and Markdown export but spec says "portable format." A ZIP bundle would be more complete.

**Fix:** Add "Export All Data (ZIP)" button that bundles JSON + Markdown + metadata into a ZIP (using JSZip or similar). Show download progress toast.

**Acceptance Criteria:**
- `grep -n 'zip\|ZIP\|JSZip\|jszip' src/screens/ProfileSettings.tsx | wc -l` ≥1

---

## ⚠️ BUILDER INSTRUCTIONS

**TASK 1 IS A SEARCH-AND-REPLACE.** Change `progress` to `percent` in `src/__tests__/components.test.tsx`. Do it FIRST. Run `npx tsc --noEmit` and paste REAL output. If it still fails, debug until it passes.

**TASK 2 (tests):** Run `npx vitest run` and paste the FINAL SUMMARY LINE showing test count and file count. Do NOT fabricate numbers. The planner for iteration 25 WILL run `npx vitest run` and compare. If the numbers don't match, you will be called out.

**General:** Do NOT claim tasks are "already done" without running the verification commands and pasting output. Every acceptance criteria has a concrete command — run it.

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
