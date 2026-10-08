# Changelog

All notable changes of `csp-front` (the shell) are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the versions follow
[Semantic Versioning](https://semver.org/). A release is a `release/<version>` branch cut from `main` and filled with the commits of `qa`,
re-applied with `git cherry-pick -x` (numerals 6.2.3, 10 and 11 of the course norm); it reaches `main` by pull request, never by merging `qa`,
and is tagged `v<version>` once it is merged.

## [Unreleased]

## [2.0.0] - 2026-10-08

MVP 2 (Cut 2), first release of the shell. It hosts the portals of the five domains with Native Federation (ADR-022) and carries the
look of the design system (HU-UI-001, [csp-docs#1](https://github.com/code-corhuila/csp-docs/issues/1)).

### Added

- Angular 21 shell with Native Federation: scaffold, runtime, `package-lock.json`, container files (`deploy/Dockerfile`,
  `deploy/nginx.conf`, `deploy/compose.yml`) and the CI workflow.
- Runtime configuration per environment (ADR-026): `config.json`, `federation.manifest.json` and the CORS rule are rendered from the
  container environment when it starts (`GATEWAY_URL`, one `*_REMOTE_URL` per portal and `CORS_ALLOWED_ORIGIN_REGEX`); the container refuses to
  start without them. The shell reads the configuration before it starts the federation. ([#10](https://github.com/code-corhuila/csp-front/issues/10))
- Development sign-in with an access token, mounted only in development.
- Design system and mockup look: global tokens and button classes, favicon and logo, sticky header with the navigation, footer, and the 404
  and remote-unavailable pages. ([#11](https://github.com/code-corhuila/csp-front/issues/11))
- Portal mounts: the catalog billboard at `/` ([#12](https://github.com/code-corhuila/csp-front/issues/12)), `/auth`, `/booking`, `/dashboard`
  (ticketing), the customer step `/booking/snack-selection` and the administration `/admin/concessions` (ADR-027).
- Session and role guard: a protected route without a session goes to `/auth/login?returnUrl=...`; the session is read from the
  `./session` module of the auth portal, and `/admin/concessions` requires `ADMIN`; the navigation shows the administration link only to
  `ADMIN` and a Snacks link to signed-in people. (HU-FE-AUTH-001 and HU-FE-CONCESSIONS-001,
  [#15](https://github.com/code-corhuila/csp-front/issues/15))
- A portal that is down only disables its own area: the shell shows a remote-unavailable notice and the rest keeps working.
- Specs for the runtime configuration, the HTTP error mapping, the routes, the guards and the layout; 67 specs, 97.3% of lines.

### Known limits

- The role guard and the session read from the auth portal are client-side checks that decide what the interface shows; they are not a security boundary until a backend enforces them.
- The Cut 2 portals work with synthetic data: the integration checks of this release ran without the gateway (`GATEWAY_URL`), so no call through it was exercised.
- The shell maps HTTP errors to its own `ApiError` (`src/app/core/http/api-error.ts`), but the contract shared between the shell and the portals
  is still open ([#1](https://github.com/code-corhuila/csp-front/issues/1)).
- A portal container must answer CORS for the shell (ADR-026, amended on 2026-10-08): `csp-auth-portal` and `csp-concessions-portal` do in
  this cut; `csp-booking-portal`, `csp-catalog-portal` and `csp-ticketing-portal` have their own issues.
- No integration or contract tests against an API: none was exercised in this cut.
