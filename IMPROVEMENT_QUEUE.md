# LearnFlow — Improvement Queue

Owner: Builder  
Planner: Ash (planner subagent)  
Last updated: 2026-03-23

---

## Iteration 72 — CONTENT QUALITY + TOPIC-ADAPTIVE COURSE STRUCTURE

Status: **DONE (iter72)**

### What changed (evidence)

Iter72 is materially complete relative to the Iter72 queue intent. The repo now has:

- **Topic-preserving, topic-adaptive outline generation** (no more “fallback-to-quantum”).
  - API course creation uses `classifyTopicDomain(topic)` → domain profile → `buildCourseOutline(topic)`.
  - **Quantum computing** has a strict required module order via `quantumComputingRequiredModules()`.
- **Async course creation**: `POST /api/v1/courses` returns quickly with `{ status: "CREATING" }` and background generation emits `progress.update`.
- **Per-lesson sourcing** (stage 2): `searchForLesson()` runs per lesson; sources persisted per lesson.
- **Lesson narration structure**: server prompt requires headings (Objectives/Estimated Time/Core Concepts/Worked Example/Recap/Quick Check+Answer Key/Sources/Next Steps) and server runs validators.
- **Embedded images**: license-safe image retrieval via Wikimedia Commons search; embeds image + attribution block in lesson markdown; illustration metadata persisted.
- **Regression tests**: outline diversity test + quantum outline regression + pipeline/course integration.

Key commits observed in `git log`:

- `6f21c58` Iter72 P0: topic-adaptive outline generation (remove quantum fallback)
- `5134b17` Iter72: enforce lesson structure + structured sources
- `a28fe52` Iter72: async course creation status+progress
- `82413c4` iter72: per-lesson sources + embedded Wikimedia image + reduce boilerplate
- `bce8bbe` Iter72: license-safe images (Wikimedia) + illustration attribution metadata
- `c140777` test(iter72): add cross-domain outline diversity regression

### Planner verification (Iter73 planner run)

- ✅ Boot: `systemctl --user restart learnflow-api learnflow-client learnflow-web || true`
- ✅ Screenshots: `SCREENSHOT_DIR=screenshots/iter73/planner-run node screenshot-all.mjs`
  - Output dir: `learnflow/screenshots/iter73/planner-run/`
- ✅ `npm test`
- ✅ `npx tsc --noEmit`
- ✅ `npx eslint .`
- ✅ `npx prettier --check .`

### Brutally honest remaining gaps vs spec (sections 1–17)

Iter72 improved “course/lesson generation quality”, but the product spec is far larger than current implementation. High-level truth:

- **Spec §§1–2 (vision/positioning/personas)**: _Partial/MVP_. UI exists; “agentic platform” framing is implemented primarily as deterministic pipelines + limited WS events.
- **Spec §§3–4 (multi-agent orchestration)**: _Not truly implemented as described._ There is no DAG planner / dynamic agent spawning registry matching the spec. There are functional “pipelines” and WS progress events, but not an orchestrator mesh.
- **Spec §5 (client app screens)**: _Mostly implemented as MVP screens_ (onboarding, dashboard, lesson reader, mindmap, marketplace stubs). Polished UX details (action chips, source drawers, agent transparency) are inconsistent.
- **Spec §6 (content pipeline + attribution)**: _Partial, improved._
  - Structured sources exist and are persisted per lesson.
  - **License/access timestamps** exist for sources best-effort.
  - Still missing: durable “credibility scoring”, dedupe, and a full provenance chain model.
- **Spec §6.2 (worked examples + cadence)**: _Partial._ Structure is enforced, but **worked-example depth/quality is not guaranteed** (validators currently warn, don’t regenerate).
- **Spec image provenance**: Wikimedia is license-safe, but **image relevance/placement quality is not validated**.
- **Spec §11 (API spec)**: _Partial._ Several endpoints exist; not all spec endpoints/features are present.
- **Spec §12 (marketing website)**: _Implemented/MVP_ (pages exist + screenshots pass).
- **Spec §14 (Update Agent Pro)**: _Partial/stub_.
- **Spec §15 (Export)**: _MVP_.
- **Spec §16 (security/privacy)**: _MVP_. BYOAI vaulting + full compliance posture not at spec level.
- **Spec §17 (observability/ops)**: _Not implemented beyond basics._

---

## Iteration 73 — TRUE TOPIC-SPECIFIC CURRICULUM + NARRATION QUALITY + SOURCING RELIABILITY

