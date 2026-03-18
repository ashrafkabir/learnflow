# IMPROVEMENT_QUEUE

Iteration: 31
Status: READY FOR BUILDER

## Brutal Assessment (with evidence)

This codebase is currently a **high-quality UI demo + lightweight API**, not the full platform described by the product spec.

**Iteration 30 changes actually landed (verified):**

- WS hub added: `apps/api/src/wsHub.ts` (`registerSocket`, `emitToUser`).
- WS server registers sockets: `apps/api/src/websocket.ts` calls `registerSocket(user.sub, ws)`.
- Lesson completion emits real progress: `apps/api/src/routes/courses.ts` emits `progress.update` with `{ course_id, lesson_id, completion_percent }`.
- WS streaming uses real app context (not canned chunks): `apps/api/src/wsOrchestrator.ts` streams excerpt from the selected lesson and extracts URLs from “References/Sources”.
- Marketing site missing routes added in `apps/web`: `/about`, `/docs`, `/marketplace`, and nav links; web dev port moved to 3003.

**Biggest spec-vs-implementation gaps (evidence):**

- Spec architecture (gRPC, agent mesh, vector DB, Redis/S3, containerized agents) is not implemented. Current persistence is **SQLite** (`apps/api/src/db.ts`) and most “agents” are simulated via routes/UI.
- WebSocket contract is **not dev-functional end-to-end**: client WS connects to `ws://{window.location.host}/ws` (`apps/client/src/hooks/useWebSocket.ts`) but API runs on port 3000 while client runs on 3001/3002 → WS fails without proxy.
- Marketing website pages exist but are **minimal**, missing wireframe-required sections (demo, testimonials, stats, security badges) and tech stack items (Tailwind/Framer/MDX).
- Docs page references `openapi.yaml` but file is not present (likely incorrect documentation).

## Verification Artifacts

### Boot

- `npm run dev` started:
  - API: http://localhost:3000
  - Client: port 3001 was in use → Vite started at http://localhost:3002
  - Web: http://localhost:3003

### Screenshots

- Client/app + marketing (existing harness): `evals/screenshots/iter30-2026-03-18/` (27 PNGs)
  - landing-home, features/pricing/download/blog/about/docs
  - login/register, onboarding 1–6
  - dashboard, conversation, mindmap, marketplace courses/agents, collaborate, settings, pipelines, course view, lesson reader, pipeline detail
- Website-only (added harness): `evals/screenshots/iter31-web-2026-03-18/` (8 PNGs)
  - web-home, web-about, web-marketplace, web-docs, web-features, web-pricing, web-download, web-blog

## Prioritized Tasks (Problem → Fix → Acceptance Criteria)

### 1) Fix WebSocket connectivity in dev (client → API) — DONE

- **Fix implemented:** Added Vite WS proxy `'/ws' -> ws://localhost:3000` (upgrade supported) and set `strictPort: true`.
  - `apps/client/vite.config.ts`
- **Result:** Client can continue to use same-origin `ws(s)://{window.location.host}/ws?...` and in dev it will be proxied correctly to API.

### 2) Update screenshot harness to be port-robust — DONE (via strictPort)

- **Fix implemented:** Pinned client dev port deterministically with `strictPort: true` so screenshots and WS proxy are stable at `http://localhost:3001`.
  - `apps/client/vite.config.ts`
- **Also:** updated `screenshot-all.mjs` default screenshot dir prefix to `iter31-YYYY-MM-DD`.

- **Acceptance:** Clean run no longer silently shifts to 3002; if 3001 is occupied it fails fast (clear signal), avoiding partial/incorrect screenshot runs.

### 3) Unify WS contract types across server + client

- **Problem:** `apps/api/src/wsContract.ts` exists but client uses ad-hoc event parsing; contract drift risk.
- **Fix:** Move contract types to `packages/shared` and import in both api+client; align events (including/omitting `connected`).
- **Acceptance:** One canonical type definition; compile-time break if contract changes.

