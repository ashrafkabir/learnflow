export function extractRetryAfterSeconds(res: Response, body: any): number {
  const headerVal = Number(res.headers.get('Retry-After'));
  if (Number.isFinite(headerVal) && headerVal > 0) return headerVal;
  const bodyVal = Number(body?.retryAfterSeconds);
  if (Number.isFinite(bodyVal) && bodyVal > 0) return bodyVal;
  return 60;
}

export function toActionableHttpErrorMessage(status: number, body: any, res?: Response): string {
  const msg = String(body?.message || body?.error || '').trim();
  if (status === 429) {
    const retryAfter = res
      ? extractRetryAfterSeconds(res, body)
      : Number(body?.retryAfterSeconds) || 60;
    return msg || `Rate limit exceeded. Please wait ~${retryAfter}s and try again.`;
  }
  return msg || `HTTP ${status}`;
}
