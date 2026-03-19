# LearnFlow Improvement Queue — Iteration 42

Iteration: 42
Status: READY FOR BUILDER

This queue is **brutally honest** against `LearnFlow_Product_Spec.md` vs current implementation.

## P0 — Must-fix (spec/UX correctness)

1. **Onboarding “Connect Your AI Provider” does not actually connect anything**
   - Spec: BYOAI keys; key is encrypted, validated, stored; used for generation.
   - Current: `apps/client/src/screens/onboarding/ApiKeys.tsx` collects `key` but never calls API (`POST /api/v1/keys`).
   - Fix: add provider selector + validate (`/keys/validate`) + save (`/keys`) + show success state + error states.

2. **Client does not subscribe to mindmap suggestions from MindmapExplorer**
   - Current: WS mindmap.subscribe is triggered only by `Conversation.tsx` (on connect).
   - Spec: mindmap should update based on course/lesson context. MindmapExplorer is a primary view.
   - Fix: in `MindmapExplorer.tsx`, open WS and send `mindmap.subscribe` when screen mounts / active course changes.

3. **Course creation pipeline mismatch: Spec calls Orchestrator+agents; API uses template + OpenAI-only**
   - Current: `apps/api/src/routes/courses.ts` uses `TOPIC_CONTENT` templates and `generateLessonContentWithLLM()` with OpenAI only.
   - Spec: multi-agent orchestration and BYO provider.
   - Fix: unify around a single “course build pipeline” that calls core orchestrator/agents; support multiple providers using stored keys.

4. **Re-engagement (>3 days inactive) not implemented**
   - Spec §10: “If the student hasn't been active for >3 days, send a gentle re-engagement message (Pro: proactive notification)”.
   - Current: no scheduler / background job scanning last activity.
   - Fix: add daily job (simple interval on API for now) using dbProgress last activity; create notification + optionally WS push for Pro.

5. **Pro feature flags exist but are not enforced end-to-end**
   - Current: subscription API returns `features`, but UI and server behaviors are not consistently gated (ex: managed keys “Pro-only” but `/keys` route does not check tier).
   - Fix: add tier checks in API routes; add UI gating and upgrade CTA.

## P1 — High impact (learning quality & credibility)

6. **Analytics endpoint is mostly synthetic**
   - Current: `apps/api/src/routes/analytics.ts` uses `dbProgress.getUserStats()` but weeklyProgress is derived by splitting total minutes into fixed ratios.
   - Spec expectation: credible analytics.
   - Fix: store daily aggregates and return real last-7-days minutes; add topTopics + quizAverage.

7. **Sources: course lesson content has Sources section but client needs first-class UI + attribution**
   - Current: server parses sources best-effort (`parseLessonSources`); client has `SourceDrawer`.
   - Gap: ensure every generated lesson includes a structured sources block; enforce at generation time.
   - Fix: generation prompt/formatter: always emit `Sources:` list with URL/title; validate and re-ask if missing.

8. **Provider abstraction: OpenAI hard-coded in API**
   - Current: `getOpenAI()` only; ignores Anthropic/Google keys.
   - Fix: implement provider adapters and select active key per user; update `/keys` UI to manage multiple keys.

9. **UpdateAgent exists but unused; no proactive “new developments” workflow**
   - Spec §10/agents: update_agent (Pro) should run on schedule.
   - Fix: wire UpdateAgent into API; create `dbSubscriptions` topic list; schedule daily check; push notifications.

## P2 — UX polish & completeness

10. **Mindmap suggested nodes acceptance should attach under correct parent**

- Current: API emits suggestions with `parentLessonId` set to current lesson id; MindmapExplorer attaches by lesson mapping when present.
- Fix: ensure server sends correct parentLessonId when suggestions were derived from a lesson; include reason text separately (not in `title` field).

11. **“Create course” free limit is enforced only in UI**

- Current: dashboard limits to 3 courses client-side.
- Fix: enforce server-side in POST /courses using user tier + count in db.

12. **Settings should expose API key management for Pro**

- Current: Settings screen exists; ensure it shows stored keys from `/keys` with add/remove/activate; show usageCount.

13. **Web marketing site parity (web app vs client) needs a single source of truth**

- Current: `apps/web` static pages; `apps/client` app routes.
- Fix: ensure CTAs/links are consistent (download/app) and that pricing reflects subscription API.

14. **Error handling: WS ‘error’ event exists but UX is weak**

- Fix: show inline banners when WS disconnected; degrade gracefully (no mindmap suggestions).

15. **Testing/Evals: add Iter42 spec compliance checks for keys + subscription gates**

- Add Playwright tests: onboarding key save, `/keys` list, Pro gating, and mindmap subscribe from MindmapExplorer.
