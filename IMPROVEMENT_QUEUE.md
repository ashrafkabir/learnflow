# LearnFlow Improvement Queue

**Iteration:** 44
**Status:** READY FOR BUILDER
**Owner:** Planner (Ash)
**Date:** 2026-03-19

This queue is a **brutally honest** gap list between **LearnFlow_Product_Spec.md** and the current implementation in `/learnflow` (API + Client + Web). It prioritizes tasks that unlock real end-to-end user value and spec compliance.

## P0 — Spec-critical / blocks real user value

1. **Make course generation truly “web-sourced + attributed” end-to-end (Spec §6, §6.3; Overrides #3/#4)**
   - **Reality today:** Marketing + UI claim “sourced from the real web,” but in practice citations are inconsistent and WS `sources` are **heuristic** (“Reference 1…”, hard-coded year) and not carried structurally.
   - **Where:** `apps/api/src/wsOrchestrator.ts` (`makeSourcesFromLesson()`), agents pipeline, course persistence.
   - **Do:** Introduce a canonical `LessonSources[]` structure produced by the pipeline, persisted in DB, returned via REST + WS, and rendered in UI. Enforce ≥3 sources/lesson with domain diversity + credibility rules.

2. **API key onboarding must actually save/validate keys (Spec §4.4, §5.2.1 step 4)**
   - **Reality today:** `OnboardingApiKeys` collects a password field and then **does nothing with it** (no provider selection, no API call, no validation feedback).
   - **Where:** `apps/client/src/screens/onboarding/ApiKeys.tsx`, API `/api/v1/keys`.
   - **Do:** Provider selector (OpenAI/Anthropic/Google), server-side validation, encrypt-at-rest, success/error states, “test key” action.

3. **Subscription UX must match spec or be clearly marked as stub (Spec §8)**
   - **Reality today:** Pro is blocked by “Pro Coming Soon” modal + email capture, yet spec requires real entitlements and billing flows.
   - **Where:** `apps/client/src/screens/onboarding/SubscriptionChoice.tsx`, `apps/api/src/routes/subscription.ts`.
   - **Do:** Implement at least a working mocked upgrade path + entitlement gating; remove misleading claims.

4. **Lesson format contract enforcement (Spec §6.2 “<10 min”, objectives, takeaways, action chips)**
   - **Reality today:** No hard validator in pipeline; UI can display lesson content but doesn’t guarantee structure/length/citations.
   - **Where:** agents lesson generator + course routes, `LessonReader.tsx`.
   - **Do:** Canonical lesson formatter + validator (word count, required sections, sources). Fail closed (regenerate) when non-compliant.

5. **Replace keyword intent routing with robust routing + topic extraction (Spec §10, §4.1)**
   - **Reality today:** `routeIntent()` is regex-based and will misroute nuanced intents; also passes full user sentence as “topic”.
   - **Where:** `packages/core/src/orchestrator/intent-router.ts`.
   - **Do:** Lightweight classifier (rules + extraction) that outputs `{intent, topic, constraints}`; optionally use a small LLM when BYOAI key exists.

6. **Mindmap must be concept/mastery-based (Spec §5.2.5, §9, §11.2)**
   - **Reality today:** Mindmap is present, but mastery coloring and concept-level progression are not genuinely implemented; WS `mindmap.update` sends “suggestions” that are not tied to mastery state.
   - **Where:** `apps/client/src/screens/MindmapExplorer.tsx`, `apps/api/src/websocket.ts` mindmap handler.
   - **Do:** Persist mastery per concept; render with colors; generate nodes from course/lesson concepts; update via real progress events.

## P1 — UX completeness / end-to-end learning flow quality

7. **First Course onboarding step must actually run a visible pipeline with real-time progress (Spec §5.2.1 step 6, §11.2)**
   - **Reality today:** Screen exists; pipeline events are not clearly validated as driving the UX in a slow/real scenario.
   - **Where:** `apps/client/src/screens/onboarding/FirstCourse.tsx`, WS events.
   - **Do:** Ensure WS progress events drive stage UI; handle retries, timeouts, and “resume pipeline”.

8. **Course View action bar + “Notes / Quiz Me / Go Deeper / Save” must be consistently present (Spec §5.2.4)**
   - **Reality today:** Some UI exists, but spec-required bottom action bar behavior needs enforcement and consistent placement.
   - **Where:** `CourseView.tsx`, `LessonReader.tsx`.
   - **Do:** Persistent bottom action bar, actions wired to WS/orchestrator tasks, keyboard shortcuts.

9. **Dashboard must implement explicit “Active courses carousel” + notification feed sources (Spec §5.2.2)**
   - **Reality today:** Dashboard is present; spec’s “carousel + updates + recommendations” is thin / mostly placeholder.
   - **Where:** `apps/client/src/screens/Dashboard.tsx`.
   - **Do:** Carousel component + data model; notifications from progress, agent updates, marketplace recommendations.

10. **Collaboration: real study groups + scheduling logic (Spec §5.2.6, §12/Collab sections if present)**

- **Reality today:** Collaboration screen exists but appears to be a lightweight stub.
- **Where:** `apps/client/src/screens/Collaboration.tsx`, API routes.
- **Do:** Matching/room creation, basic chat/agenda, opt-in persistence.

## P2 — Marketplace & creator workflow realism

11. **Marketplace course detail completeness (Spec §7, §5.2.7)**

- **Reality today:** Marketplace screens exist, but ensure: price, creator, ratings/reviews, enroll/import into workspace.
- **Where:** `apps/client/src/screens/marketplace/*`, `apps/api/src/routes/marketplace*.ts`.
- **Do:** Fill missing fields + implement enroll flow that creates a local course copy/entitlement.

12. **Creator dashboard: publish flow + versioning (Spec §7.3/Creator tools)**

- **Reality today:** CreatorDashboard exists; unclear if it supports publish/updates.
- **Do:** Publish/unpublish, versions, changelog, preview, basic analytics.

## P3 — Reliability, compliance, and dev ergonomics

13. **Systemd dev services: add health checks + deterministic boot for 3000/3001/3003**

- **Reality today:** Services exist and run, but no explicit health gating; port conflicts require manual intervention.
- **Where:** `~/.config/systemd/user/learnflow-*.service`.
- **Do:** Add `ExecStartPre` port check, health endpoint check, and clearer logs; document restart order.

14. **Replace misleading marketing metrics/claims with “demo-mode” disclaimers or real telemetry (Spec §2 positioning, trust)**

- **Reality today:** Marketing home page claims 50k courses/12k learners/SOC2 etc. These are not backed.
- **Where:** `apps/client/src/screens/marketing/Home.tsx`.
- **Do:** Remove/flag as placeholder; add real metrics pipeline later.

15. **Spec-to-implementation contract tests (Overrides #2/#4)**

- **Reality today:** Many unit tests exist; spec-level E2E contract tests are limited.
- **Do:** Add Playwright E2E suite that validates: onboarding, key save, course generation with citations, lesson structure, WS events, marketplace enroll.
