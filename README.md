# csp-front

> Front-end shell: the container that owns the HTTP client, the session and the gateway URL

Part of the **Cinesync Platform** distributed system — team `cinesync-platform`, Group 1.
Governance and documentation live in [`csp-docs`](https://github.com/code-corhuila/csp-docs).

Angular 21 (zoneless, signals) · Native Federation 21 · Node 22 LTS or 24.

The shell owns everything that must exist **exactly once**: the single `HttpClient` with its
interceptor, the session and the gateway URL. Domain portals are loaded as routes inside the
shell's injector and never call `provideHttpClient()`.

## Visual identity

The tokens, buttons and logos in `src/styles.css` and `public/assets/logos/` come from `csp-docs/12-ux-ui/design-system.md` (HU-UI-001).

## Remotes and ports

The host runs on port `4200`. Each portal is registered in `public/federation.manifest.json`.

| Name | Portal | Port |
|---|---|---|
| `shell` (host) | `csp-front` | 4200 |
| `auth` | `csp-auth-portal` | 4201 |
| `booking` | `csp-booking-portal` | 4202 |
| `catalog` | `csp-catalog-portal` | 4203 |
| `concessions` | `csp-concessions-portal` | 4204 |
| `ticketing` | `csp-ticketing-portal` | 4205 |

The `catalog` portal is mounted at the root of the shell: `/` is its billboard, and its absolute
links (`/movies/:id`, `/showtimes/:id/seats`) resolve inside it. The shell has no home page of its own.

Signing in through the auth portal opens the protected routes while the portals show synthetic data.
The shell asks the session of the auth portal for the role (`SessionService.hasRole`), and the roles
open these areas (ADR-027):

| Route | Portal entry | Who |
|---|---|---|
| `/booking/snack-selection` | `concessions` `./snack-routes` | any signed-in person |
| `/booking`, `/dashboard` | `booking`, `ticketing` `./routes` | any signed-in person |
| `/admin/concessions` | `concessions` `./routes` | role `ADMIN` |
| `/admin/users` | `auth` `./admin-routes` | role `ADMIN` |

The development token of `/sign-in` counts as every role. Neither is real security yet: no token is
validated, and the role comes from the synthetic users of the auth portal.

A reload keeps the session: the shell connects the session of the auth portal in an application
initializer and, if the portal exposes `restore()`, waits for it before the first navigation, so the
route guards read the restored session (reloading `/admin/users` with a valid refresh token stays
there; without a session it goes to `/auth/login?returnUrl=...`). The wait is bounded by 10 seconds,
and a portal that is unreachable, fails to restore or has no `restore()` lets the shell start without
a session. The explicit "Cerrar sesión" button calls `SessionService.signOut()`, which asks the portal to close the
session on the server (`signOut()`, with the access token still set) and then clears everything, even if
that call fails; a portal without `signOut()` is just cleared. A `401` from the gateway still clears the
session and ends the one of the portal, without a server call.

When the session ends the shell moves the person away from a protected page: after the explicit sign out it
navigates to `/`, and when `isAuthenticated()` goes from true to false in any other way (a `401`, a failed
renewal in the auth portal) `ShellLayoutComponent` re-runs the guards on the current address, so a protected
route goes to `/auth/login?returnUrl=...` and a public one stays. It reacts only to that change, so a shell
that starts without a session (including a failed restore) does not navigate.

## Per-environment configuration

The image is built once and the same image is promoted from one environment to the next. What
changes per environment comes from the container environment, which renders `config.json`,
`federation.manifest.json` and the CORS rule when the container starts. The container refuses to
start if a variable is missing, or if `CORS_ALLOWED_ORIGIN_REGEX` does not start with `^` and end with `$`
(an unanchored regex would also allow longer origins). For `npm start`, `public/config.json` and
`public/federation.manifest.json` hold the development values. The shell reads `config.json`
before anything else and does not start without a `gatewayUrl`.

| Variable | Meaning | Development value |
|---|---|---|
| `GATEWAY_URL` | Gateway base URL used by the interceptor | `http://localhost:8000` |
| `AUTH_REMOTE_URL` | `remoteEntry.json` of the auth portal | `http://localhost:4201/remoteEntry.json` |
| `BOOKING_REMOTE_URL` | `remoteEntry.json` of the booking portal | `http://localhost:4202/remoteEntry.json` |
| `CATALOG_REMOTE_URL` | `remoteEntry.json` of the catalog portal | `http://localhost:4203/remoteEntry.json` |
| `CONCESSIONS_REMOTE_URL` | `remoteEntry.json` of the concessions portal | `http://localhost:4204/remoteEntry.json` |
| `TICKETING_REMOTE_URL` | `remoteEntry.json` of the ticketing portal | `http://localhost:4205/remoteEntry.json` |
| `CORS_ALLOWED_ORIGIN_REGEX` | Origins allowed to load `remoteEntry` and the manifest | `^http://localhost:420[0-5]$` |

## Commands

```bash
npm ci
npm start                                   # http://localhost:4200
npm run build
npm run lint
npm test -- --browsers=ChromeHeadless
```

`package-lock.json` is versioned: `npm ci` installs exactly what was tested.

## Branching

Three permanent branches. **None of them accepts a direct commit** — you enter through a child
branch and leave through a Pull Request.

```
develop  <--PR--  feat/... fix/... chore/...
qa       <--PR--  qa-promote/...
main     <--PR--  release/...  hotfix/...
```

Promotion happens **by re-application** (`git cherry-pick -x`), never by merging one permanent
branch into another: `merge develop -> qa` and `merge qa -> main` do not exist in this model.

`main` requires **1 approval from `ariel5253`**. On `develop` and `qa` the team sets its own review
rule.

Full policy: `00-governance/branching-policy.md` in `csp-docs`.
