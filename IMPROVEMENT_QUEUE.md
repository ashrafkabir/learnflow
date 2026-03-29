# LearnFlow — Improvement Queue (Iter134)

Owner: Builder  
Planner: Ash (planner subagent)  
Last updated: 2026-03-29

Status: **READY FOR BUILDER**

### Iter134 (Builder focus)

- [x] Persist course-level research bundle to course-artifacts (web search + extracted markdown + image manifest) so later stages don’t re-scrape.
- [x] Persist per-lesson research bundles to course-artifacts (sources + extracted text + image manifest) during lesson scraping.
- [x] Track pipeline `lastError` and `retryCount` (API state) so UI can show failures + retries without digging through logs.
- [x] Wire lesson generation to use saved research bundles (no re-scrape), and include citations sourced from those bundles.
- [x] Update PipelineDetail UI: show stage progress + `lastError` + retry affordance, and render links to saved artifacts.
- [x] Generate consolidated markdown artifacts: `course-research.md` (with source index + bounded extracts + image attributions) and `lessonplan.md` (LLM-generated lesson plan referencing research URLs).

#### Iter134 follow-ups from user feedback (P0)

- [x] **Lesson reader UX**: remove duplicate “Mark complete” buttons; keep a single primary CTA per lesson.
- [x] **Lesson navigation**: add “Next lesson” (and “Previous” if easy) based on course/module/lesson ordering.
- [x] **Illustrations/hero**: fix “Illustrate” so lessons actually show a hero section and rendered images/illustrations.
  - Fix:
    - Ensure course generation embeds a license-safe illustration into lesson markdown even in `fastTestMode` (with deterministic placeholder fallback).
    - Add API integration test to assert at least one illustration exists for new fast courses.
  - Evidence:
    - `apps/api/src/routes/courses.ts` embeds `![...](https://upload.wikimedia.org/...)` and persists illustration rows.
    - `apps/api/src/__tests__/iter134-illustrations-fastmode.test.ts`.
    - Manual: `GET /api/v1/courses/:id/lessons/:lessonId` now includes a markdown image early in content; `/illustrations` returns length >= 1.
  - Status: DONE

---

## Evidence captured (Iter134 planner run)

Screenshots + notes captured into:

- Desktop: `learnflow/screenshots/iter134/planner-run/desktop/`
- Mobile: `learnflow/screenshots/iter134/planner-run/mobile/`
- Notes: `learnflow/screenshots/iter134/planner-run/NOTES.md`

Representative screenshots to reference in PRs:

- `learnflow/screenshots/iter134/planner-run/desktop/landing-home.png`
- `learnflow/screenshots/iter134/planner-run/desktop/onboarding-4-api-keys.png`
- `learnflow/screenshots/iter134/planner-run/desktop/onboarding-5-subscription.png`
- `learnflow/screenshots/iter134/planner-run/desktop/app-dashboard.png`
- `learnflow/screenshots/iter134/planner-run/desktop/app-conversation.png`
- `learnflow/screenshots/iter134/planner-run/desktop/app-mindmap.png`
- `learnflow/screenshots/iter134/planner-run/desktop/course-create-after-click.png`
- `learnflow/screenshots/iter134/planner-run/desktop/course-view.png`
- `learnflow/screenshots/iter134/planner-run/desktop/lesson-reader.png`
- `learnflow/screenshots/iter134/planner-run/desktop/marketplace-courses.png`
- `learnflow/screenshots/iter134/planner-run/desktop/marketplace-agents.png`
- `learnflow/screenshots/iter134/planner-run/desktop/app-collaboration.png`
- `learnflow/screenshots/iter134/planner-run/desktop/app-settings.png`
- `learnflow/screenshots/iter134/planner-run/desktop/settings-about-mvp-truth.png`

Dev runtime ports (repo convention; verified during run):

- API: http://localhost:3000 (`GET /health`)
- Client (app): http://localhost:3001
- Web/marketing (Next): http://localhost:3003

---

## Brutally honest spec ↔ implementation parity (Iter134)

### Spec sections that are materially implemented

- **§5.2.1 Onboarding**: 6-step flow exists (welcome → goals → topics → API keys → subscription → first course).
  - Evidence (UI): `learnflow/screenshots/iter134/planner-run/desktop/onboarding-*.png`
  - Evidence (routing): `apps/client/src/App.tsx` (onboarding routes)

