# ITERATE.md — Current Iteration Plan

> **This file is mutable.** The Orchestrator modifies it during the iteration loop. Before every change, the old version is snapshotted to `iterations/iter-{N}/old-iterate.md`. The new version is snapshotted to `iterations/iter-{N}/new-iterate.md`.

---

## Current State

- **Active Sprint**: S01 (COMPLETE)
- **Current Score**: 1.0
- **Iteration Number**: 0
- **Strategy**: Achieved 1.0 on first build — no iterations needed

---

## Sprint-Specific Overrides

Use this section to record any deviations from the default sprint plan. When the iteration loop identifies a pattern of failures, document the corrective strategy here.

### S01 — Project Scaffolding
- **Approach**: Standard scaffold per spec workstream WS-01
- **Known risks**: None yet
- **Overrides**: None

### S02 — Authentication & Key Management
- **Approach**: Standard implementation per spec
- **Known risks**: None yet
- **Overrides**: None

### S03 — Orchestrator Agent
- **Approach**: Standard implementation per spec
- **Known risks**: LLM mock setup may require custom harness
- **Overrides**: None

### S04 — Course Builder & Content Pipeline
- **Approach**: Standard implementation per spec
- **Known risks**: Web scraping tests need reliable mock HTML fixtures
- **Overrides**: None

### S05 — Core Agents
- **Approach**: Implement all 4 agents with shared AgentInterface
- **Known risks**: Agent eval harness needs to be built in S03 first
- **Overrides**: None

### S06 — Collaboration & Mindmap
- **Approach**: Standard implementation per spec
- **Known risks**: Yjs CRDT integration complexity
- **Overrides**: None

### S07 — API Layer
- **Approach**: Standard implementation per spec
- **Known risks**: WebSocket load testing setup
- **Overrides**: None

### S08 — Client Application
- **Approach**: Flutter for cross-platform (decision made per spec)
- **Known risks**: Largest sprint by scope — may need sub-sprints
- **Overrides**: None

### S09 — Marketplace
- **Approach**: Standard implementation per spec
- **Known risks**: Stripe mock complexity
- **Overrides**: None

### S10 — Subscription & Billing
- **Approach**: Standard implementation per spec
- **Known risks**: IAP receipt validation mock
- **Overrides**: None

### S11 — Marketing Website
- **Approach**: Next.js 14 per spec
- **Known risks**: Animation performance on mobile
- **Overrides**: None

### S12 — Documentation
- **Approach**: Nextra docs site per spec
- **Known risks**: Code example extraction and compilation
- **Overrides**: None

### S13 — Testing & QA
- **Approach**: Run comprehensive suite per EVALS.md
- **Known risks**: E2E test flakiness
- **Overrides**: None

### S14 — Deployment & Launch
- **Approach**: Standard implementation per spec
- **Known risks**: Platform-specific build toolchain setup
- **Overrides**: None

---

## Iteration Strategies

When the iteration loop runs, the Orchestrator selects from these strategies based on the type of failure:

### Strategy: Fix Type Error
- **Trigger**: `types` category assertion fails
- **Action**: Read the compiler error, fix the type definition or usage
- **Scope**: Single file change

### Strategy: Add Missing Implementation
- **Trigger**: `structure` or `api` assertion fails because a file/endpoint doesn't exist
- **Action**: Create the missing file or implement the missing endpoint
- **Scope**: New file or function

### Strategy: Fix Test Failure
- **Trigger**: `unit` or `integration` assertion fails
- **Action**: Debug the test, fix the source code (not the test, unless the test is wrong)
- **Scope**: Source code fix

### Strategy: Fix Agent Output
- **Trigger**: `agent` assertion fails (wrong format, hallucination, wrong routing)
- **Action**: Adjust the agent's system prompt or output parser
- **Scope**: Prompt or parser change

### Strategy: Fix UI/UX Issue
- **Trigger**: `uiux` assertion fails (missing component, accessibility, responsiveness)
- **Action**: Add or fix the UI component
- **Scope**: Component code change

### Strategy: Fix Performance Issue
- **Trigger**: `performance` assertion fails (slow response, high memory)
- **Action**: Profile, identify bottleneck, optimize
- **Scope**: Optimization change

### Strategy: Fix Security Issue
- **Trigger**: `security` assertion fails
- **Action**: Apply security fix (input validation, encryption, auth check)
- **Scope**: Security hardening

---

## Lessons Learned

This section is populated by the Orchestrator as it learns from iterations. Pattern: "When X fails, doing Y fixed it."

_(Empty — will be populated during execution)_
