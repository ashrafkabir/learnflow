# LearnFlow — Improvement Queue

Owner: Builder  
Planner: Ash (main session)  
Last updated: 2026-03-27 (Iteration 101 DONE)

---

## Iteration 101 — SPEC ↔ IMPLEMENTATION PARITY AUDIT + HIGH-LEVERAGE FIX LIST

Status: **DONE**

### Summary (Iter101)

Planner label: `iter101/planner-run` (screenshots captured desktop + key mobile).

**3 biggest gaps found**

1. **Subscription & monetization are mock/incomplete vs spec**: Pro is toggled via `/api/v1/subscription` (no Stripe), marketplace checkout is MOCK, “managed keys” is a flag only (no pooled key path). This contradicts Spec §8 and marketplace/payment flows.
2. **Export formats are stubbed vs spec**: Spec promises Pro exports to PDF/SCORM/Notion/Obsidian; API returns 501 for pdf/scorm and there is no Notion/Obsidian integration. UI labels these as “coming soon”, but spec reads as committed functionality.
3. **Behavioral tracking/privacy consent is underspecified in implementation**: Spec §9.3 calls for consent management + “Profile > Data” transparency. UI shows a tracking list + server data summary and supports deletion, but no explicit consent toggles, and event ingestion is unconditional (best-effort POST `/api/v1/events`).

### Screenshot evidence (planner-run)

- Local: `learnflow/screenshots/iter101/planner-run/` (desktop + mobile)
- OneDrive mirror: `~/onedrive-learnflow/learnflow/learnflow/screenshots/iter101/planner-run/`
- Notes/commands: `learnflow/screenshots/iter101/planner-run/NOTES.md`

### P0 (Must fix — spec contradictions that will mislead users)

#### 1) P0 — Decide + implement “Managed API keys” behavior (Pro) or revise spec + UI copy

**Why**: Spec §8 says Pro includes managed (pooled) keys. Current system supports BYOAI key storage (encrypted) and capability matrix exposes `keys.managed`, but there is no real pooled key/provider selection logic exposed for Pro.

**Acceptance criteria**

- Either:
  - (A) Implement a working Pro-managed-key path for at least one provider (e.g., OpenAI) used by server-side LLM calls when no BYOAI key exists, with guardrails + usage attribution, OR
  - (B) Update spec + marketing/pricing copy to clearly state managed keys are not yet available.
- Settings copy is consistent with the chosen behavior.

**Likely files**

- `apps/api/src/lib/capabilities.ts`
- `apps/api/src/llm/*` (`openai.ts`, `providers.ts`, key selection)
- `apps/client/src/screens/ProfileSettings.tsx`
- `LearnFlow_Product_Spec.md` (§8)

**Verification checklist**

- Manual: Pro user without BYOAI key can still generate notes/quiz/research (if (A)).
- Tests: add/adjust API tests for provider selection/attribution.
- Screenshot: Settings “API Vault” state matches reality.

---

#### 2) P0 — Subscription payments: either wire Stripe (minimal) or explicitly mark as mock across UI/spec

**Why**: Marketplace checkout is explicitly MOCK (`apps/api/src/routes/marketplace-full.ts`), and `/api/v1/subscription` directly flips tier (`apps/api/src/routes/subscription.ts`). Spec §8 + marketplace sections describe real monetization.

**Acceptance criteria**

- Either:
  - (A) Implement minimal Stripe integration for subscription _or_ marketplace checkout (one path) with webhooks stubbed safely for local/dev, OR
  - (B) Update spec + UI copy to state payments are mock in MVP and not real billing.
- Ensure “invoices” returned from `/api/v1/subscription` are coherent with chosen approach.

**Likely files**

- `apps/api/src/routes/subscription.ts`
- `apps/api/src/routes/marketplace-full.ts`
- `apps/client/src/screens/marketplace/CourseDetail.tsx` (checkout UX)
- `LearnFlow_Product_Spec.md` (§8, marketplace payment steps)

**Verification checklist**

- API: subscription status endpoints return consistent shapes.
- E2E: marketplace “Enroll/Checkout” flow deterministic (mock or real).
- Screenshots: pricing + marketplace detail reflect correct billing language.

---

#### 3) P0 — Export roadmap honesty: implement one Pro format (PDF or SCORM) end-to-end, or update spec/pricing

**Why**: API export supports Markdown for free and JSON/ZIP for Pro; PDF/SCORM return 501; Notion/Obsidian absent.

**Acceptance criteria**

- Either:
  - (A) Implement at least **one** additional Pro export format end-to-end (PDF _or_ SCORM) with UI button enabled for Pro, OR
  - (B) Update spec + pricing table to align with current export reality (MD/JSON/ZIP only).
- Exports continue to include lesson sources provenance (`apps/api/src/routes/export.ts`).

**Likely files**

