# Iter149 — IMPROVEMENT_QUEUE

Status: **DONE**

Date: 2026-03-30

Owner: Builder (Iter149)

Focus (per request): validate Improve/Dig Deeper now fully works (no `heading_not_found`, images+links render, undo works) on desktop+mobile; identify next 10–15 gaps vs `LearnFlow_Product_Spec.md` + user expectations.

---

## What I verified (brutally honest)

### 1) `npm test`

- ✅ `npm test` (turbo) passes across all packages.
  - Notes: Vite CJS deprecation warning appears in logs but does not fail.

### 2) Playwright regression suites (requested)

- ✅ Ran (chromium) and all passed:
  - `iter136-smoke-assertions.spec.ts`
  - `iter137-creator-publish-flow.spec.ts`
  - `iter137-key-screens.spec.ts`
  - `iter137-marketplace-enroll-import.spec.ts`
  - `iter137-todays-lessons-reasons.spec.ts`
  - `iter138-adaptive-loop.spec.ts`
  - `iter138-mastery-badges.spec.ts`
  - `iter138-mindmap-mastery-legend.spec.ts`
  - `iter146-lesson-reader-ask-me-overlay.spec.ts`
  - `iter146-lesson-reader-dig-deeper-empty-body.spec.ts`
  - `iter146-lesson-reader-dig-deeper-heading.spec.ts`
  - `iter146-lesson-reader-illustrate-heading.spec.ts`
  - `iter148-improve-askme-screenshots.spec.ts`

### 3) Improve/Dig Deeper “fully works” validation (desktop + mobile)

- **Improve / Dig Deeper (heading-level):** ✅ appears fixed from user POV _in the deterministic screenshot run_.
  - The Iter148 screenshot spec now consistently shows:
    - no `heading_not_found` toast
    - new title applied
    - markdown rendered
    - embedded image rendered
    - real external links rendered

- **Mobile:** ⚠️ **only partially proven**.
  - Iter148 covers **mobile Ask-me overlay only** (smoke).
  - There is **no existing mobile “Improve apply” screenshot spec** demonstrating that:
    - Improve/Dig Deeper apply works on mobile
    - embedded images render
    - links render

- **Undo:** ❌ not verified end-to-end with screenshots.
  - There is Undo UI in `LessonReader.tsx` (`aria-label="Undo last edit"`), but I could not get a stable Playwright screenshot spec to exercise Undo, mainly because:
    - Undo button only appears after `lastEditUndo` is set, which is only set on a successful apply path,
    - and my attempt to stub the apply endpoint without breaking UI state wasn’t stable within the timebox.

**Net:** Improve/Dig Deeper looks good on desktop and tests are green, but **Undo is not proven**, and **mobile Improve apply is not proven**.

---

## Evidence captured (Iter149 run-001)

Copied the latest “Improve applied” and “Ask-me overlay” proof into Iter149 folder.

Locations:

- Repo: `/home/aifactory/.openclaw/workspace/learnflow/learnflow/screenshots/iter149/run-001/`
- OneDrive: `/home/aifactory/onedrive-learnflow/iter149/screenshots/run-001/`

Files present:

- `01-desktop-lesson-reader-top.png`
- `06-desktop-improve-applied-proof.png` (copy of iter148 apply proof)
- `03-desktop-ask-me-overlay.png`
- `04-mobile-ask-me-overlay.png`

Note: there is **no Undo screenshot** in run-001.

---

## Spec / expectation gaps — next 10–15 highest impact

These are prioritized for Iter149 builder work.

### P0 — Must fix (correctness / trust)

1. **Ship an E2E proof for Undo (desktop + mobile)**

- Add Playwright that:
  - applies Improve/Dig Deeper
  - confirms content changed
  - clicks Undo
  - confirms content reverted
- This is the only way to claim “Undo works”. Right now it’s a code-path, not a product guarantee.

2. **Ship an E2E proof for mobile Improve apply**

- Add a mobile test that clicks Improve (heading-level) and asserts:
  - content changed in that subsection
  - `<img>` renders
  - `<a>` to an external URL renders
  - no `heading_not_found` toast

3. **Make Undo discoverable + safe**

- Undo currently lives in header actions area and appears conditionally.
- Improve UX:
  - show a transient banner after apply: “Edit applied. Undo”
  - keep Undo available for N minutes or until next edit.

4. **Hard stop on regressions: `heading_not_found` should be impossible silently**

- If apply targeting still relies on heading text + occurrence, add server-side debug payload with:
  - matched range info
  - available headings list
  - clear failure reason
- Also add Playwright assertion in Improve tests that no toast contains `heading not found`.

### P1 — High value (spec alignment)

5. **Bottom action bar (spec §5.2.4) is still missing / inconsistent**
   Spec expects: Mark Complete, Take Notes, Quiz Me, Ask Question.

- Today actions are mostly in right rail (desktop-only) + selection toolbar.
- Implement a responsive bottom action bar.

6. **Action discoverability on mobile**

- Ask-me should never be “desktop-only”. Provide a mobile primary affordance.

7. **Selection tools UX mismatch vs heading tools**

- Selection toolbar currently supports Dig Deeper/Mark/Discover etc, but heading-level has Improve/Dig Deeper that _persist edits_.
- Users will expect selection-level Dig Deeper to behave similarly. Decide and unify mental model:
  - either “Preview + Apply” everywhere, or
  - “Instant apply” everywhere.

8. **Preview-before-apply for destructive edits**

- Spec doesn’t explicitly demand it, but user expectations do.
- Provide a before/after diff + explicit Apply/Cancel for Improve/Dig Deeper.

### P2 — Medium (polish, robustness)

9. **Keyboard accessibility for heading hover actions**

- Improve/Dig Deeper buttons are hover-revealed (`opacity-0 group-hover`).
- Add focus-visible behavior and ensure tab order works.

10. **External images: layout shift + failure handling**

- Add max-width sizing, lazy-loading, skeleton/fallback, and broken image display.

11. **External links: security + UX**

- Ensure `rel="noopener noreferrer"` and `target="_blank"`.
- Show external-link icon.

12. **Sticky rail behavior should be tested**

- Add Playwright scroll assertion that right rail remains visible and doesn’t overlap bottom content.

13. **Lesson completeness vs spec §6.2**

- Re-add (even collapsed): Next Lesson link, Quick Check section, Suggested Reads.

14. **Agent transparency**

- Spec expects subtle “which agent is working” indicator.
- Ensure the UI shows this consistently during Improve/Dig Deeper + Ask-me.

15. **Telemetry/analytics transparency (spec §9.3)**

- Add Profile → Data view for “everything tracked about me” (even stubbed) to align with spec promise.

---

## Builder notes / pointers

- LessonReader main implementation: `apps/client/src/screens/LessonReader.tsx`
  - Heading-level Improve/Dig Deeper buttons are rendered within subsection header blocks.
  - Undo UI exists and is gated by `lastEditUndo`.
- Existing E2E proof that Improve apply works on desktop: `e2e/iter148-improve-askme-screenshots.spec.ts`.
- Existing E2E proof that Ask-me overlay opens: `e2e/iter146-lesson-reader-ask-me-overlay.spec.ts`.

---

## Bottom line

- ✅ Tests are green.
- ✅ Desktop Improve/Dig Deeper apply appears fixed and renders images + links (per screenshot proof).
- ⚠️ Mobile Improve apply is not proven.
- ❌ Undo is not proven with screenshots/tests.

Iter149 should prioritize closing those proof gaps first, then align action surfaces with the spec (bottom action bar, mobile discoverability).
