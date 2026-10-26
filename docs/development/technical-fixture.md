# B0 technical fixture (T02.0)

T02.0 was merged in PR #2. This guide records its original bounded fixture;
subsequent [T02.1 identity work](identity-spike.md) adds opt-in identity storage,
protocol/state logic, and its own checks without completing full T02/T03/T04.
The subsequent [T03.0 local MCP experiment](local-mcp.md) adds a private stdio
liveness wrapper, SDK subprocess and independent official Inspector checks.
It completes only that bounded local transport portion; remote auth/discovery,
task catalog and full T03 remain open.

Status: a reversible development scaffold using the proposed Next.js + NestJS
stack. It supports the T02/T03 spikes and supplies **partial tooling for T04**.
It does not complete T02, T03, or T04 and does not ratify the complete stack.
The planning documents remain the source of product/architecture requirements.
It follows the merged [T00 onboarding PR #1](https://github.com/Ljrr3045/rielia/pull/1),
merge `8dd7c31f454c1989d017dbf7b40e6646112d2d2a`; the immutable handoff is unchanged.

## Delivered scope and boundaries

- `apps/web`: Next.js App Router and React, with a small Spanish/English
  development page. It checks API liveness on each request, with a two-second
  timeout and an honest unavailable state. No external fonts/assets/services.
- `apps/api`: NestJS with its Express adapter; `GET /api/v1/health` returns
  `{"status":"ok","service":"rielia-api"}` with `Cache-Control: no-store`.
  This is process liveness, not dependency readiness or product availability.
- `packages/contracts`: one public response type and an unknown-input guard;
  no framework, Nest, Prisma, database, or domain dependencies.
- Root TypeScript/ESLint configuration, pnpm workspace/lockfile, a production
  HTTP smoke script, and a CI workflow. There are no empty placeholder packages.
- Subsequent `packages/mcp-local`: diagnostic-only stdio client of the existing
  REST health route, without database/domain imports or a listening socket.

Web consumes public contracts and HTTP. Backend use cases and future domain
rules belong to the API; web must never import database/backend internals.
Lint rejects the named backend/database imports and Nest/Prisma in contracts;
this is a narrow guardrail, not a complete dependency architecture verifier.

Traceability: architecture §1.3–1.5 and T02–T04; product's ES/EN/responsive
direction; branding §1.4–1.7 and UI guide UX07/UX09 for this development surface.
No task/board reference screen is implemented. Proposed tokens are used with a
system font; the working name, colors, and identity remain proposals. No brand
asset is published and no license decision is made by this change.

## Exact toolchain and research

Verified against official documentation and npm registry metadata on
**2026-10-24**. Every direct external dependency uses an exact version; the
lockfile fixes transitive resolutions and integrity values.

| Component | Pin | Evidence and compatibility decision |
| --- | --- | --- |
| Node.js | 24.22.1 LTS | [Release](https://github.com/nodejs/node/releases/tag/v24.22.1), [release schedule](https://github.com/nodejs/Release), [October security release](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases). The supported 24.x LTS line is used instead of Current 26.x. |
| pnpm | 12.15.0 | [Registry](https://registry.npmjs.org/pnpm/12.15.0), [Node/platform compatibility](https://pnpm.io/installation). `packageManager` pins pnpm; [devEngines.runtime](https://pnpm.io/package_json#devenginesruntime) pins/downloads Node and records its checksum in the lockfile. |
| Next.js | 16.4.3 | [Registry](https://registry.npmjs.org/next/16.4.3), [installation requirements](https://nextjs.org/docs/app/getting-started/installation), [October security update](https://nextjs.org/blog/nextjs-security-update-october-14-2026). Node ≥20.9 and React 19 satisfy its declared peers. Pin exceeds the 16.4.1 security patch floor. |
| React / React DOM | 19.3.1 / 19.3.1 | [React registry](https://registry.npmjs.org/react/19.3.1), [React DOM registry](https://registry.npmjs.org/react-dom/19.3.1). Matching versions satisfy React DOM's React peer. |
| Nest common/core/platform-express | 12.2.0 | [Core registry](https://registry.npmjs.org/@nestjs/core/12.2.0), [adapter registry](https://registry.npmjs.org/@nestjs/platform-express/12.2.0), [v12 migration guide](https://docs.nestjs.com/migration-guide). ESM API, NodeNext resolution, and TS 6 avoid a CJS interoperability workaround. Adapter includes Express 5.3.0. |
| TypeScript | 6.0.3 | [Registry](https://registry.npmjs.org/typescript/6.0.3), [typescript-eslint compatibility](https://typescript-eslint.io/users/dependency-versions/). TS 7 exists but is outside the lint parser's supported `<6.1.0` range. `strict`, unchecked-index and exact-optional checks are enabled; library checks remain enabled. Web includes ES2024 library declarations required by Next. |
| ESLint / JS rules | 10.13.0 / 10.0.1 | [ESLint registry](https://registry.npmjs.org/eslint/10.13.0), [support policy](https://eslint.org/version-support/). ESLint 9 is EOL. Use official `@next/eslint-plugin-next` 16.4.3 directly: the aggregate preset currently brings plugins whose peers stop at ESLint 9. |
| typescript-eslint | 8.72.0 | [Registry](https://registry.npmjs.org/typescript-eslint/8.72.0); accepts ESLint 10 and TS 6. No ignored peer requirements. |
| Supporting dependencies | reflect-metadata 0.2.2; rxjs 7.8.2; @types/node 24.19.2; @types/react and @types/react-dom 19.3.0 | Runtime peers required by Nest and matching type packages. Their exact pins are in the manifests and lockfile. |

Security research also found [GHSA-q7qp-rjg7-q26m](https://github.com/expressjs/multer/security/advisories/GHSA-q7qp-rjg7-q26m):
Nest's adapter pins affected Multer 2.4.0. A scoped pnpm override pins **2.5.0**,
the maintainer's patch. The fixture exposes no upload route; remove the override
when Nest carries a patched dependency and revalidate. The audit is a dated
registry check, not a guarantee against unknown issues.

## Reproduce locally

Prerequisites: Node **24.22.1**, pnpm **12.15.0**, network access for the first
install, and permission to listen on loopback. Install the exact pnpm release
through your preferred tool manager (for example `npm install --global
pnpm@12.15.0`). `.node-version` also configures CI. pnpm's pinned runtime makes
workspace scripts use Node 24.22.1 even if the bootstrap Node differs.

From the repository root:

```sh
pnpm install --frozen-lockfile
python3 scripts/verify-handoff.py
pnpm lint
pnpm test:smoke
pnpm typecheck
pnpm build
pnpm smoke
# The same checks, in order:
pnpm check
pnpm audit --audit-level=high
```

Typecheck builds contracts first and generates Next route types before `tsc`;
it works from a fresh checkout. Build follows workspace dependency order and
uses the documented Next Webpack build option. `pnpm smoke` needs built output.
Dependency lifecycle scripts were not required/approved by the original scaffold;
T02.1 explicitly allows only its pinned Prisma tooling scripts (see the identity guide). pnpm
will fail if a future dependency requires a build-script decision.

For local work, use two terminals:

```sh
# API at http://127.0.0.1:3001; builds TypeScript once, then starts Nest.
pnpm dev:api
# Web at http://127.0.0.1:3000; Next development server.
pnpm dev:web
```

Restart `dev:api` after API source changes; no additional watch runner is
installed. The scripts also build contracts. Rebuild/restart after contract
changes. To run production builds manually:

```sh
pnpm --filter @rielia/api start
pnpm --filter @rielia/web start
```

No environment files are required. `.env.example` lists optional values:
put API `HOST`/`PORT` in `apps/api/.env`, and the server-only `API_BASE_URL` in
`apps/web/.env.local`. Do not copy API port overrides to the web environment.
For another web port use `pnpm --filter @rielia/web dev --port 3100`.
Changing the API port requires updating `API_BASE_URL` for the web. No
`NEXT_PUBLIC_` variable, secret, credential, database, or OAuth setup is needed.

## Validation and next work

The smoke script selects temporary free loopback ports, starts the compiled
API and production Next server, verifies the exact JSON response, content
types, no-store header, missing task route, ES/EN HTML and live API status,
then stops the API and verifies web's unavailable state. It tears down its
processes in `finally`, including on assertion/startup failures. It does not
use or stop an existing developer server.

CI verifies handoff integrity/local links, installs the frozen lockfile on Linux
with the pinned toolchain, runs `pnpm check`, and fails on high/critical registry
advisories. Kody review follows the active repository governance; the retired
OpenCode workflow is absent. This fixture does not implement
the full architecture CI/release/security program.

CI action pins were resolved from each official repository's `v6`/`v4` refs
(including dereferencing pnpm's annotated tag), following
[GitHub's immutable SHA guidance](https://docs.github.com/en/actions/reference/security/secure-use#using-third-party-actions):
[checkout](https://github.com/actions/checkout/commit/d23441a48e516b6c34aea4fa41551a30e30af803),
[setup-node](https://github.com/actions/setup-node/commit/249970729cb0ef3589644e2896645e5dc5ba9c38),
and [pnpm action-setup](https://github.com/pnpm/action-setup/commit/b906affcce14559ad1aafd4ab0e942779e9f58b1).
The version comments remain readable; runtime/dependency pins and CI permissions
are unchanged.

`pnpm test:smoke` uses Node's built-in test runner and the actual process helper.
It starts a live sibling, attempts a spawn into a nonexistent working directory,
and invokes cleanup before the asynchronous spawn-error event. The check failed
before PID/wait guards and passes after them, preserving the original `ENOENT`
and confirming the live sibling exits. This is defensive lifecycle hardening;
it does not claim the normal production HTTP smoke reproduced a startup defect.
Guarding only `signal` would still risk waiting for an `exit` from a process
that never spawned, so `stopProcess` also returns before installing that wait.

Local evidence on 2026-10-24: `pnpm check` passed with Node 24.22.1 and pnpm
12.15.0 (lint, all strict typechecks, contracts/API/web production builds, and
production HTTP smoke). `pnpm audit --audit-level=high` reported no known
vulnerabilities after the Multer override. A separate temporary copy without
`node_modules`, `dist`, or `.next` passed `pnpm install --frozen-lockfile` and the
complete `pnpm check` pipeline.
Sandbox-denied initial network/port attempts were rerun with approved access;
those denied attempts are not counted as passes.

Orca browser DOM checks found one `main`, no horizontal overflow at 320, 375,
768, 1440, and 812×375 CSS-pixel viewports, and no overflow with 200% root text
at 375 px. Buttons measured at least 50 px tall. Light emulation reported
`prefers-color-scheme: dark = false` and background `rgb(248, 250, 252)`.
Capture limitation: the background worktree's screenshots stayed dark and
full-page stitching repeated the top segment; they are not accepted as light
theme or complete-page visual evidence. Orca's Tab events did not move focus,
so native keyboard traversal is still unverified. The page uses a skip link,
focusable main target, native submit button, visible keyboard-focus CSS, and
semantic language/heading structure. Manual foreground-browser/screen-reader
review and trustworthy light/dark captures remain required; no AA compliance
claim is made.

PR/latest-head Kody review results are recorded in active progress and PR evidence.

Still required: T02 real Google/GitHub flows (including private email), web/API
sessions, logout, expiry, proxy/HTTPS callbacks and staging evidence; T03 real
remote discovery/auth and product-client evidence beyond the bounded local
MCP matrix linked above; T04 database/migration, durable
queue/worker, image and restart acceptance. No OAuth verification, identity,
schema, DB, worker, product MCP catalog, sprint, product workflow, Docker deployment, throughput,
accessibility audit, or launch readiness is claimed here. Stack ratification
and all those acceptance criteria remain open.
