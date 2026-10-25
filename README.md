# Rielia

Rielia is a planned project, task, and sprint workspace for people and agents,
intended for self-hosting and third-party use. This repository contains the
bilingual planning handoff and a **local development fixture**, with a Next.js
start page and NestJS liveness endpoint, plus an opt-in identity experiment.
Tasks, sprints, MCP, deployment, and a public service are not implemented.

Start with [START HERE / Lectura para agentes](docs/handoff/00-START-HERE.md).
It links the six plans in English and Spanish and explains their authority and
proposal status. Product scope is P01–P38 / US01–US25; the technical backlog is
T01–T35. [T00 is merged](https://github.com/Ljrr3045/rielia/pull/1); T02.0 prepares
the T02/T03 spikes and partial T04 tooling without completing those tickets.

## Read and contribute

| Document | Purpose |
| --- | --- |
| [Product](docs/handoff/01-product.en.md) | Users, capabilities, rules, stories, and internal priorities |
| [Application UI/UX](docs/handoff/04-ui-ux-development-guide.en.md) | Approved reference roles, responsive behavior, interaction criteria |
| [Architecture](docs/handoff/02-architecture-technical-plan.en.md) | Proposed stack, domain boundaries, identity, operations, ticket dependencies |
| [Branding](docs/handoff/03-branding.en.md) | Proposed identity, voice, and tokens |
| [Landing plan](docs/handoff/05-landing-page-plan.en.md) | Design guidance for later work; no implementation authorized by the plan |
| [Asset inventory](docs/handoff/06-brand-assets-guide.en.md) | Candidate assets and provenance; no final identity approval |
| [Progress and decisions](docs/development/progress.md) | T00/T01–T35 state, first wave, blockers, and PR evidence |
| [Technical fixture](docs/development/technical-fixture.md) | Exact toolchain, local commands, primary research, checks, and limitations |
| [Identity spike](docs/development/identity-spike.md) | Experimental auth/database, operator setup, same-origin logic, and bounded test evidence |
| [Contributing](CONTRIBUTING.md) / [Agent instructions](AGENTS.md) | Delivery, verification, review, and ownership rules |
| [Changelog](CHANGELOG.md) | Recorded repository changes; no application release yet |

The plans recommend a TypeScript monorepo with Next.js, NestJS, PostgreSQL,
Prisma, Better Auth, a durable worker, and local/remote MCP adapters. **Stack
confirmation and complete compatibility spikes are pending.** The fixture pins
and validates the Next/Nest/React/pnpm subset provisionally. T02.1 experimentally
integrates Better Auth with an identity-only Prisma/PostgreSQL schema and web
logic; its presentation is separately owned T02.2 work. Google/GitHub OAuth credentials and
callbacks must be configured per installation; none are included.

## Run the local fixture

Use Node **24.22.1 LTS**, pnpm **12.15.0**, and Python **3.9+** for the handoff
verifier. The first install needs network access; runtime smoke needs loopback ports.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test:identity
python3 scripts/verify-handoff.py
pnpm audit --audit-level=high
```

In separate terminals, run `pnpm dev:api` (API at `http://127.0.0.1:3001`)
and `pnpm dev:web` (web at `http://127.0.0.1:3000`). No environment file or
credentials are required. The web displays Spanish/English development status
and reports API unavailability honestly. API development builds once; restart
after source changes. See the [fixture guide](docs/development/technical-fixture.md)
for optional configuration, production startup, security override, and remaining checks.
The separate identity integration command needs Docker and uses an isolated,
disposable PostgreSQL container plus simulated provider HTTP. Real Google/GitHub
and staging HTTPS acceptance remain pending; see the identity guide.

## Working agreements

- One public launch, then continuous updates. B0–B3 describe internal work batches,
  not public access stages. Public launch remains gated by the planned checks.
- A personal MCP connection acts as its human: Luis through Cursor. An autonomous
  agent acts as its own Agent principal. Author, connection, and assignee are distinct.
- The landing and v0.1 assets remain planning/proposals. Rielia is a working name;
  no final logo, availability, performance, or usability claims are established.
- The coordinator requests Kody AI review for every ready head with a root PR
  comment exactly `@kody start-review` and alone merges PRs to `dev` after validation
  and feedback handling. See CONTRIBUTING before selecting work.

## Verify the imported handoff

Git and Python 3.9+ are enough for documentation-only checks. From a clone:

```sh
python3 scripts/verify-handoff.py
git diff --check
```

The verifier checks all 47 files against a SHA-256 inventory captured from the
original source, the asset manifest's 30 hashes/sizes, and local Markdown/HTML/SVG
file links. It makes no network requests and does not validate URL availability
or heading fragments. Optional direct source comparison is documented in
[the import record](docs/development/handoff-import.md).

The archive is preserved byte for byte, including bilingual filenames and Markdown
hard line breaks. Git attributes disable text conversion for that directory and
allow its original trailing spaces; new repository docs retain normal whitespace
checks. Original source files are never edited.

## License status

The user has not selected a repository license. Apache-2.0 is a proposal in the
handoff, not an adopted license; this change adds no LICENSE or licensing grant.
Track the decision and dependency/asset notices before a software release in
[progress](docs/development/progress.md).
