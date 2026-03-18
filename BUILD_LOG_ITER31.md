# BUILD_LOG_ITER31

Date: 2026-03-18

## Summary

Iteration 31 focused on making WebSocket streaming functional in dev by fixing the client↔API port mismatch and tightening screenshot harness defaults.

## Changes

### 1) Dev WebSocket connectivity (client → API)

- Added Vite dev-server proxy for `'/ws'` → `ws://localhost:3000` with `ws: true`.
  - File: `apps/client/vite.config.ts`
  - Also set `strictPort: true` for deterministic dev port behavior.
- Kept client WS URL same-origin (`ws(s)://{window.location.host}/ws?...`) so it works both:
  - Dev: proxied to API
  - Prod: same-origin
  - File: `apps/client/src/hooks/useWebSocket.ts` (comment only)

### 2) Screenshot harness defaults

- Updated `screenshot-all.mjs` default output dir prefix to `iter31-YYYY-MM-DD`.
  - File: `screenshot-all.mjs`

### 3) Lint cleanup

- Removed unused eslint-disable directive from `screenshot-web.mjs`.

## Verification

Commands run (all green):

- `npm test`
- `npx tsc --noEmit`
- `npx vitest run`
- `npx eslint .`

UI verification:

- `node screenshot-all.mjs --dir evals/screenshots/iter31-wscontract-2026-03-18` (27 PNGs)

Notes:

- WS dev fix requires running the client via Vite dev server (proxy handles upgrade). The API WS server remains at `/ws` on port 3000.
