# BUILD_LOG — Iteration 46

**Date:** 2026-03-20  
**Planner:** subagent learnflow-planner-46  
**Status:** COMPLETE (planner outputs ready for builder)

## 1) Spec reviewed

- Read: `learnflow/LearnFlow_Product_Spec.md` (sections 1–17)
- Focused checks per request:
  - Start Reading error path
  - Course deletion support
  - Progress > 100% bug
  - Auth flows (register/login/dev/google)
  - Marketing link integrity
  - Screenshot placement (real vs placeholders)
  - Stable ports 3000/3001/3003

## 2) Service/port verification

- Expected dev ports (per `learnflow/DEV_PORTS.md`):
  - API: **3000**
  - Client: **3001**
  - Web (Next): **3003**

- Observed:
  - `GET http://localhost:3000/health` → `{ "status": "ok" }`
  - `GET http://localhost:3001/` → 200
  - `GET http://localhost:3003/` → initially failing due to Next chunk fetch errors; fixed by:
    - `systemctl --user restart learnflow-web`
    - After restart: `GET /` → 200

- Note: `learnflow-web.service` logs show `npm error ENOWORKSPACES` (noise) even though Next reports Ready.

## 3) Start Reading investigation

- UI string located:
  - `apps/client/src/components/pipeline/SynthesisList.tsx`
  - CTA navigates to `/courses/${courseId}` (not a lesson deep link).
- No direct “Start Reading” text found elsewhere.
- Likely user-reported error is either:
  - navigation to course view with missing/invalid `courseId` during synthesis
  - course view reading action expecting first lesson but none exists
- Recommended fix: “Start reading” should link to first available lesson: `/courses/:id/lessons/:lessonId`.

## 4) Progress > 100% / progress correctness audit

- Confirmed a concrete progress bug:
  - `apps/client/src/screens/PipelineDetail.tsx` computes `progressPct = Math.round((state.progress ?? 0) * 100)`.
  - But pipeline progress in API is already **0–100** (see `apps/api/src/routes/pipeline.ts`).
  - Result: UI can show values up to **10000%**.
- Course progress in `CourseView.tsx` is computed from completed lessons / total lessons (should be clamped defensively).
- Server emits WS event `progress.update` with `completion_percent` float in `apps/api/src/routes/courses.ts`.

## 5) Course deletion support

- API: no `DELETE /api/v1/courses/:id` endpoint.
  - Only delete endpoints present are for lesson illustrations and annotations.
- Client: `CreatorDashboard.tsx` includes a “Delete” button for draft courses that only shows a toast (no API call).

## 6) Auth flows audit

- API auth router exists: `apps/api/src/auth.ts`
  - `/api/v1/auth/register`, `/login`, `/refresh`, `/google/callback` (mock)
- Client guard exists: `OnboardingGuard` in `apps/client/src/App.tsx`
  - redirects unauthenticated users away from app routes
  - supports env-gated dev bypass: `VITE_DEV_AUTH_BYPASS=1` or `DEV_AUTH_BYPASS=1`
- Token refresh helper exists in `AppContext.tsx`.

## 7) Marketing site link integrity + screenshots

- Marketing pages exist in `apps/client` (React Router): `/features`, `/pricing`, `/download`, `/blog`, `/about`, `/docs`.
- Footer in `MarketingLayout.tsx` links to `/${t.toLowerCase()}` including **/changelog** (route missing → 404).
- Several footer “Resources/Company/Connect” buttons are inert (no navigation).
- No real screenshots found in `apps/client/public/` (only robots/sitemap/sw).
  - Spec §12 expects screenshots/animations; current marketing uses icons/gradients.

## 8) Screenshot capture (Playwright)

Generated fresh screenshots for every screen requested:

- Desktop: `evals/screenshots/iter46-desktop/`
  - home, onboarding-\* (welcome/goals/topics/experience), dashboard, conversation, mindmap, settings, marketplace-courses, marketplace-agents
- Mobile: `evals/screenshots/iter46-mobile/`
  - mobile-320, mobile-375, mobile-414 variants covering all listed screens
- Web: `evals/screenshots/iter46-web/`
  - web-home, web-about, web-marketplace, web-docs, web-features, web-pricing, web-download, web-blog

## 9) Outputs created

- Updated/created:
  - `learnflow/IMPROVEMENT_QUEUE.md` (Iteration 46, READY FOR BUILDER)
  - `learnflow/BUILD_LOG_ITER46.md`

## 10) Remaining work for main agent / builder

- Copy outputs + screenshot folders to OneDrive path:
  - `/home/aifactory/onedrive-learnflow/iteration-46/` (copy-only)
- Commit planner outputs (queue + log) to git.
