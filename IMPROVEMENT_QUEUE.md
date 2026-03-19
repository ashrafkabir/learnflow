# LearnFlow Improvement Queue — Iteration 45

**Iteration:** 45  
**Status:** READY FOR BUILDER  
**Date:** 2026-03-19

This queue is a **spec-vs-implementation gap list** (plus reliability fixes) prioritized by user impact + risk.

---

## P0 — Breakages / Spec-critical gaps

1. **Fix screenshot automation (iter45) so it produces fresh artifacts**
   - Problem: `screenshot*.mjs` run did not yield new iter45 folders; had to copy iter38 artifacts to satisfy eval packaging.
   - Likely causes: script expects specific folder naming; missing dependencies; hardcoded date folder; or Playwright/browser not available.
   - Deliverable: `node screenshot.mjs --out ...` must create files in:
     - `evals/screenshots/iter45-desktop/`
     - `evals/screenshots/iter45-mobile/`
     - `evals/screenshots/iter45-web/`

2. **Install/add `ripgrep` (rg) to dev env OR remove dependency from docs/scripts**
   - `rg` is not available on this host (`rg: command not found`).
   - Impacts developer productivity and any scripted grep tasks.

3. **Onboarding Step “API Keys” should actually validate + persist keys (spec §11.1 /api/v1/keys)**
   - Current: `OnboardingApiKeys` only stores the key in local React state; it **never calls** `/api/v1/keys` or `/validate`.
   - Expected: optional validation, then secure save (encrypted at rest) via API.
   - Also: allow choosing provider (OpenAI/Anthropic/Google) per spec copy.

4. **Marketing website `/features` route returns 500**
   - Observed in `learnflow-web.service` logs: `GET /features 500`.
   - Spec §12 requires a working Features page with screenshots/animations.

5. **WebSocket `mindmap.update` payload mismatch vs spec §11.2**
   - Spec: `{ nodes_added[], edges_added[] }`.
   - Current server sends `{ courseId, suggestions, nodes_added: [], edges_added: [] }` to satisfy newer client.
   - Fix: formalize **versioned payload** or align spec + client; document `suggestions[]` as an extension.

---

## P1 — Major UX/product gaps

6. **Implement Pro plan flow end-to-end (or remove Pro CTA until real)**
   - UI: subscription screen says “Pro Coming Soon” modal; API implements mock subscription + IAP mock.
   - Decide path:
     - (A) keep mock but label clearly everywhere + don’t imply payment is live
     - (B) integrate real payments (Stripe/IAP) and drive from UI.

7. **Lesson delivery: enforce <1500 words / <10 min reading time in generator**
   - Spec “LESSON DELIVERY RULES” require hard cap.
   - Verify/implement in course-builder + content pipeline (truncate/split lessons, add word-count guardrails).

8. **Source attributions: guarantee clickable links + robust citation parsing**
   - UI supports “References” and inline citations; ensure generated lesson markdown always includes source blocks.
   - Add pipeline validation: fail/prompt regeneration if <3 credible sources or missing URLs.

9. **Behavioral adaptation not implemented (quiz score-driven difficulty + inactivity nudges)**
   - Spec requires adaptation loop based on quiz performance and inactivity.
   - Implement minimal MVP:
     - store quiz results per lesson
     - compute rolling accuracy
     - adjust difficulty + suggest prerequisites
     - Pro-only re-engagement notifications after >3 days.

10. **Mindmap: “Go Deeper” / expansion should create real course content & attach under lesson**

- Client supports suggested nodes and “Add to course”; server returns suggestions but doesn’t guarantee parent linkage beyond `parentLessonId` pass-through.
- Ensure pipeline starts reliably, updates UI via `progress.update`, and suggested nodes become real lessons/modules.

---

## P2 — Reliability / Developer Experience

11. **Unify marketplace routes and client base URL usage**

- Client uses relative fetch for `/api/v1/marketplace/courses` but uses `apiBase()` for checkout.
- Standardize to `apiBase()` everywhere to avoid CORS/proxy surprises.

12. **Clarify auth/dev-mode behavior**

- API `createApp({devMode})` uses devAuth; WS uses `token=dev` in non-prod.
- Document this clearly (DEV_PORTS.md or README) so local usage is deterministic.

13. **Add regression tests for onboarding + subscription + marketing routes**

- Add API tests for `/api/v1/keys` + UI tests for onboarding saving behavior.
- Add Next smoke test for all marketing pages (homepage/features/pricing/marketplace/docs/blog/about/download).

14. **Improve error handling in client for agent failures / BYOAI exhaustion**

- Spec requires user-friendly fallbacks without exposing raw errors.
- Add consistent toast + remediation links (settings → API keys).

15. **Analytics endpoints: validate parity with spec dashboard needs**

- Spec expects learning analytics dashboard data; verify UI uses it and fields are present (streaks, mastery, time spent, etc.).

---

## Notes (evidence)

- Ports stable and occupied:
  - 3000 (API)
  - 3001 (Vite client)
  - 3003 (Next marketing site)
- Services running: `learnflow-api`, `learnflow-client`, `learnflow-web`.
- `OnboardingApiKeys.tsx` does not call API; `ProfileSettings` does call `/api/v1/keys`.
