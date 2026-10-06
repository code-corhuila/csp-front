import { loadRemoteModule } from '@angular-architects/native-federation';
import { isDevMode } from '@angular/core';
import { Route, Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { remoteUnavailable } from './core/errors/remote-unavailable.component';

/**
 * The paste-a-token sign-in exists only in development (ADR-022); any other
 * build sends the same address to the identity portal's login.
 */
export const signInRoute = (devMode: boolean): Route =>
  devMode
    ? { path: 'sign-in', title: 'Sign in', loadComponent: () =>
        import('./core/auth/sign-in.component').then((m) => m.SignInComponent) }
    : { path: 'sign-in', redirectTo: 'auth/login' };

/**
 * One entry per domain portal, mounted where csp-docs/12-ux-ui/navigation-map.md
 * places it. Each portal exposes its routes as './routes'.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', title: 'Home', loadComponent: () =>
      import('./layout/home.component').then((m) => m.HomeComponent) },
  signInRoute(isDevMode()),
  // A portal that cannot be loaded — down, or being deployed — shows its own
  // error; the shell and every other portal keep working.
  {
    path: 'auth',
    title: 'Authentication',
    loadChildren: () =>
      loadRemoteModule('auth', './routes')
        .then((m) => m.AUTH_ROUTES)
        .catch((err) => remoteUnavailable('Authentication', err)),
  },
  {
    path: 'movies',
    title: 'Movies',
    loadChildren: () =>
      loadRemoteModule('catalog', './routes')
        .then((m) => m.CATALOG_ROUTES)
        .catch((err) => remoteUnavailable('Movies', err)),
  },
  {
    path: 'booking',
    title: 'Booking',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemoteModule('booking', './routes')
        .then((m) => m.BOOKING_ROUTES)
        .catch((err) => remoteUnavailable('Booking', err)),
  },
  {
    path: 'dashboard',
    title: 'Dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemoteModule('ticketing', './routes')
        .then((m) => m.TICKETING_ROUTES)
        .catch((err) => remoteUnavailable('Tickets', err)),
  },
  {
    path: 'admin/concessions',
    title: 'Concessions',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemoteModule('concessions', './routes')
        .then((m) => m.CONCESSIONS_ROUTES)
        .catch((err) => remoteUnavailable('Concessions', err)),
  },
  { path: '**', title: 'Page not found', loadComponent: () =>
      import('./layout/not-found.component').then((m) => m.NotFoundComponent) },
];
