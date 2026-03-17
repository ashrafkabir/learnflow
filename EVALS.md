# EVALS.md — LearnFlow Evaluation Framework

> **Purpose**: Define every assertion that must pass for each sprint. The Orchestrator grades each PASS/FAIL, calculates the score, and uses this to drive the iteration loop.

---

## 1. Evaluation Protocol

For every sprint, the Orchestrator:

1. Collects all assertions defined for that sprint (see Section 3)
2. Executes each assertion by running the specified check
3. Grades each assertion as **PASS** or **FAIL** with details
4. Calculates the sprint score: `score = passed / total`
5. Writes results to `evals/sprint-{N}/eval-results-{timestamp}.json`
6. Updates `evals/summary.json` with the latest scores across all sprints

---

## 2. Assertion Categories

Every assertion belongs to one of these categories. Evals run all categories for the active sprint.

| Category        | What It Tests                                            | How It Runs                                                   |
| --------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| **structure**   | Directory layout, file existence, naming conventions     | `ls`, `find`, file existence checks                           |
| **types**       | TypeScript/Dart compilation, no type errors              | `tsc --noEmit`, `dart analyze`                                |
| **lint**        | Code style, formatting, lint rules                       | `eslint .`, `prettier --check`, `dart format`                 |
| **unit**        | Individual function correctness                          | `jest --coverage`, `pytest`, `flutter test`                   |
| **integration** | Multi-component interaction, API flows                   | `jest --testPathPattern=integration`, `supertest`             |
| **e2e**         | Full user journeys through the system                    | `playwright test`, `detox test`                               |
| **uiux**        | Component rendering, accessibility, responsiveness       | `axe-core` audit, `lighthouse` scores, visual regression      |
| **api**         | Endpoint correctness, schema validation, error handling  | `newman` / custom API test runner against OpenAPI spec        |
| **security**    | OWASP checks, key handling, injection resistance         | `owasp-zap` baseline, custom security assertions              |
| **performance** | Response times, throughput, memory usage                 | `k6 run`, `lighthouse performance`, bundle size checks        |
| **agent**       | Agent prompt quality, output format, hallucination rate  | Custom eval harness comparing agent output to expected        |
| **docs**        | Documentation completeness, link validity, code examples | `markdownlint`, link checker, code block extraction + compile |

---

## 3. Sprint Assertion Definitions

### Sprint S01 — Project Scaffolding

| ID      | Category  | Assertion                                                                             | Check                                                    |
| ------- | --------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| S01-A01 | structure | Monorepo root has: `packages/`, `apps/`, `package.json`, `turbo.json`                 | `test -f turbo.json && test -d packages && test -d apps` |
| S01-A02 | structure | `packages/core/`, `packages/agents/`, `apps/api/`, `apps/client/`, `apps/web/` exist  | `find` for each directory                                |
| S01-A03 | structure | `packages/shared/` contains `types/`, `utils/`, `config/`                             | Directory existence check                                |
| S01-A04 | types     | Shared types package compiles: User, Course, Lesson, Agent, StudentContext interfaces | `cd packages/shared && tsc --noEmit`                     |
| S01-A05 | types     | All interface fields match spec Section 4 & 9 entity definitions                      | Manual assertion: check field list against spec          |
| S01-A06 | structure | Docker Compose file exists with postgres, redis, minio services                       | `docker compose config --quiet` succeeds                 |
| S01-A07 | lint      | ESLint config exists and passes on all packages                                       | `eslint . --max-warnings 0`                              |
| S01-A08 | lint      | Prettier config exists and all files are formatted                                    | `prettier --check .`                                     |
| S01-A09 | structure | `.env.example` exists with all required variables                                     | File existence + Zod schema parse                        |
| S01-A10 | types     | Zod schema validates env variables correctly (rejects bad input)                      | Unit test for env validation                             |
| S01-A11 | structure | `tsconfig.json` has strict mode enabled                                               | `grep '"strict": true' tsconfig.json`                    |
| S01-A12 | structure | Husky pre-commit hook runs lint + type check                                          | `.husky/pre-commit` exists and is executable             |
| S01-A13 | docs      | `README.md` has setup instructions, prerequisites, and quickstart                     | Check for required sections                              |
| S01-A14 | structure | `turbo.json` defines build, lint, test, dev pipelines                                 | Parse JSON and check pipeline keys                       |
| S01-A15 | unit      | At least one unit test exists and passes                                              | `turbo run test` exits 0                                 |

---

