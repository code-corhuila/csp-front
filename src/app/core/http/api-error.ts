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
  /** Seconds left of a lock (429 with Retry-After); absent when the server did not say. */
  retryAfterSeconds?: number;
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
  const retryAfterSeconds = parseRetryAfter(err.headers?.get('Retry-After'));
  const userMessage = describe(base.status, base.code, base.message, traceId);
  return retryAfterSeconds === undefined
    ? { ...base, userMessage }
    : { ...base, userMessage, retryAfterSeconds };
}

/** Only whole seconds of at least 1; an HTTP-date or anything else is ignored. */
function parseRetryAfter(value: string | null | undefined): number | undefined {
  const text = value?.trim() ?? '';
  if (!/^\d+$/.test(text)) return undefined;
  const seconds = Number(text);
  return seconds >= 1 ? seconds : undefined;
}

function describe(status: number, code: string, message: string, traceId: string): string {
  const reference = traceId ? ` (referencia ${traceId})` : '';
  if (status === 0) {
    return code === 'TIMEOUT'
      ? `El servidor tardó demasiado en responder. Intenta de nuevo.${reference}`
      : `No se pudo contactar al servidor. Revisa tu conexión e intenta de nuevo.${reference}`;
  }
  if (status === 400) return 'Algunos campos no son válidos. Revísalos e intenta de nuevo.';
  if (status === 401) return 'Tu sesión ha expirado. Inicia sesión de nuevo.';
  if (status === 403) return 'No tienes permiso para hacer esto.';
  if (status === 404) return 'No existe o fue eliminado.';
  if (status === 409 || status === 422) return message;
  if (status === 429) return 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.';
  return `El servicio no está disponible en este momento. Intenta más tarde.${reference}`;
}
