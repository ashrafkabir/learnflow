# LearnFlow — Improvement Queue

Owner: Builder  
Planner: Ash (main session)  
Last updated: 2026-03-27 (Iteration 97 READY)

---

## Iteration 97 — BYOAI VAULT SECURITY (AEAD + ROTATION), USAGE DASHBOARD, NOTES/FLASHCARDS FORMAT ENFORCEMENT, SPEC-TRUE PROGRESS TRACKER

Status: **DONE**

### Screenshot evidence (planner-run)

- Local: `learnflow/screenshots/iter97/planner-run/` (desktop + mobile)
- OneDrive mirror: `/home/aifactory/onedrive-learnflow/learnflow/learnflow/screenshots/iter97/planner-run/`
- Notes/commands: `learnflow/screenshots/iter97/planner-run/NOTES.md`

### Brutally honest spec-vs-impl gaps (highest leverage)

1. **BYOAI key vault is not spec-secure**: keys are encrypted at rest but using **AES-256-CBC** (`apps/api/src/crypto.ts`). Spec expects “key vault encryption + rotation” and safer modern posture (AEAD, versioning, rotation, and no ambiguous “active key” semantics).
2. **Usage dashboard is thin**: Settings shows last-7-days totals and top agents/providers (`apps/client/src/screens/ProfileSettings.tsx`) backed by `usage_records`, but spec expects “per-agent token counts surfaced in user dashboard” + richer spend-monitoring views.
3. **Notes/flashcards/Zettelkasten are inconsistent across layers**: `packages/agents/src/notes-agent/*` supports Cornell/Zettelkasten/flashcards, but lesson notes generation endpoint in `apps/api/src/routes/courses.ts` only supports `summary|cornell|mindmap` and uses OpenAI directly (not the Notes Agent). UI also doesn’t expose Zettelkasten.
4. **PROGRESS.md is not in spec format**: spec requires workstream status table + overall completion % + blockers list. Current `PROGRESS.md` is a production posture checklist, not a progress tracker.
5. **Billing/Stripe is explicitly mock**: marketplace checkout + subscription endpoints are mock-mode or local-only (`apps/api/src/routes/marketplace-full.ts`, `apps/api/src/routes/subscription.ts`). That’s OK for MVP honesty, but it’s a direct spec gap.

---

### P0 (Must ship)

#### 1) Upgrade key vault to AEAD + key versioning (no silent downgrade)

**Goal**: Replace CBC with authenticated encryption and make room for rotation.

**Acceptance criteria**

- New crypto scheme: **AES-256-GCM (AEAD)** with random IV + auth tag.
- Stored key records carry `encVersion` (e.g., `v2_gcm`) and any needed fields (`tag`).
- Decrypt supports both legacy `v1_cbc` and new `v2_gcm` so existing DBs keep working.
- No raw keys ever appear in logs, errors, responses, or stack traces.

**Likely files**

- `apps/api/src/crypto.ts`
- `apps/api/src/db.ts` (api_keys schema + row mapping)
- `apps/api/src/keys.ts`
- `apps/api/src/llm/providers.ts`

**Verification checklist**

- Unit: encrypt→decrypt roundtrip for v2; decrypt legacy v1 fixtures.
- API: POST `/api/v1/keys` then GET `/api/v1/keys` still returns masked key.
- Screenshots: Settings → API Keys shows existing keys still load.

---

#### 2) Implement key rotation + “active key per provider” semantics

**Goal**: Spec says rotation is supported; current system just inserts keys with `active=true` and never deactivates prior keys.

**Acceptance criteria**

- Add endpoint(s):
  - `POST /api/v1/keys/rotate` (or `POST /api/v1/keys` with `replace=true`) that:
    - stores new key
    - marks prior keys for that provider **inactive**
    - preserves usage history
- Add `PATCH /api/v1/keys/:id/activate` OR equivalent to support manual activation.
- LLM routing always chooses the **active** key for provider.

