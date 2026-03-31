# Update Agent (Pro) — MVP behavior

## What it does (today)

Update Agent monitors the **RSS/Atom sources you explicitly add** under **Profile → Update Agent** and produces a **notification feed**.

- Checks are **best-effort**: sources may fail, time out, or be temporarily rate-limited.
- It does **not** crawl the open web.
- It does **not** automatically discover new sources.
- It does **not** follow links recursively.

## How it runs

In this MVP, scheduling is **external**. The server exposes a manual “tick” endpoint that performs one pass.

### Options to schedule in a real deployment

Pick one:

- **cron** (simple): run the tick endpoint every N minutes
- **systemd timer** (Linux)
- **Kubernetes CronJob** (if deployed on K8s)

The app also includes a **Run now** action for a one-off check.

## Reliability model (trust loop)

The Update Agent uses a _trust loop_ model:

- **Locks** prevent overlapping runs.
- **Backoff** increases delay after repeated failures.
- The UI surfaces per-topic run state (last run, last error) and per-source status.

## Data shown in UI

- Topics you created
- Sources you attached to each topic
- Recent runs (limited history)
- Notifications created from new feed items

## Limitations

- This MVP may miss updates if a source is unreliable or if scheduling is too infrequent.
- Paid “Pro” gating exists, but does not imply production-grade crawling.

## API surface (developer note)

- `GET /api/v1/update-agent/topics`
- `GET /api/v1/update-agent/sources?topicId=...`
- `POST /api/v1/update-agent/tick` (manual run)
- `GET /api/v1/update-agent/runs?limit=...`

(Exact routes may evolve; treat as best-effort documentation.)
