export function extractRetryAfterSeconds(res: Response, body: any): number {
  const headerVal = Number(res.headers.get('Retry-After'));
  if (Number.isFinite(headerVal) && headerVal > 0) return headerVal;
  const bodyVal = Number(body?.retryAfterSeconds);
  if (Number.isFinite(bodyVal) && bodyVal > 0) return bodyVal;
  return 60;
}

export function toActionableHttpErrorMessage(status: number, body: any, res?: Response): string {
  // LearnFlow API returns a stable ErrorEnvelope:
  // { error: { code, message }, requestId, ... }
  const envMsg =
    typeof body?.error?.message === 'string' ? String(body.error.message).trim() : undefined;
  const envCode =
    typeof body?.error?.code === 'string' ? String(body.error.code).trim() : undefined;
  const requestId = typeof body?.requestId === 'string' ? String(body.requestId).trim() : undefined;

  const directMsg = typeof body?.message === 'string' ? String(body.message).trim() : undefined;
  const legacyError = typeof body?.error === 'string' ? String(body.error).trim() : undefined;

  const msg = envMsg || directMsg || legacyError || '';

  const withMeta = (base: string) => {
    const bits: string[] = [];
    if (envCode) bits.push(envCode);
    if (requestId) bits.push(`req:${requestId}`);
    return bits.length ? `${base} (${bits.join(' ')})` : base;
  };

  if (status === 429) {
    const retryAfter = res
      ? extractRetryAfterSeconds(res, body)
      : Number(body?.retryAfterSeconds) || 60;
    return withMeta(msg || `Rate limit exceeded. Please wait ~${retryAfter}s and try again.`);
  }

  return withMeta(msg || `HTTP ${status}`);
}
