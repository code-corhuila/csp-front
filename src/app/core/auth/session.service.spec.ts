import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PortalSession, SessionService } from './session.service';

class FakePortalSession implements PortalSession {
  private readonly open = signal(false);
  readonly isAuthenticated = this.open.asReadonly();
  readonly end = jasmine.createSpy('end').and.callFake(() => this.open.set(false));

  start(): void {
    this.open.set(true);
  }
}

describe('SessionService', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it('starts without a session', () => {
    const session = TestBed.inject(SessionService);

    expect(session.token()).toBeNull();
    expect(session.isAuthenticated()).toBeFalse();
  });

  it('keeps the token in memory and in sessionStorage once set', () => {
    const session = TestBed.inject(SessionService);

    session.set('abc');

    expect(session.token()).toBe('abc');
    expect(session.isAuthenticated()).toBeTrue();
    expect(sessionStorage.getItem('csp.session.token')).toBe('abc');
  });

  it('restores the token of a reloaded page', () => {
    sessionStorage.setItem('csp.session.token', 'restored');

    expect(TestBed.inject(SessionService).token()).toBe('restored');
  });

  it('has a session while the auth portal reports one, and follows it', async () => {
    const portal = new FakePortalSession();
    const session = TestBed.inject(SessionService);
    await session.connect(() => Promise.resolve(portal));

    expect(session.isAuthenticated()).toBeFalse();

    portal.start();

    expect(session.isAuthenticated()).toBeTrue();
    expect(session.token()).toBeNull();
  });

  it('keeps working with the token alone when the auth portal cannot be reached', async () => {
    spyOn(console, 'error');
    const session = TestBed.inject(SessionService);

    await session.connect(() => Promise.reject(new Error('down')));
    session.set('abc');

    expect(console.error).toHaveBeenCalled();
    expect(session.isAuthenticated()).toBeTrue();
  });

  it('forgets the token and ends the portal session on clear', async () => {
    const portal = new FakePortalSession();
    const session = TestBed.inject(SessionService);
    await session.connect(() => Promise.resolve(portal));
    portal.start();
    session.set('abc');

    session.clear();

    expect(portal.end).toHaveBeenCalled();
    expect(session.token()).toBeNull();
    expect(sessionStorage.getItem('csp.session.token')).toBeNull();
    expect(session.isAuthenticated()).toBeFalse();
  });

  it('clears without a connected portal', () => {
    const session = TestBed.inject(SessionService);
    session.set('abc');

    session.clear();

    expect(session.isAuthenticated()).toBeFalse();
  });
});
