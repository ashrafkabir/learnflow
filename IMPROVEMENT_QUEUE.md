# IMPROVEMENT_QUEUE — Iter155 (Planner)

Status: DONE (built)

Date: 2026-03-30 (EDT)

Inputs used (this run):
- Spec: `LearnFlow_Product_Spec.md` (March 2026)
- Code inspection: client + API + agents (file refs inline)
- Fresh screenshot run (Iter155): `learnflow/screenshots/iter155/run-001/`

---

## 0) Executive summary (brutally honest)

**The two biggest Iter154 mismatches appear resolved (no regressions detected):**

- **Tavily removal / OpenAI-only constraint:** The spec forbids Tavily/Firecrawl for MVP research (§6.1.1). In this repo now, the **client onboarding no longer mentions Tavily** and the provider list is **OpenAI/Anthropic/Google/Mistral/Groq/Ollama** only (`apps/client/src/screens/onboarding/ApiKeys.tsx`). On the agents side, “Tavily disabled” is enforced in code (`packages/agents/src/content-pipeline/web-search-provider.ts` returns `false` from `hasTavilyKey()` and does not import Tavily).

- **LessonReader Quick Check + Next Steps rendering:** These sections are now **parsed and rendered** in the lesson body (`apps/client/src/screens/LessonReader.tsx` around the `data-testid="lesson-next-steps"` and `data-testid="lesson-quick-check"` blocks). This addresses the prior “parsed but not visible” gap.

That said, LearnFlow still has **material spec gaps** that affect user trust and product coherence:

1) **Spec says “collect sources once → recommended sources per lesson → suggested reads” (§6.1.3/6.2).** The UI’s “Suggested reads” is still effectively a **general sources list** (lesson-level curation is not clearly persisted and returned as first-class fields). The pipeline writes research artifacts, but lesson payloads don’t obviously carry “recommendedSources” vs “suggestedReads” as separate, stable concepts.

2) **The “<10 min read / 1500 words” constraint is not clearly enforced as a hard quality gate.** The spec is explicit (§6.2). The API has multiple quality validators, but there’s no obvious, strict “word cap / estimated time cap” enforcement that blocks publishing/marking a course as complete.

3) **Dashboard/mindmap spec calls for an interactive graph overview (§5.2.2/5.2.5).** Current dashboard has a **static teaser** and separate Mindmap screen; it’s acceptable as MVP, but it doesn’t meet the spec’s “interactive overview” bar.

---

## 1) Evidence — Iter155 screenshots

Stored in repo:
- `learnflow/screenshots/iter155/run-001/`

Captured screens include (desktop set):
- Marketing: home/features/pricing/download/blog/about/docs
- Auth: login/register
- Onboarding steps 1–6
- App: dashboard, conversation, mindmap, notifications, pipelines, settings, collaboration
- Marketplace: courses, agents, creator dashboard
- Course: course view, lesson reader
- Pipeline: pipeline detail

Notes:
- The capture script used a dev auth bypass and seeded stable routes (see `screenshot-all.mjs`).

---

## 2) Spec → implementation delta map (Iter155)

### 2.1 Research constraint (spec §6.1.1): **OpenAI Web Search only; no Tavily/Firecrawl**
- Spec: `LearnFlow_Product_Spec.md` §6.1.1
- Implementation:
  - Pipeline uses OpenAI `web_search` + extraction (`apps/api/src/routes/pipeline.ts` around the `openai_web_search` logs + `searchAndExtractTopic()` usage).
  - Agents layer contains an additional free multi-source search stack (Wikipedia/arXiv/GitHub/Medium/etc.) and explicitly disables Tavily (`packages/agents/src/content-pipeline/web-search-provider.ts`).
  - UI no longer exposes Tavily as a key provider (`apps/client/src/screens/onboarding/ApiKeys.tsx`).
- Risk: **two parallel “research stacks”** exist (OpenAI web_search in pipeline vs multi-source scrapers in agents). This increases drift risk and makes spec compliance harder to reason about.

### 2.2 Lesson structure (spec §6.2)
- Spec requires: estimated time, objectives, sources, suggested reads, next lesson link, next steps, quick check.
- Implementation:
  - Next lesson CTA exists (`apps/client/src/screens/LessonReader.tsx` `data-testid="next-lesson-cta"`).
  - Next Steps and Quick Check are rendered (`data-testid="lesson-next-steps"`, `data-testid="lesson-quick-check"`).
- Remaining mismatch: “Suggested Reads” should be **2–5 curated items**; current behavior appears closer to “sources list” rather than per-lesson curated reads persisted from `lessonplan.md` (§6.1.3).