### Sprint S02 — Authentication & Key Management

| ID      | Category    | Assertion                                                   | Check                                              |
| ------- | ----------- | ----------------------------------------------------------- | -------------------------------------------------- |
| S02-A01 | api         | POST `/api/v1/auth/register` creates user and returns JWT   | HTTP test with valid payload → 201 + token         |
| S02-A02 | api         | POST `/api/v1/auth/login` returns JWT for valid credentials | HTTP test → 200 + token                            |
| S02-A03 | api         | POST `/api/v1/auth/login` rejects invalid credentials       | HTTP test → 401                                    |
| S02-A04 | api         | JWT refresh endpoint issues new token before expiry         | HTTP test with valid refresh token → 200           |
| S02-A05 | api         | OAuth flow works for Google provider                        | Mock OAuth callback → user created + JWT           |
| S02-A06 | api         | POST `/api/v1/keys` stores API key encrypted (AES-256)      | Store key, read from DB → verify encrypted blob    |
| S02-A07 | api         | GET `/api/v1/keys` returns keys with masked values          | HTTP test → key list with `sk-...xxxx` format      |
| S02-A08 | api         | API key validation rejects invalid/expired keys             | Test with bad OpenAI key format → 400              |
| S02-A09 | security    | API keys are never logged in application logs               | Grep log output after key operations → no raw keys |
| S02-A10 | security    | Passwords are hashed with bcrypt (cost >= 12)               | Check stored password format in DB                 |
| S02-A11 | types       | Auth middleware correctly types `req.user` with role info   | `tsc --noEmit` on auth middleware                  |
| S02-A12 | unit        | Key encryption/decryption roundtrip works                   | Unit test: encrypt → decrypt → assert equal        |
| S02-A13 | unit        | Token usage tracking middleware counts tokens per agent     | Unit test with mock agent call → verify count      |
| S02-A14 | api         | RBAC middleware blocks free users from Pro endpoints        | HTTP test with free JWT → 403 on Pro route         |
| S02-A15 | integration | Full auth flow: register → login → add key → list keys      | Chained HTTP test                                  |

---

### Sprint S03 — Orchestrator Agent

| ID      | Category    | Assertion                                                           | Check                                                      |
| ------- | ----------- | ------------------------------------------------------------------- | ---------------------------------------------------------- |
| S03-A01 | types       | StudentContextObject type matches all fields from spec Section 9.1  | Type compilation + field check                             |
| S03-A02 | unit        | Context loader assembles SCO from DB correctly                      | Unit test with mock DB → verify all fields populated       |
| S03-A03 | unit        | Agent registry returns correct agent for capability query           | Unit test: query("build_course") → CourseBuilderAgent      |
| S03-A04 | unit        | DAG planner parallelizes independent agent calls                    | Unit test: 2 independent tasks → verify parallel execution |
| S03-A05 | unit        | DAG planner serializes dependent agent calls                        | Unit test: A depends on B → B runs first                   |
| S03-A06 | agent       | Orchestrator routes "I want to learn Python" to course_builder      | Prompt test: input → verify tool call                      |
| S03-A07 | agent       | Orchestrator routes "quiz me" to exam_agent                         | Prompt test                                                |
| S03-A08 | agent       | Orchestrator routes "take notes" to notes_agent                     | Prompt test                                                |
| S03-A09 | agent       | Orchestrator handles unknown intent gracefully                      | Prompt test: gibberish → helpful clarification             |
| S03-A10 | unit        | Response aggregator merges multi-agent outputs into single response | Unit test with mock agent responses                        |
| S03-A11 | unit        | Behavioral tracker updates SCO after quiz completion                | Unit test: mock quiz event → verify SCO updated            |
| S03-A12 | unit        | Rate limiter enforces per-tier limits                               | Unit test: exceed free limit → 429                         |
| S03-A13 | agent       | System prompt from spec Section 10 is integrated verbatim           | Compare loaded prompt to spec text                         |
| S03-A14 | types       | All agent message envelopes match spec Section 4.3 schema           | Type compilation                                           |
| S03-A15 | integration | Orchestrator spawns course_builder and returns structured syllabus  | Integration test with mock LLM                             |

---

### Sprint S04 — Course Builder & Content Pipeline

