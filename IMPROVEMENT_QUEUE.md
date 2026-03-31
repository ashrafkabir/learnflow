# IMPROVEMENT_QUEUE — Iter166 (Planner)

Status: DONE (built)

OneDrive sync (this run):

- ✅ Screenshots mirrored to: `/home/aifactory/onedrive-learnflow/iter166/screenshots/run-001/`
- ⏳ (Next) Mirror this updated `IMPROVEMENT_QUEUE.md` to OneDrive at: `/home/aifactory/onedrive-learnflow/iter166/IMPROVEMENT_QUEUE.md`

Repo evidence for this iteration:

- Product spec: `LearnFlow_Product_Spec.md`
- Client routes: `apps/client/src/App.tsx`
- API entry: `apps/api/src/index.ts` (stable ports, WS + Yjs)
- Marketing site: `apps/web/src/app/*/page.tsx`
- Playwright screenshots (this run): `learnflow/screenshots/iter166/run-001/` (and OneDrive mirror)

---

## Brutally honest spec-vs-implementation (Iter166)

### ✅ What matches the MVP-truth spec sections

- **MVP architecture disclosure is explicit** in the spec (§3.2.0) and reinforced in-product:
  - `apps/client/src/screens/AboutMvpTruth.tsx` states marketplace agents do not execute third-party code and BYOAI-only.
  - Marketing home + features pages include “planned/best-effort” language.

- **Stable dev ports exist and are enforced**:
  - `DEV_PORTS.md` says API 3000, client 3001, web 3003.
  - `apps/client/vite.config.ts` proxies `/api` and `/ws` to `http://localhost:3000`.
  - `scripts/check-ports.mjs` hard-fails `npm run dev` if ports are already in use.

- **Marketing site pages required by spec §12.1 exist** (`apps/web/src/app/.../page.tsx`):
  - `/`, `/features`, `/pricing`, `/download`, `/docs`, `/blog`, `/about`.

### ❌ Spec sections that are still misleading vs actual code

- **Full production “multi-agent mesh” architecture** in spec §§3–4 reads like shipped behavior (gRPC, K8s, vector DB, containerized agents). In repo reality, orchestration is **keyword/intent routing** + built-in handlers; no third-party agent execution.

- **Docs/Architecture guide is partially out of date / contradictory**:
  - `apps/docs/pages/architecture.md` claims Postgres/Redis/MinIO, Nextra, “packages/agents” etc — but spec §3.2.0 says SQLite + no Redis/S3/vector DB, and actual running stack in dev is Express + WS + Yjs.

- **API dev auth posture is confusing**:
  - `apps/api/src/index.ts` starts with `createApp({ devMode: config.devMode })` where `config.devMode` depends on `LEARNFLOW_DEV_AUTH`.
  - But `apps/api/src/server.ts` hardcodes `createApp({ devMode: true })` and defaults PORT to 3002, which conflicts with the port contract and creates confusion about which entrypoint is canonical.

---

## Screenshots — completion of required capture

✅ Captured **apps/client** (3001) + **apps/web** (3003) surfaces.

- Stored in repo: `learnflow/screenshots/iter166/run-001/`
- Mirrored to OneDrive: `/home/aifactory/onedrive-learnflow/iter166/screenshots/run-001/`

Note: filenames include `client-.png` and `web-.png` for the “/” route; rename in script later (see task P2.4).

---

## Prioritized buildable tasks (10–15)

### P0 — regressions / correctness / contracts

1) **Fix API port/entrypoint contradiction (PORT 3000 contract) and delete/stop using `server.ts` in dev**
   - Problem:
     - Dev ports contract expects API on **3000** (`DEV_PORTS.md`, Vite proxy), but `apps/api/src/server.ts` defaults to 3002 and hard-enables devMode.
     - This is a recurring footgun for new devs and automation.
   - Build:
     - Make `apps/api/src/index.ts` the **only** dev/prod entrypoint.
     - Either remove `server.ts` or mark it explicitly “legacy/local only” and ensure it is not referenced by package scripts/systemd.
     - Ensure API always binds `config.port` default 3000.
   - Acceptance:
     - `npm run dev:status` always shows API on 3000; docs and scripts align.
   - Files: `apps/api/src/index.ts`, `apps/api/src/server.ts`, root `package.json` scripts/systemd unit files (if present).

