# LearnFlow — Improvement Queue (Iteration 71)

Status: **READY FOR BUILDER (iter71)**

Owner: Builder  
Planner: Ash (planner subagent)  
Date: 2026-03-23

This queue is a **brutally honest** spec-vs-implementation gap list versus `LearnFlow_Product_Spec.md` (Sections **1–17**), focused for Iteration 71 on closing **WS-07 (API Layer)** gaps, especially:

- Standard **error envelope + requestId** across **REST + WebSocket**
- **Zod validation middleware** across `/api/v1`
- **OpenAPI parity + lint**
- **WS auth + rate limiting parity**
- systemd service **log cleanup**
- **WS contract tests**
- **API reference docs stub**
- **loadtest harness placeholder**

---

## Reality check: Spec §§1–17 vs implementation (as of this planner run)

High-level: the repo is a working **React/Vite client + Express API + SQLite-ish in-memory/JSON persistence patterns + WebSocket chat + Yjs mindmap** MVP. It is **not** the spec’s envisioned multi-service, gRPC-internal, production-hardened architecture.

Brutal truths (relevant to WS-07):

- **REST error envelope exists** (`apps/api/src/errors.ts` → `{ error:{code,message,details?}, requestId, status? }`) and rate-limit errors use it.
- **WS error envelope is implemented in server code**, but the **shared WS type contract is out of date**: `packages/shared/src/types/ws.ts` still defines `event:'error'` as `{ message: string }` (does not match actual emitted `{ error:{code,message,details?}, requestId, message_id? }`). This is a correctness gap.
- **RequestId** is present for REST via middleware, and WS generates requestIds ad-hoc (`ws-<timestamp>`). There is **no single shared generator** across REST+WS.
- **Zod validation is implemented route-by-route**, not as a uniform middleware. Many routes already safeParse, but consistency and shared helpers are missing.
- **OpenAPI exists** (`apps/api/openapi.yaml`) but is **clearly incomplete** vs the implemented route set; it also does not mention error envelope/requestId. There is **no spec lint/validation step**.
- **WS rate limiting parity**: REST is tiered rate limited in `app.ts`. WS message handling currently **does not** use the same limiter.
- **systemd dev services** run, but logs show recurring noise:
  - API service shows `EADDRINUSE` on port 3000 while the unit remains “active” (port is actually owned by an older `node` pid).
  - Web service logs show `npm error ENOWORKSPACES` (“This command does not support workspaces.”) even though Next continues to become ready. This is log pollution and hides real failures.

---

## Iteration 71 — Prioritized tasks (10–15)

### P0 — MUST DO (ship these first)

#### 1) P0 — Standardize **ErrorEnvelope + requestId** across REST + WS (single source of truth)

Status: ✅ **DONE (builder run-1)** — WS requestIds now generated via `apps/api/src/errors.ts:createRequestId()` (shared with REST)

Acceptance criteria:

- REST errors remain (or become) strictly:
  - `{ error: { code: string, message: string, details?: any }, requestId: string }` (status may remain internal or included; but be consistent and documented).
- WS `error` event uses the **same envelope** and includes `message_id` when tied to a client message.
- A **single request id generator** is used by both REST middleware and WS error emission.

Likely files:

- `apps/api/src/errors.ts` (source-of-truth types/helpers)
- `apps/api/src/websocket.ts` and `apps/api/src/wsOrchestrator.ts` (WS error emission)
- `packages/shared/src/types/ws.ts` (fix contract)
- `packages/shared/src/types/api.ts` (if a shared `ErrorEnvelope` type is introduced)

Test plan:

- Add/extend tests:
  - REST: 400/401/404/429/500 return envelope + requestId.
  - WS: invalid JSON → `error` event envelope includes requestId and code.
- Run: `npm test`.

Screenshot checklist:

- None.

---

#### 2) P0 — Fix **shared WS contract types** to match server reality (breaking mismatch today)

Acceptance criteria:

