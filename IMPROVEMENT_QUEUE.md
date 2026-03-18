# LearnFlow Improvement Queue

## Iteration: 30

**Status:** READY FOR BUILDER  
**Date:** 2026-03-18

## Brutal Assessment (verify, don’t trust)

The project is **demo-runnable** (API + client) and we can generate a deterministic screenshot suite.

However, spec compliance remains **mostly UI- and route-level** rather than a functioning “multi-agent learning platform”:

- The **WebSocket server is still a canned demo** (hardcoded chunks, empty sources, no actual orchestrator/agent calls).  
  Evidence: `apps/api/src/websocket.ts` emits fixed chunks and `sources: []`.
- The **marketing website spec (§12) is not met** in `apps/web`: missing `/docs`, `/about`, `/marketplace` (and no MDX docs system).  
  Evidence: `apps/web/src/app/*` only includes `/`, `/features`, `/pricing`, `/download`, `/blog`, `/sitemap.ts`.
- The product has **two competing “marketing sites”** (Next.js app and client marketing routes), which creates “two truths.”  
  Evidence: client routes in `apps/client/src/App.tsx` include `/features /pricing /download /blog /about /docs`.
- The repo’s **PROGRESS.md claims 100% complete**, which is not credible versus the spec; it undermines planning.
  Evidence: `PROGRESS.md` shows 14/14 complete, but core spec items (attribution enforcement, course marketplace, agent SDK, real orchestration) are not implemented.

### Iteration 30 verification artifacts

- ✅ Booted locally:
  - API: `http://localhost:3000`
  - Client: `http://localhost:3002` (3001 was busy)
- ✅ Screenshot-all coverage ran successfully (includes Collaboration + Lesson Reader):
  - Output: `evals/screenshots/iter30-2026-03-18/` (27 PNGs)
  - Evidence: `screenshot-all.mjs` + directory listing.

---

## Iteration 30 — Prioritized Tasks (10–15)

> Format: **Problem** → **Fix** → **Acceptance Criteria** (include file/path evidence)

### P0 — WebSocket protocol must match spec and be fed by real backend logic

1. **WS event envelope shape does not match spec**

- **Problem:** Spec §11.2 tables describe event payloads directly, but the server wraps everything in `{ event, data }` and also uses non-spec field names (`completion_percent` vs `completion%`).
  - Evidence: `apps/api/src/websocket.ts` (`sendEvent` always wraps), `progress.update` payload uses `completion_percent`.
- **Fix:** Align the WS protocol to spec in one clear way:
  - Option A (preferred): emit messages with `{ event: 'progress.update', ...payloadFields }` only if spec allows envelope; otherwise
  - Option B: keep envelope but update spec + client contract consistently.
  - Replace `completion_percent` with a spec-compliant field name (e.g., `completion_percent` is not what spec shows).
- **Acceptance:** A written contract exists (code types + docs) and both server + client match it; Playwright/E2E asserts event payload shape.
- **Files:** `apps/api/src/websocket.ts`, `apps/client/src/hooks/useWebSocket.ts`, `LearnFlow_Product_Spec.md` (if adjusting).

2. **WS “chat” is not wired to orchestrator / agents**

- **Problem:** WS `message` triggers canned streaming chunks and never calls the logic used by `/api/v1/chat` or any agents.
  - Evidence: `apps/api/src/websocket.ts` hardcodes `chunks = [...]`.
- **Fix:** Route WS messages through the same pipeline as the REST chat route (or a new shared orchestrator module), and stream real deltas.
- **Acceptance:** Sending a WS `message` results in:
  - `agent.spawned` for actual agent(s) used,
  - streamed content derived from those agents,
  - `response.end` includes `actions[]` + non-empty `sources[]` when applicable.
- **Files:** `apps/api/src/websocket.ts`, `apps/api/src/routes/chat.ts`, `packages/agents/*`.

3. **Sources are always empty, violating attribution model**

- **Problem:** Spec requires source attributions on lessons and chat responses; implementation commonly returns `sources: []`.
  - Evidence: `apps/api/src/websocket.ts` and `apps/api/src/routes/chat.ts` always return empty sources.
- **Fix:** Introduce a `Source` type and return at least 1–3 sources whenever content is derived from lesson/course material; for course-builder-generated lessons, make sources mandatory.
- **Acceptance:** LessonReader always renders a References/Sources section; chat responses include sources when referencing lesson material.
- **Files:** `apps/api/src/routes/chat.ts`, `apps/api/src/routes/courses.ts`, `apps/client/src/screens/LessonReader.tsx`.

4. **progress.update semantics are meaningless**

- **Problem:** WS emits `course_id: null`, `lesson_id: null`, `completion_percent: 0`.
  - Evidence: `apps/api/src/websocket.ts`.
- **Fix:** Emit progress updates only when progress actually changes (lesson completion, module completion), with real IDs.
- **Acceptance:** Completing a lesson triggers a progress update that updates dashboard/course progress rings.
- **Files:** `apps/api/src/routes/courses.ts` (complete endpoint), `apps/api/src/websocket.ts`, client progress UI.

### P0 — Resolve “two marketing sites” and meet §12 website requirements

5. **Next.js marketing site is missing required pages**

- **Problem:** Spec §12 requires `/marketplace`, `/docs`, `/about`; `apps/web` lacks them.
  - Evidence: file listing under `apps/web/src/app/*`.
