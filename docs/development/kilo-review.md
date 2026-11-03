# Native Kilo Code Reviews

Decision dates: 2026-11-02 (reviewer/protections), 2026-11-03 (draft batching/PR admission).
Scope: T00 repository-governance maintenance. No product
P/US or UI acceptance changes; no T01–T35 ticket is completed. Native Kilo Code
Reviews replaces Kody and the abandoned OpenCode PR integration. OpenCode Go
remains the separately selected frontend presentation worker.

This is the authoritative review policy for all new changes. Every legacy Kody
trigger or requirement to use Kody for future reviews in older development guides is obsolete,
even when phrased as an instruction. Dated notices mark those guides for readers
who open them directly. This supersession affects review governance only;
historical review evidence, runtime guidance and product scope are preserved.
The [portable PR review playbook](pr-review-playbook.md) provides a reusable
checklist; this document remains authoritative for Rielia's settings and evidence.

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
list. [PR #28](https://github.com/Ljrr3045/rielia/pull/28) retained the main-into-dev
ancestry through a **merge commit**; preserve that ancestry in later integrations.

## Native setup and observed evidence

On 2026-11-02, the coordinator verified the connected GitHub App and global settings:
AI review enabled for all 23 App-accessible repositories, including available
Rielia; DeepSeek V4.1 Flash 1017, Thinking Max; Balanced; PR Gate Threshold
**Warnings and above**; **Use REVIEW.md OFF**, **Skip Bots ON**, Advanced OFF.
Unsaved UI exploration was discarded by reload. Draft batching does not change those
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
results do not approve later heads.

PR #28's final source head `5be7aae6c8e63a36333480c2386b7f130a755f4a` passed
[validate](https://github.com/Ljrr3045/rielia/actions/runs/41485473282/job/125414972576)
(App `15368`) and [Kilo](https://app.kilo.ai/code-reviews/5a40b954-1ced-475a-9963-3dba3e874072)
(check `125414538453`, App `2193792`) before merging to `dev` on 2026-11-02 at
16:59:22 UTC as `13d0029aa87262af1560e1bc1ba3312d30f6da6e`. Its
[post-merge validate](https://github.com/Ljrr3045/rielia/actions/runs/41486779176/job/125419130069)
also passed. These are historical results, not draft-batching adoption evidence.

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

## Collaborator-only PR admission

On 2026-11-03, the user approved persistent **Collaborators only** PR submissions.
At 22:52:03 UTC, the sole repository-setting update was
`pull_request_creation_policy=collaborators_only`; independent GitHub readback at
22:52:23 UTC confirmed that value, `has_pull_requests=true` and public visibility.
The repository remains publicly readable, but external users cannot create PRs
to any base branch. See [GitHub's access policy](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/disabling-pull-requests)
and [REST contract](https://docs.github.com/en/rest/repos/repos#update-a-repository).

Before/after paginated audits found only `Ljrr3045` (ID `98565958`, admin) as a
collaborator, no invitations and all 31 existing PRs authored by him. PR #31
remained Draft at `ddb685d0da13f7b313f30286e062cc1cadfd0124`. This is a
collaborator gate, not a fixed username allowlist: future collaborator invitations
expand who can create review-bearing PRs and require a deliberate user decision.
Reopening external submissions or transferring ownership likewise needs a new
decision; after revocation, inspect that person's existing PRs.

The inspected [native Kilo handler](https://github.com/Kilo-Org/cloud/blob/fe50ac74d4af02555b9b1bfeab37cabb8a7d3356/apps/web/src/lib/integrations/platforms/github/webhook-handlers/pull-request-handler.ts#L74-L437)
has no human-author allowlist. GitHub admission provides the upstream control;
Draft batching alone does not prevent outsider PR spend. The creation setting
does not establish that pre-existing outsider PR synchronization/Ready/reopening
is blocked, cancel queued/running Kilo work or undo spent credits. No outsider PR
was found in either audit, but queued-job absence was not established. Report
unexpected external PRs immediately for coordinator containment/job inspection;
closing a PR is not verified cancellation. No paid outsider test was performed.

## Manually controlled draft batches

On 2026-11-03, the user approved **Draft → complete commits/checks → Ready** for
this governance bootstrap and future development. This supersedes unconditional
non-draft opening. Native automatic review stays enabled; the coordinator controls
when its Ready event occurs. No dashboard change is needed if the documented
enabled setup remains in place. Beyond the PR creation policy above, no workflow,
ruleset, CODEOWNERS, App/Kilo setting, secret or token permission changes are included.

1. For initial publication, verify no PR exists for the branch, push prepared
   commits and immediately open one **Draft** PR to `dev`. Complete all remaining
   source/documentation commits, the real PR URL/progress update, applicable checks and base synchronization
   while Draft. CI remains automatic and required on normal PR/push events.
   Before every push to an existing PR, the worker verifies its actual draft
   state; if it is not Draft, stop and ask the coordinator. Do not push while
   Ready or during a live review.
2. The coordinator verifies the complete batch, current-head CI, up-to-date base
   and absence of a paid Kilo review during draft opening/pushes. If live behavior
   differs, stop Ready transitions and report the discrepancy without weakening
   gates. Freeze the head, record the SHA and transition time, then the coordinator
   marks Ready **once** for that completed new-head batch.
3. Wait for the requested Kilo round to finish. The coordinator inspects all
   feedback, triages findings and delegates valid fixes together. After completed
   review, the coordinator converts the same PR to Draft **before** corrective
   pushes. The assigned worker batches fixes, documentation, base updates and
   affected checks; the coordinator verifies/freezes that new head and marks Ready
   once for the next round. Final review/delivery is non-draft.
4. Any later push, including documentation or base-update commits, invalidates
   older acceptance and requires this cycle again. Record final review evidence
   in the PR body or external delivery report without adding a source commit after
   final review. Only the coordinator controls Draft/Ready transitions and merges.

This cadence is supported by official documentation and public source pinned to
Kilo-Org/cloud commit `6028971e06143007a764a7d473ff5e543934786d`:

- The [native PR handler](https://github.com/Kilo-Org/cloud/blob/6028971e06143007a764a7d473ff5e543934786d/apps/web/src/lib/integrations/platforms/github/webhook-handlers/pull-request-handler.ts#L74)
  exits for drafts before review creation or cancellation, accepts `ready_for_review`,
  creates the native check on the PR head and deduplicates existing same-SHA runs.
  **Draft conversion does not cancel in-flight work**; repeated same-SHA toggles
  are not a reliable rerun. Failed/cancelled same-SHA rounds need separately verified
  supported native retry behavior; do not manufacture commits or statuses.
- [Payload preparation](https://github.com/Kilo-Org/cloud/blob/6028971e06143007a764a7d473ff5e543934786d/apps/web/src/lib/code-reviews/triggers/prepare-review-payload.ts#L687)
  can use prior completed review context for incremental/recheck rounds. The handler
  can also reuse covered merge-only verdicts; a new green icon does not prove a fresh
  full model pass. Inspect coverage and the requested round's details.
- Fresh [dashboard manual jobs](https://github.com/Kilo-Org/cloud/blob/6028971e06143007a764a7d473ff5e543934786d/apps/web/src/lib/code-reviews/manual-code-review-jobs.ts#L266)
  dispatch without native check creation, and the [completion guard](https://github.com/Kilo-Org/cloud/blob/6028971e06143007a764a7d473ff5e543934786d/apps/web/src/app/api/internal/code-review-status/%5BreviewId%5D/route.ts#L1046)
  skips GitHub updates without a check ID. A dashboard report cannot substitute for
  the required native check. No native `@kilocode-bot /review` check trigger is
  verified; conversational mentions and local `/review` do not establish one.

These are source findings, not an attestation of deployed code. Live adoption
still requires coordinator observation of draft events without paid review,
one Ready transition/native round per completed new-head batch, correct App/SHA
checks and merge-box recognition. [Progress](progress.md) records actual versus
pending evidence. Missing Kilo while Draft is an expected **closed merge gate**.
The approved GitHub collaborator admission gate above replaces the pending author
decision. Coordinator batch/dashboard verification and Ready/native review proof
remain required; no deployed Ready/Kilo success is claimed by this update.

## Documented behavior

Official documentation consulted on 2026-11-02 and 2026-11-03:

- [GitHub Code Reviews](https://kilo.ai/docs/automate/code-reviews/github) documents
  native App setup and automatic review on non-draft opening, pushes, reopening
  and marking ready; draft opening is skipped. Summaries may update in place.
  Its general push-cancellation description does not override the pinned draft
  guard above; never rely on Draft to cancel a live review.
- [Code Reviews overview](https://kilo.ai/docs/automate/code-reviews/overview)
  documents **Use REVIEW.md**: root [REVIEW.md](../../REVIEW.md) comes from the PR
  base branch, with a 10,000-character limit. This PR cannot supply its own active
  base-branch guidance before merge. Local `/review` does not establish a GitHub
  comment command; bot-authored PRs are skipped by default.

## Acceptance and merge evidence

1. Finish the Draft batch and applicable checks, then report the exact PR/head
   to the coordinator. Record the Ready transition URL/time and requested Kilo
   run/check ID. Wait for that requested round, including a supported retry;
   an earlier green result cannot satisfy a queued/incomplete new request.
2. Verify completed current-head SUCCESS and source Apps for both checks on `dev`,
   or `validate` on `main`, plus an up-to-date branch. Inspect all runs, including
   failed/cancelled ones, and the PR's effective required checks/merge box. Retain
   the Kilo-reviewed source SHA and CI's PR/head or synthetic merge association;
   [GitHub distinguishes these checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks).
   An eye reaction, prior-head check or old mutable summary is insufficient.
3. Inspect check summaries/annotations, issue comments, submitted reviews and inline
   comments/threads. Kilo SUCCESS can contain warnings. The coordinator
   triages findings, delegates valid fixes to the assigned worker, verifies evidence
   and records concise dispositions. The assigned worker implements fixes and
   reruns affected checks. Resolve required threads; a reply is not a documented
   rerun or completion mechanism.
4. Batch valid fixes through Draft before the coordinator requests the next round.
   After any push, rerun affected checks and require the new head's results,
   including completed Kilo feedback for `dev`. Missing, failed, cancelled,
   incomplete or prior-head-only required evidence blocks merge. No legacy Kody
   trigger or invented command.
5. Verify the core gates with no bypass. For another author, require `Ljrr3045`'s
   current-head `APPROVED` review; for his own PR, record the permitted approval-only
   exception and author/merger evidence. Check base-file activation and resolved
   threads, final non-draft state and unchanged head immediately before merge.
   Only the coordinator merges after all required evidence is satisfied.

For prose-only changes, run `python3 scripts/verify-handoff.py`,
`git diff --check` and `git diff --cached --check`, inspect scope and root guidance
length. Application suites are inapplicable. Current PR/check evidence is recorded
in [progress](progress.md) and the PR body; no deployment or product acceptance is
claimed.
