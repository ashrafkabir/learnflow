# MVP Truth (What This Build Does — and Does Not Do)

LearnFlow is an MVP. This page exists to keep product claims honest and to help you understand what’s implemented today.

## 1) Content & citations are best-effort

- The app can generate course drafts and lessons.
- When a **web source provider** is configured in your deployment, the pipeline can discover and extract public sources.
- **Citations appear when sources are available**. Some topics/providers may have limited coverage.
- Quality scoring and filtering are **heuristic** (e.g., domain/recency/readability approximations) and are **not a guarantee** of credibility.

## 2) Web sourcing depends on configuration

This build supports a BYOAI model. Depending on your environment variables and provider configuration, web source discovery/scraping may be enabled or disabled.

If web sourcing is disabled, the app may still draft content, but citations/source drawers may be limited.

## 3) Mindmap is a course map (not a full concept graph)

The current mindmap primarily visualizes:

- Courses
- Modules
- Lessons
- Progress state

Richer knowledge graphs (concept-level nodes, custom connections across courses) are planned.

## 4) Billing/Marketplace/Analytics may be mock or limited

- Billing flows are MVP/mock unless explicitly wired to a real payment provider.
- Marketplace publishing and creator analytics may be partially implemented or intentionally limited until backed by real stored data.

## 5) Expect change

Names, agent roles, scoring heuristics, and UI language may change quickly as we iterate.

If you see a claim that feels too strong, treat it as a bug and link to this page when filing an issue.

## Checklist

- [MVP truth checklist](./mvp-truth-checklist)
