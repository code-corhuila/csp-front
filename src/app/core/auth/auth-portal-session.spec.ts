import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { registerFakeRemote } from '../../testing/fake-remote';
import { loadAuthPortalSession } from './auth-portal-session';

describe('loadAuthPortalSession', () => {
  it('fails when the auth portal cannot be loaded, so the session service keeps the token alone', async () => {
    const load = loadAuthPortalSession(Injector.create({ providers: [] }));

    await expectAsync(load()).toBeRejected();
  });

  it('returns the instance of the session service that the root injector holds', async () => {
    const unregister = registerFakeRemote('auth', './session', `
      export class AuthSessionService {
        static ɵprov = { token: this, providedIn: 'root', factory: () => new AuthSessionService() };
      }`);

    try {
      const session = await loadAuthPortalSession(TestBed.inject(Injector))();

      expect(session.constructor.name).toBe('AuthSessionService');
      expect(await loadAuthPortalSession(TestBed.inject(Injector))()).toBe(session);
    } finally {
      unregister();
    }
  });
});