- **Fix:** Implement missing routes in `apps/web` and add top-level nav; or explicitly de-scope `apps/web` and remove it.
- **Acceptance:** `apps/web` serves Homepage/Features/Pricing/Marketplace/Docs/Blog/About/Download as per spec; screenshot set includes them.
- **Files:** `apps/web/src/app/*`.

6. **Client contains duplicate marketing pages conflicting with apps/web**

- **Problem:** Client routes ship marketing (`/features /pricing /download /blog /about /docs`) which duplicates Next.js site.
  - Evidence: `apps/client/src/App.tsx`.
- **Fix:** Choose one canonical marketing surface:
  - Preferred per spec: keep marketing in `apps/web`, remove marketing routes from client, or redirect them.
- **Acceptance:** Exactly one source of truth; nav/copy not duplicated; README explains where marketing lives.
- **Files:** `apps/client/src/App.tsx`, `apps/client/src/screens/marketing/*`, `apps/web/src/app/*`.

### P1 — Core product loop: “course → lesson → notes/quiz → mastery” should be real

7. **BYOAI key management is not implemented per spec**

- **Problem:** Spec §4.4 demands provider selection, encrypted vault, usage tracking dashboard; current code uses only server env `OPENAI_API_KEY` and localStorage token hacks.
  - Evidence: `apps/api/src/routes/chat.ts` uses `process.env.OPENAI_API_KEY`; onboarding `ApiKeys` is UI only.
- **Fix:** Implement real key CRUD `/api/v1/keys` with encryption-at-rest, and route agent calls via user key for free tier.
- **Acceptance:** Free tier can provide an OpenAI key and see token usage; keys are not logged; tests verify encryption.
- **Files:** `apps/api/src/routes/keys.ts` (new), `apps/api/src/db/*`, client onboarding screens.

8. **Lesson “<10 min” constraint is not enforced server-side**

- **Problem:** Spec §6.2 mandates <10 min / ~1500 words; current system doesn’t validate this at persistence/API boundary.
- **Fix:** Add server-side validation + formatting/splitting for oversized lessons.
- **Acceptance:** API guarantees lesson length within threshold; UI shows estimated read time badge.
- **Files:** `packages/agents/*` lesson formatter, `apps/api/src/routes/courses.ts`, `apps/client/src/screens/LessonReader.tsx`.

9. **Agents are not a real registry / SDK as described**

- **Problem:** Spec requires standardized agent interface + manifests + capability matching; actual implementation is ad-hoc route branching (`agent === 'notes'|'exam'|'research'`).
  - Evidence: `apps/api/src/routes/chat.ts`.
- **Fix:** Implement a minimal agent registry in `packages/agents` with `manifest.json`, `process(context, task)` interface, and server-side capability routing.
- **Acceptance:** Adding a new agent requires adding a manifest + implementation; orchestrator chooses agents via registry.
- **Files:** `packages/agents/*`, `apps/api/src/orchestrator/*` (new).

10. **Collaboration is UI-only (no peer matching, groups, messages)**

- **Problem:** Spec §4.2/§5.2.3 expects peer matching and collaboration events; current Collaboration screen exists but no backend support.
- **Fix:** Implement minimal collaboration backend: opt-in, list suggested peers, create study group, send message.
- **Acceptance:** Two users can join a group and exchange messages (even if in-memory for MVP) and see it in UI.
- **Files:** `apps/api/src/routes/collaboration.ts` (new), `apps/client/src/screens/Collaboration.tsx`.

11. **Mindmap updates are a fake demo; no persisted knowledge graph**

- **Problem:** WS sends a fixed 2-node graph; no CRUD or mastery levels.
  - Evidence: `apps/api/src/websocket.ts` on `mindmap.subscribe`.
- **Fix:** Implement mindmap data model (nodes, edges, mastery) persisted per user; emit updates when course created / lesson completed.
- **Acceptance:** Mindmap Explorer reflects user’s courses and progress; updates after lesson completion.
- **Files:** `apps/api/src/routes/mindmap.ts` (new/expand), `apps/client/src/screens/MindmapExplorer.tsx`.

### P2 — Project integrity: stop claiming “done” and improve evidence

12. **PROGRESS.md is misleading (claims 100% done)**

- **Problem:** The progress tracker states all workstreams complete despite obvious missing spec sections.
  - Evidence: `PROGRESS.md`.
- **Fix:** Re-baseline PROGRESS.md against spec; mark incomplete items explicitly; add “spec compliance score” notes.
- **Acceptance:** PROGRESS.md reflects reality and links to artifacts/tests proving completion.

13. **apps/web dev port collides with client dev port**

- **Problem:** `apps/web` dev uses `--port 3001` and client uses `3001` → collision.
  - Evidence: `apps/web/package.json` and `apps/client/package.json`.
- **Fix:** Assign stable, non-colliding ports (e.g., web=3003, client=3001) and document in README; update screenshot scripts accordingly.
- **Acceptance:** `npm run dev` can start both without manual port juggling; screenshot scripts work on documented ports.

14. **E2E coverage exists as scripts, not assertions**

- **Problem:** `screenshot-all.mjs` produces images, but doesn’t assert that key spec UI elements exist (citations, actions, agent indicators).
- **Fix:** Convert the most important checks into Playwright tests with assertions (not just screenshots).
- **Acceptance:** CI fails if citations/actions missing on lesson/chat screens.
- **Files:** `e2e/*`, `playwright.config.ts`.

---

## Notes for Builder

Highest leverage is **P0 WS + orchestrator wiring** and **P0 marketing-site decision**. Until those are resolved, every additional UI enhancement is mostly surface polish without spec compliance.