- `packages/shared/src/types/ws.ts` defines `event:'error'` as:
  - `{ event:'error', data: { error:{code,message,details?}, requestId, message_id? } }`
- API uses these shared types (best-effort) or at least aligns payload structure.

Likely files:

- `packages/shared/src/types/ws.ts`
- `apps/api/src/wsContract.ts` (re-export already exists)
- Client WS handling (wherever it discriminates on `error` payload)

Test plan:

- Typecheck compilation: `npx tsc --noEmit`.
- Add a contract unit test that imports shared type and asserts a sample payload is assignable.

Screenshot checklist:

- None.

---

#### 3) P0 — Introduce **Zod validation middleware helpers** and apply to all `/api/v1` routes

Status: ✅ **DONE (builder run-3)** — migrated remaining `/api/v1` routes to `validateBody/validateQuery/validateParams` (plus `validateQueryFrom` for query aliases)

Acceptance criteria:

- A shared utility exists (example):
  - `validateBody(schema)`, `validateQuery(schema)`, `validateParams(schema)`
- All routes use the helpers (or a consistent pattern) and return:
  - HTTP 400 with **standard error envelope** + flattened field errors.
- No route silently accepts unknown/untyped payloads.

Likely files:

- `apps/api/src/validation.ts` (new)
- `apps/api/src/routes/*.ts`, `apps/api/src/auth.ts`, `apps/api/src/keys.ts`, `apps/api/src/yjsRouter.ts`

Test plan:

- Add at least one regression test per major router:
  - `POST /api/v1/courses` missing fields → 400 with validation error.
  - `POST /api/v1/marketplace/...` invalid query/body → 400.
- Run: `npm test`.

Screenshot checklist:

- None.

---

#### 4) P0 — **OpenAPI parity**: update spec to cover _implemented_ endpoints + schemas + error envelopes

Status: 🟡 **IN PROGRESS (builder run-4)** — OpenAPI lint wired (see P0-5); parity updates pending

Acceptance criteria:

- `apps/api/openapi.yaml` documents all implemented endpoints under `/api/v1` (not just auth/keys/chat/courses).
- OpenAPI includes:
  - `components.securitySchemes.bearerAuth`
  - `components.schemas.ErrorEnvelope`
  - error responses (`4xx/5xx`) reference `ErrorEnvelope` consistently
  - major resource schemas: Course, Lesson, Notification, MarketplaceCourse, etc.
- No obvious drift: endpoints present in server but missing in OpenAPI.

Likely files:

- `apps/api/openapi.yaml`
- `apps/api/src/app.ts` (route inventory reference)

Test plan:

- Add a test that enumerates implemented route prefixes and asserts they appear in openapi (best-effort allowlist).
- Run: `npm test`.

Screenshot checklist:

- None.

---

#### 5) P0 — Add **OpenAPI lint/validation** to CI (fail fast on invalid YAML/spec)

Status: ✅ **DONE (builder run-4)** — added `apps/api/.redocly.yaml` + `npm run -w @learnflow/api openapi:lint`

Acceptance criteria:

- New script exists (choose one):
  - `npm run openapi:lint` using `@redocly/cli` or `swagger-cli`
- CI/test pipeline runs it (at least locally as part of `npm test` or a new root script).

Likely files:

- `apps/api/package.json` (script)
- root `package.json` (wire script)

Test plan:

- Run: `npm run openapi:lint` and ensure exit 0.

Screenshot checklist:

- None.

---

#### 6) P0 — Add **WS rate limiting** with tier parity (free/pro) + standard WS error on 429

Acceptance criteria:

- WS `message` events are rate limited per user tier similarly to REST limits.
- When rate limited, WS emits `event:'error'` with:
  - `error.code='rate_limit_exceeded'`
  - includes `requestId`, and `message_id` of the message that was rejected.
- Limiter logic is shared (or at least uses same configuration constants).

Likely files:

- `apps/api/src/app.ts` (extract shared limiter core)
- `apps/api/src/wsOrchestrator.ts` (apply limiter)
- `apps/api/src/websocket.ts` (if connection-level limits are added)

