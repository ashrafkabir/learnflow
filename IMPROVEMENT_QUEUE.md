# IMPROVEMENT_QUEUE — Iter162 (Planner)

Status: **DONE (built)**

OneDrive sync (this run):

- ✅ Screenshots mirrored to: `onedrive:learnflow/screenshots/iter162/run-001/`
- ✅ `IMPROVEMENT_QUEUE.md` mirrored to: `onedrive:learnflow/IMPROVEMENT_QUEUE.md`
- ✅ `BUILD_LOG_ITER162.md` mirrored to: `onedrive:learnflow/iter162/BUILD_LOG_ITER162.md`

Scope focus for Iter162:

- Demo login reliability in dev (dev auth bypass), and onboarding correctness
- Ensure API running (health), and client uses correct endpoints
- Fix any regressions introduced by recent changes

---

## What I verified (evidence)

### App boots + key routes render (Playwright)

Screenshots captured under:

- Repo: `learnflow/learnflow/screenshots/iter162/run-001/`
- Files (subset):
  - Onboarding: `onboarding-1-welcome.png` … `onboarding-6-first-course.png`
  - Auth: `auth-login.png`, `auth-register.png`
  - App: `app-dashboard.png`, `app-conversation.png`, `app-mindmap.png`, `app-pipelines.png`, `app-settings.png`, `app-notifications.png`, `app-collaboration.png`
  - Course/Lesson: `course-view.png`, `lesson-reader.png`, `pipeline-detail.png`
  - Marketing: `marketing-home.png`, `marketing-features.png`, `marketing-pricing.png`, `marketing-download.png`, `marketing-docs.png`, `marketing-blog.png`, `marketing-about.png`

### Dev auth bypass exists (client + API)

- Client env-gated bypass: `apps/client/src/App.tsx` (OnboardingGuard uses `VITE_DEV_AUTH_BYPASS=1`).
- Client sends dummy token when bypassing: `apps/client/src/context/AppContext.tsx` sets `Authorization: Bearer dev` when `devAuthBypass` true.
- API accepts deterministic dummy token ONLY when `config.devMode` is enabled: `apps/api/src/middleware.ts`.
- API devMode requires explicit opt-in: `apps/api/src/config.ts` sets `devMode` when `LEARNFLOW_DEV_AUTH=1` (and not production).

### API health endpoint

- Actual health route is `GET /health` (not `/api/v1/health`): `apps/api/src/app.ts`.
  - Verified: `curl http://localhost:3000/health` returns `{ "status": "ok" }`.

### Client API endpoint base logic

- Client uses same-origin by default (and relies on Vite proxy in dev): `apps/client/src/context/AppContext.tsx` + `apps/client/vite.config.ts`.
  - Vite proxies `/api` and `/ws` → `http://localhost:3000`.

### BYOAI / managed-key truth enforcement

- API layer enforces BYOAI-only OpenAI clients: `apps/api/src/llm/openai.ts`.
- There is also provider selection logic that _refuses_ env-managed keys even if present: `apps/api/src/llm/providers.ts`.

### Spec compliance note (important)

Spec §6.1.1 states **OpenAI web_search only** and “no Firecrawl/Tavily”. Implementation is partially compliant:

- Pipeline route uses OpenAI web_search provider (`openai_web_search`) in `apps/api/src/routes/pipeline.ts`.
- However the agents package still contains the older multi-source provider described as “Wikipedia/arXiv/GitHub/etc”: `packages/agents/src/content-pipeline/web-search-provider.ts`, and Firecrawl provider code exists in repo (`packages/agents/src/content-pipeline/firecrawl-provider.ts`).
  - This is OK **only if** runtime paths for MVP pipeline never call these providers. Builder should ensure no accidental usage.

---

## Brutally honest gaps vs spec (high-level)

The spec is a full multi-agent learning platform with rich WS protocol, dashboards, marketplaces, analytics, etc. The current codebase is a pragmatic MVP and does not fully implement:

- True agent marketplace “third-party agent code loading” (spec says planned; current is built-ins + manifests).
- Full SCO (Student Context Object) + behavioral tracking depth described in §9 (some scaffolding exists; not sure it’s complete end-to-end).
- Many roadmap-level workstreams (Flutter client, full SDK, real billing) are intentionally mocked/omitted.

Iter162 priority, though, is **dev auth + onboarding correctness + endpoint reliability**.

---

## Priority build tasks (10–15) — Iter162

### P0 — must fix (dev demo reliability)

1. **Make dev auth bypass actually work out-of-the-box for demo runs**
   - Problem: Client bypass (`VITE_DEV_AUTH_BYPASS=1`) sends `Bearer dev`, but API only accepts that token when `LEARNFLOW_DEV_AUTH=1` (server-side devMode). If only one side is enabled, login/onboarding will be flaky / redirect-loop.
   - Buildable fix: in `scripts/dev-status.mjs` (or dev bootstrap docs), enforce/print a single “DEV AUTH: ON/OFF” status and required env vars for client + API.
   - Files: `apps/client/src/App.tsx`, `apps/client/src/context/AppContext.tsx`, `apps/api/src/config.ts`, `apps/api/src/middleware.ts`.

2. **Add a dedicated “dev login” button in `/login` when bypass is enabled**
   - Goal: one-click deterministic login for demos (sets token or relies on bearer dev) and navigates to dashboard.
   - Guarded by `VITE_DEV_AUTH_BYPASS=1` only.
   - Files: `apps/client/src/screens/Login.tsx` (or equivalent; locate actual login screen), `AppContext` auth helpers.