2) **Marketing site: implement spec-required Marketplace page or correct spec**
   - Problem: Spec §12.1 includes a Marketplace page (#28). Marketing nav includes “Marketplace”, and route exists at `apps/web/src/app/marketplace/page.tsx` (present), but we did not validate content fidelity (likely stub).
   - Build:
     - Either implement a real preview (cards + search UI + honest MVP disclosure) pulling from API read-only endpoints, OR label it clearly as “Preview (no live data)”.
   - Acceptance:
     - `/marketplace` has non-placeholder content and doesn’t mislead.
   - Files: `apps/web/src/app/marketplace/page.tsx`, (optional) API marketplace read endpoints.

3) **Client Settings route mismatch: fix Dashboard link to MVP truth**
   - Problem: `Dashboard.tsx` navigates to `/about-mvp-truth`, but `App.tsx` routes MVP truth at `/settings/about` (and tests reference `/settings/about-mvp-truth`). This is a routing inconsistency waiting to break.
   - Build:
     - Choose canonical route and add redirects/aliases:
       - `/settings/about` (canonical)
       - `/settings/about-mvp-truth` (alias)
       - `/about-mvp-truth` (alias if already shipped)
     - Update all nav links.
   - Acceptance:
     - All three paths render MVP truth screen; no 404.
   - Files: `apps/client/src/App.tsx`, `apps/client/src/screens/Dashboard.tsx`.

4) **Planner screenshot script: add deterministic “required screen list” and fail if missing**
   - Problem: Iter165 had evidence gaps; Iter166 needed an ad-hoc script.
   - Build:
     - Update repo’s canonical screenshot runner (`scripts/screenshots.mjs`) to capture:
       - apps/web: `/`, `/features`, `/pricing`, `/download`, `/docs`, `/blog`, `/about`
       - apps/client: `/`, `/login`, `/register`, `/dashboard`, `/conversation`, `/mindmap`, `/marketplace/courses`, `/marketplace/agents`, `/settings`, `/settings/about`
     - If any expected file is missing, exit non-zero.
   - Acceptance:
     - One command produces a complete set and CI can enforce completeness.
   - Files: `scripts/screenshots.mjs`.

### P1 — high-value spec gaps (MVP-appropriate)

5) **Make “planned vs shipped” truthfulness consistent across spec, docs, and UI**
   - Problem: Spec §12 marketing wireframe promises demo video, testimonials, stats, etc. Marketing pages currently contain placeholders like `[Screenshot: ...]`.
   - Build:
     - Replace placeholders with:
       - real screenshots from the client app (static assets), or
       - honest “Screenshot coming soon” blocks with design polish.
     - Add a single “MVP truth” callout component used across `/features`, `/pricing`, `/download`.
   - Acceptance:
     - No “fake demo” appearance; fewer placeholders.
   - Files: `apps/web/src/app/features/page.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/app/pricing/page.tsx`.

6) **Docs site: convert `apps/web /docs` from stub to render Markdown from `apps/docs/pages`**
   - Problem:
     - `apps/web/src/app/docs/page.tsx` points at Markdown under `apps/docs/pages/*`, but does not render it.
   - Build:
     - Add a simple MD renderer (server-side) or static import pipeline to render at least:
       - getting-started
       - api-reference
       - websocket-events
       - mvp-truth
   - Acceptance:
     - `/docs` is not just a link list; it displays real documentation.
   - Files: `apps/web/src/app/docs/*`, `apps/docs/pages/*`.

