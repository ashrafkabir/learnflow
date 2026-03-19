# BUILD_LOG_ITER37

Date: 2026-03-19
Builder: learnflow-builder-37

## Context

- Iter 37 queue file pointed to Iteration 38 tasks in `IMPROVEMENT_QUEUE.md`.
- Completed the top-priority activation + action chips behavior fix (marketplace activation affects runtime behavior) and regression guardrails for references parsing.

## Work log

### 2026-03-19

- Added `/api/v1/marketplace/agents/activated` endpoint (returns activated agent IDs for current user).
- Client marketplace now loads activated agent IDs from API on mount.
- Orchestrator student context now includes `preferredAgents` from activated marketplace list.
- Intent router now receives `preferredAgents` and prefers activated marketplace agents for relevant task types (simple MVP mapping).
- WS chat now:
  - sends {courseId, lessonId} with messages
  - consumes server-provided actions in `response.end` and renders them as quick-action chips
- Added token usage persistence for WS orchestrator path (records aggregate token usage per routed agent).
- GET /api/v1/keys now returns `usageCount` (best-effort token usage sum) + `lastUsed` placeholder.
- Tightened sources parsing guard: never bleed references into an Examples section; supports Further Reading.

## QA

- `npx vitest run` ✅
- `npx tsc --noEmit` ✅
- `npx eslint .` ✅

## Screenshots

- Refreshed web + app + mobile screenshot sets via scripts.
