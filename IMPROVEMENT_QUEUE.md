# Improvement Queue — Iteration 49

Status: **READY FOR BUILDER**

## What I verified (brutal truth)

### Spec coverage

- Read the full canonical spec: `learnflow/LearnFlow_Product_Spec.md` (ends at Appendix / “_End of Specification_”).

### Ran the app + automated screenshots (Playwright)

- Playwright config baseURL is `http://localhost:3001` (`playwright.config.ts`).
- Ran targeted E2E/spec checks and captured artifacts:
  - Marketing pages: PASS (all exist + content).
  - Marketplace (courses + agents): PASS.
  - Subscription endpoint + pricing surface: PASS.
  - Settings spec test: FAIL because `/settings` redirected to **Login** in the test run (auth bypass didn’t apply or guard logic still blocks).
  - Learning journey test suite: FAIL (onboarding + dashboard selectors/assumptions don’t match reality).

### Screenshot artifacts captured (Iter49)

- Repo: `learnflow/screenshots/iter49/*.png`
- OneDrive: `/home/aifactory/onedrive-learnflow/evals/screenshots/iter49/*.png`
  - Onboarding/core/marketing screens captured: `03-...` through `26-...`.
  - Logged-out login/register capture failed only because the test expected `data-screen="login"` / `data-screen="register"` attributes that do not exist; the pages themselves render.

## Biggest broken flows / gaps vs spec

1. **Auth/onboarding gating is inconsistent for automation and likely for users.** The dev auth bypass is set in the systemd service (`VITE_DEV_AUTH_BYPASS=1`), but Playwright still hit the login screen for `/settings` in one run. That means either the env isn’t reliably present, or guard logic has edge cases.

2. **End-to-end “create course from dashboard” is not currently verifiable via Playwright** because:
   - `e2e/learning-journey.spec.ts` assumes specific selectors that don’t exist and assumes input is available without auth complications.
   - The onboarding “Add” button is disabled until text is entered (correct), but the test clicks the first button on the page (which is usually disabled) and times out.

3. **Several spec-heavy features remain “surface-only”**: mindmap CRDT collaboration (Yjs), Stripe billing enforcement, pipeline→course creation, marketplace activation influencing routing, analytics depth.

---

## Priority Queue (10–15 tasks)

### P0 — Must fix next

1. **Make auth bypass + routing deterministic for local dev + Playwright**

- **Problem:** `/settings` sometimes redirects to `/login` in tests despite `VITE_DEV_AUTH_BYPASS=1`. This blocks reliable e2e and hides UI behind auth.
- **Acceptance criteria:**
  - With `VITE_DEV_AUTH_BYPASS=1`, any route under `/dashboard|/conversation|/courses|/mindmap|/marketplace|/settings|/pipeline|/collaborate` is accessible without a token.
  - With bypass OFF, those routes redirect to `/login` when no token.
  - Add a Playwright test that asserts bypass behavior deterministically.
- **Likely files:** `apps/client/src/App.tsx` (OnboardingGuard), env loading in client, systemd service docs.
- **Test plan:** `npx playwright test e2e/iter49-screenshots.spec.ts -g "core"` plus a new `auth-guard.spec.ts`.
- **Screenshot checklist:** dashboard, settings both with bypass on/off.
- **Effort/risk:** M / Medium (auth gating bugs can be subtle).

2. **Fix E2E learning journey test to reflect actual UI + avoid false failures**

- **Problem:** `e2e/learning-journey.spec.ts` clicks disabled buttons and asserts selectors that don’t exist.
- **Acceptance criteria:**
  - Onboarding test adds a goal via input then continues.
  - Dashboard test uses stable `data-screen` and component selectors that exist.
  - Test suite passes in local dev mode (no network calls required).
- **Likely files:** `e2e/learning-journey.spec.ts`, add missing `data-component`/`data-screen` where appropriate.
- **Test plan:** `npx playwright test e2e/learning-journey.spec.ts`.
- **Screenshot checklist:** welcome/goals/topics/subscription/first-course/dashboard/course/lesson.
- **Effort/risk:** S / Low.

3. **Add missing `data-screen` attributes for Login/Register (and any other key surfaces)**

- **Problem:** Login/Register pages render but have no `data-screen` hooks, causing screenshot/E2E to be brittle.
- **Acceptance criteria:**
  - Login root element has `data-screen="login"`.
  - Register root element has `data-screen="register"`.
  - Update screenshot suite to capture `01-login`, `02-register`.
- **Likely files:** `apps/client/src/screens/LoginScreen.tsx`, `apps/client/src/screens/RegisterScreen.tsx`.
- **Test plan:** `npx playwright test e2e/iter49-screenshots.spec.ts -g "logged-out"`.
- **Screenshot checklist:** `01-login.png`, `02-register.png` in both repo + OneDrive.
- **Effort/risk:** XS / Low.

4. **Unblock Settings spec test: stop redirect-to-login in `/settings` compliance run**

- **Problem:** `e2e/spec-compliance.spec.ts` “Settings page has required sections” failed because it saw the login screen.
- **Acceptance criteria:**
  - `/settings` loads Settings UI in dev bypass mode.
  - Spec compliance settings check passes (>= 3 of goals/keys/subscription/notifications/export/privacy).
- **Likely files:** `apps/client/src/App.tsx`, `e2e/spec-compliance.spec.ts` (optionally add bypass initScript).
- **Test plan:** `npx playwright test e2e/spec-compliance.spec.ts -g "Settings"`.
- **Screenshot checklist:** settings full page.
- **Effort/risk:** S / Low.

### P1 — Next most valuable

5. **Mindmap CRDT collaboration is still a spec gap: implement minimal real-time shared state (MVP)**

