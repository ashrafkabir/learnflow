# LearnFlow — IMPLEMENTED_VS_SPEC (Iteration 130)

This document is a **brutally honest** mapping between the product spec (sections 1–17) and what is actually implemented in this repo as of Iteration 130.

Legend:

- **Implemented** — exists end-to-end in code.
- **Partial / MVP** — exists but incomplete, stubbed, or missing critical behavior.
- **Not implemented** — not present or only superficial UI.

> NOTE: The repo contains many Iteration-driven additions. Where behavior differs from spec wording, that is called out explicitly.

---

## 1) Product overview / core promise

- **Partial / MVP**
  - The app supports onboarding, course creation, lesson viewing, a mindmap explorer, and a chat/conversation screen.
  - The “AI course generator” and “agents” exist, but much of the intelligence is deterministic/test-friendly in non-network mode.

## 2) Personas & roles (student / creator / admin)

- **Partial / MVP**
  - Roles exist (`student`, `creator`, `admin`) and some UI/routes differ.
  - Admin-only search config panel exists (RBAC enforced in API tests).
  - Creator marketplace flows exist but are not full production-grade (payments etc are mocked).

## 3) Onboarding & student profile

- **Implemented (MVP scope)**
  - Onboarding screens exist and store goals/topics/experience.
  - Server-side profile context endpoint exists and client hydrates it to be source-of-truth (best-effort).
  - Not a full adaptive assessment; it’s questionnaire-style onboarding.

## 4) Course creation & curriculum generation

- **Partial / MVP**
  - Course creation exists, modules/lessons are generated.
  - Lesson content generation includes citations/"References" in the agents package tests.
  - True high-quality generation depends on available providers/keys and may be deterministic in tests.

## 5) Lesson experience (reader, resources, completion)

- **Implemented (MVP)**
  - Lesson reader screen exists.
  - Completion tracking exists.
  - Structured lesson sources are persisted and returned (best-effort).

## 6) Quizzes / assessment

- **Partial / MVP**
  - Quiz objects and submission flow exist.
  - Depth, adaptivity, and question quality are MVP-level.

## 7) Search

- **Partial / MVP**
  - Search routes exist.
  - Admin search config exists.
  - “Enterprise search” quality and indexing depth are not comparable to a production search stack.

## 8) Collaboration

- **Partial / MVP**
  - Collaboration groups/messages exist in DB and have UI.
  - This is not real-time multi-user chat; it’s CRUD-style with simple flows.

## 9) Marketplace (courses, agents)

- **Partial / MVP**
  - Marketplace browsing exists.
  - Agent activation exists.
    - **Iter130 trust hardening:** first-time activation requires an explicit disclosure acknowledgement (routing preference + UI labels only; no third-party agent code executes at runtime).
  - **Iter130 trust hardening:** course marketplace browse UI does **not** display ratings/enrollment counts unless backed by real analytics.
  - Course reviews/ratings write path exists (DB-backed) and aggregates are surfaced.
  - Payments/payouts are represented but not production-ready.

## 10) Subscriptions & plans (Free vs Pro)

- **Partial / MVP**
  - Subscription tier exists and pro-gating is used in several places.
  - Billing is not a full Stripe-like integration; it’s scaffolded.

## 11) Realtime / WebSockets

- **Implemented (MVP protocol)**
  - WS server exists at `/ws` and requires JWT (or dev token in non-prod).
  - Implemented events (per code + shared types):
    - `response.start`, `response.chunk`, `response.end`
    - `agent.spawned`, `agent.complete`
    - `mindmap.update`
    - `progress.update`
    - `error`
  - **Iter130:** `response.end` includes `message_id` and `agent_name` for client metadata.
  - **Client** Conversation screen reacts to `response.start/chunk/end` and agent events.
  - Missing: robust ordering/ids across reconnects, backpressure, binary frames, etc.

## 12) Knowledge graph / Mindmap

- **Partial / MVP**
  - Mindmap explorer UI exists (vis-network).
  - Yjs collaboration exists.
  - **User-owned** room keying implemented: `mindmap:<userId>:<courseId>`.
  - Suggestions exist via WS (`mindmap.update`) and persisted suggestions endpoints exist.
  - Accepting a suggestion now persists via `POST /api/v1/mindmap/accept`.
  - Missing: richer semantics, mastery scoring beyond MVP, and robust “node click triggers action” coverage across all node types.

## 13) Analytics (streaks, minutes, progress)

- **Partial / MVP**
  - Streak and usage concepts exist.
  - Not a full analytics pipeline; largely app-level aggregation.

## 14) “Update Agent (Pro)” proactive topic monitor

- **Partial / MVP (RSS-only, manual tick)**
  - Update Agent exists end-to-end as an MVP:
    - Topics CRUD (`/api/v1/update-agent/topics`)
    - Topic sources CRUD (`/api/v1/update-agent/topics/:id/sources`)
    - Manual run trigger (`POST /api/v1/update-agent/tick`)
    - Run history endpoints (topics include last run fields; runs endpoint present per spec/queue)
  - Notifications generation is **RSS/Atom-only** (no open-web crawling) and **best-effort** (per-source failures captured; run continues).
  - **No in-repo scheduler** is included; production scheduling must be done via external cron (documented in docs).
  - UI is Pro-gated and explicitly discloses RSS-only + best-effort behavior (Iteration 106 hardening).

## 15) Export

- **Implemented (MVP)**
  - Export endpoint(s) exist and are tested.
  - Export formats and fidelity are MVP-level.

## 16) Security / privacy

- **Partial / MVP**
  - JWT auth exists.
  - Rate limiting exists (in-memory).
  - Dev-auth bypass exists but is gated to devMode/non-prod.
  - Not a full security hardening review (no WAF, no audit logs, etc.).

## 17) Observability / ops

- **Not implemented (beyond basics)**
  - No production-grade tracing/metrics/log aggregation.
  - Some console warnings/logs exist.

---

## Biggest gaps vs the spec (summary)

1. **Update Agent** is still an MVP: notifications exist, but no real monitoring/crawling.
2. **Mindmap** is functional, but not a full knowledge-graph product; semantics and action wiring are limited.
3. **Realtime** is implemented but not hardened for production (reconnect semantics, ordering, delivery guarantees).
