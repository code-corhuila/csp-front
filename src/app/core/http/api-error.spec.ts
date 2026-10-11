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
    expect(error.userMessage).toContain('cannot be reached');
    expect(error.userMessage).toContain('corr-1');
  });

  it('decides the person message by status', () => {
    const message = (status: number) =>
      toApiError(new HttpErrorResponse({ status }), 'corr-1').userMessage;

    expect(message(400)).toContain('not valid');
    expect(message(401)).toContain('session has expired');
    expect(message(403)).toContain('not allowed');
    expect(message(404)).toContain('does not exist');
    expect(message(429)).toContain('Too many requests');
    expect(message(500)).toContain('not available right now');
  });
});