- **§5.2.3 Conversation surface (partial)**: chat UI with markdown rendering, syntax highlighting, KaTeX math, quick-action chips, source drawer, agent activity indicator driven by WS events.
  - Evidence (code): `apps/client/src/screens/Conversation.tsx` (markdown + chips + SourceDrawer + `agent.spawned/complete` handling)
  - Evidence (UI): `.../desktop/app-conversation.png`

- **§11 WebSocket contract (exists)**: server emits `response.start/chunk/end`, `agent.spawned/complete`, `mindmap.update`, `progress.update`.
  - Evidence (code): `apps/api/src/websocket.ts`, `apps/api/src/wsOrchestrator.ts`, `apps/api/src/routes/courses.ts` (`emitToUser(... 'progress.update' ...)`)
  - Evidence (docs): `apps/docs/pages/websocket-events.md`

- **BYOAI key vault (MVP)**: key entry + validation + server-side encryption-at-rest.
  - Evidence (UI copy): `apps/client/src/screens/onboarding/ApiKeys.tsx`
  - Evidence (server): `apps/api/src/keys.ts` uses `encrypt()`; crypto is in `apps/api/src/crypto.js`.

- **Usage tracking (more real than the spec implies, but still “best-effort”)**: API tracks usage_records and exposes `/api/v1/usage/dashboard`.
  - Evidence (API): `apps/api/src/routes/usage.ts`
  - Evidence (UI): `apps/client/src/screens/ProfileSettings.tsx` loads and renders usage dashboard

- **Collaboration (MVP truth-first)**: groups + messages persisted; partner matches synthetic; shared mindmaps via live sync links.
  - Evidence (UI disclosure): `apps/client/src/screens/Collaboration.tsx`
  - Evidence (API): `apps/api/src/routes/collaboration.ts`

### Major parity / trust gaps (spec implies more than shipped)

1. **Marketing web app is misconfigured in dev**: Next app uses `output: 'export'` (static export) but also has middleware → Next warns “Middleware cannot be used with output: export”. This undermines credibility and can mask real routing/SEO problems.
   - Evidence (code): `apps/web/next.config.js` (`output: 'export'`), `apps/web/src/middleware.ts`.
   - Evidence (runtime): dev logs during `npm run dev` show the middleware/export warning.

2. **Spec §6 “Content Pipeline” (search APIs, Firecrawl, MinHash/SimHash, authority/recency/readability scoring) is not truly implemented end-to-end.** You have a course builder + pipeline UI, and some attribution gates/quality checks exist (esp marketplace QC), but there’s no credible multi-source ingestion/scoring/dedup system as described.
   - Evidence (code reality): course generation is primarily orchestrated through API routes and built-in agents; there is no MinHash/SimHash module present.
   - Evidence (UI): `.../desktop/app-pipelines.png` (pipeline visibility exists, but not the spec’s pipeline depth).

3. **Mindmap Explorer (§5.2.5) is not a true “all domains knowledge graph.”** Current “knowledge map” is course/module/lesson nodes rendered via `vis-network` on the Conversation screen (side panel), plus a separate Mindmap screen. It’s useful, but it is not the spec’s D3 full-screen graph with concept relationships.
   - Evidence (code): `apps/client/src/screens/Conversation.tsx` MindmapPanel is course/lesson graph.

4. **Marketplace spec (§7) is intentionally watered down** (good), but needs stricter “no real metrics” enforcement. Some fields (rating/usageCount) are derived from manifests and default to 0; the UI says it avoids misleading metrics but still displays numeric defaults in some layouts.
   - Evidence (code): `apps/client/src/screens/marketplace/AgentMarketplace.tsx` sets `rating/usageCount` from manifest.

---

## Iter134 — Evidence-first tasks (10–15)

Each task includes: priority, acceptance criteria, and evidence pointers. Preference order: **(1) remove misleading claims/UX, (2) fix broken fundamentals, (3) add capabilities.**

### P0 — Fix correctness + credibility (dev/runtime + user trust)

