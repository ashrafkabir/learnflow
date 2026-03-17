# LearnFlow Improvement Queue

## Current Iteration: 1

## Status: READY FOR BUILDER

## Planned By: Planner Agent

## Date: 2025-07-17

## Assessment of Current State

**What's good:**

- Solid monorepo structure with Turborepo, proper packages
- Design system tokens defined (colors, typography, spacing) matching spec §5.3
- Tailwind CSS integration with custom theme tokens in `index.css`
- Dashboard, Conversation, CourseView, LessonReader screens exist with clean Tailwind UI
- Course creation flow works end-to-end (Dashboard → API → CourseView → LessonReader)
- 257/257 tests passing
- Agent files exist for all core agents (course-builder, notes, exam, research, summarizer, mindmap, collaboration)
- Firecrawl provider file exists with credibility scoring logic

**What's bad / missing:**

- **Firecrawl is NOT actually called** — the firecrawl-provider.ts exists but is never imported or invoked in the course builder or API routes. Content is 100% deterministic/hardcoded.
- **Onboarding has 6 screens but missing Subscription Choice** — spec §5.2.1 requires 6 screens: Welcome, Goals, Topics, API Keys, Subscription Choice, First Course Generation. Current: Welcome, Goals, Topics, Experience, API Keys, Ready. "Experience" and "Ready" replace "Subscription Choice" and "First Course Generation".
- **Mindmap is a tree list, NOT a D3.js/vis.js graph** — spec §5.2.5 requires interactive graph with color-coded mastery nodes. Current is a collapsible tree of `<div>`s.
- **Conversation has NO markdown rendering** — uses naive regex for bold/code, no syntax highlighting, no LaTeX, no proper markdown parser.
- **No agent activity indicator showing WHICH agent is processing** — just generic bouncing dots.
- **No quick-action chips in conversation** after messages (spec §5.2.3).
- **No mindmap panel / source drawer** in conversation (spec §5.2.3).
- **No inline source citations with hover-preview** in CourseView/LessonReader (spec §5.2.4).
- **Notes generation is stub** — hardcoded Cornell template with generic questions, not actually using an LLM or notes agent.
- **Quiz generation is stub** — chat.ts generates canned quiz questions, not using exam agent.
- **Course content is deterministic** — syllabus-generator produces identical structure regardless of topic. No real differentiation.
- **No dark mode toggle** — dark mode CSS exists but no user-facing toggle.
- **No notifications feed** on dashboard (spec §5.2.2).
- **No "Today's Lessons" daily recommended path** on dashboard (spec §5.2.2).
- **No progress rings** on course carousel (spec §5.2.2).
- **Free vs Pro feature gating** is not implemented anywhere in the UI (spec §8).
- **Lesson content doesn't have all 7 required elements** (spec §6.2) — missing learning objectives, key takeaways, next steps as structured sections.
- **OnboardingReady uses inline styles** instead of Tailwind (inconsistent with redesign).

## Priority Tasks (Builder must do ALL of these)

### Task 1: Integrate Firecrawl into Course Builder Pipeline

- **Spec Section**: §6.1, §6.3, ITERATE.md Override #3
- **Problem**: `firecrawl-provider.ts` exists but is never called. Course content is 100% hardcoded deterministic text. No real web sources are fetched.
- **Fix**: Import FirecrawlProvider in `course-builder-agent.ts` and `apps/api/src/routes/courses.ts`. Before generating each lesson, call Firecrawl search for the topic, score sources, pass crawled content as context to LLM synthesis. Store attribution metadata. If FIRECRAWL_API_KEY is missing, fall back to mock but log a warning.
- **Acceptance Criteria**: When creating a course, Firecrawl API is called (or mock if no key). Lessons include real source URLs. References section appears at bottom of each lesson with ≥3 sources.
- **Files to modify**: `packages/agents/src/course-builder/course-builder-agent.ts`, `packages/agents/src/course-builder/syllabus-generator.ts`, `apps/api/src/routes/courses.ts`, `apps/api/src/routes/chat.ts`

### Task 2: Replace Mindmap Tree with D3.js/vis.js Interactive Graph

- **Spec Section**: §5.2.5
- **Problem**: MindmapExplorer renders a collapsible `<div>` tree. Spec requires full-screen interactive graph with D3.js or vis.js, color-coded mastery nodes, clickable navigation.
- **Fix**: Install `vis-network` (lighter than D3 for this use case). Replace tree rendering with a `vis.Network` graph. Nodes colored by mastery (gray=not started, yellow=in progress, green=mastered). Clicking a node navigates to the lesson.
- **Acceptance Criteria**: Mindmap renders as a force-directed graph. Nodes are colored by mastery. Clicking navigates to lesson. Screenshot shows graph, not tree.
- **Files to modify**: `apps/client/src/screens/MindmapExplorer.tsx`, `apps/client/package.json`

