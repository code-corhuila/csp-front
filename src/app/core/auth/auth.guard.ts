import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from './session.service';

/** Without a session, the protected route sends to sign-in and comes back after. */
export const authGuard: CanActivateFn = (_route, state) =>
  inject(SessionService).token() !== null ||
  inject(Router).createUrlTree(['/sign-in'], { queryParams: { returnUrl: state.url } });
