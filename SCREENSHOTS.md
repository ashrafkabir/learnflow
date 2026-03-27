# Screenshot harnesses

LearnFlow includes two lightweight screenshot harness scripts to capture UI states across common routes.

## Prerequisites

- App running locally (default base URL: `http://localhost:3001`)
- Playwright installed (already a repo dependency)

## Scripts

### 1) Mobile harness

```bash
node screenshot-mobile.mjs --base http://localhost:3001 --outDir screenshots/local/mobile
```

- Captures a fixed set of routes at mobile widths: 320 / 375 / 414.
- Output directory resolution order:
  1. `SCREENSHOT_DIR`
  2. `SCREENSHOT_OUT_DIR`
  3. `--outDir <path>`
  4. `--out <path>` (legacy)
  5. default under `evals/screenshots/...`

Optional:

- `--authed` (if the harness supports authenticated snapshots in your environment)
- `--dryRun` (test-only; creates output dir and exits without launching Playwright)

### 2) Full (desktop) harness

```bash
node screenshot-all.mjs --base http://localhost:3001 --outDir screenshots/local/all
```

## Common ports

- Web app: `3001` (default in harnesses)

## Notes

- Harnesses are intended for **visual regression evidence**, not strict pixel-diff tests.
- Commit screenshots only when requested by the iteration/task.
