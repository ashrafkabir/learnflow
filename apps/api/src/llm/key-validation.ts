import OpenAI from 'openai';

/**
 * Best-effort network validation used by Settings validate-on-save.
 *
 * IMPORTANT:
 * - Should never throw for normal auth failures; return false instead.
 * - Only used for OpenAI + Anthropic in Iter85.
 */
export async function validateKeyWithProvider(params: {
  provider: 'openai' | 'anthropic';
  apiKey: string;
}): Promise<boolean> {
  const { provider, apiKey } = params;
  const key = apiKey.trim();

  if (provider === 'openai') {
    try {
      const client = new OpenAI({ apiKey: key });
      // Lightweight auth check. If invalid, OpenAI returns 401.
      // If valid, returns a models list.
      await client.models.list();
      return true;
    } catch (err: any) {
      const status = Number(err?.status || err?.response?.status || 0);
      if (status === 401 || status === 403) return false;
      // For network/timeouts/etc, treat as unknown; caller should not fail save.
      throw err;
    }
  }

  // Anthropic: call /v1/models with x-api-key.
  // Using HTTP here avoids adding a new dependency.
  const res = await fetch('https://api.anthropic.com/v1/models', {
    method: 'GET',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
  });

  if (res.status === 401 || res.status === 403) return false;
  if (!res.ok) throw new Error(`anthropic_validate_failed_${res.status}`);

  return true;
}