### 2.3 Dashboard (spec §5.2.2)
- Implementation includes:
  - Courses grid with progress rings (`apps/client/src/screens/Dashboard.tsx` `data-component="course-carousel"`)
  - Today’s Lessons is API-driven (`apps/api/src/routes/daily.ts`)
  - Mindmap overview is a teaser card (non-interactive)
- Spec wants an interactive overview; current is MVP-ish but below spec.

### 2.4 Conversation interface (spec §5.2.3)
- Spec wants agent activity indicator + source drawer + mindmap panel.
- Implementation:
  - Agent activity indicator exists (`apps/client/src/screens/Conversation.tsx` “Agent activity indicator — Task 5”).
  - WebSocket contract is implemented (`apps/api/src/websocket.ts` emits `connected`, `ws.contract`, streams via orchestrator).
- Gap: there’s no explicit end-to-end assertion that agent activity + sources drawer work on real streamed messages (only partial unit/ws contract tests).

### 2.5 Profile/settings transparency (spec §5.2.8 / §9)
- Implementation is better than spec implies:
  - Export endpoints exist (`apps/api/src/routes/export.ts`)
  - UI exposes export + data deletion (“Danger Zone”) (`apps/client/src/screens/ProfileSettings.tsx`)
- Gap: the spec implies a more explicit “what data is tracked” UX. There is a data summary endpoint (`GET /api/v1/profile/data-summary`), but the UI could surface it more clearly as a dedicated “Data & Privacy” section rather than mixed into a long settings page.

---

## 3) Iter155 — prioritized, buildable tasks (10–15)

### P0 — Prevent future regressions on the recently-fixed mismatches

1) **P0: E2E guard — Quick Check + Next Steps must render when present**
   - Why: This was a major spec mismatch recently; lock it.
   - Files:
     - UI: `apps/client/src/screens/LessonReader.tsx` (`data-testid="lesson-next-steps"`, `data-testid="lesson-quick-check"`)
     - New test: `e2e/iter155-lesson-endcap-renders.spec.ts`
   - Acceptance: load a lesson fixture containing both headings and assert both testids are visible.

2) **P0: E2E guard — onboarding providers list stays spec-aligned (no Tavily)**
   - Why: Spec §6.1.1 is explicit; prevent UI drift.
   - Files:
     - UI: `apps/client/src/screens/onboarding/ApiKeys.tsx`
     - New test: `e2e/iter155-onboarding-providers.spec.ts`
   - Acceptance: provider select options match `{openai, anthropic, google, mistral, groq, ollama}`.

### P1 — “Suggested Reads” correctness (spec §6.1.3 / §6.2)

3) **Persist per-lesson recommended sources from `lessonplan.md` and return them in lesson payload**
   - Why: Spec requires “recommended sources per lesson” (§6.1.3) and “Suggested Reads 2–5 items” (§6.2). Current UI likely shows general sources.
   - Files to inspect/extend:
     - Pipeline artifact writing: `apps/api/src/routes/pipeline.ts` (where lessonplan is generated + persisted)
     - Lesson fetch DTO shaping: `apps/api/src/routes/courses.ts` (lesson response)
     - Client: `apps/client/src/screens/LessonReader.tsx` (drawer section that lists reads/sources)
   - Acceptance:
     - Each lesson includes `recommendedSources[]` (stable order) and UI renders them under “Suggested Reads”.

4) **UI: Separate “Sources” vs “Suggested Reads” in the Lesson Drawer**
   - Why: Conflating them undermines trust + spec coherence.
   - Files: `apps/client/src/screens/LessonReader.tsx`
   - Acceptance: “Sources” shows full list; “Suggested Reads” shows curated 2–5.

### P1 — Enforce <10 min / 1500 word contract (spec §6.2)

5) **Add a hard lesson length gate (word count + estimated time) during generation/validation**
   - Why: Spec promises it; without enforcement lessons will drift.
   - Files:
     - Validators: `apps/api/src/utils/lessonQuality.ts`, `apps/api/src/utils/lessonSectionQuotas.ts`
     - Generation pipeline: `apps/api/src/routes/courses.ts` (lesson generation) and/or `apps/api/src/routes/pipeline.ts` (quality stage)
   - Acceptance: if lesson body exceeds threshold, it is automatically shortened or generation fails with a clear validator reason.

6) **Expose the enforcement result in the UI**
   - Why: transparency; prevents “it says 8 min but is 20 min”.
   - Files: `apps/client/src/screens/LessonReader.tsx`
   - Acceptance: badge shows “Estimated time” derived from the same server-side calculation used in validation.

### P2 — Reduce research stack drift (spec compliance + maintainability)

