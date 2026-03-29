# LearnFlow — Dev Surfaces (Iteration 130)

This repo has multiple runnable surfaces (apps) to support the MVP.

## Canonical app surfaces

### 1) Client app (React)

- **Location:** `apps/client`
- **Purpose:** the product UI (dashboard, conversation, mindmap, marketplace, settings)
- **Dev URL:** http://localhost:3001

### 2) API (Node)

- **Location:** `apps/api`
- **Purpose:** REST + WebSocket backend
- **Dev URL:** http://localhost:3002
- **WebSocket:** ws://localhost:3002/ws

### 3) Marketing site (Next.js)

- **Location:** `apps/web`
- **Purpose:** canonical marketing pages (features/pricing/download/docs/blog/about)
- **Dev URL:** http://localhost:3003

> **Note (Iter130 decision):** Marketing content is canonical in `apps/web`.
> The client app intentionally does **not** route marketing paths like `/pricing` to avoid split-brain.

## Common scripts

Run from repo root:

- `npm test` — runs vitest across packages
- `npx tsc -b` — TypeScript build (project references)
- `npm run lint` — eslint across packages

## Screenshot harness

From repo root:

- `node screenshot-all.mjs --base http://localhost:3001 --outDir screenshots/<...>`
- `node screenshot-mobile.mjs --base http://localhost:3001 --outDir screenshots/<...>`

Defaults (Iter130):

- If `--outDir` is omitted, screenshots go under: `learnflow/screenshots/iter<ITER>/...`
  - Example: `node screenshot-all.mjs --iter 130 --base http://localhost:3001`

## Environment notes

- Some pages in screenshot runs depend on local dev servers being up.
- Marketplace / agent activation in the MVP affects routing preference + UI labels only.