**Likely files**

- `apps/api/src/keys.ts`
- `apps/api/src/db.ts` (update statements)
- `apps/client/src/screens/ProfileSettings.tsx` (rotate/activate UI)

**Verification checklist**

- API tests: rotation creates new row and deactivates previous for provider.
- Manual: add OpenAI key twice; only latest is active; old key not used.

---

#### 3) BYOAI usage dashboard v1: daily series + per-agent breakdown

**Goal**: Align with spec language (“per-agent token counts surfaced in user dashboard”) and make it actually useful.

**Acceptance criteria**

- API returns:
  - `totalTokens`, `daily[]` (day, tokensTotal)
  - `byAgent[]` (agentName, tokensTotal)
  - `byProvider[]` (provider, tokensTotal)
  - range selector (7/30/90 days)
- Client Settings shows:
  - sparkline or simple chart for daily tokens
  - top agents/providers tables
  - clear label that tokens are best-effort for deterministic agents today

**Likely files**

- `apps/api/src/routes/usage.ts`
- `apps/api/src/db.ts` (aggregation queries already exist; expand response)
- `apps/client/src/lib/usage.ts`
- `apps/client/src/screens/ProfileSettings.tsx`

**Verification checklist**

- API test for response shape and determinism.
- Screenshot: Settings → Usage shows chart + tables.

---

#### 4) Notes Agent integration: unify formats + add Zettelkasten + flashcards end-to-end

**Goal**: Stop bypassing the Notes Agent and enforce spec-supported note formats.

**Acceptance criteria**

- Notes generation uses `notes_agent` (or shared implementation) rather than ad-hoc OpenAI prompt.
- Supported formats include: `cornell`, `zettelkasten`, `flashcards`, `summary`.
- UI exposes Zettelkasten + flashcards in LessonReader Notes panel.
- Persisted notes schema supports flashcards array and zettelkasten array (or markdown blocks) and exports include them.

**Likely files**

- `apps/api/src/routes/courses.ts` (notes endpoints)
- `packages/agents/src/notes-agent/*`
- `apps/client/src/screens/LessonReader.tsx`
- `apps/api/src/routes/export.ts`

**Verification checklist**

- Unit: format selection returns correct shape.
- Screenshot: LessonReader → Notes shows Cornell/Zettelkasten/Flashcards.

---

#### 5) Lesson format enforcement: hard cap ~1500 words + <10 min badge must be true

**Goal**: Spec mandates every lesson is bite-sized; we have sizing helpers but enforcement is uneven.

**Acceptance criteria**

- Pipeline (course generation) splits/compacts lessons exceeding thresholds.
- Lesson UI shows estimated read time badge derived from actual word count.
- Add a regression test that generated lessons never exceed limits in test fixtures.

**Likely files**

- `apps/api/src/utils/lessonSizing.ts`
- `apps/api/src/routes/courses.ts` (generation + validation)
- `apps/client/src/screens/LessonReader.tsx` (badge source)
- `apps/api/src/__tests__/lesson-sizing.test.ts` (new)

**Verification checklist**

- Test fixture course generation produces all lessons under limit.
- Screenshot: LessonReader shows “<10 min” and matches computed value.

---

### P1 (Should do)

#### 6) Conversation rich rendering parity: code blocks, citations, actions

**Acceptance criteria**

- Conversation bubbles render:
  - fenced code blocks with syntax highlight
  - inline citations that open Sources drawer (same credibility fields as LessonReader)
  - action chips always visible (Take Notes, Quiz Me, Go Deeper, See Sources) and context-aware

**Likely files**

- `apps/client/src/screens/Conversation.tsx`
- `apps/client/src/components/*` (renderer)

**Verification checklist**

- Screenshot: conversation shows code block + sources drawer.

---

#### 7) Spec-true PROGRESS.md tracker (don’t lose production checklist — move it)

**Acceptance criteria**