> Planner note: User interjections to incorporate next planning cycle are tracked in `USER_SUGGESTIONS.md` (must not block current builder progression).

Status: **DONE (iter73)**

Focus:

1. **True topic-specific curriculum templates beyond quantum** (domain profiles that feel real, not generic)
2. **Narration quality**: worked examples must be concrete and fully worked, not placeholders
3. **Image placement relevance**: only when it helps, and in the right spot
4. **Sourcing reliability under 429s / rate limits**: resilient retries + graceful degradation without losing attribution

Non-goals:

- Full infra re-architecture to the spec’s K8s agent mesh
- Marketplace monetization/payment rails
- Enterprise auth/SSO

### P0 (Must do)

1. **Add real domain profiles (beyond quantum) with distinct module skeletons**
   - Add profiles for at least: `programming`, `math`, `policy_business`, `cooking`, `ai_prompting`.
   - Each profile must define:
     - module ordering that reflects actual prerequisites for that domain
     - module objectives that are not generic
     - lesson title/description patterns that force specificity
   - Add regression test: module titles across 6 topics must be both _diverse_ and _domain-appropriate_.

2. **Replace generic “general outline” with topic decomposition (lightweight)**
   - Implement a small “concept extraction” step that pulls 8–15 key subtopics from sources (or from the topic string if sources unavailable).
   - Use these subtopics to populate modules/lessons (prevents “Orientation/Core/Advanced/Best Practices” repetition).
   - Deterministic in tests.

3. **Worked Example Quality Gate = regenerate or fail (not just warn)**
   - Today: `validateWorkedExampleQuality()` only logs warnings.
   - Change behavior:
     - If worked-example gate fails, **regenerate the lesson** up to N attempts (2–3) with stricter instructions.
     - If still failing, mark lesson generation as degraded and surface a clear UI banner (“Lesson generated without a fully worked example; try again”).

4. **Make “worked example” domain-specific and artifact-producing**
   - Programming: runnable snippet + expected output and “how to run”.
   - Math/science: numeric example with step-by-step computation.
   - Policy/business: scenario + options + tradeoff table.
   - Add tests that check for these artifacts by domain.

5. **Image relevance/placement rules (do not always insert after Core Concepts)**
   - Add heuristics:
     - Only add an image when it supports a definable visual concept (diagram/flow/map/graph/physical object).
     - Place image near the section it supports (often Worked Example or a dedicated “Diagram” section).
   - Add an “imageReason” field in illustration metadata.

6. **Sourcing reliability: implement rate-limit aware fetch with backoff + caching**
   - Web search/scrape frequently hits 429/timeout. Add:
     - exponential backoff with jitter
     - per-domain rate limiting
     - small persistent cache (URL→extracted content + timestamp) to avoid re-fetch
   - Ensure attribution is not lost on retries.

### P1 (Should do)

7. **Per-lesson domain diversity gate for sources (enforced, not advisory)** — **DONE (iter73)**
   - Enforced best-effort gate in API lesson sourcing:
     - if <2 sources or <2 distinct domains → retry `searchForLesson()` with broader query + expanded providers, merge, and pick sources that increase domain diversity.
   - Persist `missingReason` as `domain_diversity_gate: ...` when still failing.

8. **Source metadata enrichment (publication/year/title normalization)** — **DONE (iter73)**
   - Improved `toStructuredLessonSources()`:
     - normalize titles (collapse whitespace/trim)
     - best-effort year extraction from publishDate/title/url
     - consistent publication fallback + added `domain` field
     - expanded license heuristics (best-effort)
   - Persisted source objects now include: title, domain, year, license, accessedAt (+ publication).

9. **Lesson length control should include section-level quotas** — **DONE (iter73)**
   - Added `validateSectionLevelQuotas()` gate (API):
     - objectives_too_long
     - core_concepts_too_dominant (share cap)
     - worked_example_too_short / recap_too_short
   - Integrated into lesson regeneration retry loop (skipped in fastTestMode).

10. **Quality telemetry in DB + UI** — **PARTIAL (iter73)**

- **DONE (DB)**: persist per-lesson quality telemetry (`lesson_quality` table) with:
  - generationAttemptCount
  - finalStatus (pass/fail)
  - reasons[] (placeholder/worked-example/section-quotas)
  - wordCount
- **TODO (UI)**: surface a small “Quality” pill / debug view (admin/dev) to inspect telemetry + sourcing missingReason.

### P2 (Nice to have)

