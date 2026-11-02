# Native Kilo Code Reviews

Decision date: 2026-11-02. Scope: T00 repository-governance maintenance. No product
P/US or UI acceptance changes; no T01–T35 ticket is completed. Native Kilo Code
Reviews replaces Kody and the abandoned OpenCode PR integration. OpenCode Go
remains the separately selected frontend presentation worker.

This is the authoritative review policy for all new changes. Every legacy Kody
trigger or requirement to use Kody for future reviews in older development guides is obsolete,
even when phrased as an instruction. Dated notices mark those guides for readers
who open them directly. This supersession affects review governance only;
historical review evidence, runtime guidance and product scope are preserved.

## Approved layered protection

The coordinator applied and verified these active core rulesets:

| Base | Core ruleset | Required current-head checks |
| --- | --- | --- |
| `dev` | [Development — Review & CI (`26377556`)](https://github.com/Ljrr3045/rielia/rules/26377556) | `Kilo Code Review`, `validate` |
| `main` | [Main — Release Protection (`25810056`)](https://github.com/Ljrr3045/rielia/rules/25810056) | `validate` only |

| Required check | Expected source App | App ID |
| --- | --- | --- |
| `Kilo Code Review` (`dev` only) | `kilo-code-bot` | `2193792` |
| `validate` (both bases) | `github-actions` | `15368` |

Both core bypass lists are empty and `current_user_can_bypass=never`. They require
PRs, up-to-date heads, resolved threads, deletion/non-fast-forward protection,
`strict_required_status_checks_policy=true` and `do_not_enforce_on_create=false`.
Effective branch/API readbacks confirmed the source Apps. Main retains merge/squash
and stale-review dismissal; no last-push approval is required.

Separate [Ownership — Maintainer Approval (`26378917`)](https://github.com/Ljrr3045/rielia/rules/26378917)
applies to both branches: one approval, code-owner review required, stale approvals
dismissed, no last-push approval, and no additional unattributed-review requirement.
The only exception is User `98565958` (`Ljrr3045`), mode `pull_request`, in this
approval-only ruleset. [.github/CODEOWNERS](../../.github/CODEOWNERS) assigns every
file, including itself, to `@Ljrr3045`.

The native exception follows the **merge actor**, not the PR author. It can
technically let the owner merge someone else's PR without a formal review.
Coordinator policy permits it **only for PRs authored by `Ljrr3045`**. Other
contributors must have his current-head GitHub `APPROVED` review and resolved
findings. For an own PR, record author/merger evidence and verify all core gates;
no fake approval is created. The exception cannot bypass core checks, PR/thread
requirements, deletion or force-push protection. There is no global admin bypass.
Do not add auto-approve actions, expand `GITHUB_TOKEN` permissions or introduce PATs.

Code-owner matching uses the base branch's CODEOWNERS file. [PR #26](https://github.com/Ljrr3045/rielia/pull/26)
merged into `dev` as `a52beaa3bd535062f293fbb5f16e2699129092b4` and the separate
minimal [PR #27](https://github.com/Ljrr3045/rielia/pull/27) merged into `main` as
`41c26bc0ac6f984f8d3fecfd7f461bb5179e0465`. CODEOWNERS and CI are now present on
both bases. Main's bootstrap adds only governance files to its README; it is not
product promotion. The user authorized its one-off Kilo review. Settings changes
remain outside this reconciliation.

The PR-only exception covers the entire separate ownership ruleset, including
its approval and code-owner requirements. It does not bypass either core ruleset.
The coordinator verified this live configuration when resolving PR #27's
conditional self-approval warning; repository content alone cannot prove a bypass
list. The reconciliation PR to `dev` must retain its main-into-dev merge ancestry
through a **merge commit**, not squash or rebase. Otherwise a later merge can
repeat the same CI add/add conflict despite an equivalent file resolution.

## Native setup and observed evidence

The coordinator verified the connected GitHub App and existing global settings:
AI review enabled for all 23 App-accessible repositories, including available
Rielia; DeepSeek V4.1 Flash 1017, Thinking Max; Balanced; PR Gate Threshold
**Warnings and above**; **Use REVIEW.md OFF**, **Skip Bots ON**, Advanced OFF.
Unsaved UI exploration was discarded by reload. This PR does not change those
settings or activate its own repository guidance. Model reasoning uses Kilo credits.

On prior head `49f3d4eded3876ce12d978d834ad48c58966309e` of
[PR #26](https://github.com/Ljrr3045/rielia/pull/26), the coordinator verified
`Kilo Code Review` and `validate` SUCCESS with no Kilo findings and no submitted
formal reviews. This establishes native check behavior, not GitHub `APPROVED`.
The later `c160c6b` run returned check SUCCESS with two warnings and one suggestion
in its summary, so success alone does not establish no findings; the coordinator
must inspect summaries and inline feedback. The final reviewed head
`0cb53a4ac8f128f0111476e2e925db4532d84c25` passed
[validate](https://github.com/Ljrr3045/rielia/actions/runs/41477983229/job/125388505559)
and [Kilo](https://app.kilo.ai/code-reviews/52c2c59a-7ea4-4302-9472-5a2e06c6707b)
before PR #26 merged on 2026-11-02 at 16:14:48 UTC.

PR #27's reviewed head `6afd20aa38bf009a70e66f183838bb49b6f9c88e` passed
[validate](https://github.com/Ljrr3045/rielia/actions/runs/41479780807/job/125394679013)
and [Kilo](https://app.kilo.ai/code-reviews/f1cad821-3909-42b9-a795-f4dca0bcaae1)
before merge on 2026-11-02 at 16:25:11 UTC. Its
[one conditional CODEOWNERS warning](https://github.com/Ljrr3045/rielia/pull/27#issuecomment-6582155310)
was resolved with the live ownership-ruleset evidence described above, rather than
claimed absent. The coordinator removed both completed worktrees. These prior
results do not approve the reconciliation's new head.

The user's requested exclusion of base `main` from Kilo events remains
**unverified**. The coordinator found no supported control in the inspected UI
or checked public source; the question about allowing native review including
`main` is unanswered. No reviewer-setting change is authorized by this reconciliation.
Required-check selection, prompt text and `REVIEW.md` are not event filters and do
not authorize general review of `main`; the separate minimal bootstrap has a
specific one-off Kilo authorization. The user explicitly approved retaining
**Skip Bots ON** and blocking PRs without review. Bot-authored PRs to `dev` that
lack native Kilo remain blocked by the mandatory check; do not fabricate success.
This deliberately fails closed; automated bot-review coverage is incomplete. Do not exempt bot PRs
or bypass the gate. A maintainer can open a human-authored replacement PR,
preserving commit provenance, that still needs native Kilo, CI and ownership gates.
No Skip Bots setting change is claimed; platform coverage remains unresolved.
Cloud rerun commands, threaded replies and Kilo's formal `APPROVED` submission
remain unverified; native Kilo does not replace required maintainer approval for
other authors. Kilo is not a
required check on `main`; this does not establish or authorize automatic events.

## Retired integration cleanup

The coordinator reports [PR #25](https://github.com/Ljrr3045/rielia/pull/25) closed
unmerged, abandoned review branches/worktrees removed, and empty repository Actions
variables/secrets. Four retained workflow registrations are disabled: One-time
OpenCode Go bootstrap (`403997570`), OpenCode inline request (`404115530`), OpenCode
PR Review (`395476772`), Review support CI (`403990255`). Only Technical fixture CI
(`395541295`) remains active; `dev` contains only `ci.yml`. The OpenCode GitHub App
still has all-repository access; uninstall remains an unanswered user decision.
Preserve historical evidence. No custom workflow, App uninstall, credential,
variable, token permission, or product code change is included in this PR.

## Documented behavior

Official documentation consulted on 2026-11-02:

- [GitHub Code Reviews](https://kilo.ai/docs/automate/code-reviews/github) documents
  native App setup and automatic review on non-draft opening, pushes, reopening
  and marking ready. New pushes cancel older runs; summaries may update in place.
- [Code Reviews overview](https://kilo.ai/docs/automate/code-reviews/overview)
  documents **Use REVIEW.md**: root [REVIEW.md](../../REVIEW.md) comes from the PR
  base branch, with a 10,000-character limit. This PR cannot supply its own active
  base-branch guidance before merge. Local `/review` does not establish a GitHub
  comment command; bot-authored PRs are skipped by default.

## Acceptance and merge evidence

1. Run applicable checks and report the exact PR/head to the coordinator. Verify
   current-head SUCCESS and source Apps for both checks on `dev`, or `validate`
   on `main`, plus an up-to-date branch. An eye reaction or old summary is insufficient.
2. Inspect issue comments, submitted reviews and inline comments. The coordinator
   triages findings, delegates valid fixes to the assigned worker, verifies evidence
   and records concise dispositions. The assigned worker implements fixes and
   reruns affected checks. Resolve required threads; a reply is not a documented
   rerun or completion mechanism.
3. After any push, rerun affected checks and wait for the new head's required
   results, including Kilo completion for `dev`. Missing, failed, cancelled,
   incomplete or prior-head-only required evidence blocks merge. No legacy Kody
   trigger or invented command.
4. Verify the core gates with no bypass. For another author, require `Ljrr3045`'s
   current-head `APPROVED` review; for his own PR, record the permitted approval-only
   exception and author/merger evidence. Check base-file activation and resolved
   threads. Only the coordinator merges after all required evidence is satisfied.

For prose-only changes, run `python3 scripts/verify-handoff.py`,
`git diff --check` and `git diff --cached --check`, inspect scope and root guidance
length. Application suites are inapplicable. Current PR/check evidence is recorded
in [progress](progress.md) and the PR body; no deployment or product acceptance is
claimed.