| ID      | Category    | Assertion                                                             | Check                                                 |
| ------- | ----------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| S04-A01 | unit        | Topic decomposition breaks "Machine Learning" into concept tree       | Unit test → verify tree has ≥5 nodes                  |
| S04-A02 | unit        | Source discovery queries multiple APIs and returns ranked results     | Unit test with mock APIs                              |
| S04-A03 | unit        | Content extractor returns clean text from HTML page                   | Unit test with sample HTML → verify no tags in output |
| S04-A04 | unit        | Quality scorer produces scores in [0,1] range for all 4 dimensions    | Unit test with sample content                         |
| S04-A05 | unit        | Attribution tracker stores URL, author, date, license                 | Unit test → verify all fields persisted               |
| S04-A06 | unit        | Deduplication detects near-identical content                          | Unit test: two similar texts → flagged as duplicate   |
| S04-A07 | unit        | Lesson formatter chunks content to ≤1500 words per lesson             | Unit test with 5000-word text → 4 lessons             |
| S04-A08 | unit        | Syllabus generator creates modules with correct prerequisite ordering | Unit test → verify DAG is valid                       |
| S04-A09 | types       | Course, Lesson, Source types compile without errors                   | `tsc --noEmit`                                        |
| S04-A10 | unit        | Estimated reading time calculation is accurate (±1 min)               | Unit test: 1500 words → ~7 min                        |
| S04-A11 | agent       | Course builder agent produces valid course outline from topic         | Agent eval with mock LLM                              |
| S04-A12 | unit        | Content respects robots.txt (mock test)                               | Unit test: blocked URL → skipped                      |
| S04-A13 | integration | Full pipeline: topic → discover → extract → score → format → syllabus | Integration test                                      |
| S04-A14 | unit        | Lesson structure matches spec Section 6.2 (all 8 elements present)    | Schema validation                                     |
| S04-A15 | unit        | Rate limiting on scraper respects 1 req/sec per domain                | Unit test with timing assertions                      |

---

### Sprint S05 — Core Agents (Notes, Research, Exam, Summarizer)

| ID      | Category    | Assertion                                                               | Check                                       |
| ------- | ----------- | ----------------------------------------------------------------------- | ------------------------------------------- |
| S05-A01 | agent       | Notes Agent produces Cornell-format notes from lesson content           | Agent eval → verify structure               |
| S05-A02 | agent       | Notes Agent produces Zettelkasten-format notes                          | Agent eval → verify atomic notes with links |
| S05-A03 | agent       | Notes Agent generates flashcards (question/answer pairs)                | Agent eval → verify Q/A format              |
| S05-A04 | agent       | Research Agent finds papers from Semantic Scholar API                   | Integration test with mock API              |
| S05-A05 | agent       | Research Agent synthesizes findings into structured summary             | Agent eval                                  |
| S05-A06 | agent       | Exam Agent generates multiple-choice questions with 4 options           | Agent eval → verify format                  |
| S05-A07 | agent       | Exam Agent generates short-answer questions                             | Agent eval                                  |
| S05-A08 | agent       | Exam Agent scores responses and identifies knowledge gaps               | Unit test with known-correct answers        |
| S05-A09 | agent       | Summarizer Agent condenses 3000-word text to ≤500 words                 | Agent eval with word count check            |
| S05-A10 | agent       | Summarizer Agent preserves key facts (no hallucination)                 | Agent eval comparing output to source facts |
| S05-A11 | types       | All agents implement AgentInterface: initialize(), process(), cleanup() | Type compilation                            |
| S05-A12 | structure   | All agents have manifest.json with required fields                      | JSON schema validation                      |
| S05-A13 | unit        | Each agent has ≥80% test coverage                                       | Coverage report check                       |
| S05-A14 | unit        | Agent error handling: graceful failure on bad input                     | Unit tests with malformed input             |
| S05-A15 | integration | Orchestrator can spawn each agent and receive valid response            | Integration test                            |

---

### Sprint S06 — Collaboration & Mindmap Agents

| ID      | Category    | Assertion                                                            | Check                              |
| ------- | ----------- | -------------------------------------------------------------------- | ---------------------------------- |
| S06-A01 | unit        | Peer matching algorithm finds users with overlapping goals           | Unit test with sample user vectors |
| S06-A02 | unit        | Study group creation stores members and shared resources             | Unit test                          |
| S06-A03 | agent       | Collaboration Agent produces match recommendations                   | Agent eval                         |
| S06-A04 | unit        | Mindmap data model: nodes have id, label, mastery, parent            | Schema validation                  |
| S06-A05 | unit        | Mindmap CRUD: create, read, update, delete nodes and edges           | Unit test                          |
| S06-A06 | unit        | Mindmap export produces valid SVG                                    | Unit test → SVG schema validation  |
| S06-A07 | agent       | Mindmap Agent extends graph when new course is created               | Agent eval                         |
| S06-A08 | unit        | CRDT sync: concurrent edits on shared mindmap converge               | Unit test with Yjs                 |
| S06-A09 | types       | All collaboration types compile                                      | `tsc --noEmit`                     |
| S06-A10 | integration | Full flow: create group → share mindmap → concurrent edit → converge | Integration test                   |

