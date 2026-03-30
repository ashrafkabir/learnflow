/**
 * Redact common secret patterns from logs/errors.
 * Defense-in-depth: upstream libs can sometimes echo tokens.
 */
export function redactSecrets(input: string): string {
  return String(input || '')
    .replace(/sk-[A-Za-z0-9]{10,}/g, '[REDACTED]')
    .replace(/tvly-[A-Za-z0-9]{10,}/g, '[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]{10,}/gi, 'Bearer [REDACTED]');
}