### 4) Make `progress.update` update course-level progress everywhere

- **Problem:** Client handles `progress.update` by completing lesson + notification only; dashboard rings/percent may not update.
- **Fix:** Store per-course completion percent in app state; update on WS event.
- **Acceptance:** Completing a lesson updates dashboard progress immediately with correct %.

### 5) Implement real mindmap subscribe/update using real course data

- **Problem:** `mindmap.subscribe` returns static 2-node graph.
- **Fix:** Generate nodes/edges from enrolled courses/lessons and completed lessons; emit diffs.
- **Acceptance:** Mindmap displays course and lesson nodes; lesson completion modifies graph.

### 6) Add Settings → API Keys management using existing `/api/v1/keys`

- **Problem:** API key endpoints exist (`apps/api/src/keys.ts`) but UX parity to spec is unclear.
- **Fix:** In Settings, add list/add/validate flows; show masked key + provider.
- **Acceptance:** Add key persists; list shows masked keys; no plaintext key returned.

### 7) Token usage tracking per agent + UI surface

- **Problem:** Spec expects per-agent usage. DB has `token_usage` table, but not clearly wired.
- **Fix:** Add API routes to read usage; increment usage where LLM calls occur (chat/courses generation/notes).
- **Acceptance:** Analytics or Settings shows token totals per agent.

### 8) Fix docs correctness: remove false `openapi.yaml` reference or add it

- **Problem:** `apps/web/src/app/docs/page.tsx` points to `openapi.yaml` that doesn’t exist.
- **Fix:** Add real OpenAPI file + link, or update docs to point to actual routes/tests.
- **Acceptance:** Docs links resolve; repo contains the referenced artifact.

### 9) Marketing homepage: implement wireframe-required sections

- **Problem:** Homepage is decent but missing spec-required blocks: demo section, testimonials, stats, security badges.
- **Fix:** Add sections per §12.2; include basic stats + social proof + privacy badges.
- **Acceptance:** Homepage includes all listed wireframe sections.

### 10) Marketing marketplace preview: add search + filters + real data

- **Problem:** `/marketplace` page is static cards.
- **Fix:** Add search/filter UI consuming `/api/v1/marketplace/courses` and `/api/v1/marketplace/agents`.
- **Acceptance:** Users can search/filter and see results update.

### 11) Implement MDX for Docs/Blog (per website tech stack)

- **Problem:** Spec calls for MDX; current docs/blog are static TSX.
- **Fix:** Add MDX support in Next.js app router and convert at least 1 doc + 1 blog post.
- **Acceptance:** MDX routes render and are linked from nav.

### 12) Persist lesson citations/sources (content pipeline attribution)

- **Problem:** Sources are heuristically extracted in WS orchestrator and not persisted on lessons.
- **Fix:** Extend lesson model to include `sources[]` saved in DB and rendered in LessonReader + SourceDrawer.
- **Acceptance:** Lesson reader consistently displays stored sources, not ephemeral heuristics.

### 13) Make course builder use real web discovery minimally

- **Problem:** Course generation relies heavily on templates; spec expects web discovery and scoring.
- **Fix:** Use existing `crawlSourcesForTopic` to attach real sources and basic quality scoring.
- **Acceptance:** New courses contain real URLs and show them in UI.

### 14) Collaboration MVP backend (rooms/messages)

- **Problem:** Collaboration feature likely UI-only; spec expects study groups/peer messaging.
- **Fix:** Add simple “room” model and WS events for join/message.
- **Acceptance:** Two sessions can chat in a room.

### 15) Enforce Pro gating using feature flags

- **Problem:** Subscription endpoints exist but feature gating is unclear.
- **Fix:** Fetch `/api/v1/subscription` and gate managed keys/advanced analytics/priority agents.
- **Acceptance:** Free users see locked controls; upgrading unlocks features.
