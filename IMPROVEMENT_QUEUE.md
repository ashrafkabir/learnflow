# LearnFlow — Improvement Queue (Iter123)

Owner: Builder  
Planner: Ash (planner subagent)  
Last updated: 2026-03-28

Status: **DONE**

## Recent shipped commits (git log -10 --oneline)

- ff42a6c Iter121: mark improvement queue done
- aaa5a89 Iter121: log note about build log tracking
- 7d3ac34 Iter121: update build log
- b7fd370 Iter121 Task9: clarify pipeline publish is not marketplace publish
- f3128a1 Iter121 Task11: spec MVP truth (web-first, billing mock, native planned)
- a59a3cb Iter121 Task10: add dev:attach to bypass port checks
- a70f2d1 Iter121 Task6: spec mindmap mastery claims -> MVP progress
- a789c2e Iter121 Task5: screenshot harness infers iteration from args/outdir
- bf96c8c Iter121 Task4: add routing-only disclosure on agent activation
- 671b867 Iter121 Task3: spec onboarding step 6 reflects MVP

---

## Iter123 — Planner evidence

Screenshots + notes captured into:

- Desktop+mobile screenshots: `learnflow/screenshots/iter123/planner-run/{desktop,mobile}/`
- Notes: `learnflow/screenshots/iter123/planner-run/NOTES.md`

Key desktop screenshots (non-exhaustive):

- `learnflow/screenshots/iter123/planner-run/desktop/app-dashboard.png`
- `learnflow/screenshots/iter123/planner-run/desktop/app-conversation.png`
- `learnflow/screenshots/iter123/planner-run/desktop/app-settings.png`
- `learnflow/screenshots/iter123/planner-run/desktop/app-mindmap.png`
- `learnflow/screenshots/iter123/planner-run/desktop/lesson-reader.png`
- `learnflow/screenshots/iter123/planner-run/desktop/marketplace-agents.png`
- `learnflow/screenshots/iter123/planner-run/desktop/marketplace-courses.png`

Test status (sanity):

- `npm test` passes (API suite): `apps/api/src/__tests__/*` (observed 66 files / 206 tests)

Dev entrypoint used:

- `npm run dev:attach` (background)
- Screenshot harness: `node scripts/screenshots.mjs --iter 123 --base http://localhost:3001 --outDir learnflow/screenshots/iter123/planner-run/run-001`

---

## Iter123 — Brutally honest spec ↔ implementation parity (major areas)

### Product / UX (Spec §5.2)

- **Mostly implemented**: onboarding, dashboard, conversation, mindmap, lesson reader, notifications, pipelines, collaboration, settings.
  - Evidence: screenshots under `learnflow/screenshots/iter123/planner-run/desktop/`
- **Bookmarks exist but are local-only** (localStorage), not in Student Context Object persistence.
  - Evidence: `apps/client/src/screens/LessonReader.tsx` (`learnflow-bookmarks`)

### Student Context Object (Spec §6.2)

- **Context builder includes fields for browseHistory/searchQueries/bookmarkedContent** but they are currently empty and not persisted.
  - Evidence: `apps/api/src/orchestratorShared.ts` (initial SCO has empty arrays)
  - No API routes found for bookmarks/history persistence.

### Marketplace (Spec §7)

- **Course marketplace exists** (search, detail, enroll, creator dashboard); **checkout/billing remains MVP/mock**.
  - Evidence: `apps/api/src/routes/marketplace-full.ts`; client screens in `apps/client/src/screens/marketplace/*`
- **Agent marketplace exists** with activation state; MVP disclosure is shown; **ratings/usage metrics are intentionally omitted** to avoid misleading “real metrics,” which conflicts with spec §5.2.6.
  - Evidence: `apps/client/src/screens/marketplace/AgentMarketplace.tsx` (disclosure + “omit ratings/usage”)

### API + WebSocket (Spec §11)

- **WS event protocol broadly matches spec** (message, response.start/chunk/end, agent.spawned/complete, mindmap.update, progress.update) with MVP additions (`connected`, `ws.contract`).
  - Evidence: `apps/api/src/websocket.ts`, `apps/api/src/wsOrchestrator.ts`, `apps/client/src/screens/Conversation.tsx`
- **Web search endpoint exists** (`GET /api/v1/search`) returning trimmed results with domain attribution.
  - Evidence: `apps/api/src/routes/search.ts`, `apps/client/src/context/AppContext.tsx` (`webSearch`)

---

## Iter123 — Improvement tasks (evidence-first, 10–15)

### P0 — Spec-trust alignment (don’t promise what isn’t stored / computed)

1. **P0 — Implement server-backed bookmarks (and wire to Student Context Object)** ✅

- Evidence:
  - Bookmarks are local-only: `apps/client/src/screens/LessonReader.tsx` (`learnflow-bookmarks`)
  - Spec expects bookmarks in SCO: `LearnFlow_Product_Spec.md` §6.2 (“bookmarked content”)
  - SCO currently empty arrays: `apps/api/src/orchestratorShared.ts`
- Do:
  - Add API: `POST/GET/DELETE /api/v1/bookmarks` (or embed into `/profile/context`), persist in DB.
  - Update SCO builder to populate `bookmarkedContent` from DB.
  - Update Lesson Reader to use API (fallback to local storage migration optional).
