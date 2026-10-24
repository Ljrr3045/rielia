# Contributing to Rielia

Read [START HERE](docs/handoff/00-START-HERE.md), [AGENTS.md](AGENTS.md), and
[current progress](docs/development/progress.md) before selecting work. Either
handoff language is sufficient. T00 prepares the repository; T01–T35 remain future
work. There is no application build, dependency install, test runner, or deployment
command yet. Do not invent successful tests or a working setup procedure.

## Select a bounded change

Agree the ticket and ownership with the coordinator. Record the internal batch,
T/P/US requirements, applicable UXR/UX or LPR/S/LP criteria, dependencies, acceptance,
and exclusions. Use ticket dependencies rather than numerical order: T35 follows
T04 and precedes T05/T06/T12. Preparing these contribution documents does not
complete T16 or its real-project validation.

License, stack confirmation, and OAuth credentials are pending user decisions.
Documentation/prototype planning can proceed within scope; do not silently make
those choices or treat unavailable OAuth smoke tests as passed. Name/logo and
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

Preserve `.github/workflows/opencode-review.yml` outside explicitly authorized
changes. T00 includes coordinator-approved repairs of model environment scope
and PR comment access (`pull-requests: write` after PR reaction/comment 403s).
Keep `contents: read`, other permissions, triggers, provider restriction, secret
handling, and review-only/no-merge behavior. Use no personal credentials or review
bypass. Treat `docs/handoff/` as an
immutable import, including its asset manifest and file inventory. Record later
ratifications/corrections separately under `docs/development/` and link the
affected source section. Never modify a baseline just to make a hash check pass.

## Validate and record evidence

For the current documentation-only repository:

```sh
python3 scripts/verify-handoff.py
git diff --check
git diff --cached --check
```

See [the import record](docs/development/handoff-import.md) for direct source
comparison. Review the actual diff for unintended changes and credentials. Link
new files with portable relative paths; keep English/Spanish filenames intact.
The verifier checks local file targets, not remote sites or heading fragments.

When implementation is separately assigned, add/run checks appropriate to the
real change: domain and contract checks; actual PostgreSQL isolation, constraints,
idempotency, transactions and outbox; principal/author/revocation cases; affected
API/MCP flows; responsive UI and accessibility; restart/recovery where relevant.
Document exact commands/results and unavailable checks. No application checks
have been run at T00 because the application does not exist.

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
branch. Do not open a second PR for review fixes. A push triggers a new OpenCode
review; only the latest PR head's completed run is relevant to acceptance.

Inspect workflow checks plus all three review surfaces: issue comments, submitted
reviews, and inline review comments. For example, replace `123` with your PR:

```sh
gh pr view 123 --json url,headRefOid,baseRefName,isDraft,statusCheckRollup
gh api --paginate repos/Ljrr3045/rielia/issues/123/comments
gh api --paginate repos/Ljrr3045/rielia/pulls/123/reviews
gh api --paginate repos/Ljrr3045/rielia/pulls/123/comments
```

Evaluate every finding against the code/requirements. Fix real defects and attach
relevant validation; give a concise technical disposition for substantive findings
that are fixed, deferred, or rejected. A failed/cancelled/missing reviewer is a
blocker, not evidence of no findings. After any push, wait for its synchronize
review, reread all surfaces, and verify successful checks for the latest head.
Do not change the review workflow to bypass a failure.

Only the coordinator merges. Do not deploy or merge from a worker task. A dispatched
worker reports branch/worktree, PR/head SHA, validation/review evidence, and blockers
through its active Orca preamble, then stops after its single completion message.

## Credentials and licensing

Never commit credentials, tokens, provider secrets, private callback URLs, or
production data, or reproduce them in PR evidence/logs. OAuth values belong in
installation secret configuration when implementation is authorized.

No repository license has been adopted. Do not add a license, CLA, DCO obligation,
trademark permission, or dependency license claim without a recorded decision.
Preserve source notices and provenance; selecting the final license remains open.
