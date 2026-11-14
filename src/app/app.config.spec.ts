import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { buildAppConfig } from './app.config';
import { ApiError } from './core/http/api-error';

const GATEWAY = 'http://gateway.test';

describe('buildAppConfig HTTP client', () => {
  let fetchSpy: jasmine.Spy;

  beforeEach(async () => {
    sessionStorage.clear();
    fetchSpy = spyOn(globalThis, 'fetch').and.rejectWith(new TypeError('no remote'));
    TestBed.configureTestingModule({
      providers: buildAppConfig({ gatewayUrl: GATEWAY } as never).providers,
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
  });
  afterEach(() => sessionStorage.clear());

  it('sends the requests through fetch, so keepalive reaches the browser', async () => {
    fetchSpy.and.resolveTo(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await new Promise<void>((done) =>
      TestBed.inject(HttpClient)
        .post('/api/v1/auth/logout', {}, { keepalive: true })
        .subscribe({ complete: done }),
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.calls.mostRecent().args as [string, RequestInit];
    expect(url).toBe(`${GATEWAY}/api/v1/auth/logout`);
    expect(init.keepalive).toBeTrue();
  });

  it('maps a failed fetch to the same ApiError of an unreachable server', async () => {
    fetchSpy.and.rejectWith(new TypeError('Failed to fetch'));

    const error = await new Promise<ApiError>((resolve) =>
      TestBed.inject(HttpClient)
        .get('/api/v1/movies')
        .subscribe({ error: resolve }),
    );

    expect(error.status).toBe(0);
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.userMessage).toContain('No se pudo contactar al servidor');
    expect(error.traceId).toMatch(/^[0-9a-f-]{36}$/);
    expect(error instanceof HttpErrorResponse).toBeFalse();
  });

  it('maps an answer with an error status to its ApiError', async () => {
    fetchSpy.and.resolveTo(
      new Response(JSON.stringify({ error: 'FORBIDDEN', message: 'no' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const error = await new Promise<ApiError>((resolve) =>
      TestBed.inject(HttpClient).get('/api/v1/movies').subscribe({ error: resolve }),
    );

    expect(error.status).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });
});