- `PROGRESS.md` follows spec format:
  - overall completion %
  - current blockers
  - WS-01..WS-14 statuses (Not Started / In Progress / Complete / Blocked) with dates + notes
- Preserve current checklist by moving it to `PRODUCTION_POSTURE.md` (or similar) and link from PROGRESS.

**Likely files**

- `PROGRESS.md`
- `PRODUCTION_POSTURE.md` (new)

**Verification checklist**

- Human review: PROGRESS is scannable, matches spec.

---

#### 8) Export parity: include notes/flashcards; tighten privacy language

**Acceptance criteria**

- Exports include:
  - course + lessons
  - notes (including flashcards/zettelkasten)
  - usage summary metadata (optional)
- Privacy doc and Settings copy accurately reflect what is/ isn’t stored.

**Likely files**

- `apps/api/src/routes/export.ts`
- `apps/docs/pages/privacy-security.md`
- `apps/client/src/screens/ProfileSettings.tsx`

---

### P2 (Nice to have)

#### 9) Provider validation expansion + safer UX

**Acceptance criteria**

- Validate-on-save supports at least OpenAI + Anthropic + Google (best-effort), and surfaces failures without blocking saves.
- UI shows validation timestamp and quick “Re-validate” button.

**Likely files**

- `apps/api/src/keys.ts`
- `apps/api/src/llm/key-validation.ts`
- `apps/client/src/screens/ProfileSettings.tsx`

---

#### 10) Billing honesty upgrades: explicitly label mock flows in UI + docs

**Acceptance criteria**

- Marketplace checkout + subscription screens label mock mode clearly and consistently.
- Docs page explains what’s real vs mocked (Stripe/IAP).

**Likely files**

- `apps/api/src/routes/marketplace-full.ts`
- `apps/api/src/routes/subscription.ts`
- `apps/client/src/screens/marketing/Docs.tsx`

---

### Global verification (Builder)

- `npm test`
- `npm run lint:check`
- `npm run format:check`
- Screenshots:
  - `ITERATION=97 SCREENSHOT_DIR=learnflow/screenshots/iter97/run-001/desktop node screenshot-all.mjs`
  - `SCREENSHOT_DIR=learnflow/screenshots/iter97/run-001/mobile SCREENSHOT_AUTHED=true node screenshot-mobile.mjs`

### OneDrive sync (Builder — do not skip)

- `/home/aifactory/.openclaw/workspace/learnflow/IMPROVEMENT_QUEUE.md`
- `/home/aifactory/.openclaw/workspace/learnflow/learnflow/screenshots/iter97/run-001/`
- Any build logs created (`learnflow/BUILD_LOG_ITER97.md`)

---

## Iteration 96 — UPDATE AGENT CONTRACT (GLOBAL TICK + RUN HISTORY), WS RECONNECT IDEMPOTENCY, EXPORT TRUST + SCREENSHOT EVIDENCE PACK

Status: **DONE**

### Top 3 brutally honest gaps found (vs March 2026 spec)

1. **Update Agent contract is fragmented**: topic/source CRUD exists (`apps/api/src/routes/update-agent.ts`) and per-topic run locks exist in `POST /api/v1/notifications/generate`, but there is **no single canonical scheduler entrypoint** (spec expects a deployable “tick” contract + lock semantics + run summary).

2. **WebSocket contract is improved but not proven for reconnect/idempotency**: server validates inbound events and echoes `message_id`, but there is no guarantee that `response.end` is emitted exactly once across reconnects; ordering invariants aren’t enforced by tests.

3. **Export is usable but not “trust-grade”**: server export exists (`GET /api/v1/export?format=md|json|zip`) but needs clearer provenance + stable filenames + verified ZIP contents parity with spec claims. Evidence/screenshot packs for exports are not yet first-class.

---

### Evidence / code anchors reviewed (this planning pass)