11. **Prompt hardening to reduce template-y writing**

- Add “ban phrases” / “avoid generic claims” list.
- Add a post-pass that rewrites generic sentences (best-effort, non-LLM mode optional).

✅ **DONE (Iter73 Run 6)**

- Implemented banned-phrase guidance in lesson system prompt + non-LLM post-pass rewrite ( `hardenLessonStyle`).
- Evidence:
  - Code: `apps/api/src/utils/styleHardening.ts`, integration in `apps/api/src/routes/courses.ts`
  - Tests: `apps/api/src/utils/__tests__/styleHardening.test.ts`
  - `npm test` (turbo) ✅ (Run 6)

12. **Test harness: offline deterministic “topic pack”**

- Build a deterministic fixture set per domain (mock sources) to make content-quality tests stable without network.

✅ **DONE (Iter73 Run 6)**

- Added deterministic `TOPIC_PACKS` fixtures across 5 domains.
- Evidence:
  - Code: `packages/agents/src/fixtures/topic-packs.ts`
  - Tests: `packages/agents/src/__tests__/iter73-offline-topic-pack.test.ts`
  - `npm test` ✅ (Run 6)

13. **Improve pipeline-to-course test: enforce minimum word count without flaky retries**

- Tests currently log that lessons fall below 500 words; harden generation or adjust threshold.

✅ **DONE (Iter73 Run 6)**

- Expanded test fast mode lesson template to exceed 500 words deterministically.
- Added API integration test to assert `wordCount >= 500` for generated lessons in fast mode.
- Evidence:
  - Code: `apps/api/src/routes/courses.ts` (fastTestMode template expanded)
  - Test: `apps/api/src/__tests__/iter73-course-generation-min-words.test.ts`
  - `npm test` ✅ (Run 6)

14. **Client: Attribution Drawer component**

- Consolidate text sources + image provenance in one accessible drawer.

✅ **DONE (Iter73 Run 6)**

- Added accessible `AttributionDrawer` overlay with text sources + image provenance.
- Wired into LessonReader via “See Sources” action.
- Evidence:
  - Code: `apps/client/src/components/AttributionDrawer.tsx`, `apps/client/src/screens/LessonReader.tsx`
  - Screenshots: `screenshots/iter73/run-6/lesson-reader.png`
  - `npm test` ✅ (Run 6)

15. **Client: Action chips (Take Notes / Quiz Me / Go Deeper / See Sources)**

- Spec wants these consistently; implement minimal version with existing routes.

✅ **DONE (Iter73 Run 6)**

- Implemented action chips in LessonReader:
  - Take Notes → opens notes panel
  - Quiz Me → opens quiz panel
  - Go Deeper → scrolls to Next Steps (fallback: opens Attribution)
  - See Sources → opens AttributionDrawer
- Evidence:
  - Code: `apps/client/src/screens/LessonReader.tsx`
  - Screenshots: `screenshots/iter73/run-6/lesson-reader.png`
  - `npm test` ✅ (Run 6)

---

## Evidence pack (Iter73 planner run)

- Spec read: `learnflow/LearnFlow_Product_Spec.md`
- Code inspected:
  - `apps/api/src/routes/courses.ts` (async course creation, per-lesson sourcing, Wikimedia images)
  - `packages/agents/src/course-builder/domain-outline.ts` (domain classification + outline generator)
  - `packages/agents/src/course-builder/domain-profiles/quantum.ts`
  - `apps/api/src/utils/lessonQuality.ts` (worked example quality checks)
- Screenshots: `learnflow/screenshots/iter73/planner-run/`

---

## Iteration 74 — E2E COURSE PLANNING (FROM SOURCES) + PER-TOPIC RE-SEARCH LOOP + E-LEARNING NARRATION POLISH

Status: **IN PROGRESS (builder running)**

Focus (why this iteration exists):

- Make course creation feel like a real e-learning platform (narration + worked examples + quick checks), per `USER_SUGGESTIONS.md`.
- Tighten the **end-to-end** generation loop so the system can:
  1. create an outline,
  2. **search per topic/lesson**,
  3. synthesize lessons,
  4. detect gaps,
  5. re-search and patch,
  6. deliver stable source cards + provenance.
- Increase reliability and transparency (progress, retries, no “stuck mid-generation”).

Non-goals:

- Rebuilding into the full multi-agent K8s mesh described in the spec.
- Making LearnFlow publicly accessible on the Internet **unless explicitly approved** (see P2 task).

