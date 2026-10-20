import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationStart, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { authGuard } from '../core/auth/auth.guard';
import { SessionService } from '../core/auth/session.service';
import { ShellLayoutComponent } from './shell-layout.component';

@Component({ selector: 'app-page', template: '<p>page</p>' })
class PageComponent {}

describe('ShellLayoutComponent', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: ShellLayoutComponent, children: [{ path: '', component: PageComponent }] },
        ]),
      ],
    });
  });
  afterEach(() => sessionStorage.clear());

  it('shows the navigation links for a visitor and the brand', async () => {
    const harness = await RouterTestingHarness.create('/');
    const nav: HTMLElement = harness.routeNativeElement!.querySelector('nav')!;

    expect(Array.from(nav.querySelectorAll('a')).map((a) => a.textContent)).toEqual([
      'Películas', 'Mi cuenta', 'Reservas', 'Mis boletas',
    ]);
    expect(harness.routeNativeElement!.querySelector('.brand')?.textContent).toContain('CineSync');
  });

  it('marks the movies link as active at the start address', async () => {
    const harness = await RouterTestingHarness.create('/');
    const active = harness.routeNativeElement!.querySelectorAll('nav a.active');

    expect(active.length).toBe(1);
    expect(active[0].textContent).toBe('Películas');
    expect(active[0].getAttribute('href')).toBe('/');
    expect(active[0].getAttribute('aria-current')).toBe('page');
  });

  it('offers log in and register, and no sign out, without a session', async () => {
    const harness = await RouterTestingHarness.create('/');
    const actions: HTMLElement = harness.routeNativeElement!.querySelector('.actions')!;
    const login = actions.querySelector('a.btn-secondary')!;
    const register = actions.querySelector('a.btn-primary')!;

    expect(login.textContent).toBe('Iniciar sesión');
    expect(login.getAttribute('href')).toBe('/auth/login');
    expect(register.textContent).toBe('Registrarse');
    expect(register.getAttribute('href')).toBe('/auth/register');
    expect(actions.querySelector('button')).toBeNull();
  });

  it('offers only sign out while there is a token', async () => {
    TestBed.inject(SessionService).set('abc');
    const harness = await RouterTestingHarness.create('/');
    const actions: HTMLElement = harness.routeNativeElement!.querySelector('.actions')!;

    expect(actions.querySelector('button')?.textContent).toBe('Cerrar sesión');
    expect(actions.querySelector('a')).toBeNull();
  });

  it('offers only sign out while the auth portal has a session, and ends it on sign out', async () => {
    const open = signal(true);
    const end = jasmine.createSpy('end').and.callFake(() => open.set(false));
    await TestBed.inject(SessionService).connect(() => Promise.resolve({ isAuthenticated: open, end, hasRole: () => false }));
    const harness = await RouterTestingHarness.create('/');
    const actions: HTMLElement = harness.routeNativeElement!.querySelector('.actions')!;
    expect(actions.querySelector('a')).toBeNull();

    actions.querySelector('button')!.click();
    harness.detectChanges();

    expect(end).toHaveBeenCalled();
    expect(actions.querySelector('button')).toBeNull();
    expect(actions.querySelectorAll('a').length).toBe(2);
  });

  it('clears the token on sign out', async () => {
    const session = TestBed.inject(SessionService);
    session.set('abc');
    const harness = await RouterTestingHarness.create('/');

    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.actions button')!.click();

    expect(session.token()).toBeNull();
  });

  it('asks the portal to close the session on the server when the person signs out', async () => {
    const open = signal(true);
    const signOut = jasmine.createSpy('signOut').and.callFake(() => {
      open.set(false);
      return Promise.resolve();
    });
    await TestBed.inject(SessionService).connect(() =>
      Promise.resolve({ isAuthenticated: open, end: () => open.set(false), hasRole: () => false, signOut }));
    const harness = await RouterTestingHarness.create('/');

    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.actions button')!.click();
    await harness.fixture.whenStable();

    expect(signOut).toHaveBeenCalled();
  });

  it('shows the administration links only to an ADMIN and Snacks to any signed-in person', async () => {
    const roles = signal<string[]>(['CLIENT']);
    await TestBed.inject(SessionService).connect(() =>
      Promise.resolve({ isAuthenticated: signal(true), end: () => undefined, hasRole: (r: string) => roles().includes(r) }));
    const harness = await RouterTestingHarness.create('/');
    const links = () => Array.from(harness.routeNativeElement!.querySelectorAll('nav a')).map(a => a.getAttribute('href'));

    expect(links()).toContain('/booking/snack-selection');
    expect(links()).toContain('/profile');
    expect(links()).not.toContain('/admin/concessions');
    ['/admin/reservations', '/admin/users', '/admin/billboard', '/admin/movies', '/admin/rooms'].forEach((href) => expect(links()).not.toContain(href));

    roles.set(['CLIENT', 'ADMIN']);
    harness.detectChanges();

    expect(links()).toContain('/admin/concessions');
    ['/admin/reservations', '/admin/users', '/admin/billboard', '/admin/movies', '/admin/rooms'].forEach((href) => expect(links()).toContain(href));
  });

  it('hides Snacks and the admin link from an anonymous visitor', async () => {
    const harness = await RouterTestingHarness.create('/');
    const links = Array.from(harness.routeNativeElement!.querySelectorAll('nav a')).map(a => a.getAttribute('href'));

    expect(links).not.toContain('/booking/snack-selection');
    expect(links).not.toContain('/profile');
    expect(links).not.toContain('/admin/concessions');
    expect(links).not.toContain('/admin/reservations');
  });
});

