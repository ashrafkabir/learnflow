# BUILD_LOG_ITER30.md

Iteration 30 build log (builder subagent).

## 2026-03-18

### Task: Make WebSocket “fake demo” real enough + meaningful progress updates

- Added a small WS hub so non-WS routes can emit WS events.
  - File: `apps/api/src/wsHub.ts`
  - Exposes: `registerSocket(userId, ws)`, `emitToUser(userId, event, data)`
- WebSocket server now registers sockets in the hub.
  - File: `apps/api/src/websocket.ts`
- Lesson completion endpoint now emits `progress.update` with real course/lesson IDs and computed percent.
  - File: `apps/api/src/routes/courses.ts`
  - Payload: `{ course_id, lesson_id, completion_percent }`

### Task: WS streaming based on real app context (not canned chunks)

- Replaced canned streaming chunks with an MVP orchestrator that uses real lesson/course context when provided.
  - File: `apps/api/src/wsOrchestrator.ts`
  - Behavior:
    - Streams excerpt from the selected lesson if `lessonId` is provided.
    - Includes sources extracted from a References/Sources section when present.

### Task: WS contract clarity (spec + code)

- Added typed WS contract and clarified the `completion_percent` field (spec had `completion%` which is not a valid identifier).
  - File: `apps/api/src/wsContract.ts`
- Updated product spec table to reflect `completion_percent`.
  - File: `LearnFlow_Product_Spec.md` (§11.2)

### Task: Marketing website spec gaps (missing pages) + port collision

- Added missing Next.js marketing routes in `apps/web`:
  - `/about` → `apps/web/src/app/about/page.tsx`
  - `/marketplace` → `apps/web/src/app/marketplace/page.tsx`
  - `/docs` → `apps/web/src/app/docs/page.tsx`
- Updated marketing site nav to include Marketplace/Docs/About.
  - File: `apps/web/src/app/layout.tsx`
- Resolved dev port collision with client (client=3001); moved web dev port to 3003.
  - File: `apps/web/package.json`

### Verification

- `npx tsc --noEmit` ✅
- `npx vitest run` ✅ (377 tests)
- `npx eslint .` ✅
- `node screenshot-all.mjs` ✅ (screenshot suite re-run)
