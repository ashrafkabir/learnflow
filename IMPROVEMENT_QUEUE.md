# LearnFlow — Improvement Queue (Iter129)

Owner: Builder  
Planner: Ash (planner subagent)  
Last updated: 2026-03-28

Status: **DONE**

## Recent shipped commits (git log -10 --oneline)

- 3378903 Iter128: mark improvement queue done + refresh shipped commits
- d78ba55 Iter128: update build log for tasks 08-12
- 86337a4 Iter128: add MVP truth regression test
- 33f1854 Iter128: show toasts for key client-side error catches
- ee06955 Iter128: document screenshot harness canonical command
- bcce613 Iter128: add repo-local ripgrep script
- a27e16e Iter128: label content provenance (live vs mock)
- a02d75a Iter128: clarify mindmap persistence in UI
- b000880 Iter128: add marketplace flow Playwright smoke test
- 5d0ca15 Iter128: add WS message_id to shared types and tests

---

## Evidence captured (Iter129 planner run)

Screenshots + notes captured into:

- Desktop: `learnflow/screenshots/iter129/planner-run/desktop/`
- Mobile: `learnflow/screenshots/iter129/planner-run/mobile/`
- Notes: `learnflow/screenshots/iter129/planner-run/NOTES.md`

Representative desktop screenshots:

- `learnflow/screenshots/iter129/planner-run/desktop/landing-home.png`
- `learnflow/screenshots/iter129/planner-run/desktop/auth-login.png`
- `learnflow/screenshots/iter129/planner-run/desktop/onboarding-4-api-keys.png`
- `learnflow/screenshots/iter129/planner-run/desktop/app-dashboard.png`
- `learnflow/screenshots/iter129/planner-run/desktop/app-conversation.png`
- `learnflow/screenshots/iter129/planner-run/desktop/app-mindmap.png`
- `learnflow/screenshots/iter129/planner-run/desktop/marketplace-courses.png`
- `learnflow/screenshots/iter129/planner-run/desktop/marketplace-agents.png`
- `learnflow/screenshots/iter129/planner-run/desktop/app-pipelines.png`
- `learnflow/screenshots/iter129/planner-run/desktop/pipeline-detail.png`
- `learnflow/screenshots/iter129/planner-run/desktop/settings-about-mvp-truth.png`

Dev runtime ports (expected): `DEV_PORTS.md`.
Dev status evidence: `node scripts/dev-status.mjs` shows API:3000, client:3001, web:3003.

---

## Brutally honest spec ↔ implementation parity (Iter129)

This repo is in a good place on “MVP truth” compared to earlier iterations, but there are still a few spots where the _implementation_ is honest while _the behavior_ is misleading or brittle.

Key reality checks (with evidence):

1. **BYOAI key management is real and fairly robust** (encrypted at rest, validation endpoint, activation semantics).
   - Evidence: `apps/api/src/keys.ts` mounted at `apps/api/src/app.ts` (`/api/v1/keys`).
   - UI evidence: onboarding keys screen `.../desktop/onboarding-4-api-keys.png`.

2. **Marketplace is split-brain**: a public in-memory router and an authed DB-backed router share the same mount.
   - Evidence: `apps/api/src/routes/marketplace.ts` (public, in-memory demo) + `apps/api/src/routes/marketplace-full.ts` (authed, DB-backed, checkout/publish/reviews).
   - Risk: inconsistent data between logged-out browse and logged-in flows, plus duplicated endpoints (`/courses`) with different behavior.

3. **Client API routing is inconsistent**: some screens use `apiPost/apiGet` (base + auth), others use raw `fetch('/api/v1/...')`.
   - Evidence: raw fetches in:
     - `apps/client/src/screens/marketplace/AgentMarketplace.tsx`
     - `apps/client/src/screens/onboarding/SubscriptionChoice.tsx`
     - `apps/client/src/components/AdminSearchConfigPanel.tsx`
   - Risk: breaks if API base is not same-origin; also repeats auth header logic.

4. **Dashboard “Today 0/3 daily goal” is hardcoded**, while the API has a real `/api/v1/daily` endpoint.
   - Evidence:
     - UI hardcode: `apps/client/src/screens/Dashboard.tsx` shows `0/3`.
     - API exists: `apps/api/src/routes/daily.ts` returns deterministic recommendations.
   - Result: users see a fake metric even though a real endpoint exists.

---

## Iter129 — Evidence-first tasks (10–15)

Each task includes priority, evidence, and acceptance criteria.

### P0 (trust + correctness)

1. **P0 — Eliminate raw `fetch('/api/v1/...')` usage in the client; standardize on `apiGet/apiPost` + `apiBase()`.**
   - Evidence: `apps/client/src/screens/marketplace/AgentMarketplace.tsx`, `apps/client/src/screens/onboarding/SubscriptionChoice.tsx`, `apps/client/src/components/AdminSearchConfigPanel.tsx`.
   - Why: prevents auth/header drift and makes non-same-origin API deployments viable.
   - Acceptance:
     - `./rg -n "fetch\('/api/v1" apps/client/src` returns **0 matches**.
     - Those screens continue to work in dev and in Playwright harness.

2. **P0 — Marketplace router consolidation: remove/retire public in-memory `/marketplace` router or make it a thin proxy to DB-backed listing.**
   - Evidence: `apps/api/src/routes/marketplace.ts` vs `apps/api/src/routes/marketplace-full.ts`, both mounted at `/api/v1/marketplace` in `apps/api/src/app.ts`.
   - Why: current dual-router behavior can yield inconsistent course/agent lists depending on auth and creates maintenance risk.
   - Acceptance:
     - `GET /api/v1/marketplace/courses` returns the same shape and data source regardless of auth.
     - `GET /api/v1/marketplace/agents` is single-sourced (manifest DB or file manifests) with clear MVP labeling.

