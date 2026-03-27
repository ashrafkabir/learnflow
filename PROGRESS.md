# Progress (Spec Format)

This document tracks LearnFlow progress by **workstream**, with % complete and blockers.

> Note: The prior checklist-style progress doc is preserved as `PROGRESS_CHECKLIST_OLD.md`.

## Workstreams

### 1) Core learning experience

- **Completion:** 80%
- **In scope:** course creation, lesson reading, streaks/daily flow, basic dashboard.
- **Recently completed:** N/A (see iteration logs)
- **Next:** polish lesson reader UX, strengthen offline + empty states.
- **Blockers:** none known.

### 2) Agents (pipeline + lesson tooling)

- **Completion:** 75%
- **In scope:** content pipeline, notes agent, collaboration, update agent.
- **Recently completed:** Iter97 — Notes Agent formats expanded (summary/cornell/zettelkasten/flashcards).
- **Next:** improve determinism and fixtures for pipeline fetchers in test mode.
- **Blockers:** flaky external data sources when not in test mode.

### 3) BYOAI / Key vault + provider selection

- **Completion:** 85%
- **In scope:** key storage, validation, provider selection.
- **Recently completed:** Iter97 — AES-256-GCM (AEAD) encryption with versioning + legacy decrypt support; active-per-provider + activation endpoint.
- **Next:** admin UX for key rotation visibility; harden key validation error handling.
- **Blockers:** none.

### 4) Analytics & usage dashboard

- **Completion:** 70%
- **In scope:** usage aggregation, dashboard series, breakdowns.
- **Recently completed:** Iter97 — `/usage/dashboard` API + range selector UI (7/30/90) + daily series + byAgent/byProvider.
- **Next:** charting polish + export/CSV.
- **Blockers:** none.

### 5) Export & portability

- **Completion:** 70%
- **In scope:** export JSON/ZIP, provenance, include user artifacts.
- **Recently completed:** Iter97 — notes already included; no export changes required.
- **Next:** ensure exports include all new note formats and documentation.
- **Blockers:** none.

### 6) Production posture / security hardening

- **Completion:** 50%
- **In scope:** auth hardening, rate limiting, logging hygiene, CORS/headers.
- **Recently completed:** N/A (see checklist)
- **Next:** work down the legacy checklist items in `PROGRESS_CHECKLIST_OLD.md`.
- **Blockers:** none.

## Blockers / Risks

- External provider variability can cause non-test runs to be flaky (timeouts, rate-limits).
- Security hardening items remain partially complete (see old checklist).
