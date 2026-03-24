#!/usr/bin/env node
/**
 * Iter83: Deterministic notifications generation tick script.
 * Usage:
 *   node scripts/update-agent-tick.mjs --baseUrl http://localhost:8787 --email you@test.com --password password123
 *
 * Behavior:
 * - Logs in and fetches user's configured update-agent topics
 * - For each topic, POST /api/v1/notifications/generate { topic }
 * - Prints a stable summary that can be captured by cron.
 */

const args = process.argv.slice(2);
const getArg = (k) => {
  const idx = args.indexOf(k);
  if (idx === -1) return null;
  return args[idx + 1] || null;
};

const baseUrl = getArg('--baseUrl') || 'http://localhost:8787';
const email = getArg('--email');
const password = getArg('--password');

if (!email || !password) {
  console.error('Missing --email or --password');
  process.exit(2);
}

const api = async (path, opts = {}) => {
  const res = await fetch(`${baseUrl}${path}`, {
    ...opts,
    headers: {
      'content-type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, ok: res.ok, json };
};

const main = async () => {
  const login = await api('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!login.ok) {
    console.error('Login failed', login.status, login.json);
    process.exit(1);
  }
  const token = login.json?.accessToken;
  if (!token) {
    console.error('Missing accessToken');
    process.exit(1);
  }

  const topicsRes = await api('/api/v1/update-agent/topics', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  const topics = Array.isArray(topicsRes.json?.topics) ? topicsRes.json.topics : [];

  const results = [];
  for (const t of topics) {
    const topic = String(t.topic || '').trim();
    if (!topic) continue;

    const r = await api('/api/v1/notifications/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ topic }),
    });

    results.push({
      topic,
      status: r.status,
      created: r.json?.created ?? null,
      failures: r.json?.failures ?? [],
    });
  }

  // Deterministic log output
  results.sort((a, b) => a.topic.localeCompare(b.topic));
  const totalCreated = results.reduce((s, r) => s + Number(r.created || 0), 0);
  const totalFailures = results.reduce(
    (s, r) => s + (Array.isArray(r.failures) ? r.failures.length : 0),
    0,
  );

  console.log(
    JSON.stringify(
      {
        baseUrl,
        checkedAt: new Date().toISOString(),
        topics: results,
        totalCreated,
        totalFailures,
      },
      null,
      2,
    ),
  );
};

main().catch((e) => {
  console.error('Tick failed', e);
  process.exit(1);
});
