# Update Agent scheduling

The **Update Agent** checks your configured RSS/Atom sources and creates notifications.

In this MVP, **LearnFlow does not schedule runs by itself**. Scheduling is **external** (you run a job that calls the API).

## What runs

Call the Update Agent generator endpoint with a topic:

```bash
curl -X POST \
  -H "Authorization: Bearer $LEARNFLOW_TOKEN" \
  -H "Content-Type: application/json" \
  https://YOUR_DOMAIN/api/v1/notifications/generate \
  -d '{"topic":"AI Safety"}'
```

Notes:

- Runs are **best-effort** and may miss updates.
- LearnFlow applies **locks** to avoid overlapping runs per user/topic.
- Sources can be configured under **Settings → Update Agent**.

## Cron (Linux)

Example: run every 15 minutes:

```cron
*/15 * * * * curl -sS -X POST \
  -H "Authorization: Bearer $LEARNFLOW_TOKEN" \
  -H "Content-Type: application/json" \
  https://YOUR_DOMAIN/api/v1/notifications/generate \
  -d '{"topic":"AI Safety"}' >/dev/null
```

## systemd timer

`/etc/systemd/system/learnflow-update-agent.service`

```ini
[Unit]
Description=LearnFlow Update Agent run

[Service]
Type=oneshot
Environment=LEARNFLOW_TOKEN=REPLACE_ME
ExecStart=/usr/bin/curl -sS -X POST -H "Authorization: Bearer %E{LEARNFLOW_TOKEN}" -H "Content-Type: application/json" https://YOUR_DOMAIN/api/v1/notifications/generate -d '{"topic":"AI Safety"}'
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
                    https://YOUR_DOMAIN/api/v1/notifications/generate \
                    -d '{"topic":"AI Safety"}'
```
