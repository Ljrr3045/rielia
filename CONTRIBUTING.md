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
bounded real-library/database evidence. Browser protocol/state logic is included;
UI/UX presentation is separate T02.2 work.

## Select a bounded change

Agree the ticket and ownership with the coordinator. Record the internal batch,
T/P/US requirements, applicable UXR/UX or LPR/S/LP criteria, dependencies, acceptance,
and exclusions. Use ticket dependencies rather than numerical order: T35 follows
T04 and precedes T05/T06/T12. Preparing these contribution documents does not
complete T16 or its real-project validation.

License, stack confirmation, and OAuth credentials are pending user decisions.
The authorized fixture uses the proposed stack provisionally; do not silently
ratify the complete stack or treat unavailable OAuth smoke tests as passed. Name/logo and
final landing design also remain unapproved. An imported proposal is not an
implementation instruction.

## Branch and checkout

Use your own worktree based on `origin/dev` and a focused branch. Do not share a
worker checkout, edit another worker's files, or change the source handoff outside
the repo. With ordinary Git, a contributor can start a clone as follows:

```sh
git clone https://github.com/Ljrr3045/rielia.git
cd rielia
git fetch origin
git switch --create docs/my-change origin/dev
```

Inside Orca, use its worktree workflow. If RTK guidance is active, prefix every
shell command with `rtk` (`rtk proxy` for unsupported commands). Commands in this
document use ordinary tools so contributors do not need Orca or RTK.

For supervised agent development, the user's current rule is OpenCode with
Claude Haiku 5.5 `high` for UI/UX presentation only; all logic uses
Codex `gpt-6.1-sol` `xhigh`, including frontend auth/session/data hooks, proxies,
and functional tests. Verify the effective configuration and isolate each
worker's checkout. This is separate from Kody's external review role.

The user retired OpenCode review and requested deletion of its entire workflow,
including the version inherited from `dev`. Do not restore, repair, or invoke it;
Kody AI is the current reviewer. Do not modify secrets or introduce personal
tokens or a review bypass. Treat `docs/handoff/` as an
immutable import, including its asset manifest and file inventory. Record later
ratifications/corrections separately under `docs/development/` and link the
affected source section. Never modify a baseline just to make a hash check pass.

## Validate and record evidence

Use Python 3.9+, Node 24.22.1, and pnpm 12.15.0. From the repository root:

```sh
python3 scripts/verify-handoff.py
pnpm install --frozen-lockfile
pnpm check
pnpm test:identity
pnpm audit --audit-level=high
git diff --check
git diff --cached --check
```

See [the import record](docs/development/handoff-import.md) for direct source
comparison. Review the actual diff for unintended changes and credentials. Link
new files with portable relative paths; keep English/Spanish filenames intact.
The verifier checks local file targets, not remote sites or heading fragments.

`pnpm check` runs lint, the focused smoke-process cleanup regression, strict
typechecks, production builds, and HTTP smoke.
The smoke starts task-local servers on temporary ports and stops them afterwards;
it verifies the API contract, bilingual HTML, and API-down fallback. No external
credentials are needed. CI also enforces the immutable handoff/link checks.
See the fixture guide for individual commands, optional environment values, and
the documented screenshot/keyboard validation limitations.

`pnpm test:identity` additionally requires an existing working Docker engine and
registry access for the pinned PostgreSQL image. It builds the backend, starts a
dedicated temporary database on a random loopback port, deploys the identity
migration twice, runs real-library/session/security tests with simulated provider
HTTP, and removes only its own container. It uses generated private test values;
no Google/GitHub credentials or system PostgreSQL installation is needed. CI runs
this separately from `pnpm check`; Docker is a test prerequisite, not a deployment.

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
