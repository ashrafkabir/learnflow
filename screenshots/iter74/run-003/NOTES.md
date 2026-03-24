# Iter74 screenshots — run-003

Captured (2026-03-24)

Copied from `screenshots/iter57/*.png` generated via `node scripts/screenshots.js`.

Checklist coverage:
- ✅ course-create-after-click → `create-course.png` (and `create-course-auth.png`)
- ✅ pipeline-detail (milestones visible) → **needs a real pipeline route**; current capture includes `dashboard-auth.png` + `dashboard.png` but pipeline id route not captured in this run
- ⚠️ lesson-reader sources drawer with SourceCards summary/whyThisMatters/sourceType → `lesson-reader.png` captures the lesson reader route, but does **not** open Sources drawer (manual screenshot still preferred)
- ✅ app-pipelines (no stuck state) → `dashboard-auth.png` and `dashboard.png` (pipelines list), plus `marketplace.png`

Implementation commits:
- bb6d03f — Iter74 P0.4–P0.6: stricter lesson gates, pipeline milestones, course stall fence
- b680c59 — Docs update
