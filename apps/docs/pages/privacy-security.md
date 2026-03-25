# Privacy & Security

## Data Protection

### GDPR Compliance

LearnFlow complies with the EU General Data Protection Regulation:

- **Right to Access**: Export all your data via Settings → Privacy → Export Data
- **Right to Erasure**: Delete your account and all data via Settings → Privacy → Delete Account
- **Right to Portability**: Data exports are in standard JSON format
- **Data Minimization**: We only collect data necessary for the service
- **Consent**: All data collection requires explicit user consent

### CCPA Compliance

For California residents:

- **Right to Know**: Request disclosure of collected personal information
- **Right to Delete**: Request deletion of personal information
- **Right to Opt-Out**: Opt out of data sales (we don't sell data)
- **Non-Discrimination**: Equal service regardless of privacy choices

## API Key Encryption

Your AI API keys are secured with:

- **AES-256-CBC encryption** for API keys at rest (server-side; CBC is not AEAD—GCM/HMAC hardening is planned)
- **Single server-side encryption key** (from `ENCRYPTION_KEY` env var)
- **Keys never logged** in application logs
- **Keys sent only over TLS**; never logged in plaintext
- **Masked display**: Only last 4 characters shown in UI (e.g., `sk-...abc1`)

### How It Works

1. You enter your API key in the app
2. The key is transmitted over TLS, then encrypted server-side with AES-256-CBC
3. The encrypted blob is stored in our database
4. When needed, the key is decrypted server-side in memory only
5. After use, the plaintext key is immediately discarded

## Authentication Security

- **Passwords**: Hashed with bcrypt (cost factor 12)
- **JWTs**: Short-lived access tokens (15 min), longer refresh tokens (7 days)
- **OAuth**: Not part of the current MVP (a mock Google callback endpoint exists for testing only).
- **Rate limiting**: Protection against brute force attacks

## Agent Sandbox

Custom marketplace agents run in a sandboxed environment:

- **Network isolation**: Only allowed domains
- **Storage scoping**: Agents can't access other agents' data
- **Time limits**: 30-second execution cap
- **Memory limits**: 256MB per agent
- **Audit logging**: All agent actions are logged

## Infrastructure

- **Database**: SQLite in the current OSS/dev build (deployment-dependent for production)
- **Transport**: All connections should use TLS in production (deployment-dependent)
- **Monitoring**: Anomaly detection on authentication patterns

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it to security@learnflow.ai. We respond within 24 hours and offer a bug bounty program.
