import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SessionService } from '../auth/session.service';
import { RUNTIME_CONFIG } from '../config/runtime-config.token';
import { ApiError } from './api-error';
import { apiInterceptor } from './api.interceptor';

const MOVIES_URL = 'http://gateway.test/api/v1/movies';

describe('apiInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let session: SessionService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        { provide: RUNTIME_CONFIG, useValue: { gatewayUrl: 'http://gateway.test' } },
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionService);
  });
  afterEach(() => {
    backend.verify();
    sessionStorage.clear();
  });

  it('leaves requests outside /api/ untouched', () => {
    http.get('/assets/data.json').subscribe();

    const request = backend.expectOne('/assets/data.json');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    expect(request.request.headers.has('X-Correlation-Id')).toBeFalse();
  });

  it('sends /api/ requests to the gateway with the token and a correlation id', () => {
    session.set('abc');

    http.get('/api/v1/movies').subscribe();

    const request = backend.expectOne(MOVIES_URL);
    expect(request.request.headers.get('Authorization')).toBe('Bearer abc');
    expect(request.request.headers.get('X-Correlation-Id')).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('omits Authorization without a session and uses a new correlation id per request', () => {
    http.get('/api/v1/movies').subscribe();
    http.get('/api/v1/movies').subscribe();

    const [first, second] = backend.match(MOVIES_URL);
    expect(first.request.headers.has('Authorization')).toBeFalse();
    expect(first.request.headers.get('X-Correlation-Id'))
      .not.toBe(second.request.headers.get('X-Correlation-Id'));
  });

  it('turns a failure into an ApiError with the message decided in the shell', () => {
    let error: ApiError | undefined;
    http.get('/api/v1/movies').subscribe({ error: (e: ApiError) => (error = e) });

    backend.expectOne(MOVIES_URL).flush(
      { error: 'VALIDATION_ERROR', message: 'Invalid', details: [{ field: 'title', message: 'Required' }] },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(error?.status).toBe(400);
    expect(error?.code).toBe('VALIDATION_ERROR');
    expect(error?.details).toEqual([{ field: 'title', message: 'Required' }]);
    expect(error?.userMessage).toContain('not valid');
  });

  it('closes the session on a 401', () => {
    session.set('abc');
    http.get('/api/v1/movies').subscribe({ error: () => undefined });

    backend.expectOne(MOVIES_URL).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(session.token()).toBeNull();
  });

  it('keeps the session on other failures', () => {
    session.set('abc');
    http.get('/api/v1/movies').subscribe({ error: () => undefined });

    backend.expectOne(MOVIES_URL).flush(null, { status: 500, statusText: 'Server Error' });

    expect(session.token()).toBe('abc');
  });

  describe('timeout', () => {
    beforeEach(() => jasmine.clock().install());
    afterEach(() => jasmine.clock().uninstall());

    it('fails with TIMEOUT and status 0 after 10 seconds without an answer', () => {
      let error: ApiError | undefined;
      http.get('/api/v1/movies').subscribe({ error: (e: ApiError) => (error = e) });
      backend.expectOne(MOVIES_URL);

      jasmine.clock().tick(10_001);

      expect(error?.status).toBe(0);
      expect(error?.code).toBe('TIMEOUT');
      expect(error?.userMessage).toContain('took too long');
    });
  });
});