- `apps/api/src/routes/export.ts`
- `apps/client/src/screens/ProfileSettings.tsx`
- `packages/agents/src/export-agent/export-agent.ts` (copy/behavior)
- `LearnFlow_Product_Spec.md` (§8 export row)

**Verification checklist**

- Manual: Pro user can click an enabled export button and receive the file.
- Tests: add an export format test (Supertest) and a UI smoke (Playwright).

---

### P1 (High leverage — improves trust + reduces drift)

#### 4) P1 — Consent management for behavioral tracking (Spec §9.3)

**Acceptance criteria**

- Add user-facing toggle(s) for telemetry/behavioral tracking (at least “learning events”).
- When disabled, API should reject/ignore `/api/v1/events` writes for that user (or store nothing).
- Profile > Data reflects consent status + explains what’s stored.

**Likely files**

- `apps/api/src/routes/events.ts` (or wherever `/api/v1/events` is handled)
- `apps/api/src/db.ts` (events tables)
- `apps/client/src/screens/ProfileSettings.tsx`
- `LearnFlow_Product_Spec.md` (§9.3)

**Verification checklist**

- Toggle off → lesson view does not increment “learning events” count.
- Toggle on → events resume.
- Screenshot: Profile Settings privacy section shows consent.

---

#### 5) P1 — WebSocket contract parity with spec §11.2 (attachments/context_overrides)

**Why**: Spec indicates `message` payload includes attachments + context_overrides. Current server validates only `data.text` and ignores those fields.

**Acceptance criteria**

- Server accepts `attachments` and `context_overrides` fields (even if ignored) without errors.
- Document what is supported today via `ws.contract` event and/or docs.

**Likely files**

- `apps/api/src/websocket.ts`
- `apps/api/src/wsOrchestrator.ts`
- `apps/docs/pages/api-reference.md` (if present)
- `LearnFlow_Product_Spec.md` (§11.2)

**Verification checklist**

- Add WS contract test: send envelope with attachments; server still responds.
- Manual: Conversation works unchanged.

---

#### 6) P1 — Collaboration: reconcile spec (“forums/peer matching/study groups”) with what exists

**Acceptance criteria**

- Either implement minimal peer matching/study groups, or update spec + UI labels to match current collaboration screen behavior.
- Ensure deletion (“delete my data”) accounts for collaboration memberships per UI warning.

**Likely files**

- `apps/client/src/screens/Collaboration.tsx`
- `apps/api/src/routes/collaboration*.ts`
- `apps/api/src/routes/delete-my-data.ts`
- `LearnFlow_Product_Spec.md` (§8, §9 social)

**Verification checklist**

- E2E smoke: can create/join a study group (or UI clearly says “coming soon”).
- Screenshot: Collaboration screen updated.

---

### P2 (Cleanups)

#### 7) P2 — Update spec to match current architecture choices (Yjs on dedicated port, ws events, export gating)

**Acceptance criteria**

- Spec reflects:
  - Yjs server runs on separate port (`apps/api/src/index.ts`) and path `/yjs`.
  - WS inbound contract (`ws.contract` event).
  - Export gating is enforced server-side (free: MD only).

**Likely files**

- `LearnFlow_Product_Spec.md`

**Verification checklist**

- Reviewer can reconcile these without code-reading.

---

## Iteration 100 — QUALITY GATES + E2E SEED STABILITY + MINDMAP CRDT RELIABILITY + TSC FIXES

Status: **DONE**

### Biggest gaps (top 3)

1. **TypeScript build is broken**: `npx tsc --noEmit` fails at `apps/api/src/db.ts:1659` (`row.lockId` typing). This violates Spec §15 quality gates and breaks developer trust.
2. **E2E seed course creation is unstable**: multiple E2E suites (`e2e/lesson-map.spec.ts`, `e2e/selection-tools.spec.ts`) fail with `Failed to create seed course: 500`, preventing regression coverage for lesson-map + selection tools.
3. **Mindmap CRDT test is unreliable**: `e2e/mindmap-crdt.spec.ts` fails because the dev-only hook `window.__learnflowMindmapNodes` doesn’t populate / sync deterministically, so real-time collab claims aren’t verifiable.

### Screenshot evidence (planner-run)

- Local: `learnflow/screenshots/iter100/planner-run/` (desktop + mobile)
- OneDrive mirror: `/home/aifactory/onedrive-learnflow/learnflow/learnflow/screenshots/iter100/planner-run/`
- Notes/commands: `learnflow/screenshots/iter100/planner-run/NOTES.md`

### P0 (Must fix — restores Spec §15 quality gates + unblocks E2E)

#### 1) P0 — Fix TypeScript compile error in Update Agent global lock path

**Goal**: `npx tsc --noEmit` must pass again.

**What’s failing**

