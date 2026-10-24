# Changelog

All notable changes of `csp-front` (the shell) are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the versions follow
[Semantic Versioning](https://semver.org/). A release is a `release/<version>` branch cut from `main` and filled with the commits of `qa`,
re-applied with `git cherry-pick -x` (numerals 6.2.3, 10 and 11 of the course norm); it reaches `main` by pull request, never by merging `qa`,
and is tagged `v<version>` once it is merged.

## [Unreleased]

### Fixed

- The container refuses to start when `CORS_ALLOWED_ORIGIN_REGEX` does not start with `^` and end with `$`, and the CI builds the image and checks the CORS rule: the allowed origin is answered, a foreign origin is not, and an empty or an unanchored value does not start (ADR-026 Amendment 2026-10-19, [csp-front#57](https://github.com/code-corhuila/csp-front/issues/57)).
- A protected page no longer stays on screen after the session ends (HU-AUTH-003, [csp-front#54](https://github.com/code-corhuila/csp-front/issues/54)): the explicit "Cerrar sesión" navigates to the start page, and a session that ends any other way (a `401`, a failed renewal in the auth portal) re-runs the route guards on the current address, so a protected route goes to `/auth/login?returnUrl=...` and a public one stays. Nothing navigates when the shell starts without a session.
- Everything a person sees in the shell is in Spanish: the navigation (Películas, Mi cuenta, Reservas, Mis boletas, Confitería, Cartelera, Salas, Roles de usuarios...), the page titles, the notice of a portal that is not available, the page not found, the development sign-in, the messages of `ApiError.userMessage`, the startup errors and `lang="es"` ([csp-front#47](https://github.com/code-corhuila/csp-front/issues/47)). The portals copy the `userMessage` texts in their `shell-contract.ts`.
- The sources of the Spanish copy are saved as UTF-8: fourteen files had been committed in Latin-1, so every accented text of the shell showed a replacement character (HU-AUTH-003, [csp-front#49](https://github.com/code-corhuila/csp-front/issues/49)).

### Added

- `ApiError.retryAfterSeconds` (optional) carries the `Retry-After` header of a rate-limited answer (HU-AUTH-005, [csp-front#65](https://github.com/code-corhuila/csp-front/issues/65)): `toApiError` sets it when the header is a whole number of seconds of at least 1 and ignores any other value. The Spanish text of the 429 is unchanged, and the portals that do not read the field keep compiling.
- Route `/profile` mounts the profile page of the auth portal behind `authGuard`, and the navigation shows a "Mi perfil" link to signed-in people (HU-AUTH-004). The shell matches the single segment `profile` without consuming it and loads the `./routes` entry of the auth portal, which declares `profile` itself, so the address of `12-ux-ui/navigation-map.md` stays `/profile`; `/auth/profile` keeps working. When the portal is down the shell shows its own notice.
- The "Cerrar sesión" button closes the session on the server first (HU-AUTH-003, [csp-front#51](https://github.com/code-corhuila/csp-front/issues/51)): `SessionService.signOut()` awaits the optional `signOut()` of the auth portal session and then clears the session even if the call fails. A `401` keeps ending the session locally through `end()`, without a server call.
- A reload keeps the session (HU-AUTH-003, [csp-front#51](https://github.com/code-corhuila/csp-front/issues/51)): `SessionService.connect` calls the optional `restore()` of the auth portal session inside the application initializer, so the first navigation and the route guards wait for it (at most 10 seconds). A portal without `restore()`, one that fails or times out, or an unreachable one lets the shell start without a session.
- Route `/admin/users` mounts the `./admin-routes` entry of the auth portal behind `roleGuard('ADMIN')`, and the navigation shows a "Roles de usuarios" link to administrators (HU-AUTH-003, [csp-front#43](https://github.com/code-corhuila/csp-front/issues/43)). It needs the portal entry `./admin-routes`; when the portal or the entry is missing the shell shows its own notice. The catalog administration matcher does not consume `/admin/users`.
- The shell sends the access token of the auth portal session as `Authorization: Bearer` on every `/api/` request (HU-AUTH-003, [csp-front#44](https://github.com/code-corhuila/csp-front/issues/44)). The portal exposes it with `accessToken()` on the session it shares through `./session`; the member is optional, so a portal that predates it still connects and the shell sends no token. The development token keeps working in development builds only (ADR-022).

### Fixed

- Container healthcheck calls `http://127.0.0.1/health` instead of `http://localhost/health`: inside the container `localhost` resolves first to `::1`, nginx listens on IPv4 only, and Docker reported the shell as `unhealthy` while it served traffic (TD-025).

## [2.0.0] - 2026-10-08

MVP 2 (Cut 2), first release of the shell. It hosts the portals of the five domains with Native Federation (ADR-022) and carries the
look of the design system (HU-UI-001, [csp-docs#1](https://github.com/code-corhuila/csp-docs/issues/1)).

### Added

- Angular 21 shell with Native Federation: scaffold, runtime, `package-lock.json`, container files (`deploy/Dockerfile`,
  `deploy/nginx.conf`, `deploy/compose.yml`) and the CI workflow.
- Runtime configuration per environment (ADR-026): `config.json`, `federation.manifest.json` and the CORS rule are rendered from the
  container environment when it starts (`GATEWAY_URL`, one `*_REMOTE_URL` per portal and `CORS_ALLOWED_ORIGIN_REGEX`); the container refuses to
  start without them. The shell reads the configuration before it starts the federation. ([#10](https://github.com/code-corhuila/csp-front/issues/10))
- Development sign-in with an access token: the page is mounted only in development, and the session service accepts and stores the token only in
  development builds, so a production build ignores a token written in the browser storage. ([#28](https://github.com/code-corhuila/csp-front/issues/28))
- Design system and mockup look: global tokens and button classes, favicon and logo, sticky header with the navigation, footer, and the 404
  and remote-unavailable pages. ([#11](https://github.com/code-corhuila/csp-front/issues/11))
- Portal mounts: the catalog billboard at `/` ([#12](https://github.com/code-corhuila/csp-front/issues/12)), `/auth`, `/booking`, `/dashboard`
  (ticketing), the customer step `/booking/snack-selection`, the administration `/admin/concessions`, the booking administration
  `/admin/reservations` ([#27](https://github.com/code-corhuila/csp-front/issues/27)) and the catalog administration `/admin/billboard`,
  `/admin/movies`, `/admin/rooms` and `/admin/reports` ([#30](https://github.com/code-corhuila/csp-front/issues/30)), the booking and the catalog ones through the entry `./admin-routes`
  of their remote (ADR-027).
- Session and role guard: a protected route without a session goes to `/auth/login?returnUrl=...`; the session is read from the
  `./session` module of the auth portal, and every administration address requires `ADMIN`; the navigation shows the administration links only to
  `ADMIN` and a Snacks link to signed-in people. (HU-FE-AUTH-001 and HU-FE-CONCESSIONS-001,
  [#15](https://github.com/code-corhuila/csp-front/issues/15))
- A portal that is down only disables its own area: the shell shows a remote-unavailable notice and the rest keeps working.
- Specs for the runtime configuration, the HTTP error mapping, the routes, the guards and the layout; 92 specs, 97.6% of lines.

### Known limits

- `/admin/reports` is mounted, but nothing links to it: the shell navigation has no Reports link and the menu of the catalog administration shows Reportes disabled, so it opens only by address. The screen is mock-only (no backend requirement in the navigation map).
- `deploy/nginx.conf` serves `index.html` without `Cache-Control`, so a browser can keep the previous shell after a deployment ([#35](https://github.com/code-corhuila/csp-front/issues/35)).
- The role guard and the session read from the auth portal are client-side checks that decide what the interface shows; they are not a security boundary until a backend enforces them.
- The Cut 2 portals work with synthetic data: the integration checks of this release ran without the gateway (`GATEWAY_URL`), so no call through it was exercised.
- The shell maps HTTP errors to its own `ApiError` (`src/app/core/http/api-error.ts`), but the contract shared between the shell and the portals
  is still open ([#1](https://github.com/code-corhuila/csp-front/issues/1)).
- A portal container must answer CORS for the shell (ADR-026, amended on 2026-10-08): `csp-auth-portal`, `csp-concessions-portal`, `csp-booking-portal` and `csp-ticketing-portal` (in `qa`) do in
  this cut; `csp-catalog-portal` answers `*` for any origin instead of the environment rule ([csp-catalog-portal#29](https://github.com/code-corhuila/csp-catalog-portal/issues/29)).
- No integration or contract tests against an API: none was exercised in this cut.
