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
and exclusions. Use ticket dependencies rather than numerical order: T35 follows
T04 and precedes T05/T06/T12. Preparing these contribution documents does not
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
automated unit/integration/security/local Docker checks, CI and Kody remain
required. License and brand/final landing design remain undecided. The
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

For supervised agent development, the user's current rule is OpenCode Go with
DeepSeek V4.1 Flash 1017 (`opencode-go/deepseek-v4.1-flash`, variant `max`)
for UI/UX presentation only; all logic uses
Codex `gpt-6.1-sol` `xhigh`, including frontend auth/session/data hooks, proxies,
and functional tests. Verify the effective configuration and isolate each
worker's checkout. See the [model decision and verification limits](docs/development/frontend-agent.md).
This is separate from Kody's external review role.

The user retired OpenCode review and requested deletion of its entire workflow,
including the version inherited from `dev`. Do not restore, repair, or invoke it;
Kody AI is the current reviewer. Do not modify secrets or introduce personal
tokens or a review bypass. Treat `docs/handoff/` as an
immutable import, including its asset manifest and file inventory. Record later
ratifications/corrections separately under `docs/development/` and link the
affected source section. Never modify a baseline just to make a hash check pass.

## Validate and record evidence

The [T10.0 discovery guide](docs/development/task-discovery.md) records search,
strict-assignee My tasks, session SSE bounds and presentation integration. Focused
client/proxy/recovery checks run in `pnpm test:projects:logic` and `pnpm check`;
real search/policy/migration/commit-order/replay/revocation and backpressure checks
run in `pnpm test:identity`. The local QA fixture adds `--discovery` for populated
search/My tasks and real Nest→Next two-session streaming, rollback, heartbeat,
private-access removal and abort cleanup. Presentation remains separately owned.

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
whitespace checks below, inspect the diff, and retain existing CI and Kody gates.
Unrelated local application suites need not be rerun for prose-only edits.

Use Python 3.9+, Node 24.22.1, and pnpm 12.15.0. From the repository root:

```sh
python3 scripts/verify-handoff.py
pnpm install --frozen-lockfile
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

`pnpm check` runs lint, the backend dependency-closure guard, the focused smoke-process cleanup regression, identity
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

Open **one non-draft PR targeting `dev`** for the assigned change. Use English and
the [PR template](.github/pull_request_template.md). Include the problem/result,
T00 or T/P/US scope, validation evidence, exclusions, risks, and pending decisions.
Use a body file for multiline GitHub CLI descriptions/comments:

```sh
gh pr create --base dev --title "docs: describe the change" --body-file /tmp/rielia-pr-body.md
```

Add the real PR URL to progress after creation and push that update to the same
branch. Do not open a second PR for review fixes. Every ready PR/head requires
an explicit Kody AI request; a push alone does not satisfy that requirement.

After local checks pass, send the coordinator the PR URL and exact head SHA.
The **coordinator alone** posts a root PR comment exactly `@kody start-review`.
Workers must not duplicate the trigger. Record its comment URL, the requested
head, and the resulting Kody review/comment URLs. Confirm the review applies to
the current head rather than relying on an earlier completion message.

Inspect applicable checks plus all three review surfaces: issue comments, submitted
reviews, and inline review comments. For example, replace `123` with your PR:

```sh
gh pr view 123 --json url,headRefOid,baseRefName,isDraft,statusCheckRollup
gh api --paginate repos/Ljrr3045/rielia/issues/123/comments
gh api --paginate repos/Ljrr3045/rielia/pulls/123/reviews
gh api --paginate repos/Ljrr3045/rielia/pulls/123/comments
```

Evaluate every finding against the code/requirements. Fix real defects and attach
relevant validation; give a concise technical disposition for substantive findings
that are fixed, deferred, or rejected. A failed, cancelled, missing, or incomplete
review is a blocker, not evidence of no findings. After any push, rerun affected
checks and report the new head ready for the coordinator's fresh Kody trigger.
Wait for that round, reread all three surfaces, and handle feedback before
handoff. A prior-head review never approves changed code. Retired OpenCode checks
are historical evidence and are not the current review gate.

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