- `apps/api/src/db.ts(1659,33): error TS2339: Property 'lockId' does not exist on type '{}'`.
- The statement uses `RETURNING lockId` (`stmts.acquireUpdateAgentGlobalRunLock`) so `row` does have a `lockId` at runtime, but TypeScript typing is wrong.

**Acceptance criteria**

- `npx tsc --noEmit` exits 0.
- Update Agent lock acquisition returns typed `{ lockId: string } | null` without `any` casts leaking.

**Likely files**

- `apps/api/src/db.ts` (methods around `acquireUpdateAgentGlobalRunLock` and the `stmts` prepare typing)

**Verification checklist**

- Run: `npx tsc --noEmit`
- Run: `npm test` (at least `apps/api` tests)

---

#### 2) P0 — Stabilize seed course creation endpoint used by E2E (eliminate 500)

**Goal**: E2E tests should never fail because course seeding intermittently 500s.

**Observed failures**

- `e2e/lesson-map.spec.ts` and `e2e/selection-tools.spec.ts` both seed via `POST /api/v1/courses` and can throw `Failed to create seed course: 500`.

**Acceptance criteria**

- In dev + `VITE_DEV_AUTH_BYPASS=1`, `POST /api/v1/courses` is deterministic and never 500s.
- If the upstream agent pipeline fails, the API returns a structured 4xx/5xx with reason and the UI/E2E harness can fall back to fixture generation.

**Likely files**

- `apps/api/src/routes/courses.ts` (course creation)
- `packages/agents/src/course-builder/course-builder-agent.ts` (if invoked)
- `apps/api/src/orchestrator.ts` / chat pipeline used for course creation
- Any “test mode” toggles used for deterministic generation

**Verification checklist**

- Run repeatedly: `for i in {1..20}; do curl -s -o /dev/null -w "%{http_code}\n" -X POST .../api/v1/courses; done` (or Playwright loop)
- Re-run: `npx playwright test e2e/lesson-map.spec.ts e2e/selection-tools.spec.ts`

---

#### 3) P0 — Make Mindmap CRDT E2E assertion deterministic (dev hook or API)

**Goal**: Verify realtime collaboration behavior without relying on canvas DOM.

**Observed failure**

- `e2e/mindmap-crdt.spec.ts` expects `window.__learnflowMindmapNodes` to include `"CRDT Node A"`, but it stays `[]` after 10s.

**Acceptance criteria**

- Expose a dev-only, E2E-only hook that reliably reflects the Yjs doc state (nodes/edges) after sync.
- Or: provide a lightweight `/api/v1/mindmap/:courseId/debug` endpoint in dev auth bypass only.

**Likely files**

- `apps/client/src/screens/MindmapExplorer.tsx` (where Yjs state is managed)
- `apps/api/src/ws.ts` or mindmap websocket bridge
- `e2e/mindmap-crdt.spec.ts`

**Verification checklist**

- `npx playwright test e2e/mindmap-crdt.spec.ts`
- Manual: open 2 tabs on `/mindmap` and confirm edits sync

---

#### 4) P0 — Ensure screenshot harness covers _every_ core screen and does not depend on flaky API

**Goal**: Keep Iter100+ planner runs reproducible.

**Acceptance criteria**

- `node screenshot-all.mjs` runs from clean state and produces all expected PNGs.
- Seeded course routes (`/courses/c-1`, `/courses/c-1/lessons/l1`) must always resolve (fixture-backed) or the harness must create a deterministic local course first.

**Likely files**

- `screenshot-all.mjs`
- `apps/api/src/routes/courses.ts` (seed/fixture)

**Verification checklist**

- `SCREENSHOT_DIR=... node screenshot-all.mjs` on a fresh DB

---

### P1 (Should do — reduce spec drift / UX gaps)

#### 5) P1 — Onboarding flow parity with spec (experience step + “first course” clarity)

**Spec delta**

- Spec §5.2.1 calls for 6 onboarding screens including “experience/level assessment”. Current router redirects `/onboarding/experience` → subscription (`apps/client/src/main.tsx` route table), and the flow lands on `/onboarding/ready`/`first-course` depending.

**Acceptance criteria**

- Either implement an actual experience step UI and persist it, **or** update copy/spec tracker to explicitly mark as MVP deviation.
- The final onboarding step consistently leads to a “create first course” action.

**Likely files**

- `apps/client/src/screens/*` (`Welcome.tsx`, `Goals.tsx`, `Topics.tsx`, `SubscriptionChoice.tsx`, `FirstCourse.tsx`)
- `apps/client/src/main.tsx` (route table)
- `apps/api/src/routes/profile.ts` (context persistence)

**Verification checklist**

- Re-run: `npx playwright test e2e/learning-journey.spec.ts`

---

#### 6) P1 — Selection tools reliability + explicit error surfacing

**Observed**

- Selection tools E2E currently blocked by seed course 500s. Also ensure tool preview/attach flows handle failures without silent no-op.

