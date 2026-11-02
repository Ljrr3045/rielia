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

## Review evidence (complete after automated review)

- Latest PR head SHA and base branch:
- Kilo Code Reviews completion URL(s), result, and evidence tying it to that head:
- Current-head `Kilo Code Review` result/URL/source App (`2193792`, `kilo-code-bot`; required for `dev` only):
- Current-head `validate` result/URL/source App (`15368`, `github-actions`):
- Branch up-to-date status and unresolved review threads:
- Issue comments, submitted reviews, and inline comments inspected:
- Coordinator triage/delegation/dispositions, assigned-worker fixes/checks, and fresh-head review:
- Core ruleset: `Development — Review & CI` (`dev`, `26377556`) or `Main — Release Protection` (`main`, `25810056`); no core bypass:
- Ownership layer (`26378917`): other authors need `Ljrr3045`'s current-head APPROVED URL; own PRs need author/merger evidence for the limited PR-only exception:
- Base CODEOWNERS/CI activation status (main bootstrap is pending):
- Setup, `main` exclusion, or other unverified integration blockers:

<!-- See docs/development/kilo-review.md. No legacy Kody trigger or invented Kilo command. -->
<!-- Missing/failed/cancelled/incomplete review blocks merge; prior-head evidence never approves changed code. -->
<!-- dev requires both App-bound checks; main requires validate only. Both require an up-to-date head, PR, resolved threads and coordinator disposition. -->
<!-- The approval-only exception follows merge actor, not PR author. Coordinator may use it only for Ljrr3045-authored PRs; never bypass core gates. -->
<!-- No fake auto-approval/token expansion/PAT/global bypass. Required-check selection does not enforce the still-unverified main Kilo event exclusion. -->
<!-- main base CODEOWNERS/CI activation is pending separate minimal bootstrap; its one-off Kilo review is authorized, not product promotion. -->
<!-- Skip Bots ON leaves bot dev PRs without Kilo blocked; do not exempt/bypass or claim complete bot coverage. -->

## Limitations and remaining decisions

<!-- Include applicable license, stack, OAuth, identity/brand, and unrun checks. -->

- [ ] Proposals remain proposals; no unapproved license/branding/launch claims.
- [ ] Internal B batches remain separate from the single public launch.
- [ ] Delegated human versus autonomous Agent authorship is preserved.
- [ ] Coordinator merge only; no production deployment performed.
