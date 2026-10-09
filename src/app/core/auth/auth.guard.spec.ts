import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { authGuard, roleGuard } from './auth.guard';
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
});