**Acceptance criteria**

- Preview endpoint always returns a well-formed object (even on failure) including `error` string.
- Attach creates an annotation and the UI reflects it immediately.

**Likely files**

- `apps/api/src/routes/courses.ts` (selection-tools endpoints)
- `apps/client/src/screens/LessonReader.tsx` (selection toolbar + preview drawer)
- `e2e/selection-tools.spec.ts`

**Verification checklist**

- `npx playwright test e2e/selection-tools.spec.ts`

---

#### 7) P1 — Lesson map UX: ensure clicks always produce a meaningful action

**Acceptance criteria**

- Lesson mindmap opens and clicking a node triggers a defined behavior:
  - copy label to clipboard **and/or** open “concept details” drawer.
- If no nodes, show an empty state explaining why.

**Likely files**

- `apps/client/src/screens/LessonReader.tsx` (lesson mindmap)
- `e2e/lesson-map.spec.ts`

**Verification checklist**

- `npx playwright test e2e/lesson-map.spec.ts`
- Screenshot: lesson map open state

---

### P2 (Nice to have — spec honesty + hardening)

#### 8) P2 — Spec compliance suite: persist artifacts for failures and link them from Improvement Queue

**Acceptance criteria**

- When `e2e/spec-compliance.spec.ts` fails `tsc`, the saved `learnflow/screenshots/compliance/tsc-error.txt` is linked from the Iter section.
- Add a short “How to run compliance tests” doc snippet.

**Likely files**

- `e2e/spec-compliance.spec.ts`
- `README.md` or `PROGRESS.md`

---

#### 9) P2 — Update Agent: align marketing/security claims with actual behavior

**Observed**

- Marketing pages claim “API key encryption at rest (AES-256-GCM, AEAD)” and “Now with multi-agent AI pipeline”. Ensure these claims stay true and/or are qualified as MVP.

**Acceptance criteria**

- If any claim becomes untrue, adjust marketing copy or implement missing pieces.

**Likely files**

- `apps/web/src/app/page.tsx` (homepage)
- `apps/client/src/screens/Home.tsx` (marketing content in client)

---

#### 10) P2 — OneDrive sync guardrail (planner-run folder must always mirror)

**Acceptance criteria**

- Add a simple checklist in `screenshots/*/NOTES.md` for rsync paths.

**Verification checklist**

- Confirm files exist at: `/home/aifactory/onedrive-learnflow/learnflow/learnflow/screenshots/iter100/planner-run/`

---

### Iter100 verification (Builder)

- Typecheck: `npx tsc --noEmit`
- Unit tests: `npm test`
- Lint: `npm run lint:check`
- E2E criticals:
  - `npx playwright test e2e/lesson-map.spec.ts e2e/selection-tools.spec.ts e2e/mindmap-crdt.spec.ts e2e/spec-compliance.spec.ts`
- Screenshots:
  - Desktop: `SCREENSHOT_DIR=learnflow/screenshots/iter100/planner-run node screenshot-all.mjs`
  - Mobile: `node screenshot-mobile.mjs` (copy into iter folder)

### OneDrive sync (Planner — completed)

- Synced: `learnflow/screenshots/iter100/planner-run/` → `/home/aifactory/onedrive-learnflow/learnflow/learnflow/screenshots/iter100/planner-run/`

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

---

## Iteration 98 — Spec-to-implementation reality check (Vault/Export/Marketplace/Realtime)

**Status:** DONE

### Top 3 gaps (summary)

1. **Mobile screenshot harness is flaky**: `screenshot-mobile.mjs` crashes during `page.evaluate()` due to navigation teardown; we only captured partial mobile coverage for Iter98.
2. **Vault security + copy are inconsistent**: backend defaults to **AES-256-GCM (AEAD)** (`apps/api/src/crypto.ts`), but UI/marketing still claims **AES-256-CBC / no AEAD**.
3. **Spec claims Pro exports (PDF/SCORM/Notion/Obsidian) and subscription ($14.99)**, but implementation is Markdown/JSON/ZIP only and `/subscription` + marketplace checkout are mock/non-Stripe.

### 1) P0 — Fix mobile screenshot harness crash so Iter98 captures _every_ screen (320/375/414)

**Problem evidence**

- `learnflow/screenshots/iter98/planner-run/NOTES.md`
- Crash: `page.evaluate: Execution context was destroyed...` at `screenshot-mobile.mjs:79`.

**Acceptance criteria**

- `SCREENSHOT_DIR=learnflow/screenshots/iter98/planner-run/mobile SCREENSHOT_AUTHED=true node screenshot-mobile.mjs` completes without exception.
- Produces screenshots for **all pages** in `pages[]` across **all viewports** (`mobile-320`, `mobile-375`, `mobile-414`).

**Likely files**

- `screenshot-mobile.mjs`

**Verification checklist**

