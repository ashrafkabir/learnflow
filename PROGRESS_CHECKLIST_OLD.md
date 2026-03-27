# PROGRESS

## Production posture checklist

This repo contains both **spec-compliance** and **extra-spec** features. Use this checklist to distinguish what’s _dev-friendly_ vs what’s _production-ready_.

### 1) Authentication & sessions

- [ ] **Passwords**: hashing algorithm + parameters documented (e.g., bcrypt cost) and verified.
- [ ] **JWT/session expiry**: reasonable TTLs; refresh strategy documented.
- [ ] **CSRF**: if cookies are used, CSRF strategy is implemented.
- [ ] **Rate limiting** on auth endpoints (login/register/forgot password).

### 2) Billing / payments

- [ ] Marketplace checkout is **idempotent** (retry-safe).
- [ ] Webhooks are verified (signature verification, replay protection).
- [ ] Payment provider secrets are stored securely (env/secret manager).

### 3) LLM / BYOAI posture

- [x] Missing-key graceful degradation exists for selection-tools illustrate preview.
- [ ] Key validation is provider-specific and does not leak key material in logs.
- [ ] Strict timeouts + retries for LLM calls.
- [ ] Content safety policy: disallowed content + user warnings.

### 4) Deterministic test-mode behavior

- [x] Test mode avoids network calls for selection-tools illustrate.
- [x] Test mode avoids OpenAI trending-queries generator.
- [ ] All content-pipeline fetchers have deterministic fixtures for tests.

### 5) API request validation & payload limits

- [x] Selection-tools preview validates tool enum and caps selectedText at 5000 chars.
- [ ] Global JSON body size limits configured at Express level.
- [ ] Consistent error envelope across API endpoints.

### 6) Logging & privacy

- [ ] No secrets in logs (tokens, API keys, raw auth headers).
- [ ] PII redaction rules defined.
- [ ] Structured logs (request id / user id / route).

### 7) Reliability

- [ ] Timeouts for upstream requests (crawl, LLM, etc.).
- [ ] Circuit breaker / backoff for flaky providers.
- [ ] Background job isolation for long tasks.

### 8) Security hardening

- [ ] CORS is locked down for production.
- [ ] Helmet (or equivalent) enabled.
- [ ] Dependency audit cadence documented.

---

## Status notes

- Spec compliance suite (Playwright) is treated as the primary end-to-end contract.
- Extra-spec features (Selection Tools) are documented in `apps/docs/pages/selection-tools.md`.