### Task 3: Add Proper Markdown Rendering to Conversation

- **Spec Section**: §5.2.3
- **Problem**: Conversation uses `dangerouslySetInnerHTML` with naive regex for bold/code. No syntax highlighting, no LaTeX, no proper markdown.
- **Fix**: Install `react-markdown`, `remark-math`, `rehype-katex`, `rehype-highlight`. Replace regex rendering with `<ReactMarkdown>` component with these plugins.
- **Acceptance Criteria**: Code blocks render with syntax highlighting. Math expressions render. Markdown tables/lists render properly.
- **Files to modify**: `apps/client/src/screens/Conversation.tsx`, `apps/client/src/screens/LessonReader.tsx`, `apps/client/package.json`

### Task 4: Add Agent Activity Indicator Showing Which Agent

- **Spec Section**: §5.2.3
- **Problem**: Loading state shows generic bouncing dots. Doesn't show which agent is working (e.g., "Course Builder is researching...", "Notes Agent is generating...").
- **Fix**: Update chat API to return `agentName` in streaming/response. Display agent name in the typing indicator: "🔍 Research Agent is working..." with agent-specific icons.
- **Acceptance Criteria**: When an agent-specific request is made (notes, quiz, research), the loading indicator shows the agent name.
- **Files to modify**: `apps/client/src/screens/Conversation.tsx`, `apps/api/src/routes/chat.ts`, `apps/client/src/context/AppContext.tsx`

### Task 5: Add Quick-Action Chips After Assistant Messages

- **Spec Section**: §5.2.3
- **Problem**: Quick-action chips only appear in empty state. After an assistant message about a course/lesson, contextual chips should appear (Take Notes, Quiz Me, Go Deeper, See Sources).
- **Fix**: After each assistant message, render contextual action chips based on the conversation context. If discussing a lesson: show "Take Notes", "Quiz Me". If discussing a topic: show "Create Course", "Go Deeper".
- **Acceptance Criteria**: After assistant replies, 2-4 contextual action chips appear below the message.
- **Files to modify**: `apps/client/src/screens/Conversation.tsx`

### Task 6: Fix Onboarding Flow to Match Spec (6 Screens)

- **Spec Section**: §5.2.1
- **Problem**: Onboarding has Welcome, Goals, Topics, Experience, API Keys, Ready. Spec requires Welcome, Goals, Topics, API Keys, Subscription Choice, First Course Generation. Missing subscription choice and first course generation with progress animation.
- **Fix**: Replace "Experience" with a Subscription Choice screen (Free vs Pro comparison). Replace "Ready" with a First Course Generation screen that shows real-time progress animation while creating the first course. Ensure state persists across steps.
- **Acceptance Criteria**: Onboarding has all 6 spec screens. Subscription choice shows Free vs Pro. Last screen generates a course with animation.
- **Files to modify**: `apps/client/src/screens/onboarding/Experience.tsx` → rename/rewrite to `SubscriptionChoice.tsx`, `apps/client/src/screens/onboarding/Ready.tsx` → rewrite to `FirstCourse.tsx`, router config

### Task 7: Add Inline Source Citations with Hover-Preview in LessonReader

- **Spec Section**: §5.2.4, §6.3
- **Problem**: LessonReader renders lesson content but has no inline citation markers [1][2] or hover-preview of sources. No expandable references section.
- **Fix**: Parse citation markers in lesson content. Render them as clickable superscript numbers. On hover, show a tooltip with source title, author, and URL. At bottom, render a full References section.
- **Acceptance Criteria**: Lesson content shows inline [1] markers. Hovering shows source preview. References section at bottom with clickable links.
- **Files to modify**: `apps/client/src/screens/LessonReader.tsx`, add `components/CitationTooltip.tsx`

### Task 8: Make Lesson Content Include All 7 Required Elements

- **Spec Section**: §6.2
- **Problem**: Generated lessons have title and content, but no structured Learning Objectives, Estimated Time badge, Key Takeaways, Sources section, or Next Steps as distinct UI sections.
- **Fix**: Update course generation to produce all 7 elements per lesson. Update LessonReader to render each as a distinct, styled section: objectives at top, time badge, content body, takeaways card, sources, next steps with links.
- **Acceptance Criteria**: Every lesson displays: title, time badge, 2-3 learning objectives, content, 3-5 takeaways, sources with links, 3 next step suggestions.
- **Files to modify**: `apps/api/src/routes/courses.ts`, `apps/client/src/screens/LessonReader.tsx`, `packages/shared/src/types/`

### Task 9: Add Today's Lessons and Progress Rings to Dashboard

