# BUILD_LOG_ITER36

Iteration: 36
Date: 2026-03-19
Builder: learnflow-builder-36

## Goals (from IMPROVEMENT_QUEUE.md)

1. Fix Mobile Home Page “Blank Scroll Abyss” (P0)
2. Seed auth + onboarding in screenshot-mobile.mjs (P0)
3. Replace emoji icons across primary screens (P0)
4. Deliver spec-required Lesson Reading Experience (P0)
5. Notes Agent UX: Cornell + Flashcards + Zettelkasten (P0)
6. Quiz loop (P1)
7. Attribution & Sources (P1)
8. Agent transparency indicator (P1)
9. Marketplace realism (P1)
10. Creator dashboard publishing flow (P1)
11. Settings parity (P1)
12. Pro tier hooks (P2)

## Log

- Started Iteration 36.

### Task 1 — Fix Mobile Home Page “Blank Scroll Abyss” (P0)

- Reproduced issue via `screenshot-mobile.mjs` and Playwright: `mobile-320__home.png` was extremely tall (~14,394px), with a huge mid-page blank area.
- Root cause: Framer Motion `initial="hidden"` on multiple `motion.*` blocks caused sections to remain opacity:0/translated during screenshot capture (and potentially in some mobile conditions), leaving large whitespace.
- Fix: On marketing Home page, switched relevant Framer Motion blocks to `initial={false}` so content renders immediately and avoids the blank scroll abyss.
  - File: `apps/client/src/screens/marketing/Home.tsx`
  - Updated: Social proof section motion.section + multiple motion.div grids + CTA motion.section.
- Verified with Playwright full-page screenshot: whitespace abyss gone; sections render as expected.

### Task 2 — Screenshot automation: seed auth + onboarding in `screenshot-mobile.mjs` (P0)

- Updated `screenshot-mobile.mjs` to support authenticated screenshot runs.
  - Added env flag: `SCREENSHOT_AUTHED=1`
  - In authed mode, context init script sets localStorage:
    - `learnflow-token='dev'`
    - `learnflow-onboarding-complete='true'`
    - `onboarding-tour-complete='true'`
  - Output directories:
    - unauth: `evals/screenshots/iter36-mobile/`
    - authed: `evals/screenshots/iter36-mobile-authed/`
- Verified authed marketplace screenshot shows marketplace content (not `/login`).

### Test / Quality gates

- Ran: `npx tsc --noEmit` ✅
- Ran: `npx vitest run` ✅ (377 tests passed)
- Ran: `npx eslint .` ✅

### Notes / Next tasks

- Emoji/icon placeholders remain in multiple screens (e.g., Marketplace header, Onboarding, NotFound, LessonReader tool icons). Pending Task 3.
