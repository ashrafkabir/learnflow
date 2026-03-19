# IMPROVEMENT_QUEUE

Iteration: 37
Status: READY FOR BUILDER
Date: 2026-03-19
Theme: **From “responsive demo” → “agentic learning OS”: orchestration semantics, content pipeline realism, marketplace + creator economy, BYOAI vault**

## Verification (Iteration 36 landed)

**What was required to verify:** mobile home fix, screenshot-mobile authed mode, emoji removal, icon enforcement, and run fresh screenshots.

**Evidence (repo state):**

- `BUILD_LOG_ITER36.md` confirms emoji removal + icon enforcement + screenshot updates.
- `screenshot-mobile.mjs` includes `SCREENSHOT_AUTHED=1` mode and seeds localStorage token/onboarding.
- `apps/client/src` no longer depends on emoji icons (per Iter 36 log).

**Screenshots executed (Iteration 37 planner run):**

- Desktop app routes: `node screenshot.mjs` (outputs still default to iter36 folders; scripts hardcode DIR)
- Desktop app routes (authed): `SCREENSHOT_AUTHED=1 node screenshot.mjs`
- Mobile authed: `SCREENSHOT_AUTHED=1 node screenshot-mobile.mjs`
- Marketing web: `SCREENSHOT_DIR=evals/screenshots/iter37-web node screenshot-web.mjs`

**Dev boot (planner run):**

- Noted dev-port contention:
  - `apps/client` default port 3001 is frequently already in use; `npm run dev` fails hard.
  - `apps/api` default 3000 also frequently in use.
  - For screenshots, a server already running on the default ports is assumed.

## Brutal spec compliance assessment (v1.0)

LearnFlow is **not yet** the product described in the spec. It’s a credible UI shell with some API endpoints + localStorage “auth bypass”, but the differentiators are mostly missing:

### Biggest gaps vs spec differentiators

1. **Orchestration is not real**: no visible multi-agent DAG planning, no agent spawning events, no parallelization semantics, no tool registry/activation workflow that affects behavior.
2. **Content pipeline is not real**: no scraping/discovery/quality scoring/deduplication/attribution chain that drives lesson creation.
3. **BYOAI key management is not real**: key vault exists UI-wise, but no per-provider validation, encryption semantics surfaced, or usage dashboards that match spec.
4. **Marketplace is thin**: course + agent marketplace pages exist, but no credible publishing/moderation/reviews/earnings pipeline, and no “agent activation changes orchestrator behavior” loop.
5. **Mastery loop incomplete**: lesson format requirements (objectives, takeaways, sources, next steps, quick check) and adaptive quizzes/notes are inconsistent/placeholder.

## Iteration 37 — prioritized task queue (15)

Focus is **P0/P1 only**: deliver spec-critical semantics and credibility. Each task includes crisp acceptance.

### P0 — Make “agentic” real (or obviously simulated with correct semantics)

1. **Implement Orchestrator “event stream” UI (spec §11.2)**
   - Add WebSocket event handling + UI timeline: `response.start/chunk/end`, `agent.spawned/complete`, `mindmap.update`, `progress.update`.
   - Acceptance: in Conversation, sending a message shows agent activity (name + why), and streaming chunks appear; at end, action chips + sources render.

2. **Define/implement Agent Registry + activation affecting runtime**
   - Add a registry model: built-in agents + marketplace agents with capabilities + required provider.
   - Activation persisted in profile/context; orchestrator chooses marketplace agent when relevant.
   - Acceptance: activating a marketplace agent changes subsequent chat routing (visible via `agent.spawned` events and “first use this session” notice).

3. **Course creation workflow aligned to spec (spec §10)**
   - Enforce: clarifying questions → outline → mindmap update → first lesson → post-lesson actions.
   - Acceptance: “Create course” triggers these steps deterministically; lesson is <1500 words and has objectives/takeaways/sources/next steps.

4. **Real source citations everywhere (spec §6.3 + §5.2.3)**
   - Standardize `SourcesDrawer` and inline citations (hover/tap preview).
   - Acceptance: every lesson and long assistant response includes a `Sources` section with URLs + author/date when available.

### P0 — Content pipeline realism (spec §6)

5. **Implement pipeline artifacts model: discovery → extraction → scoring → dedupe → lesson formatting**
   - It can be “local simulated” but must store: URL, author, date, license, access timestamp, scores, dedupe hash.
   - Acceptance: Pipeline view shows each stage with inputs/outputs; creating a course produces pipeline artifacts saved in DB.

6. **Quality scoring + recency gating**
   - Implement scoring rubric fields (authority, recency, relevance, readability) and reject/flag staleness.
   - Acceptance: pipeline shows numeric scores; stale sources (>6 months for fast topics) are flagged and trigger refresh.

7. **Deduplication (MinHash/SimHash-lite acceptable)**
   - Acceptance: adding near-duplicate URLs collapses into one canonical source with linkage.

### P0 — BYOAI vault and usage tracking (spec §4.4 + §8)

8. **BYOAI provider model + validation semantics**
   - Support provider selection (OpenAI/Anthropic/Gemini/Mistral/Groq/Ollama) with per-provider key format validation.
   - Acceptance: `/api/v1/keys` stores provider + masked key; UI shows per-provider status (valid/invalid/unknown).

9. **Usage tracking by agent and by provider**
   - Token/event counters per agent surfaced in Settings → API Key Vault.
   - Acceptance: chat interactions increment usage; dashboard shows last-7-days usage.

### P1 — Mastery loop and learning science scaffolding

10. **Lesson reader spec parity**

- Enforce structure: time badge, objectives, core content, takeaways, sources, next steps, quick check.
- Acceptance: `LessonReader` renders those sections and they are present in seeded demo content.

11. **Notes agent outputs: Cornell + flashcards + Zettelkasten**

- Acceptance: “Take Notes” produces structured payload (not just text) and UI renders appropriately.

12. **Exam agent: quizzes + scoring + gap identification + difficulty adaptation**

- Acceptance: quiz submission yields score + gaps; next quiz difficulty changes based on last score.

### P1 — Marketplace + creator economy credibility

13. **Course marketplace: reviews/ratings + creator profile completeness**

- Acceptance: course detail page shows reviews, average rating, creator profile, syllabus preview, enroll.

14. **Creator publishing workflow + moderation queue**

- Add draft → submit → automated checks (attribution/readability/min lessons) → moderation state.
- Acceptance: creator dashboard shows status pipeline and blocked reasons.

15. **Monetization semantics (Free vs Pro vs paid courses)**

- Wire subscription tier into feature gates (export formats, proactive updates, paid publishing).
- Acceptance: toggling subscription tier changes visible options and API enforces gates.

## Builder notes (non-negotiables)

- If a feature is mocked, **mock it with correct data shapes and events** so the UI/semantics match the spec.
- Prioritize **orchestration + pipeline + sources + BYOAI vault** before visual polish.
- Fix dev ergonomics: hardcoded screenshot output dirs (`iter36-*`) are now a recurring footgun.

## Known technical debt surfaced in planner run

- Screenshot scripts hardcode output directories (`iter36-*`) and ignore `SCREENSHOT_DIR` for app/mobile. This makes iteration evidence messy.
- Dev servers frequently collide on ports 3000/3001/3003; consider `.env`-driven ports with printed URLs and screenshot scripts consuming `SCREENSHOT_BASE_URL`.