- **[DONE] Iter134 — Fix course research discovery (OpenAI web_search parsing + multi-query expansion) + persist sources/topics/queries + request/response logs**
  - Evidence:
    - `packages/agents/src/content-pipeline/openai-websearch-provider.ts` now uses `extractResultsFromResponse()` and query expansion.
    - `apps/api/src/routes/pipeline.ts` passes `topics/queries/rawCount/parsedResultsCount` into `writeCourseResearch()`.
    - `packages/agents/src/content-pipeline/artifact-writer.ts` writes these fields into `research/course/sources.json` and includes them in `course-research.md`.
    - Raw OpenAI web_search req/resp now persisted under `course-artifacts/<courseId>/logs/openai/*web_search*_request.json` + `*_response.json` (hooked via API route).

- **[DONE] Iter134 — Fix "Start Reading" failure in dev auth bypass mode**
  - Evidence:
    - `apps/client/src/context/AppContext.tsx` now fully respects `VITE_DEV_AUTH_BYPASS=1` (no refresh, no forced /login redirects on 401, no Authorization header injection).

1. **P0 — Fix `apps/web` static export + middleware incompatibility (choose one).**
   - Evidence:
     - `apps/web/next.config.js` sets `output: 'export'`.
     - `apps/web/src/middleware.ts` exists and matches all paths.
     - Dev runtime warning: “Middleware cannot be used with output: export”.
   - Acceptance:
     - Either remove middleware entirely (and replace HEAD / behavior in a different way), OR remove `output: 'export'` and run as a normal Next server.
     - `npm run dev` shows **no** middleware/export warning.

2. **P0 — Make screenshot harness “marketing canonical” explicit and stable.**
   - Evidence:
     - `screenshot-all.mjs` uses `BASE_WEB` for marketing, but it still calls `safeGoto()` on client `BASE` first (wasted + potentially flaky).
   - Acceptance:
     - Marketing screenshots should only ever hit `BASE_WEB`.
     - Harness should fail fast if `BASE_WEB` is unreachable (clear error).

3. **P0 — Conversation “See Sources” must never be a dead action.**
   - Evidence:
     - Chips send `__open_sources__` in `apps/client/src/screens/Conversation.tsx`.
     - SourceDrawer only populates when `response.end` includes sources.
   - Acceptance:
     - If no sources exist, “See Sources” chip is hidden/disabled and replaced with a truthful message (“No sources available for this response”).
     - If sources exist, chip opens drawer reliably.

4. **P0 — Marketplace Agent activation disclosure: enforce in UI _and_ server response.**
   - Evidence:
     - UI has disclosure modal: `apps/client/src/screens/marketplace/AgentMarketplace.tsx`.
     - Spec says MVP is manifest-based routing only.
   - Acceptance:
     - Server returns `activationMode: 'routing_only'` (or similar) on `GET /marketplace/agents` and activation endpoints; UI uses that field to render disclosure.
     - If server ever changes to `runtime_code`, disclosure copy must change automatically.

### P1 — Spec parity where it matters (learning loop + transparency)

5. **P1 — Build a minimal “Today’s Lessons” queue that is consistent with real progress state.**
   - Evidence:
     - Dashboard exists: `.../desktop/app-dashboard.png`.
     - Progress updates exist: `apps/api/src/routes/courses.ts` emits `progress.update`.
   - Acceptance:
     - “Today’s Lessons” never recommends a completed lesson.
     - When a lesson is marked complete, queue updates without refresh (WS-driven) or with a clear refresh action.

6. **P1 — Mindmap: tighten claims to what’s real, or implement concept-level graph.**
   - Evidence:
     - Spec §5.2.5 describes concept relationships; current is course/module/lesson graph.
   - Acceptance (choose one):
     - (A) Update UX copy (“Course Map”, “Lesson nodes”) and remove “knowledge graph of domains” language; OR
     - (B) Implement concept nodes + edges in API (persisted) and render full-screen explorer with expandable nodes.

7. **P1 — Usage transparency: reconcile spec “token usage” vs current “best-effort usage_records”.**
   - Evidence:
     - API exists: `apps/api/src/routes/usage.ts`.
     - UI exists: `apps/client/src/screens/ProfileSettings.tsx`.
   - Acceptance:
     - Settings screen labels usage as “best-effort” and clearly explains what’s measured (tokensTotal from usage_records) and what is not.
     - Add one deterministic test proving `/usage/dashboard` renders and numbers are non-negative.

