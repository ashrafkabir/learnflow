# Iter148 — IMPROVEMENT_QUEUE

Status: **DONE**

Date: 2026-03-30

Owner: Builder (Iter149)

Scope focus (per request): verify Improve/Dig Deeper multi-step workflow from user POV (new title applied, markdown only, embedded images render, real links), verify sticky sidebar + Ask-me overlay, identify next gaps vs `LearnFlow_Product_Spec.md`.

---

## What I verified (brutally honest)

### Tests

- `npm test` ✅ (turbo) — all packages passed.
- Playwright ✅
  - Iter136/137/138/146 suites passed.
  - Added Iter148 screenshot spec (below) and it passed.

### Evidence captured (Iter148)

Screenshots saved in **both** locations:

- Repo: `/home/aifactory/.openclaw/workspace/learnflow/learnflow/screenshots/iter148/run-001/`
- OneDrive: `/home/aifactory/onedrive-learnflow/iter148/screenshots/run-001/`

Files:

- `01-desktop-lesson-reader-top.png` — Lesson Drawer visible, Actions expanded, **Ask me button visible** (in right rail).
- `02-desktop-after-improve-applied.png` — “Improve” clicked; visible content changes, but **error toast** appears (details below).
- `03-desktop-actions-no-ask-me.png` — Actions section collapsed state; Ask me not visible in body (expected given current UI).

> Note: I attempted to capture “Ask-me overlay open” desktop/mobile, but in this run the Ask-me button was not reliably reachable from the top-level page controls (see Gap P0-2). The existing E2E test `e2e/iter146-lesson-reader-ask-me-overlay.spec.ts` does verify the overlay can open without navigation.

---

## User-POV findings vs requested workflow

### 1) Improve/Dig Deeper multi-step workflow

**Current status: partially working, but not trustworthy yet.**

- **New title applied:** visually a new subsection label appears, but a red toast says:
  - `Heading not found: Iter148 Test Subsection (occurrenceIndex=0)`
    This indicates the persistence/apply step is not robust against real lesson content structure (or the detection logic is mismatched).

- **Markdown only:** I did not observe raw JSON rendering in the UI (good).

- **Embedded images render:** not confirmed from the user surface. The “after improve” screenshot did **not** visibly show the expected embedded image. Either:
  - the image markdown is not being injected into the displayed subsection, or
  - the section being edited isn’t the one being rendered, or
  - markdown rendering/sanitization is stripping/ignoring images.

- **Real links:** not confirmed in the lesson body view. I did not see the expected external link rendered in the improved subsection.

**Net:** the “Improve” pipeline is passing tests at the request/contract level, but from a user’s point of view it is not yet reliable or visibly complete (images/links/title apply behavior is fragile).

### 2) Sidebar sticky behavior (Lesson Drawer)

- Desktop right rail exists and uses sticky positioning (`sticky top-24`).
- I cannot conclusively prove “sticky on scroll” from static screenshots, but layout appears consistent with sticky.
- UX issue: on desktop the actions are effectively **hidden inside a right-rail drawer**, which may conflict with spec expectations (see Gap P1-6).

### 3) Ask-me overlay

- Overlay exists in code and E2E tests pass.
- But discoverability is inconsistent: Ask-me is only available when the **Lesson Drawer → Actions** is expanded, and only when the drawer is visible (desktop). On mobile the right rail is hidden, so Ask-me may be unreachable depending on other UI (see Gap P0-2).

---

## Improvement queue (prioritized) — 10–15 tasks

### P0 — Must fix (correctness / user trust)

1. **Fix Improve/Dig Deeper apply targeting (“Heading not found” errors)**
   - Symptom: toast error `heading_not_found` after Improve.
   - Likely root: replace-subsection matching fails if subsection headings aren’t true markdown headings in the stored content OR if multiple identical headings exist.
   - Fix: ensure LessonReader edits operate on a stable identifier (server-generated subsection id) instead of brittle text match.

2. **Make Ask-me reachable on mobile (and without relying on the desktop right rail)**
   - Today: right rail is `hidden lg:block`; Actions are effectively desktop-only.
   - Spec §5.2.4 calls for a bottom action bar including “Ask Question”.
   - Add a mobile-friendly Actions entry point (bottom bar or FAB) that opens Ask-me overlay.

