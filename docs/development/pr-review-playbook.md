# PR admission and review playbook

Use this checklist to adapt controlled review batches to another project.
[Rielia's policy](kilo-review.md) holds its actual settings, App IDs and historical
evidence; do not copy those values as defaults. Verify each new repository and
provider independently before enabling review that consumes credits.

1. **Choose admission deliberately.** Decide whether external PR submissions are
   required. Collaborators-only admission preserves public reading but excludes
   outsider PR creation across all bases. Obtain approval for that contribution
   impact; keep PRs enabled. Audit the effective setting, collaborators, invitations
   and all existing PR authors before/after a change. New collaborators broaden
   admission. Treat invitations, ownership transfers and reopening submissions as
   deliberate decisions. A creation gate does not establish that existing outsider
   PR events or queued/running reviewer jobs stop; inspect them separately and
   report unexpected external PRs before claiming containment.
2. **Verify the provider contract.** Establish enabled repository scope, author/bot
   gates, draft-event behavior, Ready triggers, native check creation, retries,
   deduplication, cancellation and full/incremental coverage. Inspect primary
   evidence and authorized live observations: static source alone does not attest
   deployed behavior. A dashboard report, comment command or green icon cannot be
   assumed to publish the required native check. Authorize a bounded first live
   observation where needed; keep adoption unverified until it passes, and hold
   merge whenever admission or required-check evidence is missing.
3. **Prepare one complete Draft batch.** Use an isolated worktree and focused
   branch. With no existing PR, publish prepared commits and immediately open one
   Draft PR. Complete implementation, documentation, real PR URL, local checks,
   automatic required CI and base synchronization while Draft. Verify actual
   Draft before every PR-associated push; stop and ask the coordinator otherwise.
   The coordinator verifies the whole batch and no unintended paid review,
   settles any active work, freezes the head and marks Ready once. Do not push
   while Ready or during live review.
4. **Handle completed feedback together.** Record request time/run ID, reviewed
   SHA, native check name/source App and actual coverage. Wait for the requested
   round to complete; inspect all runs, summaries/annotations, issue comments,
   submitted reviews and inline threads. The coordinator triages every finding,
   returns the completed round to Draft and delegates valid fixes as one batch.
   Repeat checks/base sync and one coordinator Ready transition at the new head.
   Any source push, including docs/base updates, invalidates older acceptance.
5. **Verify merge acceptance.** Require the unchanged current head, correct base,
   effective required checks, completed review, up-to-date branch, resolved valid
   findings/threads and applicable maintainer approval. Record CI's event and
   actual source or synthetic merge checkout separately from the reviewed SHA.
   Final delivery is non-draft; only the coordinator merges. Record final evidence
   in PR metadata or the delivery report without another source commit.
6. **Finish cleanup.** Verify the PR is merged, preserve the report/evidence and
   confirm a clean worktree. Settle only task-owned resources, then remove the
   completed worktree through the project's workspace tooling. Workers never
   delete their active checkout or another worker's resources.

Do not change settings, invitations, Apps, secrets, token permissions, required
checks or bypass rules without explicit scope. Missing, failed, cancelled,
incomplete or older-head evidence keeps merge blocked; never fabricate success.
Maintainer ownership/approval and bot/main-branch policies need their own evidence.

For each batch, record: repository/author; dated admission/roster/invitation audit;
PR/Draft readback; frozen head/base; request/transition time; reviewer run/check
URL/App/SHA/coverage; CI run/event/checkout; findings/dispositions/threads; approval
or explicitly permitted exception; final merge/cleanliness/resource/report evidence.
