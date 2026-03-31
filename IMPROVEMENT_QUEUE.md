# IMPROVEMENT_QUEUE — Iter167 (Planner)

Status: DONE (built)

OneDrive sync (this run):

- ⏳ Mirror screenshots to: `/home/aifactory/onedrive-learnflow/iter167/screenshots/run-001/`
- ⏳ Mirror this file to: `/home/aifactory/onedrive-learnflow/iter167/IMPROVEMENT_QUEUE.md`

Repo evidence (Iter167):

- Product spec: `LearnFlow_Product_Spec.md` (≈1160+ lines; sections #1–#17)
- Client routes: `apps/client/src/App.tsx`
- API entry: `apps/api/src/index.ts` + config `apps/api/src/config.ts`
- Pipeline (spec §6.1): `apps/api/src/routes/pipeline.ts`
- Legacy course creation (still not spec-compliant research): `apps/api/src/routes/courses.ts`
- Orchestrator prompt (spec §10): `packages/core/src/orchestrator/system-prompt.ts`
- Key vault + encryption: `apps/api/src/keys.ts`, `apps/api/src/crypto.ts`
- Marketing site: `apps/web/src/app/*/page.tsx`
- Screenshot automation: `scripts/screenshots.mjs` → outputs under `learnflow/screenshots/iter167/run-001/`

Screenshots (this run):

- Repo: `learnflow/screenshots/iter167/run-001/desktop/*.png` and `.../mobile/*.png`
- Required desktop set captured by script (proof): `scripts/screenshots.mjs` has a `requiredDesktop[]` list and fails if missing.

---

## Brutally honest spec-vs-implementation (Iter167)

### ✅ What’s actually aligned with the spec (or the spec’s MVP-truth notes)

1. **OpenAI `web_search` only research (spec §6.1.1) is implemented for the pipeline path**
   - Evidence:
     - `apps/api/src/routes/pipeline.ts` uses `searchAndExtractTopic(...)` and logs `openai_web_search:*`.
     - `packages/agents/src/content-pipeline/openai-websearch-provider.ts` exists; MVP enforcement in `packages/agents/src/content-pipeline/mvp.ts`.

2. **BYOAI key vault exists and is encrypted at rest (spec §4.4 / §16 WS-02)**
   - Evidence:
     - `apps/api/src/keys.ts` stores `{ encryptedKey, iv, tag, encVersion }` produced by `encrypt()`.
     - `apps/api/src/crypto.ts` uses AES-256-GCM (AEAD) as default `encVersion='v2_gcm'` with legacy v1 CBC decrypt support.
     - UI copy in `apps/client/src/screens/ProfileSettings.tsx` explicitly says “AES-256-GCM, AEAD”.

3. **Lesson “bite-sized” constraints are enforced server-side**
   - Evidence:
     - `apps/api/src/utils/lessonSizing.ts` soft-caps to 1500 words and adds a truncation note.
     - `apps/api/src/routes/courses.ts` prompts include `## Estimated Time` and hard requirements for structured lesson headings.

4. **Screenshot automation is now first-class and deterministic** (regression guard)
   - Evidence:
     - `scripts/screenshots.mjs` captures desktop + mobile and hard-fails if required screenshots are missing.
     - This run successfully produced a complete set under `learnflow/screenshots/iter167/run-001/`.

### ❌ The biggest spec gaps / misleading areas (these are real, not “nice-to-haves”)

A) **Spec §6.1 content pipeline vs actual course creation path is split-brain**

- The pipeline route is spec-ish (OpenAI web_search), but `apps/api/src/routes/courses.ts` still contains legacy multi-source behavior and even says so:
  - Comment: “Iter152: Spec requires OpenAI web_search for the pipeline; course creation remains legacy.”
- Impact: Users creating courses the “normal” way can get behavior that contradicts the spec’s research constraints and artifact model.

B) **Spec §6.3 “source credibility index weights future recommendations” is not real (yet)**

- There is a heuristic scorer in `apps/api/src/utils/sourceCredibility.ts`, but it’s only used in export (`apps/api/src/routes/export.ts`).
- Pipeline also has credibilityScore fields, but those are either provider-provided or hardcoded in mock fixtures—no “index that influences recs” loop exists.

C) **Marketplace (spec §7) is largely UI scaffolding and/or not a real two-sided marketplace**

- Web has `/marketplace` (`apps/web/src/app/marketplace/page.tsx`) and client has marketplace screens (screenshots show them), but:
  - No evidence of real pricing, moderation queue, payouts, creator analytics, or publish flow matching §7.1.
  - Agent “SDK requirements” are not implemented as described (no real sandboxed third-party execution).

D) **Orchestrator is not “DAG-based execution planner” (spec §16 WS-03)**

- `packages/core/src/orchestrator/system-prompt.ts` is implemented (good), but actual orchestrator logic remains intent/heuristic routing (not a DAG planner).
- This is fine for MVP, but the spec still reads like the DAG planner exists.

E) **Docs still have contradictions risk**

- `apps/docs/pages/architecture.md` is present and has historically been out-of-date vs the MVP architecture (SQLite + no Redis/MinIO). If it still claims Postgres/Redis/MinIO, it’s misleading.

