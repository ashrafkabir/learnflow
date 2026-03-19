# LearnFlow — Iteration 42 Build Log

Iteration: 42
Status: READY FOR BUILDER
Date: 2026-03-19

## Scope

- Read FULL spec: `LearnFlow_Product_Spec.md` (entire file, chunked).
- Inspect implementation across API + client + agents packages.
- Boot app on stable ports **3000 (API)**, **3001 (client)**, **3003 (web/marketing)**; resolve port conflicts.
- Capture Playwright screenshots (desktop + mobile + web) under `evals/screenshots/iter42-*`.
- Compare spec vs implementation; produce prioritized improvement queue.
- Sync artifacts to OneDrive iteration folder.

## Commands run (high-level)

```bash
cd /home/aifactory/.openclaw/workspace/learnflow

# Port/service inspection
ss -ltnp | egrep ':3000|:3001|:3003' || true
systemctl --user --no-pager status learnflow-api learnflow-client learnflow-web | cat

# Port 3000 conflict resolution (killed stale PID shown owning :3000)
ps -p 506250 -o pid,cmd --no-headers
kill 506250

# Restart API on 3000
systemctl --user restart learnflow-api

# Quick HTTP probes
node -e "fetch('http://localhost:3001').then(r=>r.text()).then(t=>console.log(t.slice(0,120))).catch(e=>{console.error(e);process.exit(1)})"
node -e "fetch('http://localhost:3003').then(r=>r.text()).then(t=>console.log(t.slice(0,120))).catch(e=>{console.error(e);process.exit(1)})"

# Screenshot runs
mkdir -p evals/screenshots
SCREENSHOT_DIR=evals/screenshots/iter42-desktop BASE_URL=http://localhost:3001 node screenshot-all.mjs
SCREENSHOT_DIR=evals/screenshots/iter42-mobile  BASE_URL=http://localhost:3001 node screenshot-mobile.mjs
SCREENSHOT_DIR=evals/screenshots/iter42-web     BASE_URL=http://localhost:3003 node screenshot-web.mjs
```

## Runtime notes

- **API port 3000** was initially occupied; resolved by killing the owning PID and restarting `learnflow-api` user service.
- Client (3001) and web (3003) responded to HTTP.

## Screenshot capture output

Created:

- `evals/screenshots/iter42-desktop/` — 27 PNGs
- `evals/screenshots/iter42-mobile/` — 39 PNGs
- `evals/screenshots/iter42-web/` — 8 PNGs

Example files:

- `iter42-desktop/app-dashboard.png`
- `iter42-desktop/app-mindmap.png`
- `iter42-desktop/app-settings.png`
- `iter42-desktop/marketplace-agents.png`
- `iter42-mobile/app-dashboard.png`
- `iter42-web/web-home.png`

## Key implementation findings (for builder)

- **Spec §10 (Orchestrator system prompt)** is present verbatim in `packages/core/src/orchestrator/system-prompt.ts`.
- **Intent routing** is currently **regex/keyword-based** (`packages/core/src/orchestrator/intent-router.ts`) — not LLM-based.
- **Course generation** in API is mostly **template-driven** with an LLM hook for lesson text: `apps/api/src/routes/courses.ts`.
- **BYO key onboarding UI** exists (`apps/client/src/screens/onboarding/ApiKeys.tsx`) but **does not POST the key** to API; it only advances onboarding step.
- **API key vault endpoints** exist (`apps/api/src/keys.ts`) with encryption-at-rest (via `crypto.ts`) and provider format validation.
- **Mindmap suggestions** are pushed via WebSocket `mindmap.update` (server: `apps/api/src/websocket.ts`, client: `apps/client/src/screens/Conversation.tsx`, rendered: `MindmapExplorer.tsx`).
- **Re-engagement after 3 days** (spec §10) is **not implemented** in API/background job.
- `UpdateAgent` exists in agents package, but **no scheduler/trigger wiring** is present in API.

## Git hygiene

- Running the app created changes in ignored dirs (`apps/web/.next`, `apps/api/.data/*`).
- Reverted those changes before committing (no tracked changes remaining).
