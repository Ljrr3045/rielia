# Contributing to Rielia

Read [START HERE](docs/handoff/00-START-HERE.md), [AGENTS.md](AGENTS.md), and
[current progress](docs/development/progress.md) before selecting work. Either
handoff language is sufficient. T00 is merged; T02.0 supplies a small runnable
technical fixture for the T02/T03 spikes and partial T04 tooling. Full T01–T35
acceptance and deployment remain future work. Use the real commands and limits in
the [fixture guide](docs/development/technical-fixture.md); do not invent tests or
claim that health checks verify OAuth, data, or product functionality.
T02.1 adds an opt-in backend identity experiment; use the
[identity guide](docs/development/identity-spike.md) for configuration and its
bounded real-library/database evidence. Browser protocol/state logic and T02.2
presentation are merged in PRs #3/#4; real OAuth/HTTPS acceptance is still open.
The [T01 prototype contract](docs/development/task-prototype.md) describes the
fictional memory-only adapter for separately owned presentation. It is not a
production domain implementation or full T01/B0 acceptance.
The [local MCP guide](docs/development/local-mcp.md) documents T03.0/B0's private
experimental stdio liveness wrapper, exact pins, terminal-client evidence and
explicit configuration. It completes no task catalog, authorization or remote OAuth work.
The [local runtime guide](docs/development/local-runtime.md) describes T04.0/B0's
opt-in Docker preparation, migration gate, readiness and persistent diagnostic
job. It preserves default HTTP identity disablement and completes no full T04 or
production deployment acceptance.

## Select a bounded change

