import { loadRemoteModule } from '@angular-architects/native-federation';
import { isDevMode } from '@angular/core';
import { Route, Routes, UrlMatcher } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth/auth.guard';
import { remoteUnavailable } from './core/errors/remote-unavailable.component';

/** The administration areas of the catalog in `12-ux-ui/navigation-map.md`: /admin/billboard, /admin/movies, /admin/rooms, /admin/reports. */
const CATALOG_ADMIN_AREAS = ['billboard', 'movies', 'rooms', 'reports'];

/** Consumes `admin` when the next segment is a catalog area; the entry declares the area as its own first segment. */
export const catalogAdminMatcher: UrlMatcher = (segments) =>
  segments.length >= 2 && segments[0].path === 'admin' && CATALOG_ADMIN_AREAS.includes(segments[1].path)
    ? { consumed: [segments[0]] }
    : null;

/**
 * Matches `/profile` without consuming it: the auth portal declares `profile` as a route of its own `./routes`
 * entry, so the address of the navigation map stays `/profile` and the portal keeps the page.
 */
export const profileMatcher: UrlMatcher = (segments) =>
  segments.length === 1 && segments[0].path === 'profile' ? { consumed: [] } : null;

/**
 * The paste-a-token sign-in exists only in development (ADR-022); any other
 * build sends the same address to the identity portal's login.
 */
export const signInRoute = (devMode: boolean): Route =>
  devMode
    ? { path: 'sign-in', title: 'Iniciar sesión', loadComponent: () =>
        import('./core/auth/sign-in.component').then((m) => m.SignInComponent) }
    : { path: 'sign-in', redirectTo: 'auth/login' };

/**
 * Guarded routes run their guards again when the same address is navigated to again, which is how the shell
 * moves the person away from a protected page when the session ends (the default only reruns them when the
 * route parameters change).
 */
const RECHECKED_ON_SAME_URL: Pick<Route, 'runGuardsAndResolvers'> = { runGuardsAndResolvers: 'always' };

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
    title: 'Autenticación',
    canActivate: [guestGuard],
    ...RECHECKED_ON_SAME_URL,
    loadChildren: () =>
      loadRemoteModule('auth', './routes')
        .then((m) => m.AUTH_ROUTES)
        .catch((err) => remoteUnavailable('Autenticación', err)),
  },
  // The customer step of the purchase flow belongs to the concessions portal (ADR-027). Its address
  // is under /booking, so it is declared before the booking portal, which owns the prefix.
  {
    path: 'booking/snack-selection',
    title: 'Confitería',
    canActivate: [authGuard],
    ...RECHECKED_ON_SAME_URL,
    loadChildren: () =>
      loadRemoteModule('concessions', './snack-routes')
        .then((m) => m.SNACK_ROUTES)
        .catch((err) => remoteUnavailable('Confitería', err)),
  },
  {
    path: 'booking',
    title: 'Reservas',
    canActivate: [authGuard],
    ...RECHECKED_ON_SAME_URL,
    loadChildren: () =>
      loadRemoteModule('booking', './routes')
        .then((m) => m.BOOKING_ROUTES)
        .catch((err) => remoteUnavailable('Reservas', err)),
  },
  {
    path: 'dashboard',
    title: 'Mis boletas',
    canActivate: [authGuard],
    ...RECHECKED_ON_SAME_URL,
    loadChildren: () =>
      loadRemoteModule('ticketing', './routes')
        .then((m) => m.TICKETING_ROUTES)
        .catch((err) => remoteUnavailable('Mis boletas', err)),
  },
  {
    path: 'admin/concessions',
    title: 'Concesiones',
    canActivate: [roleGuard('ADMIN')],
    ...RECHECKED_ON_SAME_URL,
    loadChildren: () =>
      loadRemoteModule('concessions', './routes')
        .then((m) => m.CONCESSIONS_ROUTES)
        .catch((err) => remoteUnavailable('Concesiones', err)),
  },
  // The read-only administration view of the reservations is its own entry of the booking portal
  // (ADR-027), separate from the customer routes mounted at /booking.
  {
    path: 'admin/reservations',
    title: 'Todas las reservas',
    canActivate: [roleGuard('ADMIN')],
    ...RECHECKED_ON_SAME_URL,
    loadChildren: () =>
      loadRemoteModule('booking', './admin-routes')
        .then((m) => m.ADMIN_ROUTES)
        .catch((err) => remoteUnavailable('Todas las reservas', err)),
  },
  // The administration of the user roles is its own entry of the auth portal, separate from the
  // sign-in and account routes mounted at /auth.
  {
    path: 'admin/users',
    title: 'Roles de usuarios',
    canActivate: [roleGuard('ADMIN')],
    ...RECHECKED_ON_SAME_URL,
    loadChildren: () =>
      loadRemoteModule('auth', './admin-routes')
        .then((m) => m.ADMIN_ROUTES)
        .catch((err) => remoteUnavailable('Roles de usuarios', err)),
  },
  // The catalog administration is one entry that declares billboard, movies and rooms; the shell
  // consumes only `admin` and only for those three areas, so any other /admin address stays a 404.
  {
    matcher: catalogAdminMatcher,
    title: 'Administración del catálogo',
    canActivate: [roleGuard('ADMIN')],
    ...RECHECKED_ON_SAME_URL,
    loadChildren: () =>
      loadRemoteModule('catalog', './admin-routes')
        .then((m) => m.ADMIN_ROUTES)
        .catch((err) => remoteUnavailable('Administración del catálogo', err)),
  },
  // The profile page is declared by the auth portal inside the same entry as login and register, so the
  // shell consumes nothing and lets the portal match `profile`; the guard protects the page (navigation map).
  {
    matcher: profileMatcher,
    title: 'Mi perfil',
    canActivate: [authGuard],
    ...RECHECKED_ON_SAME_URL,
    loadChildren: () =>
      loadRemoteModule('auth', './routes')
        .then((m) => m.AUTH_ROUTES)
        .catch((err) => remoteUnavailable('Mi perfil', err)),
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
    title: 'Películas',
    loadChildren: () =>
      loadRemoteModule('catalog', './routes')
        .then((m) => m.CATALOG_ROUTES)
        .catch((err) => remoteUnavailable('Películas', err, '')),
  },
  { path: '**', title: 'Página no encontrada', loadComponent: () =>
      import('./layout/not-found.component').then((m) => m.NotFoundComponent) },
];
