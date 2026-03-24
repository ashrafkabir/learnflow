export async function fetchWithBackoff(
  url: string,
  opts: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const timeoutMs = Number(opts.timeoutMs || 12_000);
  const maxAttempts = 3;
  const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

  const sleep = async (ms: number) => {
    if (isTest) return;
    await new Promise((r) => setTimeout(r, ms));
  };

  let lastErr: any;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...opts,
        signal: opts.signal || ctrl.signal,
        headers: {
          'user-agent': 'learnflow-update-agent/0.1 (+https://learnflow.ai)',
          accept:
            'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5',
          ...(opts.headers || {}),
        },
      });

      // Retry 429 / 5xx
      if ((res.status === 429 || res.status >= 500) && attempt < maxAttempts) {
        const base = 400 * Math.pow(2, attempt - 1);
        const jitter = Math.floor(Math.random() * 200);
        await sleep(base + jitter);
        continue;
      }

      return res;
    } catch (e) {
      lastErr = e;
      if (attempt < maxAttempts) {
        const base = 300 * Math.pow(2, attempt - 1);
        const jitter = Math.floor(Math.random() * 200);
        await sleep(base + jitter);
        continue;
      }
      throw e;
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr;
}