3. **P0 — Fix silent-failure enroll flow in Course Marketplace (must toast on failure).**
   - Evidence: `apps/client/src/screens/marketplace/CourseMarketplace.tsx` has `catch { // silent fail }`.
   - Screenshot context: `.../desktop/marketplace-courses.png` shows marketplace entrypoint where failures are user-visible.
   - Acceptance:
     - Enroll failures show an error toast with next steps.
     - Errors include HTTP status/message when available (without leaking secrets).

4. **P0 — Replace Dashboard hardcoded “Today 0/3” with real `/api/v1/daily` data + honest empty state.**
   - Evidence: hardcoded `0/3` in `apps/client/src/screens/Dashboard.tsx`; API exists: `apps/api/src/routes/daily.ts`.
   - Acceptance:
     - Dashboard “Today” card reflects actual returned count/limit from `/api/v1/daily?limit=3`.
     - If API fails, show “Today: unavailable (MVP)” instead of fake 0/3.
     - Screenshot update: `screenshots/iter130/.../desktop/app-dashboard.png` shows non-hardcoded UI.

### P1 (parity, reliability, and reducing misleading UX)

5. **P1 — Agent Marketplace: route all requests through `apiBase()` and unify activation/list calls.**
   - Evidence: `apps/client/src/screens/marketplace/AgentMarketplace.tsx` uses raw `fetch` and manual auth headers for list + activated + activate/deactivate.
   - Acceptance:
     - Switch to `apiGet('/marketplace/agents')`, `apiGet('/marketplace/agents/activated')`, `apiPost('/marketplace/agents/:id/activate')`.
     - No duplicated token header code remains in this screen.

6. **P1 — Subscription upgrade onboarding should use `apiPost('/subscription', ...)` and surface failure to the user.**
   - Evidence: `apps/client/src/screens/onboarding/SubscriptionChoice.tsx` uses raw `fetch('/api/v1/subscription')` and ignores failures.
   - Acceptance:
     - Uses `apiPost('/subscription', { action: 'upgrade' })`.
     - If upgrade fails, user sees an info toast: onboarding continues, but tier remains Free.

7. **P1 — Admin Search Config Panel: use `apiGet/apiPut` helpers + handle 401/403 clearly.**
   - Evidence: `apps/client/src/components/AdminSearchConfigPanel.tsx` uses raw fetch and generic errors.
   - Acceptance:
     - Uses centralized helpers.
     - If non-admin hits it, display “Admin only” callout rather than generic failure.

8. **P1 — Marketplace course detail consistency: ensure list→detail always works for a newly published course.**
   - Evidence: detail route exists in full router (`apps/api/src/routes/marketplace-full.ts` `/courses/:id`), but list sources differ today.
   - Acceptance:
     - E2E/Playwright: publish course → verify it appears in list → open detail → enroll.
     - Add/extend Playwright test (start from `b000880` coverage) to include detail open.

9. **P1 — Pipeline screens: ensure all displayed pipeline data is provenance-labeled (real vs mock) on the screen.**
   - Evidence: `apps/client/src/screens/PipelineView.tsx` uses `MOCK_PIPELINES`; screenshot `.../desktop/app-pipelines.png` shows pipelines entrypoint.
   - Acceptance:
     - A visible label on list screen: “Demo pipelines (mock data)” when mock array is in use.
     - If/when real pipeline list exists, label flips to “Live pipelines”.

### P2 (hygiene + docs + test coverage)

10. **P2 — Add a small unit test to prevent re-introducing raw `/api/v1` fetches in client screens.**

- Evidence: repeated reintroduction risk (multiple files currently use raw fetch).
- Acceptance:
  - A test (or lint rule) fails when `fetch('/api/v1/` appears under `apps/client/src/`.

11. **P2 — Update docs: clarify that marketing pages are served by `apps/web` and client app has separate marketing screens; reduce ambiguity.**

- Evidence: spec references `apps/web` and screenshots harness currently hits client routes (`/features`, `/pricing`, `/docs`).
  - `apps/web/src/app/page.tsx` contains marketing homepage.
  - Client also has marketing screens under `apps/client/src/screens/marketing/*`.
- Acceptance:
  - `README.md` (or a short `ARCHITECTURE.md` section) states which host/port serves which marketing surface in dev and in production.

12. **P2 — Improve “MVP truth” discoverability: add a persistent Settings link or footer link from Dashboard to MVP truth.**

- Evidence: MVP truth exists (`apps/client/src/screens/AboutMvpTruth.tsx`, screenshot `.../desktop/settings-about-mvp-truth.png`) but is buried.
- Acceptance:
  - Dashboard has an “About this MVP” link.
  - Playwright screenshot `app-dashboard.png` clearly shows the link.

13. **P2 — Add API contract test ensuring `/api/v1/daily` response schema stays stable.**

- Evidence: endpoint in `apps/api/src/routes/daily.ts`; UI will depend on it after Task #4.
- Acceptance:
  - Test asserts keys: `date`, `limit`, `lessons[]` with `courseId, lessonId, estimatedTime, reason`.

---

## OneDrive sync (required)

After updating this queue + adding Iter129 screenshots/notes, run a non-destructive mirror sync:

```bash
rsync -av --progress \
  --exclude node_modules --exclude .git --exclude dist --exclude .turbo --exclude .next \
  /home/aifactory/.openclaw/workspace/learnflow/ \
  /home/aifactory/onedrive-learnflow/learnflow/learnflow/
```
