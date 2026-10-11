import { TestBed } from '@angular/core/testing';
import { RemoteUnavailableComponent, remoteUnavailable } from './remote-unavailable.component';

describe('remoteUnavailable', () => {
  beforeEach(() => spyOn(console, 'error'));

  it('logs the cause and replaces every address of the portal by default', () => {
    const cause = new Error('down');

    const routes = remoteUnavailable('Booking', cause);

    expect(console.error).toHaveBeenCalledWith('portal "Booking" failed to load', cause);
    expect(routes).toEqual([
      { path: '**', pathMatch: undefined, component: RemoteUnavailableComponent, data: { portal: 'Booking' } },
    ]);
  });

  it('matches the exact address for a portal mounted at the root', () => {
    const [route] = remoteUnavailable('Movies', new Error('down'), '');

    expect(route.path).toBe('');
    expect(route.pathMatch).toBe('full');
  });
});

describe('RemoteUnavailableComponent', () => {
  it('names the portal and offers to try again', () => {
    const fixture = TestBed.createComponent(RemoteUnavailableComponent);
    fixture.componentRef.setInput('portal', 'Snacks');
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('[role="alert"] h1')?.textContent).toBe('Snacks is not available right now');
    expect(element.querySelector('button')?.textContent).toBe('Try again');
  });
});
