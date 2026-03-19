# IMPROVEMENT_QUEUE

Iteration: 38
Status: DONE
Date: 2026-03-19
Theme: Course content quality (hero/illustrations/key points) + real attributed references + mindmap focus/expansion + “Add topic” pipeline

## User-requested Problems (must fix)

1. Course content **references became examples**; references must be **real attributed links**.
2. Lesson/course content looks **bland**: no hero, illustrations, key points.
3. Mindmaps (course + lesson) should **focus on the area in question**, and **expand with new nodes** as topics develop.
   - New nodes should render as **dimmed / dashed outlines** until accepted.
4. If user wants to add a suggested topic, start a **pipeline for that specific topic**:
   - search materials → synthesize → add to course + mindmap.

## Prioritized Task Queue (12)

### 1) Fix References/Sources parsing regression (references ≠ examples)

**Problem:** References are being rendered as “Examples” (likely header mapping/parse bug).
**Fix:** Standardize on `## References` / `## Sources` and parse as structured list; never coerce to Examples.
**Acceptance:** CourseView + LessonReader show References with outbound links; no “Examples” label for references.

Status: DONE (client parsing guard + supports Further Reading).

### 2) Make references first-class, attributed links

**Fix:** Extend lesson model to include `sources[]` with at least: `{ url, title, publication?, author?, date? }`.

- Server returns structured sources; client uses structured sources; markdown parsing only fallback.
  **Acceptance:** Each lesson has a Sources drawer listing real links; inline citations resolve to actual sources.

Status: PARTIAL (still markdown-derived parsing in client; no structured `sources[]` on lesson model yet).

### 3) Render lesson “Hero” block

**Fix:** Add a consistent hero section at top of LessonReader:

- title, short “why it matters”, estimated time, difficulty, progress.
  **Acceptance:** LessonReader top is visually distinct and consistent across lessons.

### 4) Add “Key Points” and “Recap” components

**Fix:** Parse or generate a Key Points array (3–7 bullets) and render callouts.
**Acceptance:** Every lesson renders Key Points + Recap sections.

### 5) Add illustrations (existing API hook-up)

**Fix:** If illustration endpoint exists, wire it into LessonReader and render 1 hero illustration (or tasteful placeholder).
**Acceptance:** Lessons show an illustration above fold (when available) and don’t break layout on mobile.

### 6) CourseView: richer lesson cards

**Fix:** Add per-lesson mini summary + key points preview + sources count.
**Acceptance:** CourseView lesson list feels “designed”, not plain text.

### 7) Mindmap: focus mode (area in question)

**Fix:** Implement “Focus on node” behavior:

- When a node is selected, filter graph to N-hop neighborhood (configurable, default 2).
- Provide a “Show full map” toggle.
  **Acceptance:** Large mindmaps become readable; selected area is centered and zoom-fit.

### 8) Mindmap: suggested expansion nodes (dimmed/dashed)

**Fix:** Support node status: `active | suggested`.

- Suggested nodes render dashed outline + reduced opacity.
  **Acceptance:** Suggested nodes are visually distinct and do not count as completed curriculum.

### 9) Generate suggested nodes from lesson context + conversation

**Fix:** Server/orchestrator emits `mindmap.update` with `suggestedNodes[]` when new adjacent topics are detected.
**Acceptance:** After a lesson/conversation, mindmap shows 2–5 suggested next topics connected to the current node.

### 10) “Add topic” action triggers topic-specific pipeline

**Fix:** Add UI action on suggested node: “Add to course”.

- Triggers pipeline run (discovery → extraction → synthesis) scoped to that topic.
- Adds new lesson/module and flips node status to active.
  **Acceptance:** Clicking Add runs pipeline, creates content, updates course + mindmap.

### 11) Pipeline UX: progress + artifacts

**Fix:** Show pipeline stages and sources discovered (with attribution) and final synthesis summary.
**Acceptance:** User can see what was found + why it was included.

### 12) QA + screenshots

**Acceptance:** `npx tsc --noEmit`, `npx vitest run`, `npx eslint .` green. Run desktop + mobile authed screenshots.

---

## Backlog (add next iteration; do not disturb Iteration 38 scope)

### B1) Onboarding only once (not every login)

- Persist onboarding completion flag and skip onboarding on subsequent logins.

### B2) Onboarding must not force course creation

- Remove any requirement to create a course during onboarding; onboarding should be profile/goals only.

### B3) Lesson-level mindmap + cutting-edge topic expansion

- Each lesson has its own mindmap focused on the lesson topic.
- Suggested new nodes come from cutting-edge internet topics (via web search).
- Clicking suggested nodes runs “latest on this” search and expands lesson/coursed mindmap.
- Course-level mindmap should mirror this behavior (broader context).

### B4) Fix annotation double-click heading errors

- Double-clicking a heading for annotation currently throws errors; diagnose + fix.
