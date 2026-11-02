# Native Kilo Code Reviews

Decision date: 2026-11-02. Scope: T00 repository-governance maintenance. No product
P/US or UI acceptance changes; no T01–T35 ticket is completed. The user selected
native Kilo Code Reviews to replace Kody and the abandoned OpenCode PR integration.
OpenCode Go remains the separately selected frontend presentation worker.

## Decision and current setup status

Use Kilo's GitHub App and native review configuration, not a repository-owned
workflow, custom approval bot, personal token, or legacy review trigger. Preserve
historical Kody/OpenCode review evidence. Applicable CI remains required; only the
coordinator merges.

The coordinator reports [PR #25](https://github.com/Ljrr3045/rielia/pull/25) closed
without merge and its abandoned review branches/worktrees removed. Repository
Actions variables/secrets were empty on inspection. This change adds no workflow,
credential, variable, permission, or product code.

After the dashboard finished loading, the coordinator verified the GitHub App
connection and the following existing global configuration: AI review enabled for
all 23 App-accessible repositories, including available Rielia; DeepSeek V4.1 Flash
1017, Thinking Max; Balanced review; PR Gate Threshold **Warnings and above**;
**Use REVIEW.md OFF**, **Skip Bots ON**, and Advanced configuration OFF. Temporary
unsaved UI exploration was discarded by reload. These observations do not prove
successful review, formal approval, or a base-branch filter.

The coordinator also disabled four retained retired GitHub workflow registrations:
One-time OpenCode Go bootstrap (`403997570`), OpenCode inline request (`404115530`),
OpenCode PR Review (`395476772`), and Review support CI (`403990255`). Only Technical
fixture CI (`395541295`) remains active; `dev` contains only `ci.yml`. The OpenCode
GitHub App still has all-repository installation access; removal is a pending user
decision. No App uninstall or configuration change is claimed by this PR.

Native review on this bounded PR to `dev` is authorized. Model reasoning uses Kilo
credits. Configuration and any capability verification remain coordinator-owned;
this documentation change does not itself enable repository guidance.

The user requests review of every ready PR except those with base `main`, including
new commits. Native enforcement of that base-branch exclusion is **unverified**.
Do not represent prompt text or `REVIEW.md` as an event filter or claim that this
policy file enables the integration. No such control was found in the inspected
UI. The coordinator has asked the user whether to retain the exclusion or allow native review including `main`;
that decision is pending. Do not claim the existing global configuration enforces
the exclusion or silently broaden the recorded review scope.

## Documented behavior and limits

Official documentation consulted on 2026-11-02:

- [GitHub Code Reviews](https://kilo.ai/docs/automate/code-reviews/github) documents
  App installation, repository selection, and reviews on non-draft opening,
  pushes, reopening, and marking ready. New pushes cancel older runs; the summary
  may update in place. Draft opening is skipped.
- [Code Reviews overview](https://kilo.ai/docs/automate/code-reviews/overview)
  documents the **Use REVIEW.md** setting. Guidance comes from the PR base branch,
  with a 10,000-character limit; keep the root [REVIEW.md](../../REVIEW.md) below it.
  This PR cannot supply its own active base-branch guidance before merge.

Those pages do not establish a formal GitHub `APPROVED` submission, a native
base-`main` exclusion, cloud manual-rerun commands, threaded reply handling, or
this repository's emitted check names. Keep each **pending verification**. Local
`/review` documentation does not establish a GitHub comment command. Bot-authored
PRs are skipped by default according to the overview, so the requested every-PR
coverage also needs explicit verification for automation-authored PRs.

## Acceptance and merge evidence

For each ready head whose base is not `main`:

1. Run applicable checks, report the exact PR/head to the coordinator, and wait
   for native Kilo completion. Record review/comment URLs and evidence of the
   reviewed SHA; an eye reaction or pre-push summary is insufficient.
2. Inspect applicable checks, issue comments, submitted reviews, and inline
   comments. Check actual integration output rather than inventing a required
   check name or treating an absent check as success.
3. Analyze every finding; fix valid issues with relevant validation and document
   concise dispositions for substantive findings. A reply alone is not a
   documented rerun or completion mechanism.
4. After any push, rerun affected checks and wait for the new head's completed
   review. Missing, failed, cancelled, incomplete, or prior-head-only feedback is
   a merge blocker. Do not use Kody commands or fabricate a Kilo trigger.
5. Verify repository protections independently. Kilo feedback does not prove
   formal GitHub approval. If protection requires `APPROVED`, obtain that approval
   separately; do not weaken or bypass it. Only the coordinator merges.

The requested exclusion for base `main` changes the Kilo review scope only; it
does not waive CI, repository protection, or coordinator ownership. No Kilo
completion, formal approval, branch-filter enforcement, or reply behavior is
claimed until observed evidence is recorded on the PR.

## Local documentation validation

Run `python3 scripts/verify-handoff.py`, `git diff --check`, and
`git diff --cached --check`; inspect the scope and root guidance length. Application
suites are inapplicable to this prose-only change. PR, latest-head CI, native setup,
and review evidence are recorded in [progress](progress.md) and the PR itself.
