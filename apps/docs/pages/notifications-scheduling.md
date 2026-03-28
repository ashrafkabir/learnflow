# Notifications scheduling (MVP)

LearnFlow’s **Notifications** feed is powered by Update Agent’s “trust loop” checks.

In the MVP, LearnFlow does **not** schedule checks by itself.

- For **Pro** tier, schedule the canonical endpoint:
  - `POST /api/v1/update-agent/tick`
- For **debugging a single topic** (any tier), there is also a one-topic endpoint:
  - `POST /api/v1/notifications/generate { topic }`

## Canonical scheduler endpoint (recommended)

Use this for cron/systemd/Kubernetes scheduling.

```bash
curl -X POST \
  -H "Authorization: Bearer $LEARNFLOW_TOKEN" \
  -H "Content-Type: application/json" \
  https://YOUR_DOMAIN/api/v1/update-agent/tick \
  -d '{}'
```

Notes:

- **Pro-only**.
- Runs all **enabled** topics and sources.
- Uses a **global per-user lock**; overlapping ticks return **409 Conflict**.

## One-topic endpoint (debug only)

This is useful for quickly validating that a given topic produces notifications.

```bash
curl -X POST \
  -H "Authorization: Bearer $LEARNFLOW_TOKEN" \
  -H "Content-Type: application/json" \
  https://YOUR_DOMAIN/api/v1/notifications/generate \
  -d '{"topic":"AI Safety"}'
```

Notes:

- Intended as a **single-topic** check.
- If the user hasn’t configured sources for that topic, LearnFlow falls back to **safe default sources**.
- Uses a **per-user+topic lock** when the topic exists in Update Agent settings.

## Relationship between the endpoints

- `update-agent/tick` → the **canonical scheduler story** (runs everything; Pro).
- `notifications/generate` → an **advanced / debugging** surface (runs one topic; not a scheduler replacement).
