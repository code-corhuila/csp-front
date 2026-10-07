# csp-front

> Front-end shell: the container that owns the HTTP client, the session and the gateway URL

Part of the **Cinesync Platform** distributed system — team `cinesync-platform`, Group 1.
Governance and documentation live in [`csp-docs`](https://github.com/code-corhuila/csp-docs).

Angular 21 (zoneless, signals) · Native Federation 21 · Node 22 LTS or 24.

The shell owns everything that must exist **exactly once**: the single `HttpClient` with its
interceptor, the session and the gateway URL. Domain portals are loaded as routes inside the
shell's injector and never call `provideHttpClient()`.

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

The gateway URL (`http://localhost:8000`) is set only in `src/app/core/http/api.interceptor.ts`.

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