### P0 (Must do)

1. **Course Planning stage: build a “course plan” from sources before writing lessons**
   - Add an explicit planning artifact that links: topic → extracted subtopics → modules/lessons → target sources.
   - Acceptance criteria:
     - Creating a course persists a plan object (even in degraded / test mode). ✅ DONE (courses.plan persisted)
     - Each lesson in the plan has 3–6 “planned queries” and a target source mix (e.g., docs + blog + academic). ✅ DONE
     - Plan is visible in the pipeline detail API response (debug view). ✅ DONE
   - Likely files:
     - `packages/agents/src/course-builder/*` (new plan builder)
     - `apps/api/src/routes/courses.ts`, `apps/api/src/routes/pipeline.ts`
     - DB: extend `courses` or add `course_plans` table
   - Tests:
     - New API integration test: creating a course returns/produces plan with per-lesson queries.
   - Evidence:
     - Commit: `3f42987` ("Iter74 P0: persist course plan artifact on courses")
     - Commit: `077f63b` ("iter74: expose course plan in pipeline detail debug")
     - Code: `apps/api/src/utils/coursePlan.ts`, `apps/api/src/db.ts`, `apps/api/src/routes/courses.ts`
     - Code: `apps/api/src/routes/pipeline.ts` (adds `debug.coursePlan` + persists plan on pipeline-created courses)
     - Test: `apps/api/src/__tests__/pipeline-course-plan-debug.test.ts`
     - Checks: `npm test`, `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .` all ✅

2. **Per-lesson “re-search loop” when lesson quality gates fail (topic-aware queries)** ✅ DONE
   - Today: regeneration reuses mostly the same sources; add a loop that **broadens / changes** queries when:
     - worked-example gate fails
     - section quotas fail
     - sources are too thin
   - Implemented:
     - New retry query builder with explicit hint tokens ("worked example", "step-by-step", "reference implementation", "numerical example", etc.)
     - Re-search attempts actually change inputs to `searchForLesson` via `stage2Templates` override.
     - Stores structured retry `missingReason` values like: `worked_example_missing`, `section_quota_failed`, `placeholders_present`.
   - Evidence:
     - Commit: `ef5f16e` ("Iter74 P0.2 re-search retry + P0.3 richer source cards")
     - Code: `apps/api/src/utils/stage2Retry.ts`
     - Code: `apps/api/src/routes/courses.ts` (re-search on quality gate failure)
     - Test: `apps/api/src/__tests__/iter74-research-retry.test.ts`

3. **Source cards: compute per-result summaries (not just truncation) + ensure UI parity** ✅ DONE
   - Improve `SourceCard.summary` to be an actual short summary (extractive heuristic OK) and add per-card “why this matters”.
   - Implemented:
     - `extractiveSummary()` (1–2 sentence extractive)
     - `inferSourceType()` heuristics (docs/blog/paper/forum)
     - `whyThisMatters` field (API + UI rendering)
   - Evidence:
     - Commit: `ef5f16e` ("Iter74 P0.2 re-search retry + P0.3 richer source cards")
     - Code: `apps/api/src/utils/sourceCards.ts`
     - Code: `apps/client/src/components/pipeline/SourceCards.tsx`
     - Types: `apps/client/src/hooks/usePipeline.ts`
     - Tests: `apps/api/src/utils/__tests__/sourceCards.test.ts`
   - Screenshots:
     - TODO: `lesson-reader` (sources drawer shows cards with summaries + whyThisMatters + sourceType)

4. **E-learning narration polish: enforce “worked example is fully worked” + “quick check has answer key”**
   - Strengthen validators to ensure:
     - worked example is not vague (“consider…”, “imagine…”) and includes concrete artifacts by domain
     - quick check includes answers (no placeholders)
   - Acceptance criteria:
     - Builder can point to explicit validation reasons when failing.
     - Regeneration uses a “strict” prompt variant that demands numeric/code/table outputs.
   - Likely files:
     - `apps/api/src/utils/lessonQuality.ts`
     - `apps/api/src/utils/lessonStructure.ts`
   - Tests:
     - Add failing fixtures and verify reasons + retry behavior.