Agree the ticket and ownership with the coordinator. Record the internal batch,
T/P/US requirements, applicable UXR/UX or LPR/S/LP criteria, dependencies, acceptance,
and exclusions. The [2026-11-05 quality roadmap](docs/development/development-quality-roadmap.md)
adds **T36 → T37 → T11 → remaining work under existing dependencies**. Complete
the bounded engineering quality work and then UI redesign before new sprint work.
The source dependency graph remains: T35 follows T04 and precedes T05/T06/T12.
Read the scoped [web](apps/web/AGENTS.md) or [API](apps/api/AGENTS.md) developer
rules before changing those apps. These rules describe incremental migration
targets. Delivered [tooling](docs/development/quality-tooling.md),
[unit gates](docs/development/unit-coverage.md) and scoped frontend/backend owners
are consolidated in the [stable contract](docs/development/t36-stable-ui-contract.md).
T36.1–T36.6 were accepted for the bounded scope in
[PR #44](https://github.com/Ljrr3045/rielia/pull/44); owned coverage/coupling/CSS
debt remains explicit. T37 started with the user's 2026-11-11 authorization;
no universal architecture migration or completed redesign is claimed.
Preparing these contribution documents does not
complete T16 or its real-project validation.

The [2026-10-27 decision](docs/development/stack-validation-decisions.md) approves
the current stack except Express. The [completed adapter migration](docs/development/nest-http-adapter.md)
uses the official Nest NodeAdapter with matching common/core/platform-node 12.3.2.
Preserve Nest controllers/providers/guards, identity/security parity and Express
absence throughout the actual API/worker/migration closure, including optional
peers. `pnpm check:backend-closure` follows installed Node resolution; runtime
smoke also inspects the complete deployed stores. The separately delivered
[T35.0 foundations](docs/development/principal-foundations.md) add backend-local
principals, minimal workspace/membership policy and verified execution after that
migration; full T35/T05/T06/T12 remain incomplete.

Real provider/HTTPS/staging, staging-dependent remote OAuth discovery and
real-project/user acceptance remain OPEN/DEFERRED until an advanced end-to-end
product slice and user scheduling. They do not immediately block authorized local
implementation; do not ask for credentials/staging now or report missing checks
as passed. Preserve source dependencies and public-launch acceptance. Applicable
automated unit/integration/security/local Docker checks, CI and branch-specific
review gates remain required. License and brand/final landing design remain undecided. The
[2026-10-29 project policy](docs/development/project-access.md) ratifies automatic
private content access for active human workspace owner/admin, with current grant
ceilings and human-web-only privacy administration; imported proposals alone are
not implementation instructions.

## Branch and checkout

Use your own worktree based on `origin/dev` and a focused branch. Do not share a
worker checkout, edit another worker's files, or change the source handoff outside
the repo.

Name new branches `feat/**`, `fix/**`, `refactor/**`, `docs/**`, `chore/**` or
`test/**` according to purpose, without username prefixes. Worktree names should
correspond. If Orca adds a username prefix, correct it before development.

With ordinary Git, a contributor can start a clone as follows:

```sh
git clone https://github.com/Ljrr3045/rielia.git
cd rielia
git fetch origin
git switch --create docs/my-change origin/dev
```

Inside Orca, use its worktree workflow. If RTK guidance is active, prefix every
shell command with `rtk` (`rtk proxy` for unsupported commands). Commands in this
document use ordinary tools so contributors do not need Orca or RTK.

For supervised agent development, the user's 2026-11-05 rule is Codex
`gpt-6-astra` effort `high` for UI/UX presentation, superseding OpenCode Go/DeepSeek
for future work; all logic uses
Codex `gpt-6.1-sol` `xhigh`, including frontend auth/session/data hooks, proxies,
and functional tests. SOL also owns T36's behavior-preserving structural extraction
of frontend/backend code while retaining appearance; Astra owns T37 visual and
interaction redesign after T36 acceptance. Verify the effective configuration and isolate each
worker's checkout. See the [model decision and verification limits](docs/development/frontend-agent.md).
This remains separate from Kilo Code Reviews' external review role.
The user's 2026-11-06 rule also requires every subsequent coordinator-launched
agent to use **Permissions: Approve for me**, verified from the effective session
before task execution. Preserve workspace-write/on-request boundaries and report
unavailable verification; do not silently substitute Full Access or change global
configuration. See the same decision guide for exact evidence and limits.

For unit work, explicitly install the isolated dev-tool graph with
`pnpm --dir scripts/unit/tools install --frozen-lockfile`, then run
`pnpm unit:coverage` and `pnpm test:unit-infrastructure` in addition to applicable
existing checks. This separate install prevents test tooling from entering deployed
optional-peer graphs. [The unit guide](docs/development/unit-coverage.md) documents
scope commands, source accounting, numerical gates, retained advisories and artifacts.

The user retired OpenCode PR review, including the inherited workflow and the
abandoned replacement integration. Do not restore, repair, or invoke either.
Native Kilo Code Reviews replaces Kody as the selected external reviewer; its
[setup status and evidence requirements](docs/development/kilo-review.md) distinguish
verified behavior from pending configuration. Preserve historical Kody/OpenCode
evidence and historical frontend model receipts; the current
[frontend model decision](docs/development/frontend-agent.md) supersedes older
development-role assignments, including older review-guide introductions. Every legacy
Kody trigger or requirement to use Kody for future reviews in older development guides is obsolete,
even when phrased as an instruction; the current Kilo policy governs all new
changes. This supersedes review governance only and preserves historical evidence
and runtime guidance. Do not modify secrets, introduce personal tokens, or bypass
review. Treat `docs/handoff/` as an
immutable import, including its asset manifest and file inventory. Record later
ratifications/corrections separately under `docs/development/` and link the
affected source section. Never modify a baseline just to make a hash check pass.

T36 now reuses ESLint with exact Prettier/Husky/commitlint/lint-staged pins,
read-only index-content pre-commit checks, commit-msg validation and independent
CI formatting/prospective commit enforcement. In linked worktrees use
`git -c core.hooksPath=.husky commit`; prepare does not change shared Git config.
See the [commands, adoption inventory, policy and limitations](docs/development/quality-tooling.md).
Preserve immutable/generated exclusions and avoid broad formatting churn.
T37.1 prepares the three requested [frontend-local skills](docs/development/frontend-skills.md),
with pinned complete resources/notices and offline integrity checks. Start fresh
frontend sessions from `apps/web` and observe local/global duplicate-name
resolution before claiming discovery. The separate
[Astra inventory](docs/development/t37-ui-inventory.md) and
[direction proposal](docs/development/t37-design-direction.md) are integrated
research, not redesign implementation or acceptance.
Product/UX/brand authority governs their suggestions. Later T30–T34 uses the
[Astro landing/narrative decision](docs/development/landing-direction.md), not a
new priority ticket or permission to scaffold/publish now.

Behavior-focused frontend/backend units, separate maintained-source coverage
reports and numerical CI gates are delivered. Frontend suites exercise pure
logic, controllers, real-hook lifecycle and appropriate component interactions;
backend suites exercise domain/application decisions with isolated boundaries.
The [unit guide](docs/development/unit-coverage.md) records providers, source/test
scope, baselines, exclusions and bounded artifacts. Keep unexecuted maintained
source and type-only N/A inputs in supported line/branch/function/statement
accounting. Source/provider changes need reviewed comparable migrations.

Do not lower coverage, remove meaningful tests/source, add ignores or weaken
gates to make builds green. Preserve critical negative/error paths and real
PostgreSQL/integration/security/runtime checks. New or changed behavior needs
meaningful unit/regression cases; bug fixes reproduce regressions and extraction
retains existing tests. Explain prose/styling/generated-only unit exceptions and
retain applicable checks. These requirements continue after T36 acceptance.

## Validate and record evidence

The [T10.0 discovery guide](docs/development/task-discovery.md) records search,
strict-assignee My tasks, session SSE bounds and presentation integration. Focused
client/proxy/recovery checks run in `pnpm test:projects:logic` and `pnpm check`;
real search/policy/migration/commit-order/replay/revocation and backpressure checks
run in `pnpm test:identity`. The local QA fixture adds `--discovery` for populated
search/My tasks and real Nest→Next two-session streaming, rollback, heartbeat,
private-access removal and abort cleanup. The [T10.1 presentation guide](docs/development/task-discovery-ui.md)
records the separately owned My tasks/search UI on that merged surface; presentation
adds no hook/controller/proxy/session or functional-test source.

The [T09.0 task-collaboration guide](docs/development/task-collaboration.md)
records hierarchy, checklist, own-author comments, safe history and the shared
frontend recovery contract. Its focused checks run in `pnpm test:projects:logic`
and `pnpm check`; real migration/SQL/security/paging/race/rollback/unknown-outcome
checks and the eight-table restart witness run in `pnpm test:identity`. The
test-only QA fixture has `--collaboration --large-collaboration --smoke` for
real PG/Nest/Next proxy checks. UI presentation remains separately owned.

The [T06.0 project/task guide](docs/development/project-task-flows.md) records
the bounded real-data domain and frontend recovery contracts, additive migration,
archive decisions and test-only local real PG/Nest/Next QA harness.
`pnpm test:projects:logic` is included in `pnpm check`; `pnpm test:identity`
also runs real domain HTTP/PG, paging/race/rollback and container-restart evidence.
It uses a labelled disposable volume, verified before cleanup. Presentation,
full P05/P14/T06/T35, private policy, MCP credentials and deployment remain separate.

The [T07.0 project access guide](docs/development/project-access.md) records the
ratified private-project policy, explicit human/Agent access, filtered paging and
assignment, atomic versioned policy writes and current-authority replay. Its
client/proxy/security regressions run in the same focused and real-PG suites;
presentation remains a separate delivery.

The [T05.0 workspace-flow guide](docs/development/workspace-flows.md) records the
bounded real-data backend/client contracts. `pnpm test:workspaces:logic` runs its
focused pure state/HTTP proxy checks and is included in `pnpm check`;
`pnpm test:identity` also runs the real PostgreSQL/HTTP workspace suite. Presentation
is separately owned; no full T05/T07/T35 acceptance is implied.

Documentation-only changes run the handoff/link verifier and unstaged/staged
whitespace checks below, inspect the diff, and retain CI and the applicable
branch review gates.

Changes to the frontend skill snapshots/manifest also run
`python3 -B scripts/verify-frontend-skills.py` and
`python3 -B scripts/test_frontend_skills.py`. Preserve upstream bytes and exact
three-package vendor exceptions; first-party metadata/tooling stays checked.
Unrelated local application suites need not be rerun for prose-only edits.

Use Python 3.9+, Node 24.22.1, and pnpm 12.15.0. From the repository root:

```sh
python3 scripts/verify-handoff.py
pnpm install --frozen-lockfile
pnpm format:check
pnpm test:quality
pnpm check
pnpm test:prototype
pnpm test:mcp
pnpm test:identity
pnpm test:runtime
pnpm audit --audit-level=high
git diff --check
git diff --cached --check
```

See [the import record](docs/development/handoff-import.md) for direct source
comparison. Review the actual diff for unintended changes and credentials. Link
new files with portable relative paths; keep English/Spanish filenames intact.
The verifier checks local file targets, not remote sites or heading fragments.

`pnpm check` runs adopted formatting, quality-tooling regressions, lint, the backend dependency-closure guard, the focused smoke-process cleanup regression, identity
logic/client and task-prototype tests, strict typechecks, production builds, and
the local MCP subprocess/official Inspector suite plus HTTP smoke. `pnpm test:mcp`
builds its prerequisites and runs that suite alone (about 10 seconds after build,
60-second per-test deadline); it requires loopback permission and `openssl` for
an ephemeral TLS rejection fixture, without credentials or a database.
`pnpm test:prototype` can also run the focused demo action/invariant
tests alone; it requires no backend, database, credentials, or browser.
The smoke starts task-local servers on temporary ports and stops them afterwards;
it verifies the API contract, bilingual HTML, and API-down fallback. No external
credentials are needed. CI also enforces the immutable handoff/link checks.
See the fixture guide for individual commands, optional environment values, and
the documented screenshot/keyboard validation limitations.

`pnpm test:identity` additionally requires an existing working Docker engine and
registry access for the pinned PostgreSQL image. It builds the backend, starts a
dedicated temporary database on a random loopback port, deploys the identity
migrations twice over an existing-user fixture, runs principal/direct-SQL/concurrency
and real-library/session/security tests with simulated provider
HTTP, and removes only its own container. It uses generated private test values;
no Google/GitHub credentials or system PostgreSQL installation is needed. CI runs
this separately from `pnpm check`; Docker is a test prerequisite, not a deployment.

`pnpm test:runtime` builds pinned multi-stage API/web images with frozen installs,
then runs an isolated Compose project on random loopback ports. It verifies
migration failure/gating/repeatability, readiness versus liveness, DB recovery,
bounded DB-lock/signal cleanup, and a fixed diagnostic job retained while the
worker is stopped across full stack recreation and consumed after restart.
It inspects nonroot runtime usability and credential/build-tool exclusions,
then removes only its unique containers, networks, volume and image tags. It
requires Docker Compose, network access to build dependencies, and up to 15 minutes
for the build plus bounded lifecycle checks. CI runs it separately from `pnpm check`
without live external providers; see the guide for exact pins and rebuild limits.

For subsequently assigned implementation, add/run checks appropriate to the
real change: domain and contract checks; actual PostgreSQL isolation, constraints,
idempotency, transactions and outbox; principal/author/revocation cases; affected
API/MCP flows; responsive UI and accessibility; restart/recovery where relevant.
Document exact commands/results and unavailable checks. T00 ran documentation
checks only; T02.0's startup/build evidence does not complete the identity/MCP
spikes, database/worker tooling, or product/accessibility acceptance.

For UI changes, include relevant P/US/UXR/UX or landing criteria, representative
data and states, tested widths, keyboard/touch, save/conflict/network recovery,
and author/provenance behavior. Read the UI/UX guide before design/code work.
Screenshots support behavioral evidence; they do not establish persistence,
authorization, accessibility compliance, or usability by themselves.

Update [progress](docs/development/progress.md) and [CHANGELOG](CHANGELOG.md) with
the actual status, evidence, decisions, and limitations. Keep internal B batches
separate from the single public launch. Do not add future features to an already
accepted scope without a recorded decision.

## Pull requests and review

PR submissions are **collaborators only**, as approved and verified on 2026-11-03.
Rielia stays publicly readable; external users cannot open PRs to any base branch.
The current collaborator is `Ljrr3045`, with no pending invitations. Inviting
collaborators expands review admission and needs a deliberate user decision.
This GitHub creation gate does not cancel Kilo jobs or prove existing outsider
PR events are blocked; report any unexpected external PR to the coordinator.
See the [admission evidence and limits](docs/development/kilo-review.md#collaborator-only-pr-admission).
For future projects, adapt the [portable PR review playbook](docs/development/pr-review-playbook.md)
and independently verify their settings/provider behavior.

Open **one Draft PR targeting `dev`** for the assigned change. Use English and
the [PR template](.github/pull_request_template.md). Include the problem/result,
T00 or T/P/US scope, validation evidence, exclusions, risks, and pending decisions.
Use a body file for multiline GitHub CLI descriptions/comments:

For initial publication, verify no PR exists for the branch, push the prepared
commits, then immediately create the Draft PR. The draft-state guard below applies
to every subsequent PR-associated push.

```sh
gh pr create --draft --base dev --title "docs: describe the change" --body-file /tmp/rielia-pr-body.md
```

Complete all commits, the real PR URL/progress update, applicable checks and base
synchronization while Draft. Before every push to an existing PR, verify it is
actually Draft; if not, stop and ask the coordinator. CI remains automatic and
required on normal PR/push events. Only the coordinator controls Draft/Ready
transitions: verify the batch, current-head CI, up-to-date base and absence of paid
Kilo during draft events, freeze the head, then mark Ready once for that completed
new-head batch. Final review/delivery must be non-draft. Do not push while Ready or
during a live review, or open a second PR for fixes. This user-approved 2026-11-03
cadence supersedes unconditional non-draft opening, including its governance
bootstrap. The approved protections retain separate core and ownership layers:

| Base | Core ruleset | Required current-head checks | Core bypass |
| --- | --- | --- | --- |
| `dev` | `Development — Review & CI` (`26377556`) | `Kilo Code Review`, `validate` | None |
| `main` | `Main — Release Protection` (`25810056`) | `validate` only | None |

| Required check | Expected GitHub App |
| --- | --- |
| `Kilo Code Review` | `kilo-code-bot`, App ID `2193792` |
| `validate` | `github-actions`, App ID `15368` |

Core rules require an up-to-date head, PR, resolved review threads, deletion and
non-fast-forward protection. Both core bypass lists are empty and the current
user cannot bypass them. Separate `Ownership — Maintainer Approval` (`26378917`)
requires one code-owner approval on both branches; [.github/CODEOWNERS](.github/CODEOWNERS)
assigns all files, including itself, to `@Ljrr3045`.

Other contributors' PRs require `Ljrr3045`'s current-head GitHub `APPROVED` review
and resolved findings. His own PRs can use the ownership layer's PR-only exception
for User `98565958`. GitHub applies that exception to the merge actor, not the PR
author: it can technically permit him to merge another author's PR without formal
review, but coordinator policy forbids that. Use it only for PRs authored by
`Ljrr3045`, with evidence of authorship and all core gates satisfied. It does not
bypass core checks, PR/thread requirements, deletion or force-push protection and
does not fabricate approval. There is no global admin bypass.

The coordinator applied and verified [ruleset configuration](docs/development/kilo-review.md).
Code-owner matching uses the base branch's file. [PR #26](https://github.com/Ljrr3045/rielia/pull/26)
merged into `dev` as `a52beaa3bd535062f293fbb5f16e2699129092b4`, and the separate
minimal [PR #27](https://github.com/Ljrr3045/rielia/pull/27) merged into `main` as
`41c26bc0ac6f984f8d3fecfd7f461bb5179e0465`. Both bases now contain CODEOWNERS and
CI. The user authorized one-off Kilo review of that bootstrap; it did not promote
the product to `main` or authorize general Kilo review there. Missing checks must
not be bypassed. The ownership exception covers the separate ownership ruleset's
approval and code-owner requirements, while core rules retain no bypass.

[PR #28](https://github.com/Ljrr3045/rielia/pull/28) integrated the main/dev
reconciliation through a **merge commit**, preserving `main` ancestry and combining
the CI files. Preserve that ancestry in later integrations. Product promotion to
`main` remains separate.

Native Kilo uses its GitHub App and remains enabled. Its draft guard and Ready
event support the [controlled batching policy and pinned evidence](docs/development/kilo-review.md#manually-controlled-draft-batches).
Ready-state opening/push/reopen events can still start paid review. Draft conversion
does not cancel an in-flight run; wait for completion before a corrective batch.
Same-SHA Ready toggles can deduplicate, and later rounds may be incremental/rechecks.
No native `@kilocode-bot /review` check trigger is verified; fresh dashboard manual
jobs lack native check creation in the pinned source and cannot replace the gate.
No dashboard change is needed if the documented enabled setup remains in place.

Send the coordinator the complete Draft batch's PR URL and exact head SHA. Record
the coordinator's Ready transition URL/time, requested run/check ID, completion/check
URLs, source Apps and reviewed SHA. Wait for that requested round, including a
supported retry; an old green check, reaction or mutable summary is insufficient.
Inspect all check runs, summaries/annotations and review surfaces: issue comments,
submitted reviews and inline comments/threads. Retain CI's PR/head or synthetic
merge association and confirm effective required checks in the merge box. For
example, replace `123` with your PR:

```sh
gh pr view 123 --json url,headRefOid,baseRefName,isDraft,statusCheckRollup
gh api --paginate repos/Ljrr3045/rielia/issues/123/comments
gh api --paginate repos/Ljrr3045/rielia/pulls/123/reviews
gh api --paginate repos/Ljrr3045/rielia/pulls/123/comments
```

After completed feedback, the coordinator triages all findings, converts the same
PR to Draft before corrective pushes and delegates valid fixes together. The
assigned worker verifies Draft, batches fixes/documentation/base updates, runs
affected checks and reports the exact new head. The coordinator verifies evidence
and dispositions, freezes that head and marks Ready once for the next round.
Any push, including documentation or base changes, invalidates prior acceptance.
After a push, require the new head's checks and, for `dev`, completed feedback from
the requested Kilo round. Missing, failed,
cancelled, incomplete or prior-head-only required evidence blocks merge. Confirm
maintainer approval for other authors or the permitted own-PR exception, and resolve
required threads. Kilo success can contain warnings and is separate from a formal
GitHub `APPROVED` review. Recheck final non-draft/up-to-date state, head and gates
immediately before coordinator merge. Record final evidence in the PR body or an
external report without creating another source commit after final review.

The user approved keeping **Skip Bots ON** and blocking unreviewed PRs. A
bot-authored PR to `dev` without native Kilo completion remains blocked by the
required check; do not fabricate a success result. This is an intentional closed gate and an
unresolved automation usability limit, not complete bot-review coverage. Do not
exempt or bypass it. A maintainer may open a human-authored replacement PR while
preserving commit provenance; it still needs native Kilo, CI and ownership gates.
No Kilo platform setting change is claimed here.

Do not add an auto-approve action, expand `GITHUB_TOKEN` permissions, introduce a
PAT, bypass core protections, misuse the approval-only exception, post legacy
Kody triggers, or invent Kilo cloud commands.
The requested exclusion of base `main` from native Kilo events remains unverified
and awaits the user's decision. Kilo is not a required check on `main`; choosing
required checks is not an event filter or permission to review `main`. Retired Kody/OpenCode evidence remains historical.

Only the coordinator merges. Do not deploy or merge from a worker task. A dispatched
worker reports branch/worktree, PR/head SHA, validation/review evidence, and blockers
through its active Orca preamble, then stops after its single completion message.

After merge and finished delivery, the coordinator removes the completed worktree
through Orca, as explicitly requested by the user. First verify the merge, clean
working tree, and preserved evidence, then safely stop/settle task resources.
This cleanup needs no recurring user confirmation. Workers leave changes committed
and stop their own task-local servers before handoff; they never delete their
active checkout or the coordinator's `dev` checkout.

## Credentials and licensing

Never commit credentials, tokens, provider secrets, private callback URLs, or
production data, or reproduce them in PR evidence/logs. OAuth values belong in
installation secret configuration when implementation is authorized.

No repository license has been adopted. Do not add a license, CLA, DCO obligation,
trademark permission, or dependency license claim without a recorded decision.
Preserve source notices and provenance; selecting the final license remains open.