Test plan:

- Add a WS test that spams messages and asserts `rate_limit_exceeded` appears.
- Run: `npm test`.

Screenshot checklist:

- None.

---

#### 7) P0 — systemd service **log cleanup + real health** (fix EADDRINUSE + ENOWORKSPACES noise)

Acceptance criteria:

- `systemctl --user status learnflow-api` shows a single listener on port 3000 owned by the unit.
- `learnflow-web` no longer logs `ENOWORKSPACES` during normal start.
- Provide a short doc note in-repo explaining why and how (so it doesn’t regress).

Likely files:

- `~/.config/systemd/user/learnflow-api.service`
- `~/.config/systemd/user/learnflow-web.service`
- `apps/web/package.json` and/or root scripts (where workspace-incompatible npm subcommands are used)
- `DEV_PORTS.md` (append “common failure modes”)

Test plan:

- `systemctl --user restart learnflow-api learnflow-client learnflow-web`
- `journalctl --user -u learnflow-api -n 80 --no-pager`
- `journalctl --user -u learnflow-web -n 80 --no-pager`
- `ss -ltnp | egrep ":3000|:3001|:3003"`

Screenshot checklist:

- None.

---

### P1 — SHOULD DO

#### 8) P1 — WS **contract tests** for Spec §11.2 events (shape + minimum ordering)

Acceptance criteria:

- Tests validate that sending `event:'message'` yields:
  - `response.start` then ≥1 `response.chunk` then `response.end`
  - includes `agent.spawned` and ≥1 `agent.complete`
- Tests validate payload fields match shared types.

Likely files:

- `apps/api/src/__tests__/api-layer.test.ts` (extend) or new `ws-contract.test.ts`
- `packages/shared/src/types/ws.ts`

Test plan:

- Run: `npm test`.

Screenshot checklist:

- None.

---

#### 9) P1 — Add **REST+WS requestId propagation** policy (docs + headers)

Acceptance criteria:

- REST always sets `x-request-id` response header and accepts inbound `x-request-id`.
- WS handshake or messages optionally accept a `requestId` in payload; if provided, server echoes it back in envelopes.
- Documented behavior in API reference stub.

Likely files:

- `apps/api/src/errors.ts`
- `apps/api/src/websocket.ts`, `apps/api/src/wsOrchestrator.ts`
- Docs (see Task 11)

Test plan:

- Add tests verifying header echo.
- WS test with client-provided requestId.

Screenshot checklist:

- None.

---

#### 10) P1 — Add **auth error parity**: ensure 401/403 consistently use standard envelope

Acceptance criteria:

- All auth-related failures return the standard envelope (not ad-hoc JSON).
- `requireTier('pro')` and other RBAC failures return `error.code` that’s stable/documented (e.g., `forbidden`, `insufficient_tier`).

Likely files:

- `apps/api/src/middleware.ts`
- `apps/api/src/errors.ts`

Test plan:

- Extend auth/RBAC tests.
- Run: `npm test`.

Screenshot checklist:

- None.

---

#### 11) P1 — Create **API Reference docs stub** (REST + WS) pointing at OpenAPI

Acceptance criteria:

- A docs page exists with:
  - Base URLs (dev)
  - Auth (JWT)
  - Rate limits by tier (REST + WS)
  - Error codes + envelope examples
  - WS event list (Spec §11.2) + example transcript
  - Link to `apps/api/openapi.yaml`

Likely files:

- `apps/docs` (preferred) or `apps/web` docs route

Test plan:

- `npm test` (if docs tests exist)
- manual: open docs route and confirm renders.

Screenshot checklist:

- Add screenshot via harness if docs has a route (otherwise skip).

---

#### 12) P1 — Add **OpenAPI/implementation drift test** (route inventory smoke)

Acceptance criteria:

- A test fails if:
  - a new router is added under `/api/v1/*` but OpenAPI is not updated.
