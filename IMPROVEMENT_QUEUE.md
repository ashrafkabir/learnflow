# Iter147 — IMPROVEMENT_QUEUE

Status: **DONE**

Date: 2026-03-30

Owner: Builder (next iteration)

## Why Iter147

Iter146 delivered heading-level **Improve / Dig Deeper** that can persist subsection updates + Ask-me overlay + structured preview parsing with embedded images/links.

Iter147 focus (per request): **reassess spec vs implementation** + validate LessonReader UX from a user POV:

- Improve actually changes subsection + heading title
- images render
- links are real
- selection remains stable

This queue is **brutally honest**: it prioritizes user-visible correctness and spec alignment over “nice-to-haves”.

---

## What I verified (baseline)

### Tests

- `npm test` (turbo) ✅
- Playwright (grep iter136/137/138/146) ✅ (13/13 passed)
  - `iter146-lesson-reader-illustrate-heading.spec.ts` (Improve → replace-subsection)
  - `iter146-lesson-reader-dig-deeper-heading.spec.ts`
  - `iter146-lesson-reader-dig-deeper-empty-body.spec.ts`
  - `iter146-lesson-reader-ask-me-overlay.spec.ts`

### Screenshots captured (for Iter147 handoff)

- **Before/After Improve applied** (desktop + mobile) captured via headless harness:
  - `learnflow/screenshots/iter147-improve/desktop/desktop-1280x800__before.png`
  - `learnflow/screenshots/iter147-improve/desktop/desktop-1280x800__after.png`
  - `learnflow/screenshots/iter147-improve/mobile/mobile-375x812__before.png`
  - `learnflow/screenshots/iter147-improve/mobile/mobile-375x812__after.png`

> Note: “After” is simulated DOM-apply (to show the visual delta in headless CI). E2E tests already verify the _real_ network call to `replace-subsection` includes `newHeading` + markdown with embedded image markdown.

---

## Top gaps vs Product Spec (highest impact)

These are the next 10–15 gaps that most materially diverge from **LearnFlow_Product_Spec.md** or create UX trust issues.

### P0 — Must fix (correctness / trust / UX breaks)

1. **Dig Deeper behavior is inconsistent across UX surfaces**
   - Heading-level Dig Deeper persists changes (replace-subsection).
   - Text-selection Dig Deeper attaches an annotation overlay (non-persistent) (`attachPreviewAsAnnotation()`), while Improve persists.
   - This is confusing and violates user mental model.
   - **Decision needed**: Dig Deeper should either (a) always persist, or (b) always be “preview/annotate” with an explicit “Apply” step.

2. **Selection stability after Apply** (Improve/Dig Deeper)
   - After `replace-subsection`, LessonReader calls `fetchLesson()`.
   - Risk: user loses selected subsection highlight, hover state, or scroll position; feels like nothing happened.
   - Implement **optimistic UI patch** (update in-memory lesson markdown + subsection index mapping) then refresh in background.

3. **Heading rename correctness and downstream indexing**
   - Server supports `newHeading` replacement for the markdown heading line.
   - Need to guarantee:
     - the visible heading row updates immediately
     - internal subsection lookup continues to work (no stale `heading` key)
     - re-running Improve on the same section still targets the right section after rename

4. **Image rendering hardening** (remote images)
   - Iter146 appends `![caption](url)` plus attribution blockquote.
   - Need:
     - max-width / responsive sizing in markdown renderer
     - lazy-loading and broken-image fallback (alt + “image failed to load” UI)
     - prevent layout shift (set max height or aspect box)
     - sanitize URLs (http/https only is done; also block data: and javascript:)

5. **Links must be “real” and safe**
   - Improve appends “Further resources” links.
   - Add lightweight server-side validation (URL parse + block localhost/private IPs) to uphold “no fake/unsafe links”.
   - Client: render external links with `rel="noopener noreferrer"` and optional external icon.

### P1 — High value (spec alignment / learning flow quality)

6. **Restore spec-required lesson sections that were intentionally hidden (Iter144)**
   Spec (§6.2) requires: Key Takeaways, Sources, Suggested Reads, Next Lesson Link, Next Steps, Quick Check.
   - Today: “Next Steps + Quick Check intentionally not rendered (Iter144)”.
   - Propose: reintroduce at least **Next Lesson** + **Quick Check** (even if collapsed) to meet the learning loop.

7. **Source drawer / attribution UX**
   Spec expects an expandable “Source drawer” with clickable citations.
   - Iter146 removed a Sources button from the drawer.
   - Recommend restoring a drawer section for sources/citations with:
     - credibility label + “why trusted” (already available in structured sources)
     - “Accessed at” timestamp (export already normalizes this)

8. **Improve/Dig Deeper should show a clear BEFORE/AFTER diff view**
   - Prevents “did it change?” anxiety.
   - Simple MVP: show a modal with old heading/content vs new heading/content + images/links list.

9. **Undo / revert for Apply actions**
   - Apply actions rewrite lesson content in DB.
   - Add a revision trail (even 1-level undo) to mitigate accidental damage.

10. **Toast-only confirmations are insufficient**

- Replace “Subsection improved.” toast with inline confirmation anchored near the edited section.
- Add “View change” / “Undo” buttons.

### P2 — Medium (polish / performance / readiness)

11. **Performance: avoid full lesson re-render and heavy parse on every small change**

- Apply should patch the relevant subsection instead of reparsing entire markdown synchronously.

12. **Markdown sanitizer / allowlist**

- Improve/Dig Deeper inject markdown with images and links.
- Ensure markdown renderer sanitizes HTML and blocks scriptable URLs.

13. **Mobile affordance for heading actions**

- Desktop relies on hover to reveal buttons.
- Mobile needs explicit tap affordance (kebab menu on heading row).

14. **Ask-me overlay memory + scoped context**

- Overlay currently passes `history: askMessages...` but uses stale state (race risk) and may not include the latest user message.
- Ensure last message is included and cap history length.

15. **Spec gap: “course-research artifacts persisted” and auditability**

- Spec §6.1 requires `course-artifacts/{courseId}/course-research.md` + structured JSON artifacts.
- Current MVP pipeline is functional but doesn’t visibly surface an audit trail.
- Add a “Research artifacts” debug panel per course (even if hidden behind admin/dev toggle).

---

## Suggested build order (tight loop)

1. Fix Dig Deeper consistency + explicit Apply/Annotate split (P0-1)
2. Add optimistic apply + selection stability + heading rename mapping (P0-2/3)
3. Harden images + links (P0-4/5)
4. Restore Next lesson + Quick check (P1-6)
5. Add undo + diff UI (P1-8/9)

---

## References / files

- Spec: `LearnFlow_Product_Spec.md` (§6.1–6.3, §5.2.4)
- Iter146 log: `BUILD_LOG_ITER146.md`
- LessonReader: `apps/client/src/screens/LessonReader.tsx`
- Apply endpoint: `apps/api/src/routes/courses.ts` (`POST .../content/replace-subsection`)
- Screenshot harness (Iter147): `scripts/iter147-improve-screenshots.mjs`
