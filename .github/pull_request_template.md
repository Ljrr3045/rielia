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
- Applicable CI/Kilo check names, URLs, and results actually observed:
- Issue comments, submitted reviews, and inline comments inspected:
- Findings, technical dispositions/fix evidence, and any fresh head review:
- Formal GitHub approval evidence if required by repository protection:
- Setup, `main` exclusion, or other unverified integration blockers:

<!-- See docs/development/kilo-review.md. No legacy Kody trigger or invented Kilo command. -->
<!-- Missing/failed/cancelled/incomplete review blocks merge; prior-head evidence never approves changed code. -->
<!-- Kilo feedback alone does not establish GitHub APPROVED. The requested base-main exclusion is pending verification. -->

## Limitations and remaining decisions

<!-- Include applicable license, stack, OAuth, identity/brand, and unrun checks. -->

- [ ] Proposals remain proposals; no unapproved license/branding/launch claims.
- [ ] Internal B batches remain separate from the single public launch.
- [ ] Delegated human versus autonomous Agent authorship is preserved.
- [ ] Coordinator merge only; no production deployment performed.
