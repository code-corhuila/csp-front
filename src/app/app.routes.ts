import { loadRemoteModule } from '@angular-architects/native-federation';
import { isDevMode } from '@angular/core';
import { Route, Routes, UrlMatcher } from '@angular/router';
import { authGuard, roleGuard } from './core/auth/auth.guard';
import { remoteUnavailable } from './core/errors/remote-unavailable.component';

/** The administration areas of the catalog in `12-ux-ui/navigation-map.md`: /admin/billboard, /admin/movies, /admin/rooms. */
const CATALOG_ADMIN_AREAS = ['billboard', 'movies', 'rooms'];

/** Consumes `admin` when the next segment is a catalog area; the entry declares the area as its own first segment. */
export const catalogAdminMatcher: UrlMatcher = (segments) =>
  segments.length >= 2 && segments[0].path === 'admin' && CATALOG_ADMIN_AREAS.includes(segments[1].path)
    ? { consumed: [segments[0]] }
    : null;

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
  // The customer step of the purchase flow belongs to the concessions portal (ADR-027). Its address
  // is under /booking, so it is declared before the booking portal, which owns the prefix.
  {
    path: 'booking/snack-selection',
    title: 'Snacks',
    canActivate: [authGuard],
    loadChildren: () =>
      loadRemoteModule('concessions', './snack-routes')
        .then((m) => m.SNACK_ROUTES)
        .catch((err) => remoteUnavailable('Snacks', err)),
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
    canActivate: [roleGuard('ADMIN')],
    loadChildren: () =>
      loadRemoteModule('concessions', './routes')
        .then((m) => m.CONCESSIONS_ROUTES)
        .catch((err) => remoteUnavailable('Concessions', err)),
  },
  // The read-only administration view of the reservations is its own entry of the booking portal
  // (ADR-027), separate from the customer routes mounted at /booking.
  {
    path: 'admin/reservations',
    title: 'Reservations',
    canActivate: [roleGuard('ADMIN')],
    loadChildren: () =>
      loadRemoteModule('booking', './admin-routes')
        .then((m) => m.ADMIN_ROUTES)
        .catch((err) => remoteUnavailable('Reservations', err)),
  },
  // The catalog administration is one entry that declares billboard, movies and rooms; the shell
  // consumes only `admin` and only for those three areas, so any other /admin address stays a 404.
  {
    matcher: catalogAdminMatcher,
    title: 'Catalog administration',
    canActivate: [roleGuard('ADMIN')],
    loadChildren: () =>
      loadRemoteModule('catalog', './admin-routes')
        .then((m) => m.ADMIN_ROUTES)
        .catch((err) => remoteUnavailable('Catalog administration', err)),
  },
  // The auth portal sends people to /movies after signing in and the navigation map
  // calls it the catalog: it is the start address now.
  { path: 'movies', pathMatch: 'full', redirectTo: '' },
  // The catalog portal owns the start address (billboard) and its own absolute
  // links (/movies/:id, /showtimes/:id/seats), so it is mounted at the root and
  // must stay after every other prefix. When it is down only '/' shows the
  // notice; unknown addresses still fall through to the 404 page.
  {
    path: '',
    title: 'Movies',
    loadChildren: () =>
      loadRemoteModule('catalog', './routes')
        .then((m) => m.CATALOG_ROUTES)
        .catch((err) => remoteUnavailable('Movies', err, '')),
  },
  { path: '**', title: 'Page not found', loadComponent: () =>
      import('./layout/not-found.component').then((m) => m.NotFoundComponent) },
];
