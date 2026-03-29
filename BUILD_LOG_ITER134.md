# BUILD LOG — Iter134 (Builder)

> Builder run log. Evidence is file paths + actual command outputs (no fabrication).

## 2026-03-29

### Task: P0 — Screenshot harness marketing canonical explicit/stable
- Changes:
  - `screenshot-all.mjs`
    - Added `requireBaseWeb()` URL validation.
    - Added fail-fast `HEAD` check for `BASE_WEB` before taking marketing screenshots.
    - Ensures marketing screenshots only use `BASE_WEB`.
- Commands:
  - `node -c screenshot-all.mjs`
  - `node screenshot-all.mjs --outDir learnflow/screenshots/iter134/builder-run-1`
- Results:
  - ✅ Completed, exit code 0.
- Screenshots:
  - `learnflow/screenshots/iter134/builder-run-1/*.png`

### Task: P0 — Conversation “See Sources” must never be a dead action
- Changes:
  - `apps/client/src/screens/Conversation.tsx`
    - Fixed invalid dispatch action `ADD_MESSAGE` (not handled by reducer).
    - When no sources exist and user clicks “See Sources”, app now dispatches `ADD_CHAT_MESSAGE` with a truthful assistant message: “No sources available for this response.”
- Commands:
  - `npm run lint`
  - `npm run test`
- Results:
  - ✅ `npm run lint` passed.
  - ⚠️ Root `npm run test` is flaky: sometimes fails with `EnvironmentTeardownError: Closing rpc while "onUserConsoleLog" was pending` from `apps/api`.
  - ✅ Re-ran later: root `npm run test` passed (turbo 10/10 success).
  - ✅ Verified `apps/api` tests pass when run directly via `npx vitest run --reporter verbose`.
- Screenshots:
  - Reused screenshot harness run (above) as evidence of app still renderable.

### Task: P0 — Marketplace Agent activation disclosure: enforce in UI and server response
- Changes:
  - API now returns `activationMode: 'routing_only'` in marketplace agent endpoints:
    - `GET /api/v1/marketplace/agents` (public)
    - `GET /api/v1/marketplace/agents` (full)
    - `GET /api/v1/marketplace/agents/activated`
    - `POST /api/v1/marketplace/agents/:id/activate`
    - `POST /api/v1/marketplace/agents/:id/deactivate`
    - `POST /api/v1/marketplace/agents/manifests/resolve`
  - Test updated:
    - `apps/api/src/__tests__/marketplace.test.ts` asserts `activationMode === 'routing_only'` on activation.
- Commands:
  - `npm run lint:check`
  - `npm run test`
  - `npm run build`
- Results:
  - ✅ lint/test/build passed.

### Notes / Follow-ups
- Root test flake appears related to Vitest console-hook teardown timing when run under turbo workspace aggregation. Running tests inside `apps/api` directly avoids it.

### Sync
- Ran:
  - `rsync -av --progress --exclude node_modules --exclude .git --exclude dist --exclude .turbo --exclude .next /home/aifactory/.openclaw/workspace/learnflow/ /home/aifactory/onedrive-learnflow/learnflow/learnflow/`
- Proof:
  - `learnflow/screenshots/iter134/builder-run-1/*` transferred; rsync summary shows `sent 16,072,505 bytes ... speedup is 201.61`.
