# BUILD_LOG — Iteration 45 (Builder)

**Date:** 2026-03-19  
**Iteration:** 45

## Scope

Execute the Iteration 45 Improvement Queue in order.

Hard constraints honored:

- Ports kept stable: **3000 / 3001 / 3003**
- After each task: ran **tsc**, **vitest**, **eslint**
- Captured Playwright screenshots after relevant tasks
- Sync artifacts to `/home/aifactory/onedrive-learnflow/iteration-45/` after each task

---

## Task 1 (P0): Fix screenshot automation so it produces fresh iter45 artifacts

### Root cause

The screenshot scripts had **hardcoded iter38 output directories** and did **not create output directories**, so `node screenshot*.mjs --out ...` either:

- ignored the `--out` argument entirely, and/or
- failed to write screenshots when the directory didn’t exist.

### Fix implemented

Updated these scripts to:

- support `--out` (and `--base`/`--baseUrl`) CLI args
- use `SCREENSHOT_DIR` / `SCREENSHOT_BASE_URL` env overrides
- default output directories to **iter45** (not iter38)
- `mkdir -p` the output directory via `fs.mkdirSync(..., { recursive: true })`

Files changed:

- `learnflow/screenshot.mjs`
- `learnflow/screenshot-mobile.mjs`
- `learnflow/screenshot-web.mjs`

### Verification (screenshots)

Commands executed:

- `node screenshot.mjs --out evals/screenshots/iter45-desktop --base http://localhost:3001`
- `node screenshot-mobile.mjs --out evals/screenshots/iter45-mobile --base http://localhost:3001`
- `node screenshot-web.mjs --out evals/screenshots/iter45-web --base http://localhost:3003`

Results:

- Fresh screenshots created successfully under:
  - `evals/screenshots/iter45-desktop/`
  - `evals/screenshots/iter45-mobile/`
  - `evals/screenshots/iter45-web/`

### Required checks

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅ (377 tests)
- `npx eslint .` ✅

### Sync

Copied updated log + queue + new screenshot folders to:

- `/home/aifactory/onedrive-learnflow/iteration-45/`

---

## Task 2 (P0): Install/add ripgrep (rg) OR remove dependency

### Constraint

No sudo available on this host, so system package install was not possible.

### Fix implemented (repo-local)

- Added dev dependency: `@vscode/ripgrep`
- Added a repo-local wrapper script: `learnflow/rg` that executes the vendored rg binary
- Added a short note: `learnflow/RG.md`

Usage:

- `./rg "pattern" path/`

### Required checks

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅
- `npx eslint .` ✅

### Sync

Copied updated log + queue + screenshots to:

- `/home/aifactory/onedrive-learnflow/iteration-45/`

---

## Task 3 (P0): Onboarding “API Keys” validates + persists keys via API

### Problem

`OnboardingApiKeys` only stored the key in local React state and never called:

- `POST /api/v1/keys/validate`
- `POST /api/v1/keys`

So onboarding could not actually save BYOAI keys.

### Fix implemented

Updated `apps/client/src/screens/onboarding/ApiKeys.tsx` to:

- add a **provider selector** (`openai | anthropic | google`)
- add validation + save flow:
  - `POST /api/v1/keys/validate` (shows toast error on failure)
  - `POST /api/v1/keys` (persists encrypted key server-side)
- show clear **success / error** states via toasts
- keep “Skip for now” behavior when no key is entered

### Required checks

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅ (377 tests)
- `npx eslint .` ✅

### Artifacts

- Updated desktop screenshots captured to `evals/screenshots/iter45-desktop/`

### Sync

Copied updated log + queue + screenshots to:

- `/home/aifactory/onedrive-learnflow/iteration-45/`

---

## Task 4 (P0): Marketing website `/features` 500 fixed

### Root cause

Next dev server was serving an **inconsistent / stale `.next` build artifact** where SSR attempted to `require('./135.js')` from `apps/web/.next/server/`.
In our output, chunk `135.js` actually lived under `apps/web/.next/server/chunks/135.js`, so requests to most marketing routes failed with 500.

### Fix implemented

Cleaned the Next build output and restarted the marketing site service:

- `systemctl --user stop learnflow-web.service`
- `rm -rf apps/web/.next`
- `systemctl --user start learnflow-web.service`

### Verification

- `GET http://localhost:3003/features` → **200**
- `GET http://localhost:3003/download` → **200**

### Required checks

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅
- `npx eslint .` ✅

### Artifacts

- Fresh marketing screenshots captured to `evals/screenshots/iter45-web/`

### Sync

Copied updated log + queue + screenshots to:

- `/home/aifactory/onedrive-learnflow/iteration-45/`

---

## Task 5 (P0): WebSocket `mindmap.update` payload mismatch normalized

### Problem

Spec expects `mindmap.update` payload:

- `{ nodes_added[], edges_added[] }`

But our server also sends an extension used by the Conversation UI:

- `{ courseId, suggestions, nodes_added: [], edges_added: [] }`

Shared WS types only allowed the spec shape, creating a contract mismatch.

### Fix implemented

Updated `packages/shared/src/types/ws.ts` to accept either:

- spec payload (`nodes_added`, `edges_added`), OR
- extended payload (`courseId?`, `suggestions?`, plus optional `nodes_added?`/`edges_added?`)

This makes the shared contract **spec-tolerant** while explicitly documenting the extension.

### Required checks

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅
- `npx eslint .` ✅

### Sync

Copied updated log + queue + screenshots to:

- `/home/aifactory/onedrive-learnflow/iteration-45/`

---

## Remaining queue items

Queue items 6–15 are still **NOT executed** in this builder run.
Next up would be P1 #6 (Pro plan flow decision/implementation).