---

### Sprint S07 — API Layer

| ID      | Category    | Assertion                                                                          | Check                                  |
| ------- | ----------- | ---------------------------------------------------------------------------------- | -------------------------------------- |
| S07-A01 | api         | All 17 REST endpoints from spec Section 11.1 exist and return correct status codes | Automated endpoint test                |
| S07-A02 | api         | All endpoints validate request bodies with Zod schemas                             | Send invalid payloads → 400            |
| S07-A03 | api         | All endpoints return typed responses matching OpenAPI spec                         | Response schema validation             |
| S07-A04 | api         | WebSocket connects and receives `response.start` event                             | WS test                                |
| S07-A05 | api         | WebSocket streams `response.chunk` events for long responses                       | WS test                                |
| S07-A06 | api         | WebSocket emits `agent.spawned` and `agent.complete` events                        | WS test with agent trigger             |
| S07-A07 | api         | Rate limiter: free tier blocked after 100 req/min                                  | Load test                              |
| S07-A08 | api         | Rate limiter: pro tier allowed up to 500 req/min                                   | Load test                              |
| S07-A09 | security    | All endpoints require auth (except register/login)                                 | Test each endpoint without token → 401 |
| S07-A10 | api         | Error responses follow consistent format: `{ error, message, code }`               | Validate error responses               |
| S07-A11 | docs        | OpenAPI spec generated and valid                                                   | `swagger-cli validate openapi.yaml`    |
| S07-A12 | performance | Average response time <200ms for simple GET endpoints                              | Load test                              |
| S07-A13 | performance | WebSocket handles 100 concurrent connections                                       | Load test                              |
| S07-A14 | types       | All request/response types compile                                                 | `tsc --noEmit`                         |
| S07-A15 | integration | Full API flow: register → login → create course → get lessons                      | Chained test                           |

---

### Sprint S08 — Client Application

| ID      | Category    | Assertion                                                                 | Check                       |
| ------- | ----------- | ------------------------------------------------------------------------- | --------------------------- |
| S08-A01 | uiux        | Design system: all color tokens defined and used consistently             | Token audit                 |
| S08-A02 | uiux        | Typography scale: 12/14/16/20/24/32px all defined                         | Style audit                 |
| S08-A03 | uiux        | Onboarding: all 6 screens from spec 5.2.1 implemented                     | Screen existence check      |
| S08-A04 | uiux        | Home dashboard: course carousel, daily lessons, mindmap, streaks          | Component existence check   |
| S08-A05 | uiux        | Conversation interface: markdown rendering, agent indicator, action chips | Component test              |
| S08-A06 | uiux        | Course view: syllabus, lesson reader, progress tracker                    | Component test              |
| S08-A07 | uiux        | Mindmap explorer: interactive graph with clickable nodes                  | Component test              |
| S08-A08 | uiux        | Agent marketplace: browsable catalog with activation                      | Component test              |
| S08-A09 | uiux        | Course marketplace: search, filter, detail, enroll                        | Component test              |
| S08-A10 | uiux        | Profile & settings: goals, API keys, subscription, export, privacy        | Component test              |
| S08-A11 | uiux        | Accessibility: all screens pass axe-core audit (0 violations)             | `axe-core` automated test   |
| S08-A12 | uiux        | Responsive: layouts adapt to mobile/tablet/desktop breakpoints            | Viewport resize test        |
| S08-A13 | uiux        | Dark mode: all screens render correctly in dark theme                     | Theme toggle + visual check |
| S08-A14 | performance | Initial load time <3 seconds on simulated 3G                              | Lighthouse performance      |
| S08-A15 | unit        | All UI components have at least one test                                  | Coverage check              |

---

### Sprint S09 — Marketplace

