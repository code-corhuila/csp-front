import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes, signInRoute } from './app.routes';
import { SessionService } from './core/auth/session.service';

describe('routes', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding())],
    });
  });
  afterEach(() => sessionStorage.clear());

  it('shows the 404 page for an address that does not exist', async () => {
    const harness = await RouterTestingHarness.create('/does-not-exist');

    expect(harness.routeNativeElement?.textContent).toContain('Page not found');
  });

  it('shows the notice at the start address when the catalog portal cannot be loaded', async () => {
    spyOn(console, 'error');

    const harness = await RouterTestingHarness.create('/');

    expect(harness.routeNativeElement?.textContent).toContain('Movies is not available right now');
  });

  it('keeps the 404 page for unknown addresses while the catalog portal is down', async () => {
    spyOn(console, 'error');
    const harness = await RouterTestingHarness.create('/');

    await harness.navigateByUrl('/does-not-exist');

    expect(harness.routeNativeElement?.textContent).toContain('Page not found');
    expect(harness.routeNativeElement?.textContent).not.toContain('Movies is not available');
  });

  it('sends /movies to the start address, where the auth portal lands after signing in', async () => {
    spyOn(console, 'error');

    await RouterTestingHarness.create('/movies');

    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('sends a protected route without session to sign-in with the returnUrl', async () => {
    await RouterTestingHarness.create('/booking');

    expect(TestBed.inject(Router).url).toBe('/sign-in?returnUrl=%2Fbooking');
  });

  it('replaces only the area of a portal that cannot be loaded with a notice', async () => {
    spyOn(console, 'error');
    TestBed.inject(SessionService).set('abc');

    const harness = await RouterTestingHarness.create('/booking');

    expect(harness.routeNativeElement?.textContent).toContain('Booking is not available right now');
    expect(console.error).toHaveBeenCalled();
  });

  it('keeps the rest of the application working while a portal is down', async () => {
    spyOn(console, 'error');
    TestBed.inject(SessionService).set('abc');
    const harness = await RouterTestingHarness.create('/booking');

    await harness.navigateByUrl('/does-not-exist');

    expect(harness.routeNativeElement?.textContent).toContain('Page not found');
  });

  it('mounts the token sign-in only in development', () => {
    expect(signInRoute(true).loadComponent).toBeDefined();
    expect(signInRoute(false).loadComponent).toBeUndefined();
    expect(signInRoute(false).redirectTo).toBe('auth/login');
  });
});