- Run command above; confirm non-zero file counts:
  - `find learnflow/screenshots/iter98/planner-run/mobile -type f | wc -l`
- Spot-check 3 screens for each viewport.

---

### 2) P0 — Align Vault encryption copy with actual AEAD implementation (and/or gate copy on encVersion)

**Problem evidence**

- Backend encryption defaults to **v2_gcm**: `apps/api/src/crypto.ts`.
- UI copy: `apps/client/src/screens/ProfileSettings.tsx` claims AES-256-CBC.
- Marketing copy: `apps/client/src/screens/marketing/Home.tsx` says “AES-256-CBC; no AEAD in MVP”.

**Acceptance criteria**

- UI + marketing pages reflect reality:
  - “Encrypted at rest (AES-256-GCM, AEAD)” or more deployment-neutral wording.
- No docs claim “no AEAD” if AEAD is in use.

**Likely files**

- `apps/client/src/screens/ProfileSettings.tsx`
- `apps/client/src/screens/marketing/Home.tsx`
- `apps/client/src/screens/marketing/Docs.tsx`
- `apps/client/src/screens/marketing/About.tsx`

**Verification checklist**

- `rg -n "AES-256-CBC|no AEAD" apps/client/src -S` returns no incorrect claims.
- Re-run Iter98 screenshot harness after copy changes.

---

### 3) P0 — Marketplace billing honesty: surface “MOCK checkout” clearly in UI and API responses

**Problem evidence**

- API explicitly says mock: `apps/api/src/routes/marketplace-full.ts` (checkout + confirm).
- Client note exists but is buried: `apps/client/src/screens/marketplace/CourseDetail.tsx`.

**Acceptance criteria**

- Marketplace Course Detail displays a persistent, unmissable banner/tag when checkout is mock.
- `/api/v1/marketplace/checkout` response includes `mode: 'mock'` (already) and UI uses it.

**Likely files**

- `apps/client/src/screens/marketplace/CourseDetail.tsx`
- `apps/client/src/screens/marketplace/CourseMarketplace.tsx`
- `apps/api/src/routes/marketplace-full.ts`

**Verification checklist**

- Manual: attempt enroll; verify banner shown before purchase.
- E2E: add assertion in a marketplace spec.
- Screenshots: marketplace detail + checkout state.

---

### 4) P0 — Subscription price mismatch: spec says $14.99/mo, UI matrix says $19/mo; reconcile

**Problem evidence**

- Spec: `LearnFlow_Product_Spec.md` §8 says **Pro ($14.99/mo)**.
- Client matrix: `apps/client/src/lib/capabilities.ts` uses `priceMonthlyUsd: 19` and `priceAnnualUsd: 15`.

**Acceptance criteria**

- Decide source of truth (spec vs implementation) and make both consistent.
- Pricing displayed in `/pricing` and subscription UI matches matrix.

**Likely files**

- `LearnFlow_Product_Spec.md` (if updating spec)
- `apps/client/src/lib/capabilities.ts`
- `apps/client/src/screens/marketing/Pricing.tsx` (if exists) / relevant marketing screens

**Verification checklist**

- Screenshots: pricing page shows updated price.
- Unit test (optional): ensure capability matrix values used by pricing.

---

### 5) P0 — Pro export formats: PDF/SCORM/Notion/Obsidian are “coming soon”, but API returns 501; ensure UI doesn’t imply availability

**Problem evidence**

- `/api/v1/export` returns 501 for `pdf|scorm`: `apps/api/src/routes/export.ts`.
- Settings UI shows “Export as PDF/SCORM/Notion/Obsidian” as PRO but “Coming soon” (good) — keep consistent.

**Acceptance criteria**

- No UI path suggests PDF/SCORM/Notion/Obsidian currently work.
- If buttons are added later, wire them to API with clear 501 handling.

**Likely files**

- `apps/api/src/routes/export.ts`
- `apps/client/src/screens/ProfileSettings.tsx`

**Verification checklist**

- Click “coming soon” rows do nothing (cursor-not-allowed ok).
- E2E: assert 501 is handled gracefully if route hit.

---

### 6) P1 — Mindmap plan gating: spec says Free=100 nodes / Pro=unlimited, but implementation shows no node limit gating

**Problem evidence**

- Spec §8: “Mindmap Basic (100 nodes) vs Pro unlimited”.
- No “100 nodes” limit found in codebase; mindmap UI + Yjs appear ungated.

**Acceptance criteria**

- Either implement node cap enforcement for free tier (UI + server) OR update spec/capability matrix to match reality.
- If enforcing: prevent adding nodes beyond cap, with upgrade CTA.

**Likely files**

- `apps/client/src/screens/MindmapExplorer.tsx`
- `apps/client/src/lib/capabilities.ts`
- `apps/api/src/routes/mindmap.ts` and/or `apps/api/src/yjsServer.ts`

**Verification checklist**