| ID      | Category    | Assertion                                                       | Check                    |
| ------- | ----------- | --------------------------------------------------------------- | ------------------------ |
| S09-A01 | api         | Course publishing pipeline: create → quality check → publish    | Integration test         |
| S09-A02 | api         | Stripe checkout creates payment intent for paid course          | Mock Stripe test         |
| S09-A03 | api         | Creator receives payout record after sale                       | Mock Stripe webhook test |
| S09-A04 | api         | Course discovery: search by keyword returns relevant results    | API test                 |
| S09-A05 | api         | Course discovery: filter by topic, difficulty, price works      | API test                 |
| S09-A06 | api         | Agent submission stores manifest and enters review queue        | API test                 |
| S09-A07 | api         | Agent activation adds agent to user's available tools           | API test                 |
| S09-A08 | unit        | Quality checker enforces min lessons, attribution, readability  | Unit test                |
| S09-A09 | unit        | Revenue split calculation: 85/15 for BYOAI, 80/20 for Pro       | Unit test                |
| S09-A10 | uiux        | Creator dashboard shows analytics and earnings                  | Component test           |
| S09-A11 | security    | Agent sandbox prevents network calls outside allowlist          | Security test            |
| S09-A12 | integration | Full flow: create course → publish → discover → enroll → access | E2E test                 |

---

### Sprint S10 — Subscription & Billing

| ID      | Category    | Assertion                                                         | Check                            |
| ------- | ----------- | ----------------------------------------------------------------- | -------------------------------- |
| S10-A01 | api         | Stripe subscription creates Pro user                              | Mock Stripe test                 |
| S10-A02 | api         | Subscription downgrade removes Pro features                       | API test                         |
| S10-A03 | api         | Managed API key pool serves Pro users without their own key       | Unit test                        |
| S10-A04 | unit        | Feature flags correctly gate free vs pro capabilities             | Unit test per flag               |
| S10-A05 | unit        | Billing UI shows upgrade/downgrade/cancel/invoices                | Component test                   |
| S10-A06 | agent       | Update Agent detects new content for subscribed topic             | Agent eval with mock web results |
| S10-A07 | agent       | Update Agent generates proactive notification content             | Agent eval                       |
| S10-A08 | api         | App Store IAP receipt validation works (mock)                     | Unit test                        |
| S10-A09 | integration | Full flow: subscribe → access pro features → cancel → lose access | Integration test                 |
| S10-A10 | security    | Subscription status cannot be spoofed via API                     | Security test                    |

---

### Sprint S11 — Marketing Website

| ID      | Category    | Assertion                                                     | Check                 |
| ------- | ----------- | ------------------------------------------------------------- | --------------------- |
| S11-A01 | structure   | Next.js 14 project with App Router structure                  | Directory check       |
| S11-A02 | uiux        | Homepage hero: headline, subhead, CTA, background animation   | Component render test |
| S11-A03 | uiux        | Features page: all 6 feature sections from spec 12.2          | Content check         |
| S11-A04 | uiux        | Pricing page: Free vs Pro comparison table                    | Component test        |
| S11-A05 | uiux        | Download page: platform auto-detection works                  | User-agent mock test  |
| S11-A06 | uiux        | Blog: MDX rendering with syntax highlighting                  | Render test           |
| S11-A07 | performance | Lighthouse performance score ≥90                              | `lighthouse` CI test  |
| S11-A08 | performance | Lighthouse accessibility score ≥95                            | `lighthouse` CI test  |
| S11-A09 | docs        | SEO: meta tags, OG tags, structured data, sitemap.xml present | HTML parse check      |
| S11-A10 | uiux        | Mobile responsive: all pages render correctly at 375px width  | Viewport test         |
| S11-A11 | structure   | PostHog analytics initialized (not tracking in dev)           | Code check            |
| S11-A12 | unit        | All page components have at least one test                    | Coverage check        |

---

### Sprint S12 — Documentation

| ID      | Category | Assertion                                                         | Check                    |
| ------- | -------- | ----------------------------------------------------------------- | ------------------------ |
| S12-A01 | docs     | Getting Started Guide exists with setup, key config, first course | Section check            |
| S12-A02 | docs     | User Guide covers all features from spec Section 5.2              | Section check            |
| S12-A03 | docs     | Agent SDK Reference has interface spec, manifest schema, examples | Section check            |
| S12-A04 | docs     | API Reference covers all 17 endpoints with examples               | Endpoint cross-reference |
| S12-A05 | docs     | Course Creator Guide has publishing flow and quality guidelines   | Section check            |
| S12-A06 | docs     | Privacy & Security doc covers GDPR, CCPA, key encryption          | Section check            |
| S12-A07 | docs     | Architecture Guide has system diagram and agent communication     | Section check            |
| S12-A08 | docs     | All internal links resolve (no 404s)                              | Link checker             |
| S12-A09 | docs     | All code examples in docs compile/run                             | Extract + execute        |
| S12-A10 | docs     | Documentation site builds without errors                          | `npm run build` exits 0  |

