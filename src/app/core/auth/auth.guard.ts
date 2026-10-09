import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from './session.service';

/** Without a session, the protected route sends to the auth login and comes back after. */
export const authGuard: CanActivateFn = (_route, state) =>
  inject(SessionService).isAuthenticated() ||
  inject(Router).createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });

/**
 * A role the person must have. Anonymous visitors go to the auth login and come back; a signed-in
 * person without the role goes to the start address.
 */
export const roleGuard =
  (role: string): CanActivateFn =>
  (route, state) => {
    const allowed = authGuard(route, state);
    if (allowed !== true) {
      return allowed;
    }
    return inject(SessionService).hasRole(role) || inject(Router).createUrlTree(['/']);
  };
