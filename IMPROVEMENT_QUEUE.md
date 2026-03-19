# IMPROVEMENT_QUEUE

Iteration: 33
Status: READY FOR BUILDER

## Brutal Assessment (vs full spec)

LearnFlow (repo) is still a **UI-first MVP/demo** that resembles the spec’s UX flows, but only partially matches the spec’s **systems claims** (content pipeline, attribution, persistence, multi-agent orchestration depth, marketplace monetization).

The good news: Iteration 32’s WS orchestration wiring **did land** in `apps/api/src/wsOrchestrator.ts` and the client already renders streaming events + agent activity.

### What’s genuinely solid (evidence)

- **Screens exist end-to-end** (client + marketing web) and are renderable headlessly.
- **API test suite is strong**: `npm test -w @learnflow/api` passed (115 tests) during this run.
- **WS contract largely aligns with spec §11.2**: `response.start/chunk/end`, `agent.spawned/complete`, `progress.update` all exist in runtime and client.
- **Spec-level UI elements are present**: conversation markdown rendering (GFM, math/KaTeX, syntax highlighting), mindmap drawer, source drawer, dashboard course carousel/progress, marketplaces.

### What is materially missing vs spec (top gaps)

1. **Real content acquisition + attribution pipeline** (spec §6): course/lesson generation is still synthetic and citations are not first-class persisted objects.
2. **True “multi-agent” orchestration behavior**: core orchestrator exists and is now called via WS, but agents themselves are mostly placeholder logic (no web research, no scoring, minimal DAG/parallelization).
3. **Mindmap as a real knowledge graph**: UI is rich, but it derives nodes from local course/module/lesson structure + local completed state; no CRDT collaboration; no server-driven diffs.
4. **Marketplace reality**: discovery, creator QA/moderation, purchases/revenue share are mostly simulated vs spec.
5. **BYOAI key vault and usage tracking**: endpoints exist, but encryption/rotation, provider validation, and user-facing usage dashboards are not end-to-end.

---

## Iteration 32 Verification: WS Orchestration Changes

### ✅ Landed in `apps/api/src/wsOrchestrator.ts`

Evidence (file inspection):

- Instantiates `AgentRegistry` + registers real agent classes from `@learnflow/agents`.
- Creates singleton `Orchestrator` from `@learnflow/core` and calls:
  - `orchestrator.processMessage(text, context)`
- Emits spec-aligned WS events:
  - `response.start` → `response.chunk` (chunked streaming) → `response.end`
  - `agent.spawned` (routing message) and `agent.complete`
- Provides a best-effort sources payload by extracting URLs from an in-lesson “References/Sources” markdown section.

### ⚠️ Not fully spec-compliant yet

- WS `message` payload spec allows `attachments` and `context_overrides`; API currently reads only `text`, plus non-spec `lessonId/courseId`.
- No `mindmap.update` emitted by orchestrator path.
- `sources` are not real bibliographic objects (title/author/publication/year are mostly placeholders).

---

## Boot + Screenshots (Iteration 33)

### Dev boot

`npm run dev` brought up:

- API: `http://localhost:3000`
- Client: `http://localhost:3001`
- Web: `http://localhost:3003`

### Screenshots captured (all screens reachable in repo)

Output dir:

- `learnflow/artifacts/iter33/`

Client app:

- `home.png`
- `login.png`, `register.png`
- Onboarding: `onboarding_welcome.png`, `onboarding_goals.png`, `onboarding_topics.png`, `onboarding_api_keys.png`, `onboarding_subscription.png`, `onboarding_first_course.png`
- Core: `dashboard.png`, `conversation.png`, `mindmap.png`, `settings.png`, `pipelines.png`
- Marketplace: `marketplace_courses.png`, `marketplace_agents.png`, `creator_dashboard.png`

Marketing web:

- `web_home.png`, `web_features.png`, `web_pricing.png`, `web_download.png`, `web_blog.png`, `web_about.png`, `web_docs.png`

---

## Iteration 33 — 10–15 Prioritized Tasks (Problem → Fix → Acceptance)

### 1) Make lesson sources first-class (end-to-end)

**Problem:** UI sources are partially mocked; WS sources are heuristic URL extraction. Spec §6/§11 requires real attribution objects.
**Fix:** Extend Course/Lesson schema to persist `sources[]` (title, author, publication, date/year, url, accessed_at, license if known). Remove `MOCK_SOURCES` usage.
**Acceptance:** LessonReader + SourceDrawer render persisted sources consistently via REST + WS; no mocks in production path.

### 2) Real Content Acquisition pipeline (spec §6.1)

**Problem:** CourseBuilderAgent does not actually discover/extract/score web content.
**Fix:** Implement: topic decomposition → source discovery (search) → extraction (Firecrawl/Playwright) → scoring → dedupe → lesson formatting.
**Acceptance:** Creating a course yields lessons with recency/authority signals and working citations; sources contain real metadata.

