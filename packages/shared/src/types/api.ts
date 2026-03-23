export type ApiError = {
  code: string;
  message: string;
  /** Optional structured diagnostics safe to return to clients. */
  details?: unknown;
};

export type ErrorEnvelope = {
  error: ApiError;
  requestId: string;
  /** Optional HTTP status (useful for logging/clients). */
  status?: number;
};

export type SuccessEnvelope<T> = {
  data: T;
  requestId: string;
};
