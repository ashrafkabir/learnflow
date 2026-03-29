# MVP truth checklist

This checklist is used to keep LearnFlow’s MVP marketing and in-product copy honest.

## Copy & claims

- [ ] No fake user/review numbers (e.g., “12,000+ learners”, “4.9 stars”) unless backed by stored data.
- [ ] No claims of enterprise-grade features that are not implemented (e.g., “managed API keys”, “real billing”).
- [ ] Where features are mock/best-effort, disclosures are explicit and unavoidable.

## Billing / subscription

- [ ] Pricing page includes a disclosure that billing is MVP/mock in this build.
- [ ] Upgrade CTAs are labeled as mock billing where applicable.
- [ ] Client app does not imply real billing cycles/periods if billing is mocked.

## Sources & citations

- [ ] Lessons include citations and a references section when sources are available.
- [ ] If a lesson has no sources, UI copy does not imply citations exist.
- [ ] Source credibility/trust signals are described as heuristic.

## Collaboration

- [ ] Collaboration matching is disclosed as synthetic suggestions.
- [ ] Any “real-time”/collab features are described accurately (best-effort vs guaranteed).

## Structured data (SEO)

- [ ] No AggregateRating/Review schema in MVP builds unless real review data exists.

## Tests

- [ ] Regression tests cover: no AggregateRating in client index.html; mock billing disclosures; no fake marketplace metrics.
