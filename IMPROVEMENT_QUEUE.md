# Iter150 — Improvement Queue (Planner)

Status: IN PROGRESS (builder)

Scope: **spec-vs-implementation gaps after Iter149 (Improve/Undo proofs)**.

This queue is written to be **READY FOR BUILDER**: each item has a crisp outcome + acceptance criteria.

## P0 — Spec gaps / broken UX

### 1) Desktop Undo is missing (spec/intent mismatch vs Iter149 proof)

**Problem:** Undo is implemented only in the **mobile fixed bottom bar** (`LessonReader.tsx`), but the code comments claim Undo is rendered in **Actions + mobile bar**. On desktop, the Actions drawer (right rail) does **not** show Undo.

**Outcome:** Desktop users can undo the last subsection edit after Improve/Dig Deeper/Illustrate heading apply.

**Acceptance criteria:**

- After applying **Improve** (desktop), an **Undo** control appears somewhere discoverable (prefer: inside the **Actions** section of the right-rail drawer).
- Clicking Undo reverts the exact subsection (including heading rename) and clears the undo affordance.
- Undo button has `aria-label="Undo last edit"` (or equivalent) and respects loading/disabled states.
- Playwright: add/extend an E2E asserting Undo visible on desktop after Improve.

**Evidence:** `apps/client/src/screens/LessonReader.tsx` has Undo only inside `lg:hidden` block (~line 1726+). Right-rail Actions currently includes only Quiz/Ask/Compare.

---

### 2) Desktop Actions drawer is missing core lesson actions from spec

**Problem:** Product spec calls for post-lesson contextual actions and/or quick-action chips (e.g., **Take Notes, Quiz Me, Go Deeper, Next Lesson**; plus earlier iterations implemented Improve/Ask-me interactions). Desktop right-rail Actions currently shows only **Quiz me / Ask me / Compare**.

**Outcome:** Desktop Actions contains the same primary interaction set as mobile (and/or spec).

**Acceptance criteria:**

- In right-rail "Actions" section, include at minimum:
  - **Take Notes** (opens notes panel)
  - **Go Deeper / Dig Deeper** (either heading-level or selection-level)
  - **Improve** (for selected subsection) OR a clear instruction to select a subsection and then Improve.
  - **Undo** (when available)
- If no subsection is selected, show a short helper copy (e.g., “Select a section heading to enable Improve/Dig Deeper”).
- Touch nothing about mobile bar behavior besides keeping parity.

---

### 3) Lesson bottom action bar (spec) is not implemented as described

**Problem:** Spec §5.2.4 says bottom action bar includes **Mark Complete, Take Notes, Quiz Me, Ask Question**. Current mobile bar includes **Quiz, Notes, Ask me**, plus conditional Undo. Desktop has no bottom bar.

**Outcome:** Either (A) align to spec in MVP, or (B) explicitly document divergence.

**Acceptance criteria (choose one path):**

- **Implementation path:** Add **Mark Complete** and unify labeling (**Ask Question** vs **Ask me**) across devices.
- **Documentation path:** Add a "MVP divergence" note (in repo docs) stating current action set and why.

---

## P1 — Quality / test robustness

### 4) Fix iter136 smoke flakiness (timeout + brittle expectations)

**Problem:** Batch run (Iter136–149) showed `iter136-smoke-assertions` timing out at 120s. Rerunning that single spec with a higher timeout passed quickly, indicating race/timing sensitivity in the batch environment.

**Outcome:** Smoke test is stable in batch runs.

**Acceptance criteria:**

- `iter136-smoke-assertions.spec.ts` passes reliably in a batch run without per-run manual timeout tweaks.
- If course generation can legitimately exceed 120s on CI, increase the per-test timeout **with justification** and/or add intermediate assertions.
- Replace the final `expect(..."We are building your course")` with a more resilient condition if needed (e.g., tolerate navigation delays and check for either lesson content OR generating state).

---

### 5) Add explicit desktop Undo screenshot proof artifact

**Problem:** Iter150 request explicitly calls out "desktop Undo (currently missing)".

**Outcome:** Playwright produces a screenshot proving desktop Undo exists.

**Acceptance criteria:**

- New Playwright screenshot test (or extend iter149) captures:
  1. desktop after Improve applied, with Undo visible
  2. desktop after Undo clicked, with original content restored
- Saved into `learnflow/screenshots/playwright/...` and copied into `screenshots/iter150/run-001/...`.

---

## P1 — UX consistency

### 6) Unify “Ask me” vs “Ask Question” naming

**Problem:** Spec uses “Ask Question”; implementation uses “Ask me”.

**Outcome:** Consistent UX copy across app + spec.

**Acceptance criteria:**

- Choose a canonical label and apply in:
  - Mobile action bar
  - Desktop right-rail
  - Any tooltips/aria labels
  - Docs/spec notes (if not changing UI)