- Acceptance:
  - Bookmarks persist across browsers/devices and appear in `/api/v1/profile/context`.

2. **P0 — Implement search query and browse history persistence (minimal MVP)** ✅

- Evidence: SCO defines `browseHistory`, `searchQueries` as empty: `apps/api/src/orchestratorShared.ts`
- Do:
  - Add lightweight event endpoints (or piggyback on existing routes):
    - Record search queries when calling `GET /api/v1/search`.
    - Record lesson reads / course views.
  - Expose in `GET /api/v1/profile/context`.
- Acceptance:
  - `profile/context` returns last N searches + last N viewed lessons with timestamps.

3. **P0 — Close the Agent Marketplace spec mismatch: either (A) show real rating/usage, or (B) explicitly mark those fields as PLANNED in spec & UI** ✅

- Evidence:
  - Spec demands rating/usage display: `LearnFlow_Product_Spec.md` §5.2.6
  - UI intentionally omits: `apps/client/src/screens/marketplace/AgentMarketplace.tsx` (“omit ratings/usage metrics”)
- Do:
  - Option A: add real metrics (count activations / runs, rating + reviews) stored server-side.
  - Option B (MVP-safe): keep hidden, but add a “PLANNED metrics” line + update spec section to reflect MVP.
- Acceptance:
  - No “phantom” metrics; spec and UI agree.

4. **P0 — Ensure all “Attribution recording” claims have real persistence hooks (URL/author/publication/date/license/accessedAt)** ✅

- Evidence:
  - Spec requires full chain: `LearnFlow_Product_Spec.md` §6.3, §11, and bullet “Attribution Recording” (line ~347)
  - WS response sources include fields but may be derived heuristically: `apps/api/src/wsOrchestrator.ts` (enrichedSources)
- Do:
  - Standardize a `SourceAttribution` type and persist with lessons/courses.
  - Include `license` and `accessedAt` on stored sources.
- Acceptance:
  - Lesson detail endpoint returns persisted attributions (not only computed at response time).

### P1 — UX completion & “what happens when I click” clarity

5. **P1 — Add a real “Bookmarks” UI surface (list + jump to lesson)** ✅

- Evidence: bookmark toggle exists only in Lesson Reader: `apps/client/src/screens/LessonReader.tsx`
- Do:
  - Add Settings tab or Dashboard card listing bookmarks.
- Acceptance:
  - User can review/remove bookmarks without reopening each lesson.

6. **P1 — Conversation: show a visible agent activity pill with kind + elapsed time**

- Evidence:
  - WS events provide `kind` + `startedAt`: `apps/api/src/wsOrchestrator.ts`
  - Client stores `activeAgentKind/activeAgentStartedAt`: `apps/client/src/screens/Conversation.tsx`
  - Screenshot doesn’t show a clear pill: `learnflow/screenshots/iter123/planner-run/desktop/app-conversation.png`
- Acceptance:
  - While streaming, header shows “Research Agent • running • 3.2s” (or similar).

7. **P1 — Mindmap: clarify “suggestions” vs “knowledge graph” in UI copy**

- Evidence:
  - `mindmap.update` currently sends `suggestions` plus empty `nodes_added/edges_added`: `apps/api/src/websocket.ts`
  - Client treats as suggestions: `apps/client/src/screens/Conversation.tsx` (SET_MINDMAP_SUGGESTIONS)
- Do:
  - Label suggestions as “Suggested next topics” and differentiate from persisted graph.
- Acceptance:
  - No implied persistence of nodes unless actually stored.

### P2 — Platform hygiene / operability

8. **P2 — Add API endpoints for bookmarks/history/searchQueries to OpenAPI and docs** ✅

- Evidence:
  - API reference points to OpenAPI: `apps/docs/pages/api-reference.md`
- Acceptance:
  - New endpoints are documented in `apps/api/openapi.yaml` and `apps/docs/pages/api-reference.md`.

9. **P2 — Add tests for bookmarks/history persistence + SCO hydration** ✅

- Evidence:
  - Test suite exists and runs fast: `apps/api/src/__tests__/*` (206 tests observed)
- Acceptance:
  - New tests cover CRUD + `/profile/context` integration.

10. **P2 — Consolidate “NOTES.md” location in screenshot harness (avoid duplicate templates)** ✅

- Evidence:
  - Harness created a template under `desktop/NOTES.md` while planner needs root notes; fixed by writing `learnflow/screenshots/iter123/planner-run/NOTES.md`.
- Acceptance:
  - Future runs write ONLY `learnflow/screenshots/<iter>/planner-run/NOTES.md`.

11. **P2 — Add a single “dev status” command that prints URLs + pids for API/client/web**

- Evidence: planner previously had to kill/restart processes; ports can conflict.
- Acceptance:
  - `npm run dev:status` (or similar) prints which services are running and where.

---

## OneDrive sync (required)

After updating this queue + adding Iter123 notes, run a non-destructive mirror sync:

```bash
rsync -av --progress /home/aifactory/.openclaw/workspace/learnflow/ /home/aifactory/onedrive-learnflow/learnflow/learnflow/
```

(Planner will confirm once executed.)
