# IMPROVEMENT_QUEUE

Iteration: 36
Status: DONE ✅
Date: 2026-03-19
Theme: **Brutal spec gap closure (core learning loop + marketplace realism) + mobile home fix**

## Brutal Assessment (evidence-driven)

Iteration 35 shipped real improvements (icon system, tap-target fix, mobile screenshot script). But compared to the **Product Spec v1.0**, LearnFlow is still far from “agentic learning OS” and reads like a responsive demo with placeholders.

**Evidence (local runs + screenshots):**

- Iter 35 deliverables landed:
  - New calm line icons exist in `apps/client/src/components/icons/` ✅
  - `screenshot-mobile.mjs` exists and runs ✅
  - Mobile button shrink override removed (grep for `h-6 w-6 p-0` found none) ✅
- Mobile screenshots were regenerated (320/375/414) under:
  - `evals/screenshots/iter35-mobile/` ✅
  - Additional authed mobile set created for Iter 36 validation: `evals/screenshots/iter36-mobile-authed/` ✅
- **Major mobile UX bug remains:** `mobile-320__home.png` shows **massive empty whitespace** (page becomes extremely tall with long blank sections). This is a high-severity “looks broken” issue.
- The mobile screenshot script captures routes unauthenticated, so **marketplace routes redirect to /login** unless we seed `learnflow-token` and `learnflow-onboarding-complete`. That’s expected from `OnboardingGuard`, but it means current script output can be misleading without auth seeding.
- Many screens still contain emoji/icon placeholders across the app (43 TSX files contain emoji-like chars; e.g. Marketplace headers show `🏪`, `🤖`). This conflicts with the “cohesive icon system” goal.

## What matters vs spec (big gaps)

The spec’s differentiators are **multi-agent orchestration, attribution, mastery loop (notes/quizzes/progress), and a credible marketplace + creator economy**.

Right now:

- Multi-agent orchestration is mostly implied, not delivered as a coherent in-product experience.
- Citations/attribution and source drawer are not consistently present.
- Lesson loop (≤10 min, objectives/takeaways, action bar, quizzes, notes formats) is incomplete/inconsistent.
- Marketplace feels like a static catalog; creator publishing/moderation/reviews/earnings are thin.

---

## Prioritized Task Queue (12) — biggest spec gaps first

### 1) Fix Mobile Home Page “Blank Scroll Abyss” (P0)

**Status:** DONE ✅

**Fix summary:** Framer Motion `initial="hidden"` caused key marketing sections to remain opacity:0 during full-page screenshot capture, producing huge blank whitespace. Switched relevant blocks in `apps/client/src/screens/marketing/Home.tsx` to `initial={false}` so content renders immediately.

**Acceptance:** On 320/375/414: meaningful content appears within first ~2 scrolls; no enormous empty whitespace.

### 2) Make screenshot automation reflect reality: seed auth + onboarding in `screenshot-mobile.mjs` (P0)

**Status:** DONE ✅

**Fix summary:** Added `SCREENSHOT_AUTHED=1` mode that seeds localStorage tokens + onboarding completion, and writes screenshots to `evals/screenshots/iter36-mobile-authed/`. Default unauth run writes to `evals/screenshots/iter36-mobile/`.

**Acceptance:** Running `SCREENSHOT_AUTHED=1 node screenshot-mobile.mjs` produces mobile screenshots where marketplace/dashboard/etc show correct pages, not `/login`.

### 3) Replace remaining emoji icons across _all_ primary screens with the new icon set (P0)

**Status:** DONE ✅

**Fix summary:** Removed all emoji/icon placeholders across primary client screens + marketing/docs/blog copy and replaced with the shared line-icon set in `apps/client/src/components/icons/`. Verified no emoji remain in `apps/client/src/**` TS/TSX sources.

### 4) Deliver the spec-required Lesson Reading Experience (P0)

**Status:** READY

### 5) Notes Agent UX: Cornell + Flashcards + Zettelkasten outputs (P0)

**Status:** READY

### 6) Exam/Quiz loop: adaptive quizzes + scoring + gap identification (P1)

**Status:** READY

### 7) Attribution & Sources: make citations real and visible everywhere (P1)

**Status:** READY

### 8) “Agent transparency” experience: activity indicator + which-agent/why (P1)

**Status:** READY

### 9) Marketplace realism: reviews, creator profile, and course detail completeness (P1)

**Status:** READY

### 10) Creator dashboard: publishing flow + analytics + earnings (P1)

**Status:** READY

### 11) Profile & Settings parity: API key vault + usage stats + export (P1)

**Status:** READY

### 12) Pro tier hooks: proactive updates + subscription management UX (P2)

**Status:** READY

---

## Notes for Builder

- **Do not** treat “auth bypass” as a product feature. It should remain dev/eval-only.
- Mobile automation should support both unauthenticated (marketing + auth + onboarding) and authenticated coverage.
- Prioritize **core learning loop** before expanding secondary screens.
