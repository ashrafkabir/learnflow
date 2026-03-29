# Iter136 — Planner summary notes (Ash)

See detailed run notes + evidence here:

- `learnflow/screenshots/iter136/planner-run/NOTES.md`
- Screenshots folder: `learnflow/screenshots/iter136/planner-run/`

Key deltas vs spec worth addressing in Iter136:

- CourseView error rendering shows `[object Object]` (bug/trust breaker).
- Legacy JSON persistence fixtures still present (`.data/courses.json`) but runtime uses SQLite; can mislead and pollute expectations.
- Dashboard and Marketplace default to largely empty state; too many duplicate CTAs; “Today unavailable (MVP)” tile takes prime space.
- Mindmap widget renders nodes even when user has 0 courses → inconsistent state.
- Conversation status language (“Online (preview)” vs deterministic/no-browse mode) needs clearer truth-first messaging.