3. **Guarantee Improve/Dig Deeper visibly changes the content the user just acted on**
   - Current: toast + refetch can feel like “nothing happened”, and can change scroll/selection context.
   - Implement optimistic patching of the edited subsection in-memory (then refresh in background), and scroll-to/flash the edited subsection.

4. **Ensure improved markdown embeds (images + links) actually render in the lesson body**
   - Add a Playwright assertion that after Apply, the lesson DOM contains:
     - an `<img>` for the injected markdown image
     - an `<a href="https://developer.mozilla.org/">` (or other known external link)
   - If sanitization is stripping content, adjust markdown renderer allowlist.

5. **Selection-level vs heading-level behavior mismatch (“Dig Deeper” mental model)**
   - If selection-level Dig Deeper is “annotation/preview only” while heading Improve persists, users will be confused.
   - Decide a single mental model:
     - either both persist with an explicit Apply step, or
     - both show preview and require Apply.

### P1 — High value (spec alignment / workflow completeness)

6. **Reintroduce the spec’s lesson action surface (bottom action bar)**
   - Spec §5.2.4: “Bottom action bar: Mark Complete, Take Notes, Quiz Me, Ask Question”.
   - Today: actions live in a hidden desktop drawer; mobile may lose them.
   - Implement a bottom action bar (responsive) as primary discovery; keep drawer as secondary.

7. **Multi-step Improve UX: add an explicit preview modal with Before/After + Apply/Cancel**
   - Required for trust. Today it feels like a background mutation.
   - Include: new title, rendered markdown preview, list of images/links with attribution.

8. **Add Undo / revision history for applied edits**
   - Even a single-step undo would reduce fear.
   - Spec doesn’t demand it explicitly, but it’s critical for “editing lesson content” features.

9. **Sidebar sticky behavior: confirm with an automated scroll test**
   - Add Playwright: scroll main content and assert right rail stays within viewport (top position stable) and does not overlap bottom sticky nav.

10. **Improve the “Actions” state clarity**

- In screenshot `03-*`, Actions appears collapsed with no hint of Ask-me.
- Add small inline preview of available actions (chips) or a count (e.g., “Actions (3)”).

### P2 — Medium (polish, robustness)

11. **Better empty-state and error messaging for Improve/Dig Deeper**

- Replace generic toast with anchored inline message near edited heading.
- Include actionable “Try again / Report issue” copy.

12. **Hardening for external images**

- Responsive sizing, lazy load, broken-image fallback, avoid layout shifts.

13. **External link security + anti-fake-link validation**

- Server-side: block localhost/private IP ranges; enforce http(s).
- Client-side: external icon + `rel="noopener noreferrer"`.

14. **Keyboard accessibility for heading actions + drawer actions**

- Hover-only affordances are not accessible.
- Ensure Improve/Dig Deeper/Ask-me reachable via tab/focus.

15. **Spec-driven lesson completeness: restore Next Lesson link + Quick Check (even collapsed)**

- Spec §6.2 includes Next Lesson Link and Quick Check; code currently comments these out (Iter144).
- Implement as collapsed sections to satisfy spec and learning loop.

---

## Pointers (where to look)

- LessonReader UI: `apps/client/src/screens/LessonReader.tsx`
  - Right rail sticky: `data-testid="lesson-right-rail"`, `sticky top-24`.
  - Ask-me overlay: `data-testid="lesson-ask-overlay"`.
- E2E tests:
  - Ask-me: `e2e/iter146-lesson-reader-ask-me-overlay.spec.ts`
  - Improve apply contract: `e2e/iter146-lesson-reader-illustrate-heading.spec.ts`
  - Iter148 screenshots: `e2e/iter148-improve-askme-screenshots.spec.ts`

---

## Bottom line

The codebase is **test-green**, but the Improve/Dig Deeper experience is not yet “user-trustworthy” because apply targeting is brittle (heading_not_found), and the user-visible proof of images/links rendering is missing. Ask-me exists, but is not reliably discoverable/accessible on mobile due to being buried in a desktop-only rail.
