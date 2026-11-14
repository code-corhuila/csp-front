import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { toApiError } from './api-error';

describe('toApiError', () => {
  it('takes code, message, details and traceId from the error envelope', () => {
    const response = new HttpErrorResponse({
      status: 422,
      error: {
        error: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: [{ field: 'title', message: 'Required' }],
        traceId: 'trace-1',
      },
    });

    expect(toApiError(response, 'corr-1')).toEqual({
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request',
      details: [{ field: 'title', message: 'Required' }],
      traceId: 'trace-1',
      userMessage: 'Invalid request',
    });
  });

  it('falls back to the response header and then to the correlation id for the traceId', () => {
    const withHeader = new HttpErrorResponse({
      status: 500,
      headers: new HttpHeaders({ 'X-Correlation-Id': 'from-header' }),
    });
    const withoutHeader = new HttpErrorResponse({ status: 500 });

    expect(toApiError(withHeader, 'corr-1').traceId).toBe('from-header');
    expect(toApiError(withoutHeader, 'corr-1').traceId).toBe('corr-1');
  });

  it('names the code after the status when the body has no envelope', () => {
    const error = toApiError(new HttpErrorResponse({ status: 503 }), 'corr-1');

    expect(error.code).toBe('HTTP_503');
    expect(error.details).toEqual([]);
  });

  it('reports no answer as NETWORK_ERROR with the reference', () => {
    const error = toApiError(new HttpErrorResponse({ status: 0 }), 'corr-1');

    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.userMessage).toContain('No se pudo contactar');
    expect(error.userMessage).toContain('corr-1');
  });

  it('decides the person message by status', () => {
    const message = (status: number) =>
      toApiError(new HttpErrorResponse({ status }), 'corr-1').userMessage;

    expect(message(400)).toContain('no son válidos');
    expect(message(401)).toContain('sesión ha expirado');
    expect(message(403)).toContain('No tienes permiso');
    expect(message(404)).toContain('No existe');
    expect(message(429)).toContain('Demasiadas solicitudes');
    expect(message(500)).toContain('no está disponible en este momento');
  });

  describe('retryAfterSeconds', () => {
    const rateLimited = (retryAfter?: string) =>
      toApiError(
        new HttpErrorResponse({
          status: 429,
          headers: retryAfter === undefined ? undefined : new HttpHeaders({ 'Retry-After': retryAfter }),
        }),
        'corr-1',
      );

    it('reads the seconds of the Retry-After header', () => {
      expect(rateLimited('1').retryAfterSeconds).toBe(1);
      expect(rateLimited('300').retryAfterSeconds).toBe(300);
      expect(rateLimited(' 45 ').retryAfterSeconds).toBe(45);
    });

    it('ignores a missing, empty, non positive, fractional or non numeric value', () => {
      for (const value of [undefined, '', '0', '-5', '1.5', 'abc', '10s', 'Wed, 21 Oct 2026 07:28:00 GMT']) {
        expect(rateLimited(value).retryAfterSeconds).toBeUndefined();
      }
    });

    it('keeps the generic message of the 429', () => {
      expect(rateLimited('300').userMessage).toContain('Demasiadas solicitudes');
    });
  });
});
