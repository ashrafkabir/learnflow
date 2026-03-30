/**
 * Client-side redaction for user-facing error details.
 * Keep this conservative and deterministic.
 */
export function redactSecrets(input: string): string {
  return String(input || '')
    .replace(/sk-[A-Za-z0-9]{10,}/g, '[REDACTED]')
    .replace(/tvly-[A-Za-z0-9]{10,}/g, '[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]{10,}/gi, 'Bearer [REDACTED]');
}
