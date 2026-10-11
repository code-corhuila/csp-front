import { loadRemoteModule } from '@angular-architects/native-federation';
import { Injector, Type } from '@angular/core';
import { PortalSession } from './session.service';

/**
 * The class lives in the auth bundle, but Angular shares one root injector with the
 * shell, so asking it here returns the very instance the login screen writes to.
 */
export const loadAuthPortalSession = (injector: Injector) => (): Promise<PortalSession> =>
  loadRemoteModule<{ AuthSessionService: Type<PortalSession> }>('auth', './session').then((m) =>
    injector.get(m.AuthSessionService),
  );
