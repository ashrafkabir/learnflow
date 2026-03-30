# LearnFlow API — Implemented vs Planned (Truthfulness Pass)

This document is intentionally _practical and honest_: it describes what exists in this repo today.

- **Base path:** `/api/v1`
- **Auth:** Bearer JWT (or dev auth when server is started with `LEARNFLOW_DEV_AUTH=1`)
- **Data store:** SQLite (via `apps/api/src/db.ts`)

> Note: The product spec (`LearnFlow_Product_Spec.md`) describes a larger architecture (gateway, agent mesh, Postgres/Redis/vector DB). The current repo ships a smaller Express + SQLite MVP.

---

## Implemented endpoints (current repo)

### Auth — `/auth`

- `POST /auth/register` — create user (MVP)
- `POST /auth/login` — login and return JWT (MVP)

### Profile — `/profile`

- `GET /profile` — get current user profile
- `GET /profile/context` — role/tier/admin context used by client (Iter69 server-driven admin gating)

### Keys (BYOAI) — `/keys`

- Endpoints for storing API keys per provider (exact provider set depends on configuration)

### Chat — `/chat`

- `POST /chat` — orchestrated agent response (keyword/regex intent routing; multiple deterministic agents)

### Courses / Lessons / Progress — `/courses`

- `GET /courses` — list courses
- `POST /courses` — create/generate course (MVP pipeline)
- `GET /courses/:id` — get course detail
- `GET /courses/:id/lessons/:lessonId` — get lesson (includes `sources` best-effort)
- `POST /courses/:id/add-topic` — append module/lesson (MVP)
- `POST /courses/:id/lessons/:lessonId/complete` — mark complete

### Marketplace — `/marketplace`

There are two routers:

- Public browse endpoints (no auth): `apps/api/src/routes/marketplace.ts`
- Creator/checkout/activation flows (auth): `apps/api/src/routes/marketplace-full.ts`

Key implemented endpoints include:

- `GET /marketplace/courses` — list published courses
- `GET /marketplace/courses/:id` — course detail
- `POST /marketplace/publish` — publish a course (mock quality checker)
- `POST /marketplace/courses/:id/checkout` — mock checkout -> enrollment + payout ledger
- `GET /marketplace/creator/dashboard` — creator analytics (MVP)
- `POST /marketplace/agents/submit` — submit agent (MVP)
- `GET /marketplace/agents` — list approved agents
- `POST /marketplace/agents/:id/activate` — activate agent for user

**Important honesty note:** checkout is currently **mock**, and the client UI labels it as Mock checkout (Iter69).

### Search — `/search`

- Search endpoints backing pipeline/research.
- **MVP constraint:** LearnFlow’s MVP research path is **OpenAI-only** (OpenAI Web Search / extraction). No Tavily/Firecrawl key configuration is exposed in the client onboarding, and agents code disables Tavily usage.
  - See: `apps/api/src/routes/search.ts`, `apps/api/src/routes/pipeline.ts`.

### Pipeline — `/pipeline`

- Pipeline endpoints for generating/reviewing lesson content (MVP)

### Analytics / Events / Usage

- `/analytics` — analytics summaries (MVP)
- `/events` — event ingestion (append-only learning events)
- `/usage` — usage reporting

### Export — `/export`

- Export endpoints for course/lesson exports (MVP)

### Subscription — `/subscription`

- Tier endpoints (Free/Pro) with partial enforcement

### Daily — `/daily`

- Daily endpoints used for “proactive update” scaffolding (MVP)

### Mindmap — `/mindmap` and `/yjs`

- REST endpoints for mindmap persistence/suggestions
- Yjs WebSocket server runs separately on `/yjs` (dedicated port) for real-time mindmap collaboration

---

## WebSockets (implemented)

- Orchestrator/chat WebSocket: created by `apps/api/src/websocket.ts` (server attaches to main HTTP server)
- Yjs mindmap WebSocket: `apps/api/src/yjsServer.ts` mounted at path `/yjs` on a dedicated port

---

## Planned / Spec-described but not yet implemented (high-level)

- Multi-agent “real” planner/executor with tool DAG composition (current: keyword/regex routing + deterministic agents)
- Real payments (Stripe test-mode / webhook) and non-mock payout workflows
- Collaboration backend: persisted study groups + group chat messages (client screen currently mock)
- Robust subscription quota enforcement across all features
- Mature attribution enforcement gates (server enforces minimum sources, UI always shows references but content sourcing is still best-effort)
- Larger architecture components from spec (gateway, gRPC, Redis, vector DB, etc.)
