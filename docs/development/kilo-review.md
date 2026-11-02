# Native Kilo Code Reviews

Decision date: 2026-11-02. Scope: T00 repository-governance maintenance. No product
P/US or UI acceptance changes; no T01–T35 ticket is completed. Native Kilo Code
Reviews replaces Kody and the abandoned OpenCode PR integration. OpenCode Go
remains the separately selected frontend presentation worker.

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

Code-owner matching uses the base branch's CODEOWNERS file. This PR adds the file
for `dev` activation after merge. Main currently has only README: CODEOWNERS and CI
have not landed there, so main ownership/CI activation is **pending a separately
authorized bootstrap**. Active ruleset configuration is not proof of base-file
activation. No full product promotion, main PR or main merge is authorized here.
Settings changes belong to the coordinator; this worker changes only repository
guidance and CODEOWNERS.

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
The amended head requires a fresh successful run of both checks and review-surface
inspection; prior-head evidence cannot approve it.

The user's requested exclusion of base `main` from Kilo events remains
**unverified**. No supported control was found in the inspected UI, and the
coordinator's question about allowing native review including `main` is unanswered.
Required-check selection, prompt text and `REVIEW.md` are not event filters and do
not authorize reviewing `main`. Default bot-PR skipping also limits every-PR
coverage until configured and verified. Cloud rerun commands, threaded reply
handling and formal `APPROVED` submission remain unverified; formal approval is
separate from required maintainer approval for other authors. Kilo is not a
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
   analyzes every finding, fixes valid issues with evidence and records concise
   technical dispositions. Resolve required threads; a reply is not a documented
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