describe('ShellLayoutComponent when the session ends', () => {
  let open: ReturnType<typeof signal<boolean>>;
  let navigations: string[];

  const startWith = async (authenticated: boolean, signOut?: () => Promise<void>) => {
    open = signal(authenticated);
    await TestBed.inject(SessionService).connect(() =>
      Promise.resolve({ isAuthenticated: open, end: () => open.set(false), hasRole: () => false, signOut }));
    const router = TestBed.inject(Router);
    navigations = [];
    router.events.subscribe((e) => {
      if (e instanceof NavigationStart) {
        navigations.push(e.url);
      }
    });
    return RouterTestingHarness.create();
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            component: ShellLayoutComponent,
            children: [
              { path: '', component: PageComponent },
              { path: 'public', component: PageComponent },
              { path: 'admin/users', component: PageComponent, canActivate: [authGuard], runGuardsAndResolvers: 'always' },
              { path: 'auth/login', component: PageComponent },
            ],
          },
        ]),
      ],
    });
  });
  afterEach(() => sessionStorage.clear());

  it('goes to the start page after the explicit sign out, with a single navigation', async () => {
    const harness = await startWith(true, () => {
      open.set(false);
      return Promise.resolve();
    });
    await harness.navigateByUrl('/admin/users');
    navigations.length = 0;

    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.actions button')!.click();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/');
    expect(navigations).toEqual(['/']);
  });

  it('sends a protected page to the login with its return url when the session ends otherwise', async () => {
    const harness = await startWith(true);
    await harness.navigateByUrl('/admin/users');

    open.set(false);
    harness.detectChanges();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/auth/login?returnUrl=%2Fadmin%2Fusers');
    expect(navigations).toEqual(['/admin/users', '/admin/users', '/auth/login?returnUrl=%2Fadmin%2Fusers']);
  });

  it('keeps a public page when the session ends otherwise', async () => {
    const harness = await startWith(true);
    await harness.navigateByUrl('/public');

    open.set(false);
    harness.detectChanges();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/public');
  });

  it('does not navigate when the shell starts without a session', async () => {
    const harness = await startWith(false);
    await harness.navigateByUrl('/public');
    navigations.length = 0;

    harness.detectChanges();
    await harness.fixture.whenStable();

    expect(navigations).toEqual([]);
  });

  it('does not navigate again when the session stays closed', async () => {
    const harness = await startWith(true);
    await harness.navigateByUrl('/public');
    open.set(false);
    harness.detectChanges();
    await harness.fixture.whenStable();
    navigations.length = 0;

    harness.detectChanges();
    await harness.fixture.whenStable();

    expect(navigations).toEqual([]);
  });
});
