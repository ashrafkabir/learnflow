# LearnFlow Improvement Queue — Iteration 47

**Iteration:** 47  
**Status:** IN PROGRESS  
**Date:** 2026-03-20

## Hotfixes shipped in Iteration 47

- ✅ Fix API rate limiter keying to prefer user-subject over IP (prevents unexpected 429s in NAT/shared IP situations).
- ✅ Add `Retry-After` + `retryAfterSeconds` to 429 responses.
- ✅ Client surfaces actionable 429 message.
- ✅ Add API regression test: burst create+delete does not 429.
- ⚠️ Lesson click crash: not reproduced in this pass; capture stack trace if still occurring.

---

# LearnFlow Improvement Queue — Iteration 46

**Iteration:** 46  
**Status:** READY FOR BUILDER  
**Date:** 2026-03-20

This queue is a **spec-vs-implementation gap list** (plus reliability fixes) prioritized by user impact + risk.

---

## P0 — Breakages / correctness (ship-stoppers)

1. **Fix PipelineDetail progress % bug (shows 0–10000%)**
   - Where: `apps/client/src/screens/PipelineDetail.tsx`
   - Current: `const progressPct = Math.round((state.progress ?? 0) * 100);` but API already stores `progress` as **0–100**.
   - Impact: Users see nonsensical progress values; breaks trust.
   - Fix: `Math.round(state.progress ?? 0)` and clamp to `[0, 100]`.

2. **Clamp all progress displays to never exceed 100%**
   - Client:
     - `CourseView.tsx` uses computed `pct` (should be clamped in case of duplicated completion events).
     - `PipelineView.tsx` uses `state.progress` directly.
   - Server:
     - `apps/api/src/routes/courses.ts` emits `completion_percent` (float) and client rounds.
   - Hypothesis for >100 bug: WS `progress.update` dispatches `COMPLETE_LESSON` every time, even if duplicate events fire; Set prevents duplicates in-memory, but UI may compute from mismatched lesson ids or repeated completes per course.
   - Deliverable: hard clamp + add regression tests.

3. **“Start reading” CTA should deep-link to first available lesson, not just /courses/:id**
   - Where: `apps/client/src/components/pipeline/SynthesisList.tsx` CTA navigates to `/courses/${courseId}`.
   - Expected UX: “Start reading” opens the first completed/generated lesson (or first syllabus lesson) for immediate reading.
   - Implement: choose first DONE lesson synthesis → `/courses/:id/lessons/:lessonId`; fallback: first lesson in course.
   - Add: handle missing `courseId` or empty lessons gracefully.

4. **Course deletion end-to-end (API + UI)**
   - Current: no `DELETE /api/v1/courses/:id` route; UI “Delete” in CreatorDashboard is a toast-only stub.
   - Implement API:
     - Delete course from `courses` map + persisted db (`dbCourses`) and delete associated progress/notes/annotations/illustrations where applicable.
     - Return 204 or 200.
   - Implement UI:
     - Add “Delete course” action in Dashboard/CourseView and CreatorDashboard.
     - Confirm dialog + optimistic UI + error toast.

5. **Marketing site link integrity audit + fix missing routes**
   - Found: footer includes `Changelog` linking to `/changelog` but no such route/screen.
   - Found: footer buttons under “Resources/Company/Connect” are inert (no `onClick` / `href`).
   - Deliverable: either implement routes (`/changelog`, `/privacy`, `/terms`, `/community`, etc.) or remove/disable links until available.

---

## P1 — Major spec gaps / misleading claims

6. **Marketing screenshots/real product imagery**
   - Spec §12.1/12.2: Features page should include screenshots/animations.
   - Current marketing pages are icon/gradient driven; no real screenshots in `apps/client/public/`.
   - Deliverable: add real screenshots (from `evals/screenshots/`) into marketing pages, with responsive placement and alt text.

7. **Reconcile marketing stack mismatch (spec wants Next.js web; implementation uses React-router marketing + a separate Next app)**
   - Current:
     - `apps/client` serves marketing pages via React Router.
     - `apps/web` exists as a Next.js app (port 3003) but is a separate marketing surface.
   - Decide one:
     - (A) Use `apps/web` as canonical marketing site and ensure it matches spec pages.
     - (B) Remove/disable `apps/web` and keep `apps/client` marketing routes, updating spec.

8. **Fix misleading metric claims on marketing home**
   - `Home.tsx` displays “50,000+ courses”, “12,000+ learners”, “4.9 rating”, “98% completion rate” without backing.
   - Deliverable: remove, label as “demo”, or source from real analytics.

9. **Auth flows verification & tightening**
   - API provides: register/login/refresh + mock Google callback.
   - Client: has dev auth bypass env var + onboarding guard.
   - Deliverable: verify register/login works end-to-end with token storage, refresh, and logout; ensure dev bypass is gated and not accidentally on in prod builds.

---

## P2 — Quality / maintenance

10. **Install `ripgrep` (rg) or update tooling docs**

- Current: `rg` not available on host; slows down audits.
- Deliverable: add dependency to dev image or ensure scripts don’t assume it.

11. **Fix learnflow-web startup log noise (`ENOWORKSPACES`)**

- `learnflow-web.service` logs `npm error ENOWORKSPACES` even though server becomes ready.
- Deliverable: identify source (npm invocation inside next dev?) and eliminate noise to improve debugging.

12. **Add automated checks for 3000/3001/3003 services and a single “health” dashboard**

- Ensure systemd user services are always the only listeners on these ports.
- Add a script that checks health endpoints + home pages and fails CI if broken.

---

## Notes / Evidence (Iteration 46)

- Ports verified:
  - API: `http://localhost:3000/health` → `{"status":"ok"}`
  - Client: `http://localhost:3001/` → 200
  - Web: `http://localhost:3003/` initially 500 due to missing `./522.js` (Next build artifact), fixed by restarting `learnflow-web.service`.
- “Start reading” CTA exists only as `▶ Start reading ...` in `SynthesisList.tsx`.
- No course delete route exists; only deletes for illustrations/annotations.
