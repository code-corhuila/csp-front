import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './auth.guard';
import { SessionService } from './session.service';

describe('authGuard', () => {
  const state = { url: '/booking/checkout' } as RouterStateSnapshot;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });
  afterEach(() => sessionStorage.clear());

  const run = () =>
    TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, state));

  it('lets through a person with the development token', () => {
    TestBed.inject(SessionService).set('abc');

    expect(run()).toBeTrue();
  });

  it('lets through a person with a session of the auth portal', async () => {
    const open = signal(true);
    await TestBed.inject(SessionService).connect(() =>
      Promise.resolve({ isAuthenticated: open, end: () => open.set(false), hasRole: () => true }));

    expect(run()).toBeTrue();
  });

  it('sends a person without session to the auth login and remembers where they were going', () => {
    const result = run();

    expect(result instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree))
      .toBe('/auth/login?returnUrl=%2Fbooking%2Fcheckout');
  });

  describe('roleGuard', () => {
    const runRole = (role: string) =>
      TestBed.runInInjectionContext(() => roleGuard(role)({} as ActivatedRouteSnapshot, state));
    const connectPortal = (roles: string[]) =>
      TestBed.inject(SessionService).connect(() =>
        Promise.resolve({
          isAuthenticated: signal(true),
          end: () => undefined,
          hasRole: (role: string) => roles.includes(role),
        }));

    it('lets through a person that has the role', async () => {
      await connectPortal(['CLIENT', 'ADMIN']);

      expect(runRole('ADMIN')).toBeTrue();
    });

    it('sends a person without the role to the start address', async () => {
      await connectPortal(['CLIENT']);

      const result = runRole('ADMIN');

      expect(result instanceof UrlTree).toBeTrue();
      expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
    });

    it('sends a person without session to the auth login and remembers where they were going', () => {
      const result = runRole('ADMIN');

      expect(TestBed.inject(Router).serializeUrl(result as UrlTree))
        .toBe('/auth/login?returnUrl=%2Fbooking%2Fcheckout');
    });
  });

  describe('after the session restore of a reloaded page', () => {
    const portalRestoring = (signedIn: boolean) => {
      const open = signal(false);
      return {
        isAuthenticated: open,
        end: () => open.set(false),
        hasRole: (role: string) => open() && role === 'ADMIN',
        restore: () => {
          open.set(signedIn);
          return Promise.resolve();
        },
      };
    };
    const runRole = () =>
      TestBed.runInInjectionContext(() => roleGuard('ADMIN')({} as ActivatedRouteSnapshot, { url: '/admin/users' } as RouterStateSnapshot));

    it('keeps the person on the protected route when the restore found a session', async () => {
      await TestBed.inject(SessionService).connect(() => Promise.resolve(portalRestoring(true)));

      expect(runRole()).toBeTrue();
    });

    it('sends the person to the auth login when the restore found no session', async () => {
      await TestBed.inject(SessionService).connect(() => Promise.resolve(portalRestoring(false)));

      expect(TestBed.inject(Router).serializeUrl(runRole() as UrlTree))
        .toBe('/auth/login?returnUrl=%2Fadmin%2Fusers');
    });
  });
});

describe('guestGuard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });
  afterEach(() => sessionStorage.clear());

  const run = (url: string) =>
    TestBed.runInInjectionContext(() => guestGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot));

  ['/auth', '/auth/', '/auth/login', '/auth/register', '/auth/login?returnUrl=%2Fbooking'].forEach((url) => {
    it(`sends a signed-in person from ${url} to the start address`, () => {
      TestBed.inject(SessionService).set('abc');

      const result = run(url);

      expect(result instanceof UrlTree).toBeTrue();
      expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
    });

    it(`lets a visitor into ${url}`, () => {
      expect(run(url)).toBeTrue();
    });
  });

  ['/auth/forgot-password', '/auth/reset-password?token=abc', '/auth/profile'].forEach((url) => {
    it(`keeps ${url} reachable for a signed-in person`, () => {
      TestBed.inject(SessionService).set('abc');

      expect(run(url)).toBeTrue();
    });
  });
});
