# Iter139 Improvement Queue (Builder)

Status: **IN PROGRESS**

This file tracks Iter139 builder execution against the planner’s queue from `IMPROVEMENT_QUEUE.md` (Iter138) and the Iter139 directive:

- Close biggest remaining spec gaps: **quiz quality** + **adaptive gap-driven loop**.
- Minimum expected: complete top 2 P0 tasks:
  1. Replace placeholder ExamAgent distractors
  2. Implement quiz_gap recommendations in `/daily` + UI

## P0 Tasks

### P0.1 Replace placeholder ExamAgent distractors (non-garbage MCQ)

- [x] Implement plausible distractor generation in `packages/agents/src/exam-agent/exam-agent.ts`
- [x] Add unit tests to prevent regressions (no "incorrect option" placeholders)

### P0.2 Concept-level gap extraction + quiz_gap recommendations

- [x] Emit normalized gaps (concept tags) on quiz submit (client → `quiz.submitted.meta.gaps` prefers `gapTags`)
- [ ] Persist normalized gaps (concept tags) on quiz submit (server-side)
- [ ] Update `/api/v1/daily` to recommend a lesson with `reasonTag='quiz_gap'` when recent gaps exist
- [ ] Update client Dashboard to render quiz-gap reason clearly

## Evidence checklist

- [ ] `npm test` passes
- [ ] Playwright: `e2e/iter136-smoke-assertions.spec.ts`
- [ ] Playwright: `e2e/iter137-key-screens.spec.ts`
- [ ] Playwright: `e2e/iter138-adaptive-loop.spec.ts`
- [ ] Screenshots captured + synced to OneDrive: `/home/aifactory/onedrive-learnflow/iter139/`