- Implementation approach can be best-effort allowlist of expected prefixes.

Likely files:

- `apps/api/src/__tests__/openapi-parity.test.ts` (new)
- `apps/api/openapi.yaml`

Test plan:

- Run: `npm test`.

Screenshot checklist:

- None.

---

### P2 — NICE TO HAVE (but valuable for WS-07 completeness)

#### 13) P2 — Create **loadtest harness placeholder** (k6 or Artillery) for 1 REST + 1 WS scenario

Acceptance criteria:

- `npm run loadtest:smoke` exists and can:
  - call `/health`
  - call `/api/v1/chat` in dev/mock mode
  - open `/ws` and send one message; verify at least `response.end`
- Produces a short summary.

Likely files:

- `apps/api/loadtest/` (new)
- `apps/api/package.json` scripts

Test plan:

- Run: `npm run loadtest:smoke`.

Screenshot checklist:

- None.

---

#### 14) P2 — Standardize **success envelope (optional)** without breaking clients

Acceptance criteria:

- Introduce `{ data, requestId }` for _new_ endpoints or behind a flag/header.
- Existing client expectations continue to pass.

Likely files:

- `packages/shared/src/types/api.ts`
- selected routes

Test plan:

- `npm test`

Screenshot checklist:

- Ensure screenshot harness still passes.

---

#### 15) P2 — WS backpressure/ordering note (document, don’t overbuild)

Acceptance criteria:

- Document known WS limitations (no delivery guarantees, naive chunking, etc.).
- Add a small unit test for chunk sizing to prevent regression.

Likely files:

- Docs page (Task 11)
- `apps/api/src/wsOrchestrator.ts`

Test plan:

- `npm test`

Screenshot checklist:

- None.

---

## Evidence pack (Iteration 71 planner run)

### 1) Spec read (FULL, sections 1–17)

- Read full spec file: `/home/aifactory/.openclaw/workspace/learnflow/LearnFlow_Product_Spec.md`
  - Sections 1–17 verified present (ends at Appendix).

### 2) Code inspected (WS-07 focus)

- REST error envelope + requestId: `apps/api/src/errors.ts`, `apps/api/src/app.ts`
- WS server + WS orchestrator: `apps/api/src/websocket.ts`, `apps/api/src/wsOrchestrator.ts`
- Shared WS types: `packages/shared/src/types/ws.ts`
- OpenAPI: `apps/api/openapi.yaml`

### 3) System boot + screenshots

Commands executed:

- `systemctl --user restart learnflow-api learnflow-client learnflow-web || true`
- `cd /home/aifactory/.openclaw/workspace/learnflow && SCREENSHOT_DIR=screenshots/iter71/planner-run node screenshot-all.mjs`

Screenshots saved to:

- Workspace: `/home/aifactory/.openclaw/workspace/learnflow/screenshots/iter71/planner-run/`
  - Includes: `app-dashboard.png`, `app-conversation.png`, `app-mindmap.png`, `course-view.png`, `lesson-reader.png`, etc.

### 4) Verification commands (required)

Commands executed:

- `npm test` ✅ (Vitest/turbo) — **22 test files, 140 tests passed**
- `npx tsc --noEmit` ✅
- `npx eslint .` ✅
- `npx prettier --check .` ✅

### 5) Ops evidence (systemd / ports)

- `systemctl --user status learnflow-api learnflow-client learnflow-web` shows:
  - API: `EADDRINUSE` on port 3000 in logs
  - Web: `npm error ENOWORKSPACES` noise
- `ss -ltnp | egrep ":3000|:3001|:3003"` shows:
  - 3000 is held by an older `node` pid (not the current unit pid)

---

## OneDrive sync (required)

This file and screenshots are mirrored by the planner step:

- `/home/aifactory/onedrive-learnflow/learnflow/IMPROVEMENT_QUEUE.md`
- `/home/aifactory/onedrive-learnflow/learnflow/learnflow/learnflow/screenshots/iter71/planner-run/`
