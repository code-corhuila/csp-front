import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
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

  it('shows the five navigation links and the brand', async () => {
    const harness = await RouterTestingHarness.create('/');
    const nav: HTMLElement = harness.routeNativeElement!.querySelector('nav')!;

    expect(Array.from(nav.querySelectorAll('a')).map((a) => a.textContent)).toEqual([
      'Movies', 'Account', 'Booking', 'My tickets', 'Concessions',
    ]);
    expect(harness.routeNativeElement!.querySelector('.brand')?.textContent).toContain('CineSync');
  });

  it('marks the movies link as active at the start address', async () => {
    const harness = await RouterTestingHarness.create('/');
    const active = harness.routeNativeElement!.querySelectorAll('nav a.active');

    expect(active.length).toBe(1);
    expect(active[0].textContent).toBe('Movies');
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

  it('offers only sign out while there is a session', async () => {
    TestBed.inject(SessionService).set('abc');
    const harness = await RouterTestingHarness.create('/');
    const actions: HTMLElement = harness.routeNativeElement!.querySelector('.actions')!;

    expect(actions.querySelector('button')?.textContent).toBe('Sign out');
    expect(actions.querySelector('a')).toBeNull();
  });
});