---

### Sprint S13 — Testing & QA

| ID      | Category    | Assertion                                                                   | Check                  |
| ------- | ----------- | --------------------------------------------------------------------------- | ---------------------- |
| S13-A01 | unit        | Global unit test coverage ≥85%                                              | Coverage report        |
| S13-A02 | e2e         | Onboarding journey: register → set goals → create course → complete lesson  | Playwright test        |
| S13-A03 | e2e         | Marketplace journey: browse → enroll → access course                        | Playwright test        |
| S13-A04 | e2e         | Creator journey: create course → publish → view analytics                   | Playwright test        |
| S13-A05 | e2e         | Subscription journey: subscribe → use pro features → cancel                 | Playwright test        |
| S13-A06 | agent       | All agent prompts pass regression tests (output format correct)             | Agent eval harness     |
| S13-A07 | performance | API handles 1000 concurrent users with <500ms p95 latency                   | k6 load test           |
| S13-A08 | performance | WebSocket handles 500 concurrent connections                                | k6 WebSocket test      |
| S13-A09 | security    | OWASP ZAP baseline scan: zero high-severity findings                        | ZAP scan report        |
| S13-A10 | uiux        | Cross-platform: client builds successfully for macOS, Windows, iOS, Android | Build scripts exit 0   |
| S13-A11 | uiux        | Accessibility: zero critical violations across all screens                  | Full axe-core scan     |
| S13-A12 | types       | Zero TypeScript errors across entire codebase                               | `tsc --noEmit` at root |

---

### Sprint S14 — Deployment & Launch

| ID      | Category  | Assertion                                             | Check                                 |
| ------- | --------- | ----------------------------------------------------- | ------------------------------------- |
| S14-A01 | structure | Production Dockerfile builds successfully             | `docker build .` exits 0              |
| S14-A02 | structure | Kubernetes manifests are valid                        | `kubectl apply --dry-run=client`      |
| S14-A03 | structure | Monitoring config: Datadog/Grafana dashboards defined | Config file existence                 |
| S14-A04 | structure | CDN config for static assets                          | Config file existence                 |
| S14-A05 | structure | iOS app archive builds                                | `xcodebuild archive` or Flutter build |
| S14-A06 | structure | Android app bundle builds                             | `flutter build appbundle` or gradle   |
| S14-A07 | structure | macOS .dmg installer script exists                    | Script existence + syntax check       |
| S14-A08 | structure | Windows .exe/.msi installer script exists             | Script existence                      |
| S14-A09 | docs      | Launch blog post draft exists                         | File existence + word count ≥500      |
| S14-A10 | structure | All environment variables documented for production   | Cross-reference env schema with docs  |

---

## 4. Scoring Formula

```
sprint_score = assertions_passed / assertions_total
```

- Score is a float from `0.0` to `1.0`
- A sprint is **complete** when `score == 1.0`
- The iteration loop triggers whenever `score < 1.0`

### Overall Project Score

```
project_score = sum(sprint_scores) / total_sprints
```

Only completed sprints contribute their full score (1.0). In-progress sprints contribute their current score. Not-started sprints contribute 0.0.

---

## 5. Eval Output Storage

All eval results go to `evals/`:

```
evals/
├── sprint-01/
│   ├── eval-results-2026-03-16T10-00-00Z.json    # First run
│   ├── eval-results-2026-03-16T10-15-00Z.json    # After iteration 1
│   ├── eval-results-2026-03-16T10-30-00Z.json    # After iteration 2
│   ├── uiux-report.json                           # Lighthouse/axe results
│   ├── qa-report.json                             # Test runner output
│   └── perf-report.json                           # k6/lighthouse perf
├── sprint-02/
│   └── ...
└── summary.json                                    # Aggregate
```

### summary.json Format

```json
{
  "last_updated": "2026-03-16T12:00:00Z",
  "project_score": 0.143,
  "sprints": {
    "S01": { "status": "complete", "score": 1.0, "iterations": 3 },
    "S02": { "status": "in_progress", "score": 0.8, "iterations": 2 },
    "S03": { "status": "not_started", "score": 0.0, "iterations": 0 }
  },
  "total_iterations": 5,
  "total_assertions": 192,
  "total_passed": 27
}
```
