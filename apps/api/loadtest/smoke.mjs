import { WebSocket } from 'ws';

// Simple smoke loadtest placeholder (P2) — no k6/artillery dependency.
// Usage: LEARNFLOW_BASE_URL=http://127.0.0.1:3000 node apps/api/loadtest/smoke.mjs

const baseUrl = process.env.LEARNFLOW_BASE_URL || 'http://127.0.0.1:3000';
const wsUrl = baseUrl.replace(/^http/, 'ws') + '/ws?token=dev';

function log(section, msg) {
  process.stdout.write(`[loadtest] ${section}: ${msg}\n`);
}

async function httpGet(path) {
  const url = baseUrl + path;
  const start = Date.now();
  const res = await fetch(url);
  const ms = Date.now() - start;
  const text = await res.text();
  return { status: res.status, ms, text };
}

async function httpPost(path, body) {
  const url = baseUrl + path;
  const start = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const ms = Date.now() - start;
  const json = await res.json().catch(() => null);
  return { status: res.status, ms, json };
}

async function wsRoundTrip() {
  return new Promise((resolve, reject) => {
    const events = [];
    const ws = new WebSocket(wsUrl);

    const timeout = setTimeout(() => {
      try {
        ws.close();
      } catch {
        // ignore
      }
      resolve({ ok: false, events, reason: 'timeout' });
    }, 2500);

    ws.on('open', () => {
      ws.send(JSON.stringify({ event: 'message', data: { text: 'smoke', requestId: 'lt-1' } }));
    });

    ws.on('message', (raw) => {
      try {
        events.push(JSON.parse(raw.toString()));
      } catch {
        // ignore
      }
      if (events.some((e) => e.event === 'response.end')) {
        clearTimeout(timeout);
        ws.close();
        resolve({ ok: true, events });
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function main() {
  log('config', `baseUrl=${baseUrl}`);

  // 1) /health
  const health = await httpGet('/health');
  log('http', `GET /health -> ${health.status} (${health.ms}ms)`);

  // 2) /api/v1/chat (dev auth mode)
  const chat = await httpPost('/api/v1/chat', { message: 'hello', requestId: 'lt-rest-1' });
  log('http', `POST /api/v1/chat -> ${chat.status} (${chat.ms}ms)`);

  // 3) WS message -> response.end
  const ws = await wsRoundTrip();
  log('ws', `message -> response.end: ${ws.ok ? 'OK' : 'FAIL'}`);

  const summary = {
    baseUrl,
    health: { status: health.status, ms: health.ms },
    chat: { status: chat.status, ms: chat.ms },
    ws: {
      ok: ws.ok,
      events: ws.events.map((e) => e.event),
    },
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

  if (health.status !== 200) process.exitCode = 1;
  if (chat.status !== 200) process.exitCode = 1;
  if (!ws.ok) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