- E2E: attempt to add >100 nodes as free → blocked.
- Screenshot: mindmap shows limit messaging.

---

### 7) P1 — Lesson structure enforcement: ensure required headings are hard failures (not just console.warn)

**Problem evidence**

- `apps/api/src/utils/lessonStructure.ts` defines required headings.
- `apps/api/src/routes/courses.ts` currently only `console.warn` when missing.

**Acceptance criteria**

- If a generated lesson misses required sections, regeneration retries must run (or request fails with actionable error) and persisted lesson always complies.

**Likely files**

- `apps/api/src/routes/courses.ts`
- `apps/api/src/utils/stage2Retry.ts` (if used)

**Verification checklist**

- Unit test: force malformed lesson → verify retry/fail.
- E2E: course-quality spec passes.

---

### 8) P1 — Export fidelity: include notes inline in Markdown export (currently payload includes notesByLessonId but Markdown ignores)

**Problem evidence**

- Export payload includes `notesByLessonId` but `coursesToMarkdown()` doesn’t render it: `apps/api/src/routes/export.ts`.

**Acceptance criteria**

- Markdown export includes user notes under each lesson (clearly labeled) when present.

**Likely files**

- `apps/api/src/routes/export.ts`

**Verification checklist**

- Create note → export MD → confirm note present.

---

### 9) P2 — Marketplace agent activation: ensure orchestrator transparently informs first-use per session (spec requirement)

**Problem evidence**

- Spec §10: “Always inform the student when using a marketplace agent for the first time in a session.”
- Need to verify in orchestrator routing / client chat UI (not confirmed in planner run).

**Acceptance criteria**

- On first marketplace-agent invocation in session, UI includes a clear disclosure.

**Likely files**

- `packages/core/src/orchestrator/*`
- `apps/api/src/wsOrchestrator.ts`
- `apps/client/src/screens/Conversation.tsx`

**Verification checklist**

- Unit test: orchestrator chooses marketplace agent → message includes disclosure.

---

### 10) P2 — Update spec vs code: document known MVP stubs (Stripe, exports, mindmap limits) to prevent “spec drift” confusion

**Acceptance criteria**

- Add an explicit “MVP deviations” section to the spec or repo docs listing:
  - mock subscription + checkout
  - export formats supported
  - mindmap limits
  - vault encryption version

**Likely files**

- `LearnFlow_Product_Spec.md` or `README.md`

**Verification checklist**

- Reviewer can quickly understand what is real vs planned.

---

### Iter98 verification (Builder)

- Playwright (screenshots):
  - Desktop: `SCREENSHOT_DIR=learnflow/screenshots/iter98/planner-run SCREENSHOT_AUTHED=true node screenshot.mjs`
  - Mobile: `SCREENSHOT_DIR=learnflow/screenshots/iter98/planner-run/mobile SCREENSHOT_AUTHED=true node screenshot-mobile.mjs`
- Tests:
  - `npm test`
  - `npm run lint:check`

### OneDrive sync (Builder — do not skip)

Sync:

- `/home/aifactory/.openclaw/workspace/learnflow/IMPROVEMENT_QUEUE.md`
- `/home/aifactory/.openclaw/workspace/learnflow/learnflow/screenshots/iter98/planner-run/`
- Mirror location:
  - `/home/aifactory/onedrive-learnflow/learnflow/learnflow/screenshots/iter98/planner-run/`

---

## Iteration 99 — SPEC-TRUTH HARDENING: API STABILITY, MARKETPLACE AGENTS REALITY, EXPORT MATRIX, SCO COVERAGE

Status: **DONE**

### Screenshot evidence (planner-run)

- Local: `learnflow/screenshots/iter99/planner-run/` (desktop + mobile)
- OneDrive mirror: `/home/aifactory/onedrive-learnflow/learnflow/screenshots/iter99/planner-run/`
- Notes/commands: `learnflow/screenshots/iter99/planner-run/NOTES.md`

### Brutally honest spec-vs-impl gaps (Iteration 99 focus)

1. **API can boot “active” but not listen (crash loop risk).** `journalctl --user -u learnflow-api` showed `TypeError: Router.use() requires a middleware function but got a undefined` and stack at `apps/api/src/app.ts:169` (mounting `keysRouter`). After restart it recovered, which suggests a brittle import/compile/runtime mismatch.

2. **Agent Marketplace is partially real, partially demo, and silently ignores failures.** UI (`apps/client/src/screens/marketplace/AgentMarketplace.tsx`) uses a hard-coded `AGENTS` list and activation calls that swallow errors (`catch { // silent fail }`). Spec requires SDK/manifest submission + safety review + capability routing.

3. **Student Context Object is far thinner than spec §9.1.** API `/api/v1/profile/context` (`apps/api/src/routes/profile.ts`) returns a subset and hard-coded defaults (e.g., strengths/weaknesses empty, learningStyle fixed, quizScores empty) and doesn’t include activated agents list even though orchestration uses it (`apps/api/src/orchestratorShared.ts:60`).