---

## Prioritized, buildable tasks (10–15)

### P0 — regressions / contracts / user-facing correctness

1. **Unify course creation onto the spec pipeline (OpenAI `web_search` only) or explicitly label legacy path**
   - Problem: Two different course generation systems with different guarantees.
   - Build option A (preferred): Route “Create course” to `pipeline` (spec §6.1) and deprecate legacy `courses.ts` generation.
   - Build option B: Keep both, but add a clear UI toggle + warnings and ensure tests cover both.
   - Acceptance:
     - Default new-course flow uses pipeline and persists research artifacts.
     - No silent fallbacks to legacy multi-source.
   - Files: `apps/client` course create UI, `apps/api/src/routes/pipeline.ts`, `apps/api/src/routes/courses.ts`.

2. **Fix Settings copy mismatch: UI says AES-256-GCM but spec says AES-256 generically — ensure truthfulness and no contradictions**
   - Problem: Copy consistency. Also ensure no place claims “never logged” while pipeline logs could include request previews.
   - Build:
     - Confirm secrets are redacted everywhere in pipeline logging.
     - Update spec or UI copy to state AES-256-GCM (AEAD) explicitly.
   - Acceptance:
     - A single canonical statement (spec + UI + docs) with exact algorithm/version.
   - Files: `LearnFlow_Product_Spec.md`, `apps/client/src/screens/ProfileSettings.tsx`, `apps/api/src/routes/pipeline.ts`.

3. **Docs accuracy patch: update `apps/docs/pages/architecture.md` to match spec §3.2.0 MVP**
   - Problem: Documentation is the fastest way to lose trust.
   - Build:
     - Add “MVP (this repo today)” section: SQLite, Express, WS, Yjs, no Redis/MinIO/Postgres required.
     - Clearly mark future-state diagrams as “PLANNED”.
   - Acceptance: Reading docs cannot lead to the wrong deployment assumptions.

4. **Marketplace truth audit: add “MVP marketplace is a preview” banners where applicable**
   - Problem: Spec §7 describes monetization + moderation; UI likely implies it exists.
   - Build:
     - Add consistent “Preview / mock mode” callouts on marketplace screens (courses, agents, creator dashboard).
   - Acceptance:
     - No screen implies paid publishing, payouts, or agent sandbox execution if it isn’t implemented.

### P1 — high-value spec gaps (MVP-appropriate + testable)

5. **Implement real “Suggested Reads” + “Further Reading” blocks end-to-end**
   - Evidence: API already returns `recommendedSources` (2–5) and client has `AttributionDrawer` sections.
   - Build:
     - Ensure lesson pages always show recommended sources when available (and titles, not just URLs).
     - In pipeline, generate/attach recommended sources per lesson using `sourceCards` selection.
   - Acceptance:
     - Lesson reader shows curated suggested reads; export includes them.

6. **Add a minimal “credibility index influences recommendations” loop**
   - Build:
     - Persist credibility score per source and use it to rank `recommendedSources`.
   - Acceptance:
     - Measurable effect: same lesson plan yields different ordering when credibility differs.

7. **Orchestrator “action chips” contract: make it match spec language and be consistent across screens**
   - Evidence: Aggregator ensures 3–4 chips in `packages/core/src/orchestrator/response-aggregator.ts`.
   - Build:
     - Ensure chips are always visible after lessons (if lesson reader moved actions to drawer, confirm parity).
   - Acceptance:
     - After any assistant message, UI exposes 3–4 actions without hunting.

8. **Marketing /docs should render real Markdown from `apps/docs/pages/*` (not just link lists)**
   - Problem: Spec §13 says docs plan; web `/docs` should be credible.
   - Build:
     - Render at least “Getting Started” + “API Reference” pages.
   - Acceptance:
     - `/docs` on web is readable documentation, not a stub.

### P2 — polish / maintainability

9. **Improve screenshot run notes**
   - Build:
     - In `scripts/screenshots.mjs`, auto-fill `NOTES.md` “What changed” and “Known limitations” with git SHA + dev ports used.

10. **Add Playwright smoke tests for marketing surfaces (§15)**

- Build:
  - E2E test that asserts each marketing page loads and has the expected H1.

11. **Remove or further harden any “legacy” entrypoints and footguns**

- Evidence: `apps/api/src/server.ts` is “LEGACY ENTRYPOINT (do not use)”.
- Build:
  - Ensure package scripts and systemd units only point at `src/index.ts`.

12. **Clarify subscription mock mode consistently**

- Evidence: spec §8 explicitly notes mock billing; ensure marketing pricing and in-app settings say the same.

---

## OneDrive sync — TODO (must complete this iteration)

- Mirror screenshots:
  - from: `learnflow/screenshots/iter167/run-001/`
  - to: `/home/aifactory/onedrive-learnflow/iter167/screenshots/run-001/`
- Mirror this file:
  - from: `IMPROVEMENT_QUEUE.md`
  - to: `/home/aifactory/onedrive-learnflow/iter167/IMPROVEMENT_QUEUE.md`
