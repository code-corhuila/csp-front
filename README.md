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

## Per-environment configuration

The image is built once and the same image is promoted from one environment to the next. What
changes per environment comes from the container environment, which renders `config.json`,
`federation.manifest.json` and the CORS rule when the container starts. The container refuses to
start if a variable is missing. For `npm start`, `public/config.json` and
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
