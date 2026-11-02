# Native Kilo Code Reviews

Decision date: 2026-11-02. Scope: T00 repository-governance maintenance. No product
P/US or UI acceptance changes; no T01–T35 ticket is completed. Native Kilo Code
Reviews replaces Kody and the abandoned OpenCode PR integration. OpenCode Go
remains the separately selected frontend presentation worker.

## Approved dev protection

The user approved **mandatory checks** for `dev`, with zero required formal
approvals. PRs remain required; both checks must succeed on the current head:

| Required check | Expected source App | App ID |
| --- | --- | --- |
| `Kilo Code Review` | `kilo-code-bot` | `2193792` |
| `validate` | `github-actions` | `15368` |

The separate active `dev` ruleset uses
`strict_required_status_checks_policy=true` (branch up to date) and
`do_not_enforce_on_create=false`. It retains thread resolution, deletion and
non-fast-forward protection. The existing user bypass entry is preserved but
must not be exercised. The coordinator applied and verified active `dev`-only
[ruleset `26377556`](https://github.com/Ljrr3045/rielia/rules/26377556), with zero
required approving reviews and code-owner review disabled. Effective branch/API
readbacks confirmed the App-bound checks; `gh pr checks 26 --required` recognized
both prior-head checks as passing. No bypass was used. This documentation worker
does not apply rules or alter credentials.

After verifying `dev` protection, the coordinator narrowed prior
[ruleset `25810056`](https://github.com/Ljrr3045/rielia/rules/25810056) to `main`
only, preserving its original rules including formal approval. Zero
required approvals on `dev` does not waive current-head review, findings handling,
thread resolution, CI, or coordinator merge ownership. Do not add an auto-approve
action, expand `GITHUB_TOKEN` permissions, introduce a PAT, or use bypass.

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
not required by the accepted `dev` policy.

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
   current-head SUCCESS for both required check names and expected source Apps,
   plus the branch's up-to-date state. An eye reaction or old summary is insufficient.
2. Inspect issue comments, submitted reviews and inline comments. The coordinator
   analyzes every finding, fixes valid issues with evidence and records concise
   technical dispositions. Resolve required threads; a reply is not a documented
   rerun or completion mechanism.
3. After any push, rerun affected checks and wait for both fresh checks and Kilo
   completion on the new head. Missing, failed, cancelled, incomplete or
   prior-head-only review blocks merge. No legacy Kody trigger or invented command.
4. Verify the applicable branch rules without using bypass. `dev` requires zero
   formal approvals; `main` retains its existing approval rules. Only the
   coordinator merges after checking feedback and all required evidence.

For prose-only changes, run `python3 scripts/verify-handoff.py`,
`git diff --check` and `git diff --cached --check`, inspect scope and root guidance
length. Application suites are inapplicable. Current PR/check evidence is recorded
in [progress](progress.md) and the PR body; no deployment or product acceptance is
claimed.