7) **Onboarding: add explicit “Interests” step (or fix spec references)**
   - Problem: `App.tsx` maps `/onboarding/interests` to `Topics` screen (same component). Spec claims separate goals/topics/interests.
   - Build:
     - Either implement a distinct Interests UI (lightweight tag picker) OR remove the duplicated route and adjust copy/spec references.
   - Acceptance:
     - Onboarding steps align with `OnboardingProgress` (6 steps) and routes.
   - Files: `apps/client/src/screens/onboarding/*`, `apps/client/src/components/OnboardingProgress.tsx`, `apps/client/src/App.tsx`.

8) **Client landing vs marketing home: decide canonical entrypoint and implement redirect**
   - Problem: There’s `apps/client` landing (`LandingApp.tsx`) and `apps/web` marketing home. This creates split-brain.
   - Build (pick one):
     - Option A: Make client `/` redirect to `apps/web` home when unauth (using `VITE_WEB_ORIGIN`).
     - Option B: Remove marketing link-outs and build a real product landing within client.
   - Acceptance:
     - “What is LearnFlow?” has exactly one canonical home.
   - Files: `apps/client/src/screens/LandingApp.tsx`, `apps/client/src/App.tsx`, `apps/web/src/app/layout.tsx`.

9) **Mindmap: add basic navigational affordance (node click → open course/lesson)**
   - Problem: Spec expects mindmap as a navigation surface; MVP appears mostly visualization.
   - Build:
     - Ensure nodes have stable IDs mapping to lesson routes and implement click behavior.
   - Acceptance:
     - From mindmap you can reach lesson reader reliably.
   - Files: `apps/client/src/screens/MindmapExplorer.tsx`, `apps/api/src/routes/mindmap.ts`.

### P2 — polish / maintainability

10) **Rename screenshot outputs for “/” route**
   - Problem: `client-.png` and `web-.png` are ugly and ambiguous.
   - Build:
     - In screenshot script, name “/” as `home`.
   - Acceptance:
     - Filenames are stable and readable.

11) **Fix missing ripgrep dependency or update repo scripts/docs to avoid `rg`**
   - Problem: `rg` is referenced in docs/planner workflows but isn’t installed in this environment.
   - Build:
     - Either add `ripgrep` to dev dependencies/tooling or remove references.
   - Acceptance:
     - New dev can follow docs without missing commands.

12) **Update `apps/docs/pages/architecture.md` to match spec §3.2.0 MVP**
   - Problem: Architecture doc currently describes Postgres/Redis/MinIO and agent mesh diagrams that are not in this repo’s MVP.
   - Build:
     - Add an “MVP (this repo)” section mirroring spec §3.2.0 and clearly label future-state.
   - Acceptance:
     - Docs don’t contradict the spec’s MVP truth.

13) **Add a “Surface Map” doc and keep it in-repo**
   - Build:
     - Create `apps/docs/pages/surface-map.md` listing all routes and their owning app/port.
   - Acceptance:
     - Future screenshot automation + QA has a canonical route list.

14) **Add smoke tests for marketing pages**
   - Build:
     - Playwright test: visit each marketing URL and assert the H1 matches expected and no placeholder “undefined”.
   - Acceptance:
     - Prevent broken deploys on marketing surfaces.

15) **Clarify Update Agent scheduler truth in both UI and docs**
   - Problem: Spec says manual tick + RSS/Atom-only; ensure UI doesn’t imply web crawling.
   - Build:
     - Add “RSS/Atom only; requires external cron” note wherever Update Agent is surfaced.
   - Files: `apps/docs/pages/update-agent-scheduling.md`, relevant client screen.

---

## OneDrive sync — completed

✅ Mirrored Iter166 artifacts to:

- `/home/aifactory/onedrive-learnflow/iter166/IMPROVEMENT_QUEUE.md`
- `/home/aifactory/onedrive-learnflow/iter166/BUILD_LOG_ITER166.md`
- `/home/aifactory/onedrive-learnflow/iter166/screenshots/iter166/run-002/`
