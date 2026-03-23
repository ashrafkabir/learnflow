# Loadtest (placeholder)

Iteration 71: This is a **smoke harness placeholder** so we have a home for future k6/Artillery scripts.

## Smoke run

Start the API (dev):

```bash
npm run dev -w @learnflow/api
```

Then in another terminal:

```bash
LEARNFLOW_BASE_URL=http://127.0.0.1:3000 node apps/api/loadtest/smoke.mjs
```

Notes:

- Uses WS dev token (`token=dev`) when NODE_ENV!=production.
- Requires Node 18+ for global `fetch`.