7) **Unify “web search” behavior behind one provider interface**
   - Why: today there’s OpenAI-web_search in pipeline and a separate multi-source search in `@learnflow/agents`.
   - Files:
     - API: `apps/api/src/routes/pipeline.ts`, `apps/api/src/routes/search.ts`
     - Agents: `packages/agents/src/content-pipeline/openai-websearch-provider.ts`, `packages/agents/src/content-pipeline/web-search-provider.ts`
   - Acceptance: one “ResearchProvider” path (OpenAI web_search for MVP) and tests confirm no paid provider usage.

8) **Docs truth pass: update `docs/api.md` search section**
   - Why: it currently hints at “provider switching and Tavily support if configured” which contradicts MVP constraint.
   - File: `docs/api.md`
   - Acceptance: docs explicitly state OpenAI-only (or list exactly what’s used) with no Tavily implication.

### P2 — Dashboard + mindmap spec alignment

9) **Make the Dashboard “Knowledge Map” preview minimally interactive**
   - Why: spec §5.2.2 calls for an interactive overview.
   - Files: `apps/client/src/screens/Dashboard.tsx`
   - Acceptance: clicking a node/teaser element filters/jumps to a course/module/lesson or opens the mindmap with focus.

10) **Mindmap screen: ensure progress coloring is accurate and deterministic**
   - Why: spec §5.2.5; avoid “random” colors.
   - Files: `apps/client/src/screens/Mindmap.tsx` (and mindmap suggestions path via WS `mindmap.subscribe`)
   - Acceptance: nodes reflect completion state (not started/in progress/complete) reliably.

### P3 — UX polish and “truthful MVP” hardening

11) **Settings: split into tabs/sections; make Data & Privacy first-class**
   - Why: current settings page is extremely long; key trust features (export/delete) are buried.
   - File: `apps/client/src/screens/ProfileSettings.tsx`
   - Acceptance: clear sections (Account, Keys, Usage, Data & Privacy, Dev panels).

12) **PipelineDetail: add “Copy logs (redacted)” and “Download artifacts” UX**
   - Why: easier debugging without leaking keys.
   - Files: `apps/client/src/screens/PipelineDetail.tsx`, API artifact endpoints (wherever served)
   - Acceptance: one-click copy includes requestId and strips secrets.

13) **Conversation: add an explicit “See sources” affordance when sources exist (not only chips)**
   - Why: spec §5.2.3; improve discoverability.
   - File: `apps/client/src/screens/Conversation.tsx`
   - Acceptance: source drawer opens reliably for any message with sources.

14) **Update Agent: clarify “manual tick” in UI copy + surface last run result**
   - Why: spec implies proactive; MVP is manual (`POST /api/v1/update-agent/tick`). Make it honest.
   - Files: `apps/client/src/components/update-agent/UpdateAgentSettingsPanel.tsx`, `apps/api/src/routes/update-agent.ts`
   - Acceptance: user sees last tick time/status and the fact it’s manual in MVP.

15) **Add a single “Spec compliance” checklist doc per iteration**
   - Why: prevents recurring drift.
   - Files: new `iterations/iter155/SPEC_DELTA.md`
   - Acceptance: 1–2 pages summarizing any intentional deviations.

---

## 4) Concrete file refs (for Builder)

- Spec
  - `LearnFlow_Product_Spec.md`

- Screenshots
  - `learnflow/screenshots/iter155/run-001/`

- OpenAI-only search constraint / research pipeline
  - `apps/api/src/routes/pipeline.ts`
  - `apps/api/src/routes/search.ts`
  - `packages/agents/src/content-pipeline/openai-websearch-provider.ts`
  - `packages/agents/src/content-pipeline/web-search-provider.ts`

- Lesson reader endcap sections
  - `apps/client/src/screens/LessonReader.tsx`

- Dashboard + daily lessons
  - `apps/client/src/screens/Dashboard.tsx`
  - `apps/api/src/routes/daily.ts`

- Conversation + WS contract
  - `apps/client/src/screens/Conversation.tsx`
  - `apps/api/src/websocket.ts`

- Data export + deletion
  - `apps/client/src/screens/ProfileSettings.tsx`
  - `apps/api/src/routes/export.ts`
  - `apps/api/src/routes/delete-my-data.ts`

---

## 5) OneDrive sync (Iter155) — REQUIRED

Sync these outputs to OneDrive:
- `learnflow/screenshots/iter155/run-001/`
- `IMPROVEMENT_QUEUE.md`

Target paths:
- `/home/aifactory/onedrive-learnflow/iter155/IMPROVEMENT_QUEUE.md`
- `/home/aifactory/onedrive-learnflow/iter155/screenshots/run-001/`