### 3) Orchestrator: implement spec workflow semantics (spec §10)

**Problem:** Orchestrator is invoked, but doesn’t follow the spec’s “clarify → build course → mindmap extend → lesson delivery → action chips” rigor.
**Fix:** Update orchestrator policy: ask clarifying questions when needed; invoke course_builder; then mindmap_agent; then deliver first lesson; always return 3–4 suggested actions.
**Acceptance:** New goal messages trigger clarifications; subsequent message builds course; response.end includes actions + sources; first lesson delivered under 1500 words.

### 4) WebSocket protocol: implement `context_overrides` and attachments

**Problem:** Spec §11.2 requires `context_overrides`; current API ignores it.
**Fix:** Parse and merge `context_overrides` into StudentContextObject; support simple attachment metadata in envelope.
**Acceptance:** WS message with overrides changes orchestrator behavior (e.g., difficulty, lesson length) and is covered by tests.

### 5) Emit `mindmap.update` and `progress.update` from real state changes

**Problem:** Client listens for these events but server rarely emits them from orchestrator flows.
**Fix:** When a new course is created, emit `mindmap.update` (nodes_added/edges_added). When lesson completion occurs, emit `progress.update` with `{course_id, lesson_id, completion_percent}`.
**Acceptance:** Conversation UI shows notifications and mindmap changes without refresh.

### 6) Replace fake “agent activity” with real agent routing signals

**Problem:** Client guesses agent by keywords in user text; spec wants transparency of which agent is working.
**Fix:** Server should emit `agent.spawned` with real agent name/task summary for each sub-agent call; client should render those directly.
**Acceptance:** Activity indicator always matches actual invoked agent (no keyword guessing).

### 7) BYOAI key vault: validation + secure storage + UX

**Problem:** Spec §4.4: encrypt keys, validate, rotate, usage dashboard; current flow is partial.
**Fix:** Implement provider selection, key validation call, store encrypted at rest, return masked keys only; add rotation/delete.
**Acceptance:** Settings supports add/list/delete/rotate; keys never returned in plaintext; invalid keys show actionable errors.

### 8) Token usage tracking per agent (spec §4.4, §8)

**Problem:** Spec wants per-agent token counts surfaced to user.
**Fix:** Track tokens per agent per session; aggregate daily/weekly; expose in `/analytics` and UI.
**Acceptance:** Dashboard/Settings show usage by agent + last-7-days; tests verify increments.

### 9) Mindmap: server-backed graph model (not derived-only)

**Problem:** Mindmap UI is generated from courses + local completion; spec expects a knowledge graph with mastery states + expand/jump.
**Fix:** Introduce `mindmap` resource in API; build from courses; update mastery with progress; add manual node create API.
**Acceptance:** `/mindmap` returns persisted nodes/edges; MindmapExplorer renders from server data.

### 10) Collaboration MVP with real-time rooms (spec §4.2 collaboration_agent)

**Problem:** Collaboration experience is largely UI; no WS peer messaging.
**Fix:** Create rooms, join/leave, message broadcast over WS; minimal peer matching using shared interests.
**Acceptance:** Two sessions can chat in a room; messages persist; basic matching endpoint works.

### 11) Course marketplace: real search/filter and enroll

**Problem:** Marketplace experience is partially static.
**Fix:** Implement filtering/sorting/pagination and enroll flow backed by DB.
**Acceptance:** Filters change results; enroll imports course into learner workspace; e2e covers browse→enroll.

### 12) Creator publish state machine + QA checks (spec §7.1)

**Problem:** Spec requires quality checks + moderation; creator dashboard is mostly presentation.
**Fix:** Draft→submitted→approved→published states; automated checks (min lessons, attribution completeness, readability).
**Acceptance:** Submit triggers checks; failures show reasons; approved courses appear in marketplace.

### 13) Export: Markdown (Free) + PDF/SCORM (Pro) incremental

**Problem:** Export spec is broad; current implementation unclear/stubbed.
**Fix:** Ship Markdown export first; gate PDF/SCORM behind Pro; include citations.
**Acceptance:** Export produces downloadable artifact with sources; Pro gating enforced server-side.

### 14) Security hardening: dev token guardrails

**Problem:** `token=dev` is useful locally but must never ship.
**Fix:** Require NODE_ENV=development for dev token; add tests.
**Acceptance:** In production mode, dev token auth fails; WS rejects unauthenticated connections.

### 15) Reality alignment: update spec/README to reflect MVP vs target architecture

**Problem:** Spec claims gRPC/K8s/vector DB; MVP is Node/WS + in-memory/SQLite-ish.
**Fix:** Add “MVP architecture” doc + delta list; stop misleading new engineers.
**Acceptance:** Docs match what runs locally; roadmap clearly states what’s mocked.
