## Problem and resulting behavior

<!-- Explain the concrete change and why it is needed. Distinguish the development fixture from product functionality. -->

## Scope and requirements

- Ticket and internal batch:
- P/US requirements; UXR/UX or LPR/S/LP if applicable:
- Dependencies and ownership:
- Explicit exclusions:

## Validation evidence

<!-- Record real commands, results, and relevant artifacts. Mark unavailable checks explicitly. -->

- [ ] `git diff --check` and staged/PR diff whitespace check pass.
- [ ] `python3 scripts/verify-handoff.py` passes; immutable handoff remains unchanged.
- [ ] Appropriate behavior/invariant checks pass, or are explicitly inapplicable.
- [ ] No secrets or unrelated files included; retired OpenCode workflow is not restored.
- [ ] Progress and unreleased changelog reflect actual status and PR URL.

## Draft batch readiness

- [ ] PR opened Draft; all commits, PR URL/progress, applicable checks and base sync completed while Draft.
- [ ] Actual Draft verified before each push to the existing PR; no push while Ready or during live review.
- Coordinator verification of complete batch/current-head CI and no paid Kilo during draft events:
- Frozen batch head SHA; coordinator Ready transition URL/time (pending until performed):

## Review evidence (complete after requested Kilo round)

- Latest PR head SHA and base branch:
- Requested Kilo run/check ID, request time and reviewed source SHA; completion of this requested round:
- Kilo Code Reviews completion URL(s), result, and evidence tying it to that head:
- Current-head `Kilo Code Review` result/URL/source App (`2193792`, `kilo-code-bot`; required for `dev` only):
- Current-head `validate` result/URL/source App (`15368`, `github-actions`):
- CI PR/head or synthetic merge association; effective required-check/merge-box readback:
- Branch up-to-date status and unresolved review threads:
- All check runs, summaries/annotations, issue comments, submitted reviews, and inline comments/threads inspected:
- Coordinator triage/dispositions; completed review → coordinator Draft → worker fix/check batch → coordinator Ready once at new head:
- Final non-draft state; unchanged reviewed head verified immediately before coordinator merge:
- Core ruleset: `Development — Review & CI` (`dev`, `26377556`) or `Main — Release Protection` (`main`, `25810056`); no core bypass:
- Ownership layer (`26378917`): other authors need `Ljrr3045`'s current-head APPROVED URL; own PRs need author/merger evidence for the limited PR-only exception:
- Base CODEOWNERS/CI activation evidence (active on dev via PR #26 and main via PR #27):
- Setup, `main` exclusion, or other unverified integration blockers:

<!-- See docs/development/kilo-review.md. No legacy Kody trigger or invented Kilo command. -->
<!-- Missing/failed/cancelled/incomplete review blocks merge; prior-head evidence never approves changed code. -->
<!-- Draft does not cancel live review; same-SHA toggles can deduplicate, later rounds may be incremental/rechecks. -->
<!-- Dashboard manual jobs and unverified mention commands cannot substitute for the required native check. -->
<!-- Any later push, including docs/base changes, requires a new Draft batch/current-head round; record final evidence here without another source commit. -->
<!-- dev requires both App-bound checks; main requires validate only. Both require an up-to-date head, PR, resolved threads and coordinator disposition. -->
<!-- The approval-only exception follows merge actor, not PR author. Coordinator may use it only for Ljrr3045-authored PRs; never bypass core gates. -->
<!-- No fake auto-approval/token expansion/PAT/global bypass. Required-check selection does not enforce the still-unverified main Kilo event exclusion. -->
<!-- CODEOWNERS/CI are active on both bases after PRs #26/#27; the bootstrap had one-off Kilo authorization without product promotion. -->
<!-- Preserve main ancestry integrated by the main/dev reconciliation's merge commit in PR #28. -->
<!-- Skip Bots ON leaves bot dev PRs without Kilo blocked; do not exempt/bypass or claim complete bot coverage. -->

## Limitations and remaining decisions

<!-- Include applicable license, stack, OAuth, identity/brand, and unrun checks. -->

- [ ] Proposals remain proposals; no unapproved license/branding/launch claims.
- [ ] Internal B batches remain separate from the single public launch.
- [ ] Delegated human versus autonomous Agent authorship is preserved.
- [ ] Coordinator merge only; no production deployment performed.
