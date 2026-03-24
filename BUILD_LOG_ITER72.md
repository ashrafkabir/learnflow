# LearnFlow — Build Log (Iteration 72)

## Chunk: Iter72 regression tests — outline diversity across domains

Goal: strengthen regression coverage so course outlines don't collapse into a single generic template across unrelated domains.

### Changes

- Added cross-domain outline diversity regression test:
  - `apps/api/src/__tests__/iter72-outline-diversity.test.ts`
  - Creates 3 courses (quantum computing, italian cooking basics, rust programming fundamentals)
  - Asserts:
    - each outline contains domain-specific module tokens (e.g., qubit/qiskit/shor vs pasta/sauce vs cargo/ownership)
    - pairwise Jaccard similarity of normalized module-title sets stays below a conservative threshold (0.55)
    - at least one pair is strongly dissimilar (<0.35) to catch accidental global templates

- Kept existing strict quantum order regression (already present):
  - `apps/api/src/__tests__/iter72-outline-regression.test.ts`

### Verification (mandatory)

- ✅ `npm test`
- ✅ `npx tsc --noEmit`
- ✅ `npx eslint .`
- ✅ `npx prettier --check .`
- ✅ Screenshots: `SCREENSHOT_DIR=screenshots/iter72/run-2 node screenshot-all.mjs`

### Artifacts

- Screenshots: `screenshots/iter72/run-2/`

---