- **Problem:** Spec requires CRDT (Yjs) multi-user mindmap editing; current implementation is suggestions/local graph with no shared rooms.
- **Acceptance criteria:**
  - Create a mindmap “room” per course (or per user) with persisted state.
  - WS event(s) for mindmap ops (add/update/delete nodes/edges) that replicate across clients.
  - Conflict-free concurrent edits (Yjs doc) for at least node label + position.
- **Likely files:** `apps/api` websocket server + mindmap routes, `apps/client/src/screens/MindmapExplorer.tsx`.
- **Test plan:** unit tests for ops merge, Playwright with two pages to verify sync.
- **Screenshot checklist:** mindmap with edits visible in 2nd session.
- **Effort/risk:** L / High.

6. **Course creation flow: make “Create Course” reliably work without hidden dependencies**

- **Problem:** Current E2E can’t validate course creation; likely due to auth gating + fragile selectors + potential LLM/offline behavior.
- **Acceptance criteria:**
  - In dev mode (or test mode), `/api/v1/courses` can generate a deterministic stub course without external calls.
  - UI shows created course and navigable lesson reader.
- **Likely files:** `apps/api/src/routes/courses*`, any stubbing logic, `apps/client/src/screens/Dashboard.tsx`, `CourseView.tsx`, `LessonReader.tsx`.
- **Test plan:** Playwright creates a course and asserts module/lesson visible.
- **Screenshot checklist:** course view + lesson reader.
- **Effort/risk:** M / Medium.

7. **Pipeline → course integration (spec WS-04 / WS-08 coherence)**

- **Problem:** Pipeline SSE exists but isn’t clearly powering actual course creation.
- **Acceptance criteria:**
  - Pipeline “Add Topic” output can be converted into a course entity.
  - UI shows pipeline progress and then routes to created course.
- **Likely files:** `apps/api/src/routes/pipeline*`, `apps/client/src/screens/Pipeline*`, course creation logic.
- **Test plan:** integration test for pipeline completion → course created.
- **Screenshot checklist:** pipeline view + resulting course.
- **Effort/risk:** L / Medium.

8. **Stripe billing: replace subscription toggle with real entitlements (even if sandbox-only)**

- **Problem:** Spec requires Pro tier enforcement + billing state; current UI is largely mocked.
- **Acceptance criteria:**
  - Stripe Checkout session creation endpoint exists.
  - Webhook updates user billing status.
  - API enforces managed-key availability and tier limits.
- **Likely files:** `apps/api/src/routes/subscription*`, db schema for billing, client settings UI.
- **Test plan:** webhook signature verification unit test; integration test with Stripe CLI fixtures.
- **Screenshot checklist:** pricing/upgrade flow surface.
- **Effort/risk:** L / High.

9. **Marketplace activation must affect orchestrator routing (not just UI)**

- **Problem:** Activated agents are fetched but don’t clearly influence actual routing.
- **Acceptance criteria:**
  - Activating an agent changes available actions and/or influences selection logic.
  - Chat responses identify which agent answered.
- **Likely files:** `apps/api/src/wsOrchestrator.ts`, agent registry/routing logic, marketplace db.
- **Test plan:** API test activate agent → chat routes to it; WS transcript asserts `agent.spawned` matches.
- **Screenshot checklist:** marketplace activation UI + conversation agent indicator.
- **Effort/risk:** M / Medium.

### P2 — Quality + completeness

10. **Harden accessibility baselines (WCAG hooks + keyboard nav smoke checks)**

- **Acceptance criteria:**
  - Key interactive controls have aria-label/role where needed.
  - Add Playwright keyboard nav smoke test for onboarding and settings.
- **Likely files:** client components.
- **Test plan:** Playwright + (optional) axe integration.
- **Effort/risk:** M / Low.

11. **Standardize and render `sources[]` everywhere**

- **Problem:** Spec emphasizes attribution; implementation is “best effort” and inconsistent.
- **Acceptance criteria:**
  - Common `sources[]` schema across lesson, chat, research, pipeline.
  - UI renders sources with domain + publish year and clickable links.
- **Likely files:** API serializers + client lesson/chat renderers.
- **Test plan:** unit test parse + UI snapshot.
- **Effort/risk:** M / Medium.

12. **Analytics: move from placeholder counts to event-based metrics**

- **Acceptance criteria:**
  - Persist events: lesson opened/completed, time on lesson, chat usage.
  - `/api/v1/analytics` returns streak + progress charts from events.
- **Likely files:** API analytics route + DB migrations.
- **Test plan:** integration tests with seeded events.
- **Effort/risk:** L / Medium.

13. **Docs page vs spec (developer docs + MDX)**

- **Acceptance criteria:**
  - `/docs` includes an “API + Agent SDK” section and at least one MDX-backed page.
- **Likely files:** marketing/docs screens.
- **Test plan:** Playwright content assertions.
- **Effort/risk:** M / Low.

14. **Stabilize test artifact output paths (repo vs OneDrive)**

- **Problem:** Some E2E writes to OneDrive only (`/home/aifactory/onedrive-learnflow/evals/screenshots/compliance`), some to repo `evals/`.
- **Acceptance criteria:**
  - For every E2E suite, artifacts go to both locations or we document the canonical one.
  - CI-safe relative paths preferred.
- **Likely files:** `e2e/*.spec.ts`, `playwright.config.ts`.
- **Test plan:** run suites and verify files appear in both destinations.
- **Effort/risk:** S / Low.

---

## Current artifact pointers (for Builder)

- Iter49 screenshots (repo): `learnflow/screenshots/iter49/`
- Iter49 screenshots (OneDrive): `/home/aifactory/onedrive-learnflow/evals/screenshots/iter49/`
- Compliance artifacts (OneDrive): `/home/aifactory/onedrive-learnflow/evals/screenshots/compliance/`
