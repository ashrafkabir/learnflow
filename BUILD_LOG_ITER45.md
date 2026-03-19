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

## Remaining queue items

Queue items 3–15 are still **NOT executed** in this builder run.
Next up would be P0 #3 (Onboarding API Keys should validate + persist keys).
