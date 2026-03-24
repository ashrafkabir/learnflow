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

Status: **READY FOR BUILDER (iter73)**

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

9. **Lesson length control should include section-level quotas**
   - Keep total <10 min, but also prevent 80% of words in “Core Concepts”.
   - Add quotas: objectives short; worked example must have minimum content.

10. **Quality telemetry in DB + UI**

- Persist per-lesson quality flags: `missingWorkedExample`, `lowSourceCount`, `imageMissingReason`, etc.
- UI: small “Quality” pill or debug view (admin/dev) to see why a lesson is degraded.

### P2 (Nice to have)

11. **Prompt hardening to reduce template-y writing**

- Add “ban phrases” / “avoid generic claims” list.
- Add a post-pass that rewrites generic sentences (best-effort, non-LLM mode optional).

12. **Test harness: offline deterministic “topic pack”**

- Build a deterministic fixture set per domain (mock sources) to make content-quality tests stable without network.

13. **Improve pipeline-to-course test: enforce minimum word count without flaky retries**

- Tests currently log that lessons fall below 500 words; harden generation or adjust threshold.

14. **Client: Attribution Drawer component**

- Consolidate text sources + image provenance in one accessible drawer.

15. **Client: Action chips (Take Notes / Quiz Me / Go Deeper / See Sources)**

- Spec wants these consistently; implement minimal version with existing routes.

---

## Evidence pack (Iter73 planner run)

- Spec read: `learnflow/LearnFlow_Product_Spec.md`
- Code inspected:
  - `apps/api/src/routes/courses.ts` (async course creation, per-lesson sourcing, Wikimedia images)
  - `packages/agents/src/course-builder/domain-outline.ts` (domain classification + outline generator)
  - `packages/agents/src/course-builder/domain-profiles/quantum.ts`
  - `apps/api/src/utils/lessonQuality.ts` (worked example quality checks)
- Screenshots: `learnflow/screenshots/iter73/planner-run/`
