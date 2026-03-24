/**
 * Dev-only cron-safe entrypoint for generating notifications.
 *
 * Usage:
 *  TOPIC="rust programming" API_BASE="http://localhost:3001" npm run notifications:tick
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const TOPIC = process.env.TOPIC || 'AI agents';

async function main() {
  const url = `${API_BASE}/api/v1/notifications/generate`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      // dev auth middleware accepts x-dev-user in devMode
      'x-dev-user': process.env.DEV_USER || 'tick-user',
    },
    body: JSON.stringify({ topic: TOPIC, idempotencyKey: process.env.IDEMPOTENCY_KEY }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`notifications:tick failed: ${res.status} ${res.statusText}`);
    console.error(text);
    process.exit(1);
  }

  console.log(text);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