8. **P1 — Content pipeline truth pass: remove any copy implying multi-source scraping/scoring is live if it isn’t.**
   - Evidence:
     - Spec §6 is ambitious; current implementation is partial.
   - Acceptance:
     - Audit marketing + in-app docs pages (especially `apps/client/src/screens/marketing/*` and `apps/web`) and remove/qualify claims about Google/Bing/Semantic Scholar/Firecrawl/MinHash unless code exists.
     - “About MVP Truth” remains the source of truth; add links to it from any “pipeline” UI.

### P2 — Reliability + cleanup to prevent regressions

9. **P2 — Remove/avoid duplicate dev processes (`dev-status` shows leftover turbo pids).**
   - Evidence:
     - `node scripts/dev-status.mjs` lists multiple turbo dev processes from old sessions.
   - Acceptance:
     - Add a safe `npm run dev:clean` step (or improve `scripts/dev-clean.mjs`) that finds and terminates only LearnFlow dev processes.
     - Document it in root README.

10. **P2 — Playwright robustness: avoid EPIPE crashes on `--list` piping.**

- Evidence:
  - Running `npx playwright test --list | head` can throw EPIPE in Node 22.
- Acceptance:
  - Document “don’t pipe Playwright list mode to head” and/or adjust CI scripts to not pipe.
  - Optional: add a tiny node wrapper that catches EPIPE for `--list` commands.

11. **P2 — Align client vs web marketing routing decisions (reduce split-brain).**

- Evidence:
  - Client comment: `apps/client/src/App.tsx` says marketing is served by `apps/web`.
  - Client still has marketing screen files and screenshot harness captures marketing pages.
- Acceptance:
  - Either (A) delete client marketing screens and ensure client `/` becomes LandingApp/login, OR (B) make client marketing canonical and delete `apps/web`.
  - Screenshot harness updated accordingly.

12. **P2 — Add a single “Spec claims vs MVP reality” checklist in docs and keep it current.**

- Evidence:
  - `apps/client/src/screens/AboutMvpTruth.tsx` exists, but it’s app-only.
- Acceptance:
  - Add `apps/docs/pages/mvp-truth.md` (or equivalent) and link it from Settings + marketing footer.

---

## Recent shipped commits (git log -10)

2b5ce7e Iter133: mark improvement queue DONE
ca94a8b Iter133 P0: mock billing CTA sweep + collaboration synthetic disclosure
d7afffb Prevent pipeline hangs: add timeouts for scraping/synthesis
c36c8b4 Surface create-course pipeline errors instead of dead list
292f2ae Fix Create Course button: pipeline hook uses apiPost/apiGet
8521846 Filter courses list to user-owned courses
d41006c Iter129: mark improvement queue done
0280d5a Iter129: standardize API calls + marketplace parity + dashboard today
3378903 Iter128: mark improvement queue done + refresh shipped commits
d78ba55 Iter128: update build log for tasks 08-12

---

## OneDrive sync (required)

After updating this queue + adding Iter134 screenshots/notes, run a non-destructive mirror sync:

```bash
rsync -av --progress \
  --exclude node_modules --exclude .git --exclude dist --exclude .turbo --exclude .next \
  /home/aifactory/.openclaw/workspace/learnflow/ \
  /home/aifactory/onedrive-learnflow/learnflow/learnflow/
```

## Iter135 — Lesson Reader (Takeaways rail + real Suggested reads + source images)

### What changed

- **LessonReader layout**: added a responsive **right-side rail** (desktop) and collapsible sections for mobile.
- **Key takeaways**: now read from persisted lesson field `takeaways` (no placeholders).
- **Suggested reads**: renamed from “References” to **Suggested reads**; only shows real `http(s)` URLs.
- **Related images**: added a “Related images” section that renders from persisted `relatedImages` manifest (best-effort, hides broken images).

### Data persistence

- Added DB tables:
  - `lesson_takeaways` (lessonId, courseId, takeaways JSON)
  - `lesson_images` (lessonId, courseId, images JSON)

### Guards

- Lesson generation prompt hardening: if no sources exist, the LLM is instructed to output exactly “No sources available.” and **not** add URLs.
- Added API unit test to ensure `parseLessonSources` only emits valid http(s) URLs.

### Tests

- New Playwright spec: `e2e/iter135-lesson-reader-sources-rail.spec.ts`
- Updated existing LessonReader test to be tolerant of the additional rail rendering.