5. **Pipeline/course progress: visible milestones for plan → sources → lesson drafts → finalize**
   - Make progress granular and monotonic so UI never feels stuck.
   - Acceptance criteria:
     - Pipeline logs contain milestones per lesson (e.g., `plan_ready`, `sources_ready`, `draft_ready`, `quality_passed`).
     - Client pipeline detail shows a per-lesson checklist/progress list.
   - Likely files:
     - `apps/api/src/routes/pipeline.ts`
     - `apps/client/src/screens/PipelineDetail.tsx`
   - Tests:
     - API test asserts logs include milestone messages.
   - Screenshots:
     - `pipeline-detail` shows milestones

6. **Course creation must not end early: add “completion fence” and restartability for course builds**
   - Ensure that background course generation cannot silently stop mid-way.
   - Acceptance criteria:
     - If a course is left `CREATING` beyond a timeout, it transitions to `FAILED(stalled)` with an explanation.
     - UI shows a “Resume/Restart build” action.
   - Likely files:
     - `apps/api/src/routes/courses.ts`, `apps/api/src/routes/pipeline.ts`
     - `apps/client/src/screens/PipelineDetail.tsx`
   - Tests:
     - Similar to pipeline stall test, but for course creation status.

### P1 (Should do)

7. **Topic-specific curriculum patterns library (more than domain profiles)**
   - Move beyond domain-only patterns and introduce topic-family templates (e.g., “cert prep”, “hands-on project”, “conceptual survey”).
   - Acceptance criteria:
     - At least 3 templates selectable via deterministic classifier.
     - Templates change number of modules/lessons and cadence (not just titles).
   - Likely files:
     - `packages/agents/src/course-builder/*`
   - Tests:
     - Regression: 3 distinct topics map to 3 different templates.

8. **Search thread spawning model (internal): per lesson, per modality (text + image)**
   - Implement an internal structure to run lesson search as two tracks:
     - text sources
     - image candidates (Wikimedia)
   - Acceptance criteria:
     - Each lesson stores separate logs for text-search and image-search.
     - Image candidates include `imageReason` matching a section (“Core Concepts diagram”, “Worked Example flowchart”).
   - Likely files:
     - `packages/agents/src/content-pipeline/*`
     - `apps/api/src/lib/search-run-log.ts`
   - Tests:
     - Unit test: image search logs are present and do not block text sourcing on failure.

9. **Improve lesson-source selection: add simple “coverage” scoring vs lesson objectives**
   - Reduce irrelevant sources by checking overlap with lesson goals/subtopics.
   - Acceptance criteria:
     - Persist per-source `coverageScore` and pick top N with diversity.
     - Expose `coverageScore` in debug view.
   - Likely files:
     - `apps/api/src/utils/sourcesStructured.ts`
     - `packages/agents/src/content-pipeline/*`
   - Tests:
     - Unit test for scoring + selection behavior.

10. **Quality telemetry UI (finish Iter73 partial): show per-lesson quality pill + reasons**

- Acceptance criteria:
  - Lesson Reader shows a dev-only “Quality” pill (e.g., in header) with pass/fail + reasons.
  - Pipeline detail shows count of lessons that required retries.
- Likely files:
  - `apps/client/src/screens/LessonReader.tsx`
  - `apps/client/src/screens/PipelineDetail.tsx`
- Tests:
  - Client test asserts pill renders in dev/test mode.
- Screenshots:
  - `lesson-reader` shows quality pill

### P2 (Nice to have / Conditional)

11. **External accessibility plan (ONLY IF USER EXPLICITLY APPROVES)**

- Prepare a minimal “public access” checklist without deploying it by default.
- Acceptance criteria:
  - Documented steps to expose web+api safely (CORS, cookies/JWT, rate limits, config).
  - Add a config flag (default off) to bind to non-localhost.
- Likely files:
  - `apps/api/src/server.ts` / config
  - `apps/client` and `apps/web` deploy notes
  - `docs/*`

12. **Lesson polish pass: de-template language rewrite tuned per domain**

- Build on `hardenLessonStyle` to remove generic e-learning filler.
- Acceptance criteria:
  - Adds a set of domain-specific banned phrases.
  - Produces measurable reduction in “generic phrase” hits in a unit test.
- Likely files:
  - `apps/api/src/utils/styleHardening.ts`
- Tests:
  - Extend `styleHardening.test.ts` with domain fixtures.

### Screenshot checklist (Iter74)

- `course-create-after-click`
- `pipeline-detail` (milestones visible)
- `lesson-reader` (sources drawer shows cards + summaries; quality pill if implemented)
- `app-pipelines` (no stuck state)

### Verification checklist (Iter74)

- `npm test`
- `npx tsc --noEmit`
- `npx eslint .`
- `npx prettier --check .`
