import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { HomeComponent } from './home.component';
import { ShellLayoutComponent } from './shell-layout.component';

describe('ShellLayoutComponent', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: ShellLayoutComponent, children: [{ path: '', component: HomeComponent }] },
        ]),
      ],
    });
  });
  afterEach(() => sessionStorage.clear());

  it('shows the six navigation links and the brand', async () => {
    const harness = await RouterTestingHarness.create('/');
    const nav: HTMLElement = harness.routeNativeElement!.querySelector('nav')!;

    expect(Array.from(nav.querySelectorAll('a')).map((a) => a.textContent)).toEqual([
      'Home', 'Account', 'Movies', 'Booking', 'My tickets', 'Concessions',
    ]);
    expect(harness.routeNativeElement!.querySelector('.brand')?.textContent).toContain('CineSync');
  });

  it('marks the link of the current page as active', async () => {
    const harness = await RouterTestingHarness.create('/');
    const active = harness.routeNativeElement!.querySelectorAll('nav a.active');

    expect(active.length).toBe(1);
    expect(active[0].textContent).toBe('Home');
    expect(active[0].getAttribute('aria-current')).toBe('page');
  });

  it('offers sign out only while there is a session', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement!.querySelector('header button')).toBeNull();
  });
});
