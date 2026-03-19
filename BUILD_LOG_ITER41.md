# Build Log — Iteration 41 (Planner)

Date: 2026-03-19
Owner: Planner subagent (learnflow-planner-41)

## Objective

- Read FULL product spec: `LearnFlow_Product_Spec.md`
- Inspect code in: `apps/client`, `apps/api`, `packages/core`, `packages/agents`
- Boot app on stable ports: API 3000, Client 3001, Web 3003
- Take Playwright screenshots of every screen (desktop + mobile + web)
- Compare EVERY spec section vs implementation; be brutally honest
- Write 10–15 prioritized tasks to `IMPROVEMENT_QUEUE.md` (Status: READY FOR BUILDER, Iteration: 41)
- Sync queue/log/screenshots to `/home/aifactory/onedrive-learnflow/`
- Commit the plan

## Runtime verification (ports + services)

- Ports were already occupied by LearnFlow dev services:
  - 3001: Vite client (`learnflow-client.service`)
  - 3003: Next web (`learnflow-web.service`)
  - 3000: **conflict** — a stray `node tsx watch src/index.ts` process (PID 483971) was listening and causing `learnflow-api.service` to log `EADDRINUSE`.

### Fix applied

- Killed the conflicting port holder (PID 483971).
- Restarted API service: `systemctl --user restart learnflow-api`.
- Verified API bound successfully to 3000.

## Screenshots (Iter41)

Captured using repo scripts, pinned to Iter41 output dirs:

- Desktop/client route set:
  - Command: `SCREENSHOT_DIR=evals/screenshots/iter41-desktop node screenshot-all.mjs`
  - Output: `learnflow/evals/screenshots/iter41-desktop/`

- Mobile viewports (320/375/414):
  - Command: `SCREENSHOT_DIR=evals/screenshots/iter41-mobile node screenshot-mobile.mjs`
  - Output: `learnflow/evals/screenshots/iter41-mobile/`

- Marketing website (Next):
  - Command: `SCREENSHOT_DIR=evals/screenshots/iter41-web node screenshot-web.mjs`
  - Output: `learnflow/evals/screenshots/iter41-web/`

## Spec vs implementation — key findings (brutally honest)

### ✅ Implemented / close enough

- **Core screens exist** per spec §5.2.x: onboarding, dashboard, conversation, course view, lesson reader, mindmap explorer, marketplace, settings, collaboration, pipelines.
- **WS orchestrator path exists** and routes messages through `packages/core` `Orchestrator` + `AgentRegistry` (`apps/api/src/wsOrchestrator.ts`).
- **Conversation markdown + LaTeX**: Conversation imports `remark-math` and `rehype-katex`.
- **Firecrawl integration hooks exist** in course generation; falls back if `FIRECRAWL_API_KEY` absent.

### ❌ Major gaps / mismatches

- **Marketplace backend:** rich router exists (`apps/api/src/routes/marketplace-full.ts`) but is **not mounted**; active router is the minimal demo `routes/marketplace.ts`. This blocks spec-level publishing, checkout, creator analytics.
- **Export agent:** `intent-router.ts` routes export requests to `export_agent`, and system prompt lists it, but **no ExportAgent exists in `packages/agents`** and it is not registered in API orchestrator registry.
- **Lesson rendering parity:** Lesson Reader is not clearly using the same markdown/LaTeX/code rendering pipeline as Conversation; it uses a custom structured parser.
- **Context drift:** REST `GET /api/v1/profile/context` returns a smaller/older shape than the richer WS `StudentContextObject` builder. This violates spec §9 “SCO always available” consistency and risks client drift.
- **Mobile onboarding mismatch:** the mobile screenshot script still visits `/onboarding/experience` although the canonical app routes are `/onboarding/subscription` etc. Indicates stale path(s) or missing redirect.

## Output artifacts

- Updated: `learnflow/IMPROVEMENT_QUEUE.md` (Iteration 41)
- Created: `learnflow/BUILD_LOG_ITER41.md`
- Screenshots: `learnflow/evals/screenshots/iter41-*`

## Next steps required by the main agent (not completed here)

- Sync the following to `/home/aifactory/onedrive-learnflow/`:
  - `learnflow/IMPROVEMENT_QUEUE.md`
  - `learnflow/BUILD_LOG_ITER41.md`
  - `learnflow/evals/screenshots/iter41-desktop/`
  - `learnflow/evals/screenshots/iter41-mobile/`
  - `learnflow/evals/screenshots/iter41-web/`
- Commit the plan to git.
