import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlSegment, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { catalogAdminMatcher, profileMatcher, routes, signInRoute } from './app.routes';
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

    expect(harness.routeNativeElement?.textContent).toContain('Página no encontrada');
  });

  it('shows the notice at the start address when the catalog portal cannot be loaded', async () => {
    spyOn(console, 'error');

    const harness = await RouterTestingHarness.create('/');

    expect(harness.routeNativeElement?.textContent).toContain('Películas no está disponible en este momento');
  });

  it('keeps the 404 page for unknown addresses while the catalog portal is down', async () => {
    spyOn(console, 'error');
    const harness = await RouterTestingHarness.create('/');

    await harness.navigateByUrl('/does-not-exist');

    expect(harness.routeNativeElement?.textContent).toContain('Página no encontrada');
    expect(harness.routeNativeElement?.textContent).not.toContain('Películas no está disponible');
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

  it('sends a signed-in person from the login and register pages to the start address', async () => {
    spyOn(console, 'error');
    TestBed.inject(SessionService).set('abc');

    const harness = await RouterTestingHarness.create('/auth');
    expect(TestBed.inject(Router).url).toBe('/');

    for (const address of ['/auth/login', '/auth/register']) {
      await harness.navigateByUrl(address);

      expect(TestBed.inject(Router).url).toBe('/');
    }
  });

  it('keeps the login page for a visitor and the reset page for a signed-in person', async () => {
    spyOn(console, 'error');
    const unregister = registerFakeRemote('auth', './routes',
      "export const AUTH_ROUTES = [{ path: 'login', children: [] }, { path: 'reset-password', children: [] }];");

    try {
      const harness = await RouterTestingHarness.create('/auth/login');
      expect(TestBed.inject(Router).url).toBe('/auth/login');

      TestBed.inject(SessionService).set('abc');
      await harness.navigateByUrl('/auth/reset-password?token=abc');
      expect(TestBed.inject(Router).url).toBe('/auth/reset-password?token=abc');
    } finally {
      unregister();
    }
  });

  it('replaces only the area of a portal that cannot be loaded with a notice', async () => {
    spyOn(console, 'error');
    TestBed.inject(SessionService).set('abc');

    const harness = await RouterTestingHarness.create('/booking');

    expect(harness.routeNativeElement?.textContent).toContain('Reservas no está disponible en este momento');
    expect(console.error).toHaveBeenCalled();
  });

  it('keeps the rest of the application working while a portal is down', async () => {
    spyOn(console, 'error');
    TestBed.inject(SessionService).set('abc');
    const harness = await RouterTestingHarness.create('/booking');

    await harness.navigateByUrl('/does-not-exist');

    expect(harness.routeNativeElement?.textContent).toContain('Página no encontrada');
  });

  it('runs the guards again on every guarded route, so the shell can leave a page when the session ends', () => {
    const guarded = routes.filter((route) => route.canActivate);

    expect(guarded.length).toBeGreaterThan(0);
    guarded.forEach((route) => expect(route.runGuardsAndResolvers).withContext(String(route.path)).toBe('always'));
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

    expect(harness.routeNativeElement?.textContent).toContain('Confitería no está disponible en este momento');
  });

  it('sends a signed-in person without the ADMIN role from the concessions admin to the start address', async () => {
    spyOn(console, 'error');
    await TestBed.inject(SessionService).connect(() =>
      Promise.resolve({ isAuthenticated: signal(true), end: () => undefined, hasRole: (r: string) => r === 'CLIENT' }));

    await RouterTestingHarness.create('/admin/concessions');

    expect(TestBed.inject(Router).url).toBe('/');
  });

  const adminAddresses = ['/admin/reservations', '/admin/users', '/admin/billboard', '/admin/movies', '/admin/rooms', '/admin/reports'];

  adminAddresses.forEach((address) => {
    it(`sends ${address} without session to the auth login with the returnUrl`, async () => {
      await RouterTestingHarness.create(address);

      expect(TestBed.inject(Router).url).toBe(`/auth/login?returnUrl=${encodeURIComponent(address)}`);
    });

    it(`sends a signed-in person without the ADMIN role from ${address} to the start address`, async () => {
      spyOn(console, 'error');
      await TestBed.inject(SessionService).connect(() =>
        Promise.resolve({ isAuthenticated: signal(true), end: () => undefined, hasRole: (r: string) => r === 'CLIENT' }));

      await RouterTestingHarness.create(address);

      expect(TestBed.inject(Router).url).toBe('/');
    });
  });

  it('shows its own notice at /admin/reservations when the booking portal is down', async () => {
    spyOn(console, 'error');
    TestBed.inject(SessionService).set('abc');

    const harness = await RouterTestingHarness.create('/admin/reservations');

    expect(harness.routeNativeElement?.textContent).toContain('Todas las reservas no está disponible en este momento');
  });

  it('shows its own notice at /admin/users when the auth portal is down', async () => {
    spyOn(console, 'error');
    TestBed.inject(SessionService).set('abc');

    const harness = await RouterTestingHarness.create('/admin/users');

    expect(harness.routeNativeElement?.textContent).toContain('Roles de usuarios no está disponible en este momento');
  });

  ['billboard', 'movies', 'rooms', 'reports'].forEach((area) => {
    it(`shows its own notice at /admin/${area} when the catalog portal is down`, async () => {
      spyOn(console, 'error');
      TestBed.inject(SessionService).set('abc');

      const harness = await RouterTestingHarness.create(`/admin/${area}`);

      expect(harness.routeNativeElement?.textContent).toContain('Administración del catálogo no está disponible en este momento');
    });
  });
  it('keeps the 404 page for an /admin address that is not an administration area', async () => {
    spyOn(console, 'error');
    TestBed.inject(SessionService).set('abc');

    const harness = await RouterTestingHarness.create('/admin/unknown');

    expect(harness.routeNativeElement?.textContent).toContain('Página no encontrada');
  });

  it('declares the catalog administration only for billboard, movies, rooms and reports', () => {
    const segments = (...paths: string[]) => paths.map((path) => new UrlSegment(path, {}));

    ['billboard', 'movies', 'rooms', 'reports'].forEach((area) => {
      expect(catalogAdminMatcher(segments('admin', area), {} as never, {} as never)?.consumed.length).toBe(1);
    });
    expect(catalogAdminMatcher(segments('admin'), {} as never, {} as never)).toBeNull();
    expect(catalogAdminMatcher(segments('admin', 'concessions'), {} as never, {} as never)).toBeNull();
    expect(catalogAdminMatcher(segments('booking', 'movies'), {} as never, {} as never)).toBeNull();
  });

  it('sends /profile without session to the auth login with the returnUrl', async () => {
    await RouterTestingHarness.create('/profile');

    expect(TestBed.inject(Router).url).toBe('/auth/login?returnUrl=%2Fprofile');
  });

  it('shows its own notice at /profile when the auth portal is down', async () => {
    spyOn(console, 'error');
    TestBed.inject(SessionService).set('abc');

    const harness = await RouterTestingHarness.create('/profile');

    expect(harness.routeNativeElement?.textContent).toContain('Mi perfil no está disponible en este momento');
  });

  it('keeps the 404 page for an address below /profile', async () => {
    spyOn(console, 'error');
    TestBed.inject(SessionService).set('abc');

    const harness = await RouterTestingHarness.create('/profile/unknown');

    expect(harness.routeNativeElement?.textContent).toContain('Página no encontrada');
  });

  it('declares the profile entry only for the single segment profile, without consuming it', () => {
    const segments = (...paths: string[]) => paths.map((path) => new UrlSegment(path, {}));

    expect(profileMatcher(segments('profile'), {} as never, {} as never)?.consumed).toEqual([]);
    expect(profileMatcher(segments('profile', 'unknown'), {} as never, {} as never)).toBeNull();
    expect(profileMatcher(segments('auth', 'profile'), {} as never, {} as never)).toBeNull();
    expect(profileMatcher([], {} as never, {} as never)).toBeNull();
  });

  describe('with every portal available', () => {
    const portals: { remote: string; exposed: string; routes: string; address: string }[] = [
      { remote: 'concessions', exposed: './snack-routes', routes: 'SNACK_ROUTES', address: '/booking/snack-selection' },
      { remote: 'booking', exposed: './routes', routes: 'BOOKING_ROUTES', address: '/booking' },
      { remote: 'ticketing', exposed: './routes', routes: 'TICKETING_ROUTES', address: '/dashboard' },
      { remote: 'concessions', exposed: './routes', routes: 'CONCESSIONS_ROUTES', address: '/admin/concessions' },
      { remote: 'booking', exposed: './admin-routes', routes: 'ADMIN_ROUTES', address: '/admin/reservations' },
      { remote: 'auth', exposed: './admin-routes', routes: 'ADMIN_ROUTES', address: '/admin/users' },
      { remote: 'catalog', exposed: './routes', routes: 'CATALOG_ROUTES', address: '/' },
    ];

    it('mounts /profile with the profile page of the auth portal', async () => {
      const unregister = registerFakeRemote('auth', './routes', "export const AUTH_ROUTES = [{ path: 'login', children: [] }, { path: 'profile', children: [] }];");
      TestBed.inject(SessionService).set('abc');
      spyOn(console, 'error');

      try {
        await RouterTestingHarness.create('/profile');

        expect(TestBed.inject(Router).url).toBe('/profile');
        expect(console.error).not.toHaveBeenCalled();
      } finally {
        unregister();
      }
    });

    it('mounts /auth with the AUTH_ROUTES of the auth portal for a visitor', async () => {
      const unregister = registerFakeRemote('auth', './routes', "export const AUTH_ROUTES = [{ path: '', children: [] }];");
      spyOn(console, 'error');

      try {
        await RouterTestingHarness.create('/auth');

        expect(TestBed.inject(Router).url).toBe('/auth');
        expect(console.error).not.toHaveBeenCalled();
      } finally {
        unregister();
      }
    });

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

    ['billboard', 'movies', 'rooms', 'reports'].forEach((area) => {
      it(`mounts /admin/${area} with the ADMIN_ROUTES of the catalog portal`, async () => {
        const unregister = registerFakeRemote(
          'catalog',
          './admin-routes',
          "export const ADMIN_ROUTES = [{ path: 'billboard', children: [] }, { path: 'movies', children: [] }, { path: 'rooms', children: [] }, { path: 'reports', children: [] }];",
        );
        TestBed.inject(SessionService).set('abc');
        spyOn(console, 'error');

        try {
          await RouterTestingHarness.create(`/admin/${area}`);

          expect(TestBed.inject(Router).url).toBe(`/admin/${area}`);
          expect(console.error).not.toHaveBeenCalled();
        } finally {
          unregister();
        }
      });
    });
  });
});
