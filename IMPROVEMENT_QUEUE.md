# Improvement Queue — Iteration 48

Status: **READY FOR BUILDER**

This queue is written after reviewing the full product spec and inspecting the current LearnFlow implementation (API + client + web marketing) and capturing Iter48 screenshots.

## Top priorities (P0)

1. **Implement real BYOAI key usage end-to-end (not global env-only)** ✅

- **Spec:** BYOAI free tier; per-user API keys.
- **Fix:** Added per-request OpenAI client selection that prefers the user’s stored active `openai` key, falls back to managed env key only for Pro tier.
- **Routes updated:** `/api/v1/chat`, `/api/v1/courses` (lesson gen, notes, illustrations, compare, selection explain/example), `/api/v1/pipeline`.
- **Test safety:** In `NODE_ENV=test`, course lesson generation forces `openai=null` to prevent accidental outbound network calls even if `OPENAI_API_KEY` is set.

2. **Replace mock Research Agent + citations with real retrieval** ✅

- **Spec:** Real-time internet curation with attribution.
- **Fix:** `/api/v1/chat` with `agent=research` now returns real crawled sources via `crawlSourcesForTopic(input)` and a `sources[]` array with metadata (title/url/author/publishDate/domain/source).
- **Removed:** hard-coded fake arXiv/DOI URLs.

3. **Unify chat routing: REST `/api/v1/chat` should use Core Orchestrator like WebSocket does** ✅

- **Spec:** Central Orchestrator spawns/routes specialized agents.
- **Current:** WS uses `Orchestrator` + `AgentRegistry` (`wsOrchestrator.ts`) but REST `/chat` has its own routing + bespoke OpenAI prompt.
- **Build:** Route REST chat through the same orchestrator path to ensure consistent behavior and telemetry.

✅ DONE (Iter48): Extracted shared orchestrator builder/helpers (`apps/api/src/orchestratorShared.ts`), refactored WS orchestrator to use it, and updated REST `/api/v1/chat` general chat path to call `getOrchestrator().processMessage()` with `buildStudentContext(req.user.sub)`. Added best-effort `token_usage` persistence and `sources[]` extraction from lesson References.

4. **Fix mindmap “CRDT collaborative editing” gap (currently only suggestions + local graph)**

- **Spec:** CRDT-based collaborative mindmap editing.
- **Current:** Client renders a derived graph from courses/progress plus “suggestions” nodes; MindmapAgent supports CRDT ops but there is no persistence, no WS ops, no multi-user rooms.
- **Build:** Add mindmap state store (SQLite initially), implement WS events for add/update/delete node/edge + merge operations, and persist per user/course.

5. **Implement real subscription + billing status (Stripe) and gate Pro features**

- **Spec:** Pro subscription with managed infra, updates.
- **Current:** `/api/v1/subscription` exists but is effectively a toggle; no real billing, no entitlements enforcement.
- **Build:** Add Stripe integration (checkout + webhook), store `billingStatus`, enforce quotas/managed-key availability.

## High priorities (P1)

6. **Pipeline: connect “Add Topic” pipeline outputs to actual course creation & UI state**

- **Spec:** Conversational course creation with attributed learning paths; proactive updates.
- **Current:** `/api/v1/pipeline` is robust SSE state machine, but course creation endpoint still uses static `TOPIC_CONTENT` templates (topic-matched) and doesn’t use pipeline module planning.
- **Build:** Use pipeline’s `generateModulesForTopic()` and synthesis outputs to create course modules/lessons; show pipeline progress in UI.

7. **Lesson word-count/reading-time spec compliance (bite-sized <10 minutes)**

- **Spec:** Every lesson under 10 minutes.
- **Current:** LLM lessons target 800–1200 words and estimatedTime is capped at 10, but fallback templates can be generic and word counts are not enforced by validator.
- **Build:** Enforce word count bounds; re-summarize/trim automatically when over; compute accurate reading time.

8. **Citations/sources parsing and display**

- **Spec:** “Curated with attribution.”
- **Current:** Lesson generation includes a “Sources” section; API provides best-effort `parseLessonSources`, WS mindmap suggestions use web signals; but UI/source rendering consistency unclear.
- **Build:** Standardize `sources[]` schema across lesson, chat answers, research results, and pipeline; render in UI with domain + publish year.

9. **Next.js marketing site `/features` 500 error**

- **Current:** `learnflow-web` logs show GET `/features` → 500.
- **Build:** Fix route component/import/data assumptions; add a basic e2e check in CI.

10. **Security & auth hardening: dev WS token bypass**

- **Spec:** production-grade auth.
- **Current:** WS accepts `token=dev` when not production.
- **Build:** Ensure dev bypass is only in dev profile; add env guard + audit log; never enable in staging/prod.

## Medium priorities (P2)

11. **Marketplace agents: activation → orchestrator routing**

- **Spec:** Extensible agent marketplace.
- **Current:** `wsOrchestrator` reads `preferredAgents` from `dbMarketplace.getActivatedAgents(userId)` but doesn’t actually condition registry/routing (only mentions in `agent.spawned` text).
- **Build:** Implement: activated agents affect routing decisions and available actions; UI should show which agent answered.

12. **Analytics: replace placeholders with real event-based metrics**

- **Spec:** mastery, engagement, streaks, adaptive learning.
- **Current:** `/api/v1/analytics` exists, but data sources appear lightweight.
- **Build:** Event table (lesson opened, time-on-lesson, quiz attempts, chat usage); compute weekly progress and streaks.

13. **Collaboration/peer features are stubbed**

- **Spec:** peer collaboration agent and shared courses.
- **Current:** CollaborationAgent exists but unclear feature surface.
- **Build:** Define MVP: share course link, co-study session, shared notes; implement minimal flows.

14. **Replace in-memory maps with consistent DB usage**

- **Spec:** scalable persistence.
- **Current:** courses runtime Map caches dbCourses; some endpoints use `courses` Map while others query SQLite.
- **Build:** Use DB as source of truth; add repository layer; remove dual-read complexity.

15. **Test coverage: add spec-driven integration tests beyond S07**

- **Current:** API tests cover endpoint existence and WS streaming.
- **Build:** Add tests for: per-user BYOAI, pipeline create→publish, mindmap suggestions accept→course module created, marketplace activation influences routing.
