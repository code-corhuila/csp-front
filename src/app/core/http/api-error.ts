import { HttpErrorResponse } from '@angular/common/http';

export interface FieldError {
  field: string;
  message: string;
}

/**
 * What every failed request becomes before it reaches a portal: the shared error
 * envelope, the HTTP status (0 = no answer) and the message a person sees, decided
 * here, in ONE place. Portals declare the same shape in src/app/shell-contract.ts.
 */
export interface ApiError {
  status: number;
  code: string;
  message: string;
  details: FieldError[];
  traceId: string;
  userMessage: string;
}

export function toApiError(err: HttpErrorResponse, correlationId: string): ApiError {
  const envelope = typeof err.error === 'object' && err.error !== null ? err.error : {};
  const traceId: string = envelope.traceId ?? err.headers?.get('X-Correlation-Id') ?? correlationId;
  const status = err.status;
  const base = {
    status,
    code: envelope.error ?? (status === 0 ? 'NETWORK_ERROR' : `HTTP_${status}`),
    message: envelope.message ?? err.message,
    details: envelope.details ?? [],
    traceId,
  };
  return { ...base, userMessage: describe(base.status, base.code, base.message, traceId) };
}

function describe(status: number, code: string, message: string, traceId: string): string {
  const reference = traceId ? ` (reference ${traceId})` : '';
  if (status === 0) {
    return code === 'TIMEOUT'
      ? `The server took too long to answer. Try again.${reference}`
      : `The server cannot be reached. Check your connection and try again.${reference}`;
  }
  if (status === 400) return 'Some fields are not valid. Check them and try again.';
  if (status === 401) return 'Your session has expired. Sign in again.';
  if (status === 403) return 'You are not allowed to do this.';
  if (status === 404) return 'It does not exist, or it was removed.';
  if (status === 409 || status === 422) return message;
  if (status === 429) return 'Too many requests. Wait a moment and try again.';
  return `The service is not available right now. Try again later.${reference}`;
}