---

### 7) Improve/Dig Deeper Undo semantics: define “last edit” precisely

**Problem:** Undo currently stores only last subsection replacement snapshot (client-side) and posts `replace-subsection` on undo. It’s unclear what happens if the lesson refresh races the snapshot or multiple edits occur quickly.

**Outcome:** Predictable undo behavior.

**Acceptance criteria:**

- Document and enforce:
  - Undo is single-level (last edit only) OR multi-level stack.
  - Undo snapshot invalidates when navigating away, selecting different lesson, or performing new operation.
- Add at least one unit test for `patchLessonSubsectionMarkdownWithUndo` covering heading rename + content replacement.

---

## P2 — Spec gaps (content pipeline / transparency)

### 8) Agent transparency in lesson reader (spec principle)

**Problem:** Spec §5.3 requires showing which agent is working and why. Conversation screen shows active agent via WS events; LessonReader tool actions (Improve/Dig Deeper/etc.) do not visibly indicate "which agent" (beyond toasts/loading).

**Outcome:** Lightweight agent transparency for lesson tools.

**Acceptance criteria:**

- When Improve/Dig Deeper/Illustrate runs, show a small inline status (e.g., “Improve agent working…”) with spinner.
- No internal routing leakage beyond friendly labels.

---

### 9) Next Lesson link (spec) and “Next Steps / Quick Check” divergence

**Problem:** Spec §6.2 expects Next Lesson link, Next Steps, Quick Check. Current LessonReader explicitly does not render Next Steps/Quick Check (`{null}`) and Next Lesson link behavior is unclear.

**Outcome:** Either implement or clearly document MVP divergence.

**Acceptance criteria:**

- Implement Next Lesson link at end of lesson OR add a drawer/CTA for Next Lesson.
- Add a short MVP divergence doc note for Next Steps/Quick Check if intentionally out-of-scope.

---

### 10) Research provider constraint mismatch (spec vs code reality)

**Problem:** Spec §6.1.1 states **OpenAI web_search only** (no Tavily/Firecrawl) as MVP constraint, but repo contains tests and code referencing Firecrawl/Tavily providers.

**Outcome:** Align docs/spec to actual MVP behavior.

**Acceptance criteria:**

- Update spec to reflect current provider reality (or gate those providers behind explicit flags and keep OpenAI-only as default).
- Ensure no user-facing UI implies a provider is used when it is not configured.

---

## P2 — Accessibility & mobile ergonomics

### 11) Ensure action bar does not obscure content and is keyboard accessible

**Outcome:** Mobile fixed bottom bar does not cover lesson content and remains accessible.

**Acceptance criteria:**

- Add bottom padding/margin to main content so the last paragraph isn’t hidden under fixed bar.
- Buttons have adequate hit targets and correct aria-labels.
- On iOS Safari, bar doesn’t jitter with address bar collapse.

---

### 12) Add explicit “Select a section” affordance for subsection actions

**Problem:** Improve is invoked via each heading’s inline button; desktop drawer actions depend on `selectedSubsection`. Many users won’t discover the selection concept.

**Outcome:** Clear, discoverable subsection selection.

**Acceptance criteria:**

- When no subsection selected, show hint UI (desktop + mobile) pointing to section headings.
- When selected, highlight the selected section header.

---

## P3 — DevEx / tooling

### 13) Add `ripgrep` to dev dependencies or replace usage in scripts/docs

**Problem:** `rg` is not installed on the environment by default (planner session had `rg: command not found`).

**Outcome:** Consistent contributor tooling.

**Acceptance criteria:**

- Either add `ripgrep` to tooling docs (and CI image) or avoid assuming it exists.

---

### 14) Consolidate screenshot outputs for iterations

**Problem:** Screenshots are spread between `learnflow/screenshots/playwright/*` and `screenshots/iter*` copies.

**Outcome:** One canonical location + a predictable export/copy step.

**Acceptance criteria:**

- Document: where screenshots are generated, and how to export them to iteration folders.
- Add a small script (optional) to copy the latest run artifacts.

---

### 15) Add regression E2E for desktop Actions parity

**Outcome:** Prevents reintroducing desktop-missing-actions.

**Acceptance criteria:**

- New E2E asserts desktop right-rail Actions contains: Quiz, Ask, Notes, Improve (or selection tool), Undo (conditional).

---

## Notes from Iter150 Planner Run

- `npm test` passed (turbo; all packages green).
- Batch Playwright run for iter136/137/138/146/148/149: all passed except `iter136` timed out at 120s in batch; rerun of iter136 alone with higher timeout passed.
- Screenshots for Improve/Undo (desktop + mobile) were captured and copied to `screenshots/iter150/run-001/`.
