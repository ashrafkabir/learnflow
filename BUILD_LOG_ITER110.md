# BUILD LOG — Iteration 110 (Builder)

Date: 2026-03-27
Builder: learnflow-builder-110b

## Scope
Execute remaining Iter110 tasks from `IMPROVEMENT_QUEUE.md` in order. After each task: run tests, capture Playwright screenshots under `learnflow/screenshots/iter110/run-001/`, and sync artifacts to OneDrive.

---

## Task 2 (P0) — Marketing honesty pass (qualify URL + “real web sources” claims)

### Changes
- Updated marketing copy to match MVP behavior and remove implied “paste any URL” ingestion.
  - `apps/client/src/screens/marketing/Features.tsx`
    - Step 1: replaced “Enter any topic or paste a URL…” with topic-only + “URL ingestion planned” phrasing.
  - `apps/client/src/screens/marketing/Home.tsx`
    - Hero description: clarified “public web sources with citations (best-effort)” instead of hard “sourced from the real web.”

### Tests
- `npm test` — PASS

### Screenshots
- Captured full desktop run to `learnflow/screenshots/iter110/run-001/` (includes marketing pages).

### OneDrive sync
- Synced `learnflow/screenshots/iter110/run-001/` to `/home/aifactory/onedrive-learnflow/learnflow/screenshots/iter110/run-001/`.

---

## Task 3 (P0) — Secrets hardening: fail fast if ENCRYPTION_KEY/JWT_SECRET are defaults in non-dev

### Changes
- Added boot-time validation for `JWT_SECRET` in production (must be set and must not equal dev fallback).
  - `apps/api/src/index.ts`
    - If `NODE_ENV=production` and `JWT_SECRET` missing or equals `learnflow-dev-secret-change-in-production`, process exits with a clear error.
  - Note: ENCRYPTION_KEY prod validation already existed and remains unchanged.

### Tests
- `npm test` — PASS

### Screenshots
- Captured full desktop run to `learnflow/screenshots/iter110/run-001/`.

### OneDrive sync
- Synced `learnflow/screenshots/iter110/run-001/` to OneDrive path.

---

## Task 4 (P1) — Export UI consistency: remove PDF/SCORM from settings until implemented

### Changes
- Removed “PDF” and “SCORM” from the disabled “Coming soon” export list in Settings.
  - `apps/client/src/screens/ProfileSettings.tsx`

### Tests
- `npm test` — PASS

### Screenshots
- Captured full desktop run to `learnflow/screenshots/iter110/run-001/`.

### OneDrive sync
- Synced updated screenshots folder + updated `ProfileSettings.tsx` to OneDrive.

---

## Task 5 (P0) — Agent Marketplace: add spec-consistent disclosure in UI

### Changes
- Added an in-product disclosure banner to clarify MVP behavior: marketplace activation influences routing, but built-in agents execute at runtime.
  - `apps/client/src/screens/marketplace/AgentMarketplace.tsx`

### Tests
- `npm test` — PASS

### Screenshots
- Captured full desktop run to `learnflow/screenshots/iter110/run-001/`.

### OneDrive sync
- Synced updated screenshots folder + updated `AgentMarketplace.tsx` to OneDrive.

---

## Task 6 (P1) — Update Agent scheduling docs link: avoid dead route

### Changes
- Updated “Scheduling docs” link in Update Agent settings panel to route to existing `/docs` page (was `/docs/update-agent-scheduling`, which 404s).
  - `apps/client/src/components/update-agent/UpdateAgentSettingsPanel.tsx`

### Tests
- `npm test` — PASS

### Screenshots
- Captured full desktop run to `learnflow/screenshots/iter110/run-001/`.

### OneDrive sync
- Synced updated screenshots folder + updated `UpdateAgentSettingsPanel.tsx` to OneDrive.

---

## Task 7 (P1) — Update Agent: expose per-topic “Run selected topic only” (advanced)

### Notes
- This is an advanced/debug action. It uses legacy `POST /api/v1/notifications/generate` and only checks the selected topic.

### Changes
- Added a secondary action in the Update Agent settings panel to run only the selected topic via legacy `POST /api/v1/notifications/generate`.
  - Kept “Run now” as the canonical scheduler entrypoint (`POST /api/v1/update-agent/tick`).
  - `apps/client/src/components/update-agent/UpdateAgentSettingsPanel.tsx`

### Tests
- `npm test` — PASS

### Screenshots
- Captured updated screenshots (mobile set) to `learnflow/screenshots/iter110/run-001/mobile`.

### OneDrive sync
- Synced `learnflow/screenshots/iter110/run-001/` to `/home/aifactory/onedrive-learnflow/learnflow/screenshots/iter110/run-001/`.

---

## Task 8 (P1) — Marketplace publishing QC: compute QC fields server-side when courseId provided

### Notes
- QC computations are best-effort and based on current course JSON structure (`course.modules[*].lessons`) to avoid adding new schema/migrations in Iter110.

### Changes
- Extended marketplace publish schema to accept optional `courseId`.
- When `courseId` is provided and refers to a course owned by the user:
  - Recompute `lessonCount` from `course.modules[*].lessons`.
  - Recompute `attributionCount` from structured `lesson.sources[]` URLs when present, else fall back to unique inline citation markers like `[1]`.
  - Recompute `readabilityScore` as a best-effort 0..1 heuristic to avoid client spoofing extremes.
- Persist recomputed QC values on the published course record.
  - `apps/api/src/routes/marketplace-full.ts`

- Softened marketing copy on homepage to avoid promising universal “real web sources” behavior.
  - `apps/client/src/screens/marketing/Home.tsx`

### Tests
- `npm test` — PASS

### Screenshots
- Captured updated screenshots (mobile set) to `learnflow/screenshots/iter110/run-001/mobile`.

### OneDrive sync
- Synced `learnflow/screenshots/iter110/run-001/` to OneDrive.



---

## Task 9 (P1) — Pro managed keys: reconcile spec/docs copy with current behavior

### Additional UI
- Added a dedicated Notifications screen route (`/notifications`) linked from the mobile nav.
  - `apps/client/src/screens/Notifications.tsx`
  - `apps/client/src/App.tsx`
  - `apps/client/src/components/MobileNav.tsx`

### Notes
- We already implement AES-256-GCM for API-key encryption (`apps/api/src/crypto.ts`). This task updates docs/copy to match reality.

### Changes
- Clarified marketing docs copy: managed keys may be available for Pro depending on server configuration (not guaranteed in OSS/dev).
  - `apps/client/src/screens/marketing/Docs.tsx`
- Fixed security doc to match implementation: API keys are encrypted at rest with AES-256-GCM (AEAD).
  - `apps/docs/pages/privacy-security.md`
- Softened marketing Features copy (“Real web sources”) to match best-effort behavior.
  - `apps/client/src/screens/marketing/Features.tsx`

### Tests
- `npm test` — PASS

### Screenshots
- Captured updated screenshots (desktop + mobile) to `learnflow/screenshots/iter110/run-001/` (incl. Notifications screen in desktop set).

### OneDrive sync
- Synced `learnflow/screenshots/iter110/run-001/` to OneDrive.