4. **Export matrix doesn’t match spec tier table.** Spec §8 says Free=Markdown only; Pro adds PDF/SCORM/Notion/Obsidian. Current API export (`apps/api/src/routes/export.ts`) enforces Free=MD only and Pro=JSON/ZIP + stubs PDF/SCORM (501), but Notion/Obsidian are UI-only placeholders (see `apps/client/src/screens/ProfileSettings.tsx` export modal).

5. **Marketplace creator flow is “MVP plausible” but missing paid-course moderation/billing truth.** Creator dashboard publishes courses via `/api/v1/marketplace/courses` (implemented in `apps/api/src/routes/marketplace-full.ts`), but Stripe is mocked and the moderation queue is just status assignment from `qualityCheck()` (no human review lane).

---

### P0 (Must fix to avoid regressions / spec lies)

#### 1) P0 — Fix API startup crash: ensure `keysRouter` can never be undefined (build/ESM correctness)

**Acceptance criteria**

- API service consistently binds to :3000 on cold start (10 consecutive restarts) without fatal crash.
- Add a unit/integration test that imports app and hits `/api/v1/health` (or existing endpoint) without throwing.
- If `keysRouter` is absent, fail fast with a descriptive error at boot (not mid-request).

**Likely files**

- `apps/api/src/app.ts` (crash observed at line ~169)
- `apps/api/src/keys.ts` (router export)
- `apps/api/src/index.ts` (server boot)
- Build config: `apps/api/tsconfig.json`, `apps/api/package.json` (module/exports)

**Verification checklist**

- `systemctl --user restart learnflow-api` x10 and confirm `ss -ltnp | grep :3000` each time.
- Run API test suite: `npm test` (or `npm run test:api` if present).
- Re-run screenshot harness (desktop) to ensure routes used by UI don’t 500.

#### 2) P0 — Make Agent Marketplace “honest”: load agents from API + do not silently fall back

**Acceptance criteria**

- `AgentMarketplace` fetches `/api/v1/marketplace/agents` and renders returned agents (keep seed list only as a skeleton fallback behind explicit “demo mode” banner).
- Activation flow surfaces errors (toast) and reverts optimistic UI on failure.
- If user is not authenticated, activation CTA prompts login.

**Likely files**

- `apps/client/src/screens/marketplace/AgentMarketplace.tsx`
- `apps/api/src/routes/marketplace-full.ts` (`GET /agents`, `GET /agents/activated`, `POST /agents/:id/activate`)
- `apps/client/src/lib/api.ts` (helper)

**Verification checklist**

- Screenshot: marketplace-agents shows server agents.
- Simulate 401 from API: user sees clear prompt.
- Add/adjust test: basic render with mocked fetch.

#### 3) P0 — Align SCO source-of-truth: `/profile/context` must include activated agents + behavioral fields used by Orchestrator

**Acceptance criteria**

- `/api/v1/profile/context` returns `preferredAgents` (activated marketplace agents) and key fields from spec §9.1 (interests/browseHistory/searchQueries/bookmarks, subscription/apiKeyProvider, collaboration settings).
- Client hydration uses the API SCO as canonical (no divergence between core orchestrator context and UI context).

**Likely files**

- `apps/api/src/routes/profile.ts`
- `apps/api/src/orchestratorShared.ts`
- `apps/client/src/context/AppContext.tsx` (hydration)
- `packages/core/src/context/student-context.ts`

**Verification checklist**

- Contract test: `GET /api/v1/profile/context` contains `preferredAgents: string[]` and `subscriptionTier`.
- WS: `agent.spawned.task_summary` reflects activated agents.
- Screenshot: Settings → Data summary shows expanded fields (if UI exists).

#### 4) P0 — Export tier matrix: enforce spec and remove misleading UI options

**Acceptance criteria**

- Free tier: Markdown export works.
- Pro tier: JSON + ZIP work; PDF/SCORM show “Coming soon” but only if spec allows; Notion/Obsidian options are either removed or clearly labeled as “Planned (not yet available)”.
- UI export modal matches server reality (no dead buttons).

**Likely files**

- `apps/client/src/screens/ProfileSettings.tsx` (export UI)
- `apps/api/src/routes/export.ts` (capabilities + error messages)

**Verification checklist**

- Screenshots: Settings export modal for free vs pro.
- API: `GET /api/v1/export?format=zip` as free returns 403 upgrade_required.

---

### P1 (High leverage spec coverage)

#### 5) P1 — Agent SDK submission path: manifest validation + basic “security review” stub

**Acceptance criteria**

- `/api/v1/marketplace/agents/submit` validates a minimal manifest schema (name, version, capabilities, provider requirements).
- Store submissions with statuses: pending/approved/rejected with reason.
- Admin-only approve endpoint (even if only dev-admin) so flow is testable.

