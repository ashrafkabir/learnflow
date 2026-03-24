# BUILD LOG — Iteration 73

Date: 2026-03-24
Builder: subagent learnflow-builder-73f

## Scope (from IMPROVEMENT_QUEUE.md)
P0–P2, in order.

---

## P0.1 — Add real domain profiles beyond quantum

### Plan
- Add new domain profile modules under `packages/agents/src/course-builder/domain-profiles/` for:
  - programming
  - math
  - policy_business
  - cooking
  - ai_prompting
- Ensure each profile expresses:
  - prerequisite-aware module ordering
  - non-generic module objectives
  - lesson title patterns that force specificity
- Update domain registry/classification to include them.
- Add regression test: 6 topics → diverse, domain-appropriate module titles.

### Work log
- Implemented 5 new domain profiles with non-generic module objectives + lesson title patterns.
- Wired domain-specific outlines into API route `/api/v1/courses` so topics in these domains don't fall back to generic outlines.
- Added regression test ensuring domain classifier + outline generation are diverse across 6 topics.
- Ran: `npm test`, `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .`.
- Screenshots: `screenshots/iter73/run-1`.
- Committed + pushed: `Iter73 P0: add domain profiles (programming/cooking/math/business/ai)`.

---

## Iter73 P0.2 — Topic fingerprinting + deterministic subtopics; enforce subtopic-shaped modules/lessons

### What changed (earlier P0.2 chunks)
- Enhanced `topicFingerprint()` to include:
  - `subdomain` (salient token extraction)
  - `intent` (hands_on/exam/interview/build_project/overview/troubleshooting)
  - `prerequisite` (beginner/intermediate/advanced)
- Updated outline generators (`make*Outline`) to ensure module titles are **topic-anchored** and avoid generic labels like “Core Concepts/Best Practices” without including topic keywords.
- Strengthened outline regression test to enforce that **at least one module title includes a meaningful topic token** (≥4 chars) for each non-quantum topic.

### What changed (this builder chunk)
- Added deterministic subtopic extraction helper: `packages/agents/src/course-builder/topic-subtopics.ts`.
  - Extracts 8–15 subtopics using unigram/bigram frequency from a source corpus, with lexical tie-breaks.
  - Falls back deterministically to topic-seeded + generic learning subtopics when sources are unavailable.
- Added `shapeOutlineWithSubtopics()` in `packages/agents/src/course-builder/subtopic-outline-shaper.ts` and integrated into `buildCourseOutline()`.
  - For **non-quantum** courses, enforces that **>=60%** of module titles include a subtopic phrase.
  - Also anchors the first lesson title/description in those modules to the same subtopic (keeps lesson text specific and not placeholder-y).
- Added regression tests to lock the behavior for 3 topics:
  - `packages/agents/src/__tests__/iter73-subtopic-shaping-regression.test.ts`

### Verification
- Ran: `npm test`, `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .`.
- Screenshots: `SCREENSHOT_DIR=screenshots/iter73/run-3 node screenshot-all.mjs`.

---

## Iter73 P0.3/0.4 — Hard lesson quality gates + retries (previously completed)
- Added placeholder detection (no 'Example (fill in)', TBD/TODO, Q1/A1, 'placeholder') and domain-specific Worked Example artifact requirements.
- Enforced HARD gates in course generation with up to 3 regeneration retries (skipped only in fastTestMode).
- On permanent failure: throw error so pipeline/course surfaces FAILED.
- Updated fastTestMode lesson markdown to satisfy quality gates deterministically.
- Added regression tests: `apps/api/src/__tests__/iter73-lesson-quality-gates.test.ts`.
- Screenshots: `screenshots/iter73/run-1` and `run-2`.
