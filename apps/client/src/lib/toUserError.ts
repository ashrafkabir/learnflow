import type { ErrorEnvelope } from '@learnflow/shared';

export type UserError = {
  message: string;
  requestId?: string;
};

function isPlainObject(v: unknown): v is Record<string, any> {
  return Boolean(v) && typeof v === 'object' && (v as any).constructor === Object;
}

/**
 * Convert arbitrary thrown values into a human-friendly message.
 * Also attempts to extract requestId from the API's ErrorEnvelope shape.
 */
export function toUserError(err: unknown, fallbackMessage: string): UserError {
  const fallback = String(fallbackMessage || 'Request failed');

  // Native Error
  if (err instanceof Error) {
    const msg = String(err.message || '').trim();
    return { message: msg || fallback };
  }

  // Strings
  if (typeof err === 'string') {
    const msg = err.trim();
    return { message: msg || fallback };
  }

  // Fetch-style / API error envelope
  if (isPlainObject(err)) {
    // Some call sites may throw parsed JSON directly.
    const maybeEnvelope = err as Partial<ErrorEnvelope> & any;
    const requestId =
      typeof maybeEnvelope.requestId === 'string' && maybeEnvelope.requestId
        ? maybeEnvelope.requestId
        : undefined;

    const envMsg =
      typeof maybeEnvelope?.error?.message === 'string' ? maybeEnvelope.error.message : undefined;

    const directMsg =
      typeof (maybeEnvelope as any).message === 'string'
        ? (maybeEnvelope as any).message
        : undefined;

    const msg = String(envMsg || directMsg || '').trim();

    return { message: msg || fallback, requestId };
  }

  return { message: fallback };
}
