# BUILD_LOG — Iteration 48 (Planner)

Date: 2026-03-20 (America/New_York)

## Goal

Follow LearnFlow Continuous Improvement Loop:

1. Read full spec
2. Inspect code (UI/API/agents)
3. Verify stack running on stable ports 3000/3001/3003; kill conflicts/restart services if needed
4. Take Playwright screenshots of every screen; output to evals/screenshots/iter48-\*
5. Compare spec vs implementation
6. Write IMPROVEMENT_QUEUE.md (10–15 tasks) — READY FOR BUILDER
7. Write this build log
8. Copy outputs to OneDrive iteration folder (copy only)
9. Commit planner outputs

## 1) Spec review

- Read: `learnflow/LearnFlow_Product_Spec.md` (v1.0, March 2026)
- Key spec themes for this iteration review:
  - BYOAI (per-user key) free tier + Pro managed infra
  - Orchestrator spawns specialized agents
  - Real-time web curation with attribution
  - Mindmap knowledge graph w/ CRDT collaboration
  - Marketplace (agents + courses)
  - REST + WebSocket API contracts

## 2) Running services & ports

Verified listeners:

```bash
ss -ltnp | egrep ":3000|:3001|:3003"
```

Result:

- :3000 → node (LearnFlow API) PID 585417
- :3001 → node (Vite client) PID 568220
- :3003 → next-server (marketing web) PID 561377

Systemd user services:

```bash
systemctl --user status learnflow-api learnflow-client learnflow-web
```

- All **active (running)**. No port conflicts encountered; no restarts needed.

Notes:

- `learnflow-web` logs show `GET /features 500` during screenshot run.

## 3) Screenshots (Playwright)

Created directories:

```bash
mkdir -p evals/screenshots/iter48-desktop evals/screenshots/iter48-mobile evals/screenshots/iter48-web
```

Commands executed:

```bash
node screenshot.mjs evals/screenshots/iter48-desktop
SCREENSHOT_DIR=evals/screenshots/iter48-mobile node screenshot-mobile.mjs
SCREENSHOT_DIR=evals/screenshots/iter48-web node screenshot-web.mjs
```

Counts:

- Desktop: 11 pngs
- Mobile: 39 pngs (multiple device widths)
- Web: 8 pngs

Example outputs:

- Desktop: home, dashboard, conversation, mindmap, marketplace-agents, marketplace-courses, settings, onboarding-\*.
- Mobile: same set across 320/375/414 widths incl. onboarding-api-keys, onboarding-subscription, onboarding-first-course.
- Web: web-home, web-features, web-marketplace, web-docs, web-download, web-blog, web-about.

## 4) Key implementation findings (spec vs code)

### Orchestrator + WS streaming

- WebSocket path (`apps/api/src/websocket.ts` + `wsOrchestrator.ts`) uses Core `Orchestrator` and streams:
  - `response.start`, `response.chunk`, `response.end`
  - `agent.spawned`, `agent.complete`
- WS also handles `mindmap.subscribe` and emits `mindmap.update` suggestions.

### REST chat endpoint divergence

- REST `/api/v1/chat` (`apps/api/src/routes/chat.ts`) has bespoke routing:
  - `agent=notes` → template notes
  - `agent=exam` → template quiz
  - `agent=research` → **hard-coded** papers/links
  - otherwise uses OpenAI directly with lesson context prompt
- This diverges from spec’s “single orchestrator” and from the WS path.

### Course generation

- `/api/v1/courses` uses static `TOPIC_CONTENT` with a topic matcher; it may crawl sources but module/lesson structure is template-driven.
- Lesson content generation uses OpenAI if env key exists; fallback templates are generic.

### BYOAI keys

- `/api/v1/keys` exists, but primary LLM calls use `process.env.OPENAI_API_KEY` (server-managed) via `getOpenAI()`.
- Spec requires true per-user BYOAI for free tier.

### Mindmap

- Client mindmap explorer builds a graph from courses/modules/lessons + progress.
- Suggestions are dashed nodes from WS `mindmap.update` using `generateSuggestedMindmapNodes()` (web-search heuristics or OpenAI json).
- MindmapAgent supports CRDT ops but there is **no persisted mindmap state** or collaborative ops wired.

### Marketplace

- Marketplace endpoints exist and UI screens exist.
- Activated agents are read into WS student context, but routing behavior does not clearly change beyond messaging.

### Marketing web

- Next.js marketing site running on 3003.
- Observed server log: `/features` returns 500; needs fix.

## 5) Artifacts produced

- `learnflow/IMPROVEMENT_QUEUE.md`
- `learnflow/BUILD_LOG_ITER48.md` (this file)
- Screenshots under:
  - `learnflow/evals/screenshots/iter48-desktop/`
  - `learnflow/evals/screenshots/iter48-mobile/`
  - `learnflow/evals/screenshots/iter48-web/`

## 6) Copy to OneDrive iteration folder

Planned copy-only sync target:

- `/home/aifactory/onedrive-learnflow/iteration-48/`

Copy commands (copy only; no deletes):

```bash
mkdir -p /home/aifactory/onedrive-learnflow/iteration-48/
cp -R learnflow/IMPROVEMENT_QUEUE.md learnflow/BUILD_LOG_ITER48.md /home/aifactory/onedrive-learnflow/iteration-48/
cp -R learnflow/evals/screenshots/iter48-desktop /home/aifactory/onedrive-learnflow/iteration-48/
cp -R learnflow/evals/screenshots/iter48-mobile /home/aifactory/onedrive-learnflow/iteration-48/
cp -R learnflow/evals/screenshots/iter48-web /home/aifactory/onedrive-learnflow/iteration-48/
```

## 7) Git commit

Planned:

- Add `IMPROVEMENT_QUEUE.md` and `BUILD_LOG_ITER48.md`
- Do **not** commit screenshots (unless repo expects them; currently treated as artifacts to sync to OneDrive)

Proposed commit message:

- `planner: iteration 48 improvement queue + build log`
