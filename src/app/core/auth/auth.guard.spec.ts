import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { authGuard } from './auth.guard';
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

  it('lets a signed-in person through', () => {
    TestBed.inject(SessionService).set('abc');

    expect(run()).toBeTrue();
  });

  it('sends a person without session to sign-in and remembers where they were going', () => {
    const result = run();

    expect(result instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree))
      .toBe('/sign-in?returnUrl=%2Fbooking%2Fcheckout');
  });
});
