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

/** The pages of the auth portal that only make sense without a session. The recovery and reset pages are not here: their link must work for anyone. */
const GUEST_ONLY_PATHS = ['/auth', '/auth/login', '/auth/register'];

/** A signed-in person who opens the login or the register page goes to the start address instead of seeing the form again. */
export const guestGuard: CanActivateFn = (_route, state) => {
  const path = state.url.split(/[?#]/)[0].replace(/\/$/, '') || '/';
  return !GUEST_ONLY_PATHS.includes(path) ||
    !inject(SessionService).isAuthenticated() ||
    inject(Router).createUrlTree(['/']);
};
