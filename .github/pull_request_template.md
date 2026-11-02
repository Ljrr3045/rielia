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
- Current-head `Kilo Code Review` result/URL/source App (`2193792`, `kilo-code-bot`):
- Current-head `validate` result/URL/source App (`15368`, `github-actions`):
- Branch up-to-date status and unresolved review threads:
- Issue comments, submitted reviews, and inline comments inspected:
- Findings, technical dispositions/fix evidence, and any fresh head review:
- Base-specific protection: `dev` requires zero formal approvals; existing `main` approval rules remain unchanged:
- Setup, `main` exclusion, or other unverified integration blockers:

<!-- See docs/development/kilo-review.md. No legacy Kody trigger or invented Kilo command. -->
<!-- Missing/failed/cancelled/incomplete review blocks merge; prior-head evidence never approves changed code. -->
<!-- dev requires both App-bound checks on the current head, resolved threads and coordinator disposition. No auto-approve action/token expansion/PAT/bypass. -->
<!-- main rules are unchanged. Required-check selection does not enforce the still-unverified main Kilo event exclusion. -->

## Limitations and remaining decisions

<!-- Include applicable license, stack, OAuth, identity/brand, and unrun checks. -->

- [ ] Proposals remain proposals; no unapproved license/branding/launch claims.
- [ ] Internal B batches remain separate from the single public launch.
- [ ] Delegated human versus autonomous Agent authorship is preserved.
- [ ] Coordinator merge only; no production deployment performed.
