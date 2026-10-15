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
