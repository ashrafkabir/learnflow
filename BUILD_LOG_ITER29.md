# BUILD LOG — Iteration 29

Date: 2026-03-18

This log captures all work performed by the Iteration 29 builder agent.

---

## Task 1 — WebSocket spec compliance: `progress.update` payload

### Changes

- Updated WS server `progress.update` payload to be spec-shaped.
  - **Before:** `{ user_id, metric, value }`
  - **After:** `{ course_id, lesson_id, completion_percent }`
  - File: `apps/api/src/websocket.ts`
- Updated client handler to support the spec-shape and to optionally mark a lesson complete when `lesson_id` is present.
  - File: `apps/client/src/screens/Conversation.tsx`

### Commands / Results

- `cd /home/aifactory/.openclaw/workspace/learnflow && npx tsc --noEmit` ✅ (no output)
- `npx vitest run` ✅ (377 passed)
- `npx eslint .` ✅ (no output)

---

## Task 2 — WebSocket spec compliance: `mindmap.update` payload

### Changes

- Updated WS server `mindmap.update` payload to match spec table `{ nodes_added[], edges_added[] }` and emit a minimal meaningful update.
  - File: `apps/api/src/websocket.ts`

### Commands / Results

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅ (377 passed)
- `npx eslint .` ✅

---

## Task 3 — WS auth dev experience

### Changes

- Added dev-only token support: `token=dev` accepted when `NODE_ENV !== 'production'`.
  - File: `apps/api/src/websocket.ts`
- Updated client WS hook to fall back to `dev` token in dev builds when no token exists.
  - File: `apps/client/src/hooks/useWebSocket.ts`

### Commands / Results

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅ (377 passed)
- `npx eslint .` ✅

---

## Task 11 — Screenshot automation: include Collaboration + Lesson Reader

### Changes

- Added explicit authed route coverage for Collaboration.
  - File: `screenshot-all.mjs`
- Made Lesson Reader capture deterministic by adding stable seeded routes:
  - `/courses/c-1` → `course-view.png`
  - `/courses/c-1/lessons/l1` → `lesson-reader.png`

### Commands / Results

- `node -c screenshot-all.mjs` ✅
- `SCREENSHOT_DIR=evals/screenshots/iter29-2026-03-18d BASE_URL=http://localhost:3002 node screenshot-all.mjs` ✅
  - Output includes `app-collaboration.png` and `lesson-reader.png`
  - Directory: `evals/screenshots/iter29-2026-03-18d/`

---

## Verification (final)

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅ (377 passed)
- `npx eslint .` ✅