- **Spec Section**: §5.2.2
- **Problem**: Dashboard has stats grid and course cards, but no "Today's Lessons" daily queue and no progress rings on course cards. No notifications feed.
- **Fix**: Add a "Today's Lessons" section showing 3 prioritized next lessons across courses. Add SVG progress rings on course cards showing completion %. Add a simple notifications feed section.
- **Acceptance Criteria**: Dashboard shows daily lesson queue, progress rings on course cards, and a notifications area.
- **Files to modify**: `apps/client/src/screens/Dashboard.tsx`, add `components/ProgressRing.tsx`

### Task 10: Upgrade Notes and Quiz from Stubs to Real Agent Calls

- **Spec Section**: §4.2 (Notes Agent, Exam Agent)
- **Problem**: "Take Notes" and "Quiz Me" in chat.ts return hardcoded templates. The actual NotesAgent and ExamAgent classes exist in `packages/agents/` but are never invoked.
- **Fix**: Wire up `chat.ts` to instantiate and call `NotesAgent.process()` and `ExamAgent.process()` with the lesson content as context. If no LLM key is available, use the agent's mock mode but ensure output is richer than current stubs.
- **Acceptance Criteria**: Notes agent produces context-specific Cornell notes with ≥5 cue questions derived from actual lesson content. Exam agent produces ≥8 questions with plausible distractors. Not generic templates.
- **Files to modify**: `apps/api/src/routes/chat.ts`, `packages/agents/src/exam-agent/exam-agent.ts`, `packages/agents/src/notes-agent/` (if exists, or notes logic in agents)

### Task 11: Add Dark Mode Toggle

- **Spec Section**: §5.3
- **Problem**: Dark mode CSS classes exist throughout, but there's no user-facing toggle to switch between light/dark mode.
- **Fix**: Add a dark mode toggle in ProfileSettings and in the Dashboard header. Use `localStorage` to persist preference. Apply `dark` class to `<html>` element.
- **Acceptance Criteria**: User can toggle dark mode. Preference persists across sessions. All screens render correctly in dark mode.
- **Files to modify**: `apps/client/src/screens/ProfileSettings.tsx`, `apps/client/src/screens/Dashboard.tsx`, `apps/client/src/context/AppContext.tsx`

### Task 12: Fix OnboardingReady Inline Styles → Tailwind

- **Spec Section**: §5.3 (Design consistency)
- **Problem**: `OnboardingReady` uses inline styles while all other screens use Tailwind CSS. Inconsistent with the redesign.
- **Fix**: Rewrite to use Tailwind classes matching the design system. Add gradient background, proper spacing, and animations consistent with Welcome screen.
- **Acceptance Criteria**: Ready/FirstCourse screen uses only Tailwind classes. Visual consistency with other onboarding screens.
- **Files to modify**: `apps/client/src/screens/onboarding/Ready.tsx`

### Task 13: Add Source Drawer to Conversation

- **Spec Section**: §5.2.3
- **Problem**: No source drawer in conversation. When the assistant cites sources, there's no expandable panel to see them.
- **Fix**: Add a slide-out drawer component that shows when sources are present in an assistant response. Display source title, URL, credibility score, and snippet.
- **Acceptance Criteria**: When assistant response contains sources, a "View Sources" button appears. Clicking it opens a drawer with source details.
- **Files to modify**: `apps/client/src/screens/Conversation.tsx`, add `components/SourceDrawer.tsx`

### Task 14: Implement Free vs Pro Feature Gating in UI

- **Spec Section**: §8 (Subscription tiers)
- **Problem**: No feature gating exists. All features are accessible regardless of subscription status. No Pro badges, no upgrade prompts.
- **Fix**: Add subscription state to AppContext (default: free). Gate Pro features (Update Agent, priority agent access, managed keys) with upgrade prompts. Show "Pro" badges on gated features. Add upgrade CTA in settings.
- **Acceptance Criteria**: Certain features show a "Pro" badge and prompt to upgrade when clicked by free users. Settings shows current tier.
- **Files to modify**: `apps/client/src/context/AppContext.tsx`, `apps/client/src/screens/ProfileSettings.tsx`, `apps/client/src/screens/Dashboard.tsx`

### Task 15: Set Up Playwright E2E Test Infrastructure

- **Spec Section**: ITERATE.md Override #2
- **Problem**: No Playwright tests exist. The iteration mandates real browser testing of all screens.
- **Fix**: Install `@playwright/test`. Create `playwright.config.ts` at monorepo root pointing to Chromium at `/home/aifactory/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome`. Create `e2e/learning-journey.spec.ts` with at least Tests 1-3 from ITERATE.md (onboarding, course generation, lesson content).
- **Acceptance Criteria**: `npx playwright test` runs and produces screenshots in `evals/screenshots/`. At least 3 test files covering onboarding, course generation, and lesson viewing.
- **Files to modify**: Create `playwright.config.ts`, `e2e/learning-journey.spec.ts`, `package.json` (add devDep)