- Update Agent CRUD API: `apps/api/src/routes/update-agent.ts`
- Update Agent generation path + per-topic lock + backoff: `apps/api/src/routes/notifications.ts` (+ `apps/api/src/utils/updateAgent/*`)
- WS server: `apps/api/src/websocket.ts`
- REST chat: `apps/api/src/routes/chat.ts`
- Export: `apps/api/src/routes/export.ts` and Settings usage: `apps/client/src/screens/ProfileSettings.tsx`
- Privacy context + data-summary: `apps/api/src/routes/profile.ts`

---

## P0 (Must ship)

### 1) Create canonical scheduler entrypoint: `POST /api/v1/update-agent/tick`

**Problem**: Schedulers (cron/systemd/K8s) need one endpoint. Today the “real work” sits in `POST /api/v1/notifications/generate { topic }` and expects topic text; this is not a good contract for production scheduling.

**Acceptance criteria**

- Add `POST /api/v1/update-agent/tick` (Pro-gated) that:
  - acquires a **per-user global lock** (not per-topic) to prevent overlap
  - iterates enabled topics + enabled sources (honor `nextEligibleAt`)
  - calls the existing internal logic to fetch/parse/dedupe notifications
  - returns a **run summary**:
    - `topicsChecked`, `sourcesChecked`, `notificationsCreated`, `failures[]`
    - `startedAt`, `finishedAt`, `status`
  - if already running: returns **409** with standard envelope

**Likely files**

- `apps/api/src/routes/update-agent.ts` (new `/tick` route)
- `apps/api/src/db.ts` (new `update_agent_runs` table OR reuse existing run-state pattern)
- `apps/api/src/routes/notifications.ts` (extract generator into reusable function)

**Verification checklist**

- API tests:
  - concurrent tick calls → second gets 409
  - tick creates notifications and returns summary
- Gates: `npm test`, `npm run lint:check`, `npm run format:check`, `npm run -w @learnflow/api openapi:lint`

---

### 2) Add Update Agent run history API + Settings UI

**Acceptance criteria**

- API:
  - `GET /api/v1/update-agent/runs?limit=20` returns last runs (summary + timestamps + status)
- Client:
  - Settings Update Agent panel shows “Last run” + last 5 summaries
  - If last run failed, show a non-scary message + top failure source domain

**Likely files**

- `apps/api/src/routes/update-agent.ts`
- `apps/client/src/components/update-agent/UpdateAgentSettingsPanel.tsx`

**Verification checklist**

- Screenshot: `settings-update-agent-run-history.png`
- API test for shape + limit

---

### 3) Scheduling docs must name exactly one endpoint + document lock semantics

**Acceptance criteria**

- Update docs page to declare the single canonical endpoint (`/api/v1/update-agent/tick`) and:
  - cron example
  - systemd user timer example
  - K8s CronJob example
  - concurrency behavior: 409 when already running

**Likely files**

- `apps/docs/pages/update-agent-scheduling.md`

**Verification checklist**

- `npm run -w @learnflow/api openapi:lint`
- Manual: run tick twice quickly → second 409

---

### 4) WebSocket reconnect/idempotency P0: “end exactly once” per message_id

**Problem**: Spec-level trust requires clients not to see duplicate completions when reconnecting.

**Acceptance criteria**

- Server tracks recent `message_id` completions per user for a short TTL (e.g., 5 minutes).
- If a client resends the same `message_id`:
  - server does **not** emit a second `response.end` for that same message_id
  - server either replays the final cached end payload OR returns an `error` event with `code=duplicate_message`
- Add a WS contract test to prove behavior.

**Likely files**

- `apps/api/src/websocket.ts`
- `apps/api/src/wsHub.ts` (if used for per-user state)
- `apps/api/src/__tests__/ws-contract.test.ts`

**Verification checklist**

- `npm test`
- Manual: send same message twice with same message_id → no duplicate end

---

### 5) Export trust polish: deterministic filenames + ZIP contents test

**Acceptance criteria**

