# LearnFlow Improvement Queue

**Iteration:** 43
**Status:** READY FOR BUILDER
**Owner:** Planner (Ash)
**Date:** 2026-03-19

This queue is a brutally honest gap list between **LearnFlow_Product_Spec.md** and the current implementation.

## P0 — Core user value / spec-critical

1. **Replace template CourseBuilder with real content pipeline + sources (Spec §6, Override #3)**
   - **Problem:** `CourseBuilderAgent` currently decomposes topic and calls `generateSyllabus()` (template-ish) without Firecrawl-backed source acquisition/citations.
   - **Where:** `packages/agents/src/course-builder/course-builder-agent.ts`
   - **Fix:** Integrate `crawlSourcesForTopic()` (Firecrawl provider) into syllabus + lesson generation; store per-lesson sources; enforce ≥3 sources/lesson, domain diversity, credibility threshold.

2. **Fix Orchestrator intent routing mismatch + improve routing quality (Spec §4.1, §10)**
   - **Problem:** Keyword router mis-routes “Agentic AI” as generic ML modules (observed output), and routing is non-semantic.
   - **Where:** `packages/core/src/orchestrator/intent-router.ts`, `packages/agents/src/course-builder/*`
   - **Fix:** Replace regex routing with lightweight classifier (rules + topic extraction) and ensure `CourseBuilderAgent` receives clean `topic` (not full sentence).

3. **Implement lesson generation that meets Lesson Structure contract (Spec §6.2)**
   - **Problem:** Need structured lesson output: objectives, estimated time (<10), core content, key takeaways, sources, next steps, quick check.
   - **Where:** API lesson endpoints + agent content pipeline (`packages/agents/src/content-pipeline/*`, `apps/api/src/routes/courses.ts`)
   - **Fix:** Add a single canonical lesson formatter used everywhere; validate word counts and section presence.

4. **Inline citations + References section are only “best effort” today (Spec §6.3, Override #3)**
   - **Problem:** WS orchestrator extracts URLs heuristically from lesson content and fabricates titles/years.
   - **Where:** `apps/api/src/wsOrchestrator.ts` (`makeSourcesFromLesson()`)
   - **Fix:** Carry structured `sources[]` from pipeline → DB → API/WS; render in UI via Source Drawer with correct metadata.

5. **API Key Setup must actually validate/store provider keys (Spec §4.4, §5.2.1 step 4)**
   - **Problem:** `OnboardingApiKeys` collects a password field but doesn’t call API, validate provider, or save key.
   - **Where:** `apps/client/src/screens/onboarding/ApiKeys.tsx`, API `/api/v1/keys`
   - **Fix:** Add provider selector (OpenAI/Anthropic/Google), server-side validation, encryption-at-rest, and UI feedback.

6. **First Course Generation onboarding step should run pipeline with progress animation (Spec §5.2.1 step 6)**
   - **Problem:** Screen exists but pipeline quality + progress behavior needs to match spec (real-time progress, not just a static view).
   - **Where:** `apps/client/src/screens/onboarding/FirstCourse.tsx`, pipeline hooks
   - **Fix:** Ensure orchestration events (WS) drive progress UI; verify on slow network.

## P1 — UX completeness / consistency

7. **Unify route naming across app ("/course" vs "/courses") and deep links**
   - **Problem:** Tests reference `/course/c1` + `/courses/...` — likely inconsistent user-facing URLs.
   - **Where:** client router + links in screens; tests
   - **Fix:** Choose canonical route scheme, add redirects, update nav/CTA links.

8. **Dashboard: implement “Active Courses carousel” and richer notifications feed (Spec §5.2.2)**
   - **Problem:** Dashboard has scaffolding but needs explicit carousel + agent updates + marketplace recommendations.
   - **Where:** `apps/client/src/screens/Dashboard.tsx`
   - **Fix:** Add horizontal carousel component; notifications source + UI grouping.

9. **Course View bottom action bar + hover citation previews (Spec §5.2.4)**
   - **Problem:** Lesson reader exists, but action bar and citation hover-preview compliance needs verification.
   - **Where:** `CourseView.tsx`, `LessonReader.tsx`, citation components
   - **Fix:** Add persistent bottom action bar; ensure citations show preview (tooltip) + “See Sources” drawer.

10. **Mindmap Explorer should be concept-first and mastery-colored (Spec §5.2.5)**

- **Problem:** Mindmap currently graphs courses/modules/lessons (coarse) vs concept nodes + coverage gaps.
- **Where:** `MindmapExplorer.tsx`, Mindmap agent
- **Fix:** Generate concept graph from syllabus + lesson content; persist mastery state; show gaps.

## P2 — Marketplace + monetization realism

11. **Subscription: replace “Pro Coming Soon” modal with real upgrade flow (Spec §8)**

- **Problem:** `SubscriptionChoice` blocks Pro with email capture.
- **Where:** `apps/client/src/screens/onboarding/SubscriptionChoice.tsx`
- **Fix:** Integrate billing endpoints (even mocked) + entitlement gating in UI.

12. **Marketplace: ensure course detail includes creator, reviews, price + enroll import (Spec §5.2.7, §7)**

- **Problem:** Marketplace pages exist; need full detail and import behavior.
- **Where:** `apps/client/src/screens/marketplace/*`, API marketplace routes
- **Fix:** Add missing fields + enroll/import into user workspace.

## P3 — Reliability, dev experience, and evaluation

13. **Stabilize marketing web dev server (port 3003) and remove stale .next dependence**

- **Problem:** Observed intermittent 500s due to missing `./135.js` chunk until service restart.
- **Where:** `learnflow-web` systemd unit + Next dev
- **Fix:** Ensure clean build artifacts, ignore `.next` in git, and add healthcheck/restart policy.

14. **Add Playwright E2E “learning journey” tests that hit running stack (Spec overrides #2/#4)**

- **Problem:** Current screenshots exist, but no automated E2E suite executed as required by spec overrides.
- **Where:** new `e2e/*` + CI scripts
- **Fix:** Implement tests for onboarding, course generation quality, lesson depth, notes, quiz, research, mindmap.

15. **Persist Student Context Object fields and behavioral tracking (Spec §9)**

- **Problem:** `buildStudentContext()` returns many defaults; limited persistence.
- **Where:** `packages/core/src/context/*`, `apps/api/src/wsOrchestrator.ts`, db layer
- **Fix:** Store context updates (goals/interests/progress/time-on-lesson), expose via `/api/v1/profile/context`.
