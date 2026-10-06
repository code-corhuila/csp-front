import { TestBed } from '@angular/core/testing';
import { SessionService } from './session.service';

describe('SessionService', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it('starts without a session', () => {
    expect(TestBed.inject(SessionService).token()).toBeNull();
  });

  it('keeps the token in memory and in sessionStorage once set', () => {
    const session = TestBed.inject(SessionService);

    session.set('abc');

    expect(session.token()).toBe('abc');
    expect(sessionStorage.getItem('csp.session.token')).toBe('abc');
  });

  it('restores the token of a reloaded page', () => {
    sessionStorage.setItem('csp.session.token', 'restored');

    expect(TestBed.inject(SessionService).token()).toBe('restored');
  });

  it('forgets the token on clear', () => {
    const session = TestBed.inject(SessionService);
    session.set('abc');

    session.clear();

    expect(session.token()).toBeNull();
    expect(sessionStorage.getItem('csp.session.token')).toBeNull();
  });
});
