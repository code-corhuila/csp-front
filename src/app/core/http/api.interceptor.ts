import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, timeout, TimeoutError } from 'rxjs';
import { SessionService } from '../auth/session.service';
import { RUNTIME_CONFIG } from '../config/runtime-config.token';
import { toApiError } from './api-error';

const TIMEOUT_MS = 10_000;

/**
 * Every request to '/api/...' goes through here, whichever portal made it:
 * the gateway URL, the token, a fresh X-Correlation-Id, a timeout, and one
 * shape for every error. Portals never set any of these themselves.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) return next(req);
  const { gatewayUrl } = inject(RUNTIME_CONFIG);
  const session = inject(SessionService);
  const correlationId = crypto.randomUUID();
  const token = session.token();
  const outgoing = req.clone({
    url: gatewayUrl + req.url,
    setHeaders: {
      'X-Correlation-Id': correlationId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return next(outgoing).pipe(
    timeout(TIMEOUT_MS),
    catchError((err: unknown) => {
      const http =
        err instanceof TimeoutError
          ? new HttpErrorResponse({ status: 0, error: { error: 'TIMEOUT' }, url: outgoing.url })
          : err instanceof HttpErrorResponse
            ? err
            : new HttpErrorResponse({ status: 0, error: err, url: outgoing.url });
      if (http.status === 401) session.clear();
      return throwError(() => toApiError(http, correlationId));
    }),
  );
};
