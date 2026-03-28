# Screenshot harness

LearnFlow includes a Playwright-based screenshot harness for consistent UI snapshots.

## Canonical command

```bash
node scripts/screenshots.mjs --iter 128 --base http://localhost:3001 --outDir screenshots/iter128/local
```

### Notes

- `--iter` is used for grouping and traceability in PRs/iteration logs.
- `--base` should point at the running client (see `DEV_PORTS.md`, default `http://localhost:3001`).
- `--outDir` controls where desktop + mobile screenshots are written.

## Output structure

The harness writes:

- `desktop/*.png` (desktop routes)
- `mobile/*.png` (mobile routes at multiple widths)

## When to run

Run this after UI changes to:

- validate layout on desktop/mobile
- ensure MVP truth + disclosures are visible
- catch accidental regressions in navigation and key screens
