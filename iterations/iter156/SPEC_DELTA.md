# Iter156 — SPEC_DELTA (MVP truth)

Date: 2026-03-30 (EDT)

This document captures **intentional deviations** between the product spec and the repo’s MVP implementation, so “spec compliance” stays honest.

## Key intentional deviations (MVP)

### Billing / monetization
- **Spec describes subscriptions + payments.**
- **MVP reality:** billing is **mocked / disclosed as mock** in UI; tier gating exists for certain features (e.g., export).

### Research / web discovery provider stack
- **Spec §6.1.1 (MVP) says:** use **OpenAI web_search only**.
- **MVP reality:** the repo still includes legacy multi-source and Firecrawl providers for historical/reference purposes, but **MVP enforcement is now added** so non-OpenAI providers are forbidden in dev/test by default.
  - Enforcement: `packages/agents/src/content-pipeline/mvp.ts`
  - Unit test: `packages/agents/src/content-pipeline/__tests__/mvp-research-enforcement.test.ts`

### Attribution / credibility scoring
- **Spec implies a rigorous provenance + credibility index.**
- **MVP reality:** credibility scoring is **best-effort heuristic**; provenance manifests exist but are not a full chain-of-custody system.

### Native apps
- **Spec references iOS/Android.**
- **MVP reality:** web-first app; native apps are future state.

## Notes
- This file should be updated if we intentionally keep a deviation rather than implementing the spec.