3. **Ensure onboarding completion state is consistent and stored durably**
   - Risk: OnboardingGuard currently checks multiple sources (state + localStorage legacy + `learnflow-user`). Easy to regress.
   - Buildable fix: define one canonical field (e.g. `user.onboardingCompletedAt`) persisted by API, and make client fallback minimal.
   - Files: `apps/client/src/App.tsx` (OnboardingGuard), `apps/client/src/context/AppContext.tsx`, API profile/context endpoint.

4. **Create /api/v1/health alias or update docs/scripts to stop using the wrong endpoint**
   - Evidence: `/api/v1/health` returns 404; `/health` works.
   - Builder decision:
     - Either add `GET /api/v1/health` that proxies to the same handler, OR
     - Update tooling/docs to use `/health` consistently.
   - Files: `apps/api/src/app.ts`, `DEV_PORTS.md`, any scripts calling `/api/v1/health`.

### P1 — should fix (integration correctness)

5. **Add a diagnostics banner in client when API is unreachable / mis-proxied**
   - Show: API base (`apiBase()`), devAuthBypass status, and quick copy/paste cURL.
   - Avoids silent blank screens.
   - Files: `apps/client/src/components/ModeProvidersDebugPanel.tsx` + `AppStateDebugPanel`.

6. **Verify WebSocket proxy + auth path works with dev auth**
   - Ensure `/ws` proxy and server WS auth accept `Bearer dev` in dev mode.
   - Add an E2E that asserts the socket connects in bypass mode.
   - Files: `apps/client/vite.config.ts`, `apps/api/src/websocket.ts`, `apps/api/src/wsOrchestrator.ts`.

7. **Harden redirect logic to avoid loops between /login, /onboarding, /dashboard**
   - Add test cases:
     - no token → /dashboard redirects to /login
     - token but onboarding incomplete → redirects to /onboarding/welcome
     - dev bypass → allows /dashboard without token
   - Files: `apps/client/src/App.tsx`, existing tests under `apps/client/src/__tests__/`.

8. **Make pipeline source-mode (“mock” vs “real”) consistent and visible**
   - Spec trust: if mock sources are used, disclose clearly.
   - Implementation already has sourceMode plumbing; ensure it is set reliably for every pipeline run and rendered consistently.
   - Files: `apps/api/src/routes/pipeline.ts`, `apps/client/src/components/pipeline/PipelineView.tsx`, `apps/client/src/context/AppContext.tsx`.

### P2 — cleanup / spec alignment guardrails

9. **Enforce OpenAI web_search-only for MVP pipeline at runtime (no accidental multi-source provider)**
   - Add an assertion or config gate so the pipeline cannot call `web-search-provider.ts` paths.
   - Files: `packages/agents/src/content-pipeline/mvp.ts`, `apps/api/src/routes/pipeline.ts`.

10. **Document “BYOAI-only” truth in one place and link from Settings → About**

- There is `settings-about-mvp-truth.png`; ensure it stays accurate and includes: “No managed keys in this build” + how to set key.
- Files: client Settings About screen.

11. **Add a single canonical DEV_PORTS / endpoint map and update screenshot scripts to use it**

- Avoid drift between :3000 API, :3001 client, :3003 web.
- Files: `DEV_PORTS.md`, `screenshot-all.mjs`, `scripts/dev-status.mjs`.

12. **Fix OneDrive mirror instructions + add a script to sync planner artifacts**

- Repo has historical references to OneDrive paths that don’t match what exists now.
- Provide `npm run onedrive:sync:planner -- --iter 162` that mirrors:
  - `learnflow/screenshots/iter162/run-001/`
  - `IMPROVEMENT_QUEUE.md`
- Destination should be consistent with existing OneDrive tree: `/home/aifactory/onedrive-learnflow/learnflow/screenshots/iter162/run-001/` and `/home/aifactory/onedrive-learnflow/learnflow/IMPROVEMENT_QUEUE.md`.

13. **Add CI guard: dev auth bypass must never be enabled in production builds**

- Already partially enforced via `config.devMode` check; add explicit startup log + fail if `LEARNFLOW_DEV_AUTH=1` and `NODE_ENV=production`.
- Files: `apps/api/src/config.ts` + server bootstrap.

14. **Tighten tests around auth bypass token acceptance**

- Unit test that API rejects `Bearer dev` unless `LEARNFLOW_DEV_AUTH=1`.
- Unit/E2E test that when enabled, it attaches `req.user` with deterministic identity.
- Files: `apps/api/src/middleware.ts`, new tests.

15. **Onboarding UX polish: ensure “First Course Setup” screen actually results in a visible course or a next action**

- Spec says progress animation only + saved prefs + create first course from dashboard; ensure the CTA and dashboard messaging are aligned.
- Files: `apps/client/src/screens/onboarding/*`, dashboard screen.

---

## Screenshots captured (Iter162)

Stored at: `learnflow/learnflow/screenshots/iter162/run-001/`

- landing-home.png
- marketing-{home,features,pricing,download,docs,blog,about}.png
- auth-{login,register}.png
- onboarding-1-welcome.png
- onboarding-2-goals.png
- onboarding-3-topics.png
- onboarding-4-api-keys.png
- onboarding-5-subscription.png
- onboarding-6-first-course.png
- app-{dashboard,conversation,mindmap,pipelines,notifications,collaboration,settings}.png
- course-view.png
- course-create-after-click.png
- lesson-reader.png
- pipeline-detail.png
- marketplace-{courses,agents,creator-dashboard}.png
- settings-about-mvp-truth.png