- Export filenames include timestamp + format:
  - `learnflow-export-YYYYMMDD-HHMMSS.md|json|zip`
- ZIP contains:
  - `learnflow-export.md`
  - `learnflow-export.json` (Pro only)
  - `metadata.json` (exportedAt, appVersion, schemaVersion)
- Add an API test that opens the ZIP (JSZip) and asserts entries exist.

**Likely files**

- `apps/api/src/routes/export.ts`
- `apps/api/src/__tests__/export-zip.test.ts` (new or extend)
- `apps/client/src/screens/ProfileSettings.tsx` (copy/UX: explain Pro gating)

**Verification checklist**

- `npm test`
- Manual: click export buttons → correct filenames + downloads

---

## P1 (Should do)

### 6) Deprecate/align `packages/agents/src/update-agent/update-agent.ts`

**Problem**: This file still defines `MockWebSearchProvider` and in-memory subscriptions; server Update Agent is RSS/HTML-based. Keeping this around risks confusion and spec drift.

**Acceptance criteria**

- Either:
  - delete/mark deprecated the mock UpdateAgent implementation, OR
  - refactor it into a thin wrapper around the real RSS/HTML fetch pipeline used by API.
- Ensure imports from `packages/agents/src/index.ts` remain correct.

**Likely files**

- `packages/agents/src/update-agent/update-agent.ts`
- `packages/agents/src/index.ts`

**Verification checklist**

- `npm test` (workspace)
- `npx tsc --noEmit` (or `npm run build` if that’s the repo standard)

---

### 7) WS event envelope parity: ensure _all_ WS events include `{ requestId, message_id }`

**Acceptance criteria**

- `response.start|chunk|end` always include `message_id` and `requestId`
- `error` event includes `message_id` when applicable
- Add contract tests for each.

**Likely files**

- `packages/shared/src/types/ws.ts`
- `apps/api/src/websocket.ts`
- `apps/client/src/screens/Conversation.tsx` (assume invariant; simplify)

---

### 8) Screenshot evidence pack for this iteration (Iter96)

**Acceptance criteria**

- Add/extend screenshot harness to capture:
  - Update Agent run history visible
  - Export section with Pro locks
  - WS conversation roundtrip (optional)
- Output:
  - `learnflow/screenshots/iter96/run-001/*`
  - include `NOTES.md` with exact commands

**Likely files**

- `screenshot-all.mjs` and/or `scripts/screenshots-auth.js`

---

## P2 (Nice to have)

### 9) Update Agent: per-topic “Run now” result summary

**Acceptance criteria**

- Clicking “Run now” shows:
  - topics checked, sources checked, notifications created, failures
- No UI dead-ends.

**Likely files**

- `apps/client/src/components/update-agent/UpdateAgentSettingsPanel.tsx`
- `apps/api/src/routes/update-agent.ts`

---

### 10) Export provenance improvements (credibility + accessedAt surfaced in JSON)

**Acceptance criteria**

- JSON export includes `sources[].credibilityScore/label/whyCredible/accessedAt/domain`
- Add a unit test for schema shape.

**Likely files**

- `apps/api/src/routes/export.ts`
- `apps/api/src/utils/sourceCredibility.ts`

---

## Global verification (Builder)

- `npm test`
- `npm run lint:check`
- `npm run format:check`
- `npm run -w @learnflow/api openapi:lint`
- Screenshots:
  - `SCREENSHOT_DIR=screenshots/iter96/run-001 node screenshot-all.mjs`

## OneDrive sync (Builder — do not skip)

Sync these artifacts to OneDrive per standard destination (`onedrive:Documents/Apps/Learnflow/` or the repo’s documented path):

- `/home/aifactory/.openclaw/workspace/learnflow/IMPROVEMENT_QUEUE.md`
- `/home/aifactory/.openclaw/workspace/learnflow/learnflow/screenshots/iter96/run-001/`
- Any build logs created (`learnflow/BUILD_LOG_ITER96.md`)
