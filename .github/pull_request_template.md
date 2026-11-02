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
- [ ] No secrets or unrelated files included; review credentials never execute PR code/config/install hooks.
- [ ] Progress and unreleased changelog reflect actual status and PR URL.

## Review evidence (complete after automated review)

- Latest PR head SHA and base ref/SHA:
- Automatic OpenCode run, or coordinator's `/oc review` request URL:
- OpenCode formal review/inline/comment URLs and complete result for that head/base:
- Issue comments, submitted reviews, and inline comments inspected:
- Findings, technical dispositions/fix evidence, and any fresh head review:

<!-- Automatic review covers non-main PRs; coordinator alone requests extra manual full rounds. No Kody trigger. -->
<!-- Failed/cancelled/missing/incomplete/obsolete review blocks acceptance. Replies and old APPROVED badges are not current approval. -->
<!-- Bootstrap only: record independent security review + CI + normal repository approval; live App/Go/event smoke stays OPEN until default-branch activation. -->

## Limitations and remaining decisions

<!-- Include applicable license, stack, OAuth, identity/brand, and unrun checks. -->

- [ ] Proposals remain proposals; no unapproved license/branding/launch claims.
- [ ] Internal B batches remain separate from the single public launch.
- [ ] Delegated human versus autonomous Agent authorship is preserved.
- [ ] Coordinator merge only; no production deployment performed.