**Likely files**

- `apps/api/src/routes/marketplace-full.ts` (agent submissions exist but validation/review depth is shallow)
- `packages/core/src/agents/types.ts` (capabilities typing)

**Verification checklist**

- API tests for submit→approve→list.
- UI: Agent marketplace can show community vs official badge (optional).

#### 6) P1 — Marketplace course “paid” truth table: gate paid-course publishing to Pro tier

**Acceptance criteria**

- If `price > 0`, only Pro creators can publish (spec §8: Free courses only on free tier).
- Response includes clear error `upgrade_required` for free tier.

**Likely files**

- `apps/api/src/routes/marketplace-full.ts` (publish route)
- `apps/client/src/screens/marketplace/CreatorDashboard.tsx` (publish step copy)

**Verification checklist**

- API test: free tier publish paid course -> 403.
- Screenshot: publish form shows gating message.

#### 7) P1 — Moderation queue UX (minimal): show “Under review” state + admin approve

**Acceptance criteria**

- Creator dashboard shows “Under Review” for courses with status `review`.
- Add admin screen or admin action to approve/reject.

**Likely files**

- `apps/client/src/screens/marketplace/CreatorDashboard.tsx`
- `apps/api/src/routes/marketplace-full.ts`

**Verification checklist**

- E2E: publish course failing QC -> appears as under_review.

#### 8) P1 — Privacy spec hooks: “view everything tracked” screen should reflect server data

**Acceptance criteria**

- Profile → Data (or equivalent) renders `/api/v1/profile/data-summary` output (exists today), including origins.
- Add “Delete my data” confirmation flow if not already wired.

**Likely files**

- `apps/api/src/routes/profile.ts` (`/data-summary` exists)
- `apps/api/src/routes/delete-my-data.ts`
- `apps/client/src/screens/ProfileSettings.tsx`

**Verification checklist**

- Screenshot: Settings → Data Summary populated.
- API: data-summary returns expected counts.

---

### P2 (Polish / reduce drift)

#### 9) P2 — Fix screenshots harness determinism: ensure dev auth toggles are documented and consistent

**Acceptance criteria**

- `LEARNFLOW_DEV_AUTH` behavior clearly documented for REST + WS.
- Harness scripts set env explicitly so runs don’t depend on user shell state.

**Likely files**

- `apps/api/src/websocket.ts` (dev token requires LEARNFLOW_DEV_AUTH)
- `screenshot-all.mjs`, `screenshot-mobile.mjs`
- `DEV_PORTS.md` / README

**Verification checklist**

- Fresh shell: run screenshot harness and confirm it completes.

#### 10) P2 — Spec cleanup: annotate planned vs implemented for exports + marketplace billing

**Acceptance criteria**

- Add “Implemented in MVP” vs “Planned” notes to spec sections §7–§9 and §8 export table.

**Likely files**

- `LearnFlow_Product_Spec.md`

**Verification checklist**

- Reviewer can reconcile UI/API behavior with spec in <5 minutes.

#### 11) P2 — Marketing site parity: ensure all pages listed in spec §12 exist and nav is consistent

**Acceptance criteria**

- Pages exist: Home/Features/Pricing/Marketplace/Docs/Blog/About/Download.
- No dead links; basic responsive.

**Likely files**

- `apps/web/*`

**Verification checklist**

- Screenshot harness already covers key pages; add any missing routes.

#### 12) P2 — WS contract alignment: confirm event payloads match spec §11.2 or document differences

**Acceptance criteria**

- Update WS contract tests if spec expects fields not present.
- Document any deltas (e.g., `ws.contract` event).

**Likely files**

- `apps/api/src/websocket.ts`
- `apps/api/src/__tests__/ws-contract.test.ts`
- `LearnFlow_Product_Spec.md`

**Verification checklist**

- `npm test` passes.
- Manual WS smoke: Conversation shows streaming + agent activity pills.

---

## Iteration 102 — Spec ↔ Implementation Audit (re-run) + Builder Task List

Status: **DONE**

### Completed tasks

- **P0 — Marketplace publish gating (spec aligned)**
  - Policy: Free can publish **free** courses only (price=0). Pro can publish free + **paid**.
  - Implemented in capability matrices (client + api) and enforced server-side in `/api/v1/marketplace/publish`.
  - Tests updated/added.

- **P2 — Screenshot harness output naming**
  - `screenshot-all.mjs` now supports `--outDir` (and `--out`) and no longer hardcodes historical iter folder naming.

### Evidence

- Local screenshots: `learnflow/screenshots/iter102/run-001/`
- OneDrive mirror: `~/onedrive-learnflow/learnflow/learnflow/screenshots/iter102/run-001/`
- Build log: `BUILD_LOG_ITER102.md`
