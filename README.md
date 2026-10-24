# Rielia

Rielia is a planned project, task, and sprint workspace for people and agents,
intended for self-hosting and third-party use. This repository currently contains
the bilingual planning handoff and contribution/governance documents. **There is
no runnable application, installation procedure, or public service in this repo.**

Start with [START HERE / Lectura para agentes](docs/handoff/00-START-HERE.md).
It links the six plans in English and Spanish and explains their authority and
proposal status. Product scope is P01–P38 / US01–US25; the technical backlog is
T01–T35. T00 establishes this repository before implementation begins and repairs
the existing automated review's model environment scope so PR review can run.

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
| [Contributing](CONTRIBUTING.md) / [Agent instructions](AGENTS.md) | Delivery, verification, review, and ownership rules |
| [Changelog](CHANGELOG.md) | Recorded repository changes; no application release yet |

The plans recommend a TypeScript monorepo with Next.js, NestJS, PostgreSQL,
Prisma, Better Auth, a durable worker, and local/remote MCP adapters. **Stack
confirmation and compatibility spikes are pending.** No dependency versions or
runtime setup have been selected here. Google/GitHub OAuth credentials and
callbacks must be configured per installation; none are included.

## Working agreements

- One public launch, then continuous updates. B0–B3 describe internal work batches,
  not public access stages. Public launch remains gated by the planned checks.
- A personal MCP connection acts as its human: Luis through Cursor. An autonomous
  agent acts as its own Agent principal. Author, connection, and assignee are distinct.
- The landing and v0.1 assets remain planning/proposals. Rielia is a working name;
  no final logo, availability, performance, or usability claims are established.
- Only the coordinator merges PRs to `dev`. See CONTRIBUTING before selecting work.

## Verify the imported handoff

Git and Python 3.9+ are enough for the current documentation checks. From a clone:

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
