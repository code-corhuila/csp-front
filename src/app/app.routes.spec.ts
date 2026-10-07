import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes, signInRoute } from './app.routes';
import { SessionService } from './core/auth/session.service';
import { registerFakeRemote } from './testing/fake-remote';

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

  it('sends a protected route without session to the auth login with the returnUrl', async () => {
    await RouterTestingHarness.create('/booking');

    expect(TestBed.inject(Router).url).toBe('/auth/login?returnUrl=%2Fbooking');
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

  it('sends the customer snack step without session to the auth login with the returnUrl', async () => {
    await RouterTestingHarness.create('/booking/snack-selection');

    expect(TestBed.inject(Router).url).toBe('/auth/login?returnUrl=%2Fbooking%2Fsnack-selection');
  });

  it('mounts the customer snack step before the booking portal, with its own notice when it is down', async () => {
    spyOn(console, 'error');
    TestBed.inject(SessionService).set('abc');

    const harness = await RouterTestingHarness.create('/booking/snack-selection');

    expect(harness.routeNativeElement?.textContent).toContain('Snacks is not available right now');
  });

  it('sends a signed-in person without the ADMIN role from the concessions admin to the start address', async () => {
    spyOn(console, 'error');
    await TestBed.inject(SessionService).connect(() =>
      Promise.resolve({ isAuthenticated: signal(true), end: () => undefined, hasRole: (r: string) => r === 'CLIENT' }));

    await RouterTestingHarness.create('/admin/concessions');

    expect(TestBed.inject(Router).url).toBe('/');
  });

  describe('with every portal available', () => {
    const portals: { remote: string; exposed: string; routes: string; address: string }[] = [
      { remote: 'auth', exposed: './routes', routes: 'AUTH_ROUTES', address: '/auth' },
      { remote: 'concessions', exposed: './snack-routes', routes: 'SNACK_ROUTES', address: '/booking/snack-selection' },
      { remote: 'booking', exposed: './routes', routes: 'BOOKING_ROUTES', address: '/booking' },
      { remote: 'ticketing', exposed: './routes', routes: 'TICKETING_ROUTES', address: '/dashboard' },
      { remote: 'concessions', exposed: './routes', routes: 'CONCESSIONS_ROUTES', address: '/admin/concessions' },
      { remote: 'catalog', exposed: './routes', routes: 'CATALOG_ROUTES', address: '/' },
    ];

    portals.forEach(({ remote, exposed, routes: exportName, address }) => {
      it(`mounts ${address} with the ${exportName} of the ${remote} portal`, async () => {
        const unregister = registerFakeRemote(remote, exposed, `export const ${exportName} = [{ path: '', children: [] }];`);
        TestBed.inject(SessionService).set('abc');
        spyOn(console, 'error');

        try {
          await RouterTestingHarness.create(address);

          expect(TestBed.inject(Router).url).toBe(address);
          expect(console.error).not.toHaveBeenCalled();
        } finally {
          unregister();
        }
      });
    });
  });
});
