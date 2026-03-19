# LearnFlow dev ports (stable)

LearnFlow uses fixed ports in dev so local links, tests, and websocket endpoints remain stable:

- **API**: http://localhost:3000
- **Client**: http://localhost:3001
- **Web**: http://localhost:3003

## If you see a port conflict

Do **not** hop ports.

1. Identify what is holding the port:

```bash
ss -ltnp | egrep ":3000|:3001|:3003" || true
```

2. Kill the conflicting process(es) (example):

```bash
kill <pid>
```

3. Restart the systemd user services:

```bash
systemctl --user restart learnflow-api learnflow-client learnflow-web
systemctl --user --no-pager status learnflow-api learnflow-client learnflow-web
```

This project expects those three services to bind **3000 / 3001 / 3003**.
