# Update Agent scheduling

The **Update Agent** checks your configured RSS/Atom sources and creates notifications.

In this MVP, **LearnFlow does not schedule runs by itself**. Scheduling is **external** (you run a job that calls the API).

For local development only, you can enable an **in-process dev scheduler** via environment variables (see below).

## What runs

Call the canonical Update Agent tick endpoint:

```bash
curl -X POST \
  -H "Authorization: Bearer $LEARNFLOW_TOKEN" \
  -H "Content-Type: application/json" \
  https://YOUR_DOMAIN/api/v1/update-agent/tick \
  -d '{}'
```

Notes:

- Runs are **best-effort** and may miss updates.
- The endpoint is **Pro-only**.
- LearnFlow applies a **global per-user lock** to avoid overlapping runs. If a tick is already in progress, the API returns **409 Conflict**.
- Sources can be configured under **Settings → Update Agent**.

## Dev-only scheduler toggle

If you want the API process to _attempt_ periodic ticks during local development, start the API with:

- `UPDATE_AGENT_DEV_SCHEDULER=true`
- `UPDATE_AGENT_DEV_INTERVAL_MS=900000` (15 minutes)

This is intentionally **dev-only**. In production, use an external scheduler (cron/systemd/Kubernetes).

## Cron (Linux)

Example: run every 15 minutes:

```cron
*/15 * * * * curl -sS -X POST \
  -H "Authorization: Bearer $LEARNFLOW_TOKEN" \
  -H "Content-Type: application/json" \
  https://YOUR_DOMAIN/api/v1/update-agent/tick \
  -d '{}' >/dev/null
```

## systemd timer

`/etc/systemd/system/learnflow-update-agent.service`

```ini
[Unit]
Description=LearnFlow Update Agent run

[Service]
Type=oneshot
Environment=LEARNFLOW_TOKEN=REPLACE_ME
ExecStart=/usr/bin/curl -sS -X POST -H "Authorization: Bearer %E{LEARNFLOW_TOKEN}" -H "Content-Type: application/json" https://YOUR_DOMAIN/api/v1/update-agent/tick -d '{}'
```

`/etc/systemd/system/learnflow-update-agent.timer`

```ini
[Unit]
Description=Run LearnFlow Update Agent every 15 minutes

[Timer]
OnBootSec=5m
OnUnitActiveSec=15m

[Install]
WantedBy=timers.target
```

## Kubernetes CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: learnflow-update-agent
spec:
  schedule: '*/15 * * * *'
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: update-agent
              image: curlimages/curl:8.10.1
              env:
                - name: LEARNFLOW_TOKEN
                  valueFrom:
                    secretKeyRef:
                      name: learnflow
                      key: token
              command:
                - sh
                - -lc
                - |
                  curl -sS -X POST \
                    -H "Authorization: Bearer $LEARNFLOW_TOKEN" \
                    -H "Content-Type: application/json" \
                    https://YOUR_DOMAIN/api/v1/update-agent/tick \
                    -d '{}'
```
