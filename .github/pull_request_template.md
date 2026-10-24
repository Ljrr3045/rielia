## Problem and resulting behavior

<!-- Explain the concrete change and why it is needed. Do not claim an app exists at T00. -->

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
- [ ] No secrets or unrelated files included; any review-workflow change explicitly authorized and validated.
- [ ] Progress and unreleased changelog reflect actual status and PR URL.

## Review evidence (complete after automated review)

- Latest PR head SHA:
- OpenCode run URL and result for that head:
- Issue comments, submitted reviews, and inline comments inspected:
- Findings, technical dispositions/fix evidence, and follow-up synchronize run:

<!-- Failed/cancelled/missing reviewer is a blocker, not a clean review. Recheck after every push. -->

## Limitations and remaining decisions

<!-- Include applicable license, stack, OAuth, identity/brand, and unrun checks. -->

- [ ] Proposals remain proposals; no unapproved license/branding/launch claims.
- [ ] Internal B batches remain separate from the single public launch.
- [ ] Delegated human versus autonomous Agent authorship is preserved.
- [ ] Coordinator merge only; no production deployment performed.
