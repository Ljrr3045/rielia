# Delivery progress and decisions

Updated: 2026-10-24. This is repository delivery tracking, separate from the
unchanged [handoff](../handoff/00-START-HERE.md). Plans describe intended outcomes,
not completed implementation. This checkout has no app, scaffold, deployment, or
software release. The coordinator owns integration and status across workers.

## Current delivery

| Field | Evidence/state |
| --- | --- |
| Scope | T00 onboarding/governance plus coordinator-authorized OpenCode model-scope repair |
| Base | `origin/dev` at `188a760c36f8ec6d09f10f5027d162facce13875` |
| Branch | `Ljrr3045/rielia-t00-onboarding` |
| Worktree | Isolated Orca checkout named `rielia-t00-onboarding` |
| PR | [#1](https://github.com/Ljrr3045/rielia/pull/1), target `dev`, non-draft; coordinator merge only |
| T00 | In review: import/docs and local validation complete; coordinator acceptance/merge pending |
| T01–T35 | None complete; T02.0 fixture in progress separately (coordinator report); remaining full tickets not started |
| Automated review | Latest-head run/status and dispositions tracked in [PR review evidence](https://github.com/Ljrr3045/rielia/pull/1); recheck after each push |

T00 acceptance: complete byte-identical import with links/assets/hashes/proposal
status; practical repository instructions and docs; truthful dependency/state
tracking; passing whitespace/integrity checks; one non-draft PR to `dev`; latest
head review handled with successful checks. The coordinator authorized a narrow
workflow exception to restore that review; no app/scaffold scope was added.
Merge remains the coordinator's step.

## Coordinated work outside T00

The coordinator reported T02.0 in progress in a separate `rielia-b0-fixture`
worktree (Orca task `task_cfe35a018420`). Its bounded scope is an executable
Next/Nest/pnpm fixture and checks to support the spikes and partial T04 tooling.
This is not full T02/T03/T04 completion or stack ratification. T00 has not
validated that worker's files/results. Its PR must wait until this T00 PR is
reviewed and merged; integration and any dependency exceptions belong to the
coordinator. License, stack, and OAuth user answers remain pending.

## Dependency-based first wave

The T02.0 supporting fixture is already dispatched separately. After T00 is
accepted, the coordinator can assign/continue these bounded starts:

1. **T01 / B0, UX prototype:** no ticket prerequisite. Select a real project/backlog
   and review the five mobile/desktop journeys and friction. Use P/US and UXR/UX
   criteria; this is prototype validation, not a complete app or landing design.
2. **T02 / B0, identity/proxy spike:** no ticket prerequisite, but stack confirmation
   and provider credentials/callbacks are pending. Record pinned versions and real
   Google/GitHub, private-email, session, expiry/logout, and HTTPS/proxy evidence.
   An offline/mocked result cannot complete its real OAuth acceptance.
3. **T03 / B0, local MCP portion:** can be scoped separately from remote auth once
   the stack choice is resolved; one terminal client reads bounded data and records
   versions. Its remote discovery/auth portion depends on T02. Coordinator must
   record any split; this document does not remove the dependency or complete T03.

Convergence: T02 + T03 → T04 → **T35** → T05 → T06. The principal/authorship model
must precede workspaces/tasks/credentials despite T35's number. T01 supplies UI
evidence; the B0 exit still requires the reviewed prototype and technical vertical.
No scaffold is authorized in T00. The full source acceptance remains in
[Architecture §7.3](../handoff/02-architecture-technical-plan.en.md#73-execution-ready-engineering-backlog).

## Ticket ledger

`Not started` means no full-ticket implementation or acceptance evidence is
recorded here. T02.0's reported start does not satisfy the full identity spike.
Dependencies below reproduce the plan, not inferred completion. B labels
are internal sequencing; T30–T34 form a separate future marketing track. T35 is a
foundational prerequisite within the B1 track, not the final ticket to execute.

| Ticket | Internal batch/track | Planned outcome | Dependencies | State |
| --- | --- | --- | --- | --- |
| T00 | Pre-B0 governance | Import, instructions, contribution/review process, ledger, authorized review repair | None | In review, PR #1; coordinator acceptance/merge pending |
| T01 | B0 | Navigation and task prototype validation | None | Not started |
| T02 | B0 | Identity/proxy integration spike | None; stack/OAuth decisions pending | In progress: T02.0 fixture elsewhere; full spike unverified |
| T03 | B0 | MCP SDK/wrapper/minimal remote profile spike | T02 for remote auth; stack decision pending | Not started |
| T04 | B1 foundations | Monorepo, images, worker/queue, initial migration | T02–T03 | Not started as full ticket; T02.0 supports partial tooling |
| T05 | B1a | Auth, workspaces, principal memberships | T04, T35 | Not started |
| T06 | B1a | Projects/tasks, versions, idempotency, atomic activity/outbox | T05 | Not started |
| T07 | B1b | Invitations, revocation, roles/private projects | T06 | Not started |
| T08 | B1b | List/Kanban, filters, ranking | T06 | Not started |
| T09 | B1b | Subtasks, checklists, comments, history | T06 | Not started |
| T10 | B1b | Search, My tasks, responsive layout, SSE | T07–T09 | Not started |
| T11 | B1c | Sprint lifecycle and scope history | T08–T09 | Not started |
| T12 | B1c | Personal/service credentials, explicit-subject grants | T07, T35 | Not started |
| T13 | B1c | Local MCP catalog/client/guide | T03, T11–T12 | Not started |
| T14 | B1d | JSON/CSV export and archive recovery | T09, T12 | Not started |
| T15 | B1d | Private deployment, backups, runbook | T04, T13–T14 | Not started |
| T16 | B1d | Two real work cycles, contribution readiness | T10–T15 | Not started; T00 docs do not complete it |
| T17 | B2a | RLS, quotas, registration hardening | T16 | Not started |
| T18 | B2a | Private attachments/storage driver | T17 | Not started |
| T19 | B2a | Inbox/mentions/SMTP via durable outbox/worker | T09, T15, T17 | Not started |
| T20 | B2b | Remote OAuth MCP and reviewable ChangeSets | T03, T12–T13, T17 | Not started |
| T21 | B2b | Saved views, table/calendar, guest, batches | T17, T19 | Not started |
| T22 | B2b | Dependencies and sprint reports | T11, T17 | Not started |
| T23 | B2b | CSV/JSON import, dry run/deduplication | T14, T19 | Not started |
| T24 | B2b launch readiness | Single-launch operations/accessibility/compatibility verification | T18–T23, T35; T34 for marketing | Not started |
| T25 | B3 | Epics, milestones, roadmap | T24 and actual demand | Not started |
| T26 | B3 | Typed fields and templates | T24 and actual demand | Not started |
| T27 | B3 | Automation and recurrence | T19, T26 | Not started |
| T28 | B3 | GitHub and outgoing webhooks | T19, T24 | Not started |
| T29 | B3 | Time/workload/docs/specific importers; split by capability | T24 and actual-use evidence | Not started |
| T30 | Marketing (future) | Integrate selected brand assets/tokens | T04; kit and identity review | Not started |
| T31 | Marketing (future) | ES/EN landing with stable CTA | T30 | Not started; implementation outside T00 |
| T32 | Marketing (optional capture) | Confirmed leads/backend/worker/SMTP | T04, T31 | Not started; no waitlist/access staging |
| T33 | Marketing (future) | Metadata, localized SEO, minimal measurement | T31; T32 if capture active | Not started |
| T34 | Marketing launch gate | Verify/enable public marketing launch | T31, T33; T32 if capture active | Not started |
| T35 | B1 foundations | Principal model, immutable authorship, autonomous memberships | T04; precedes T05/T06/T12 | Not started |

Public release is one launch followed by continuous updates. Internal B1 readiness,
private T15 deployment, and marketing T34 do not substitute for T24. B3 follows
actual use/demand; no launch date or public capacity has been established.

## Decisions and blockers

| Item | Current status | Owner / next evidence |
| --- | --- | --- |
| License | Pending user answer; Apache-2.0 remains a proposal; no LICENSE adopted | User/maintainer records selection and notice/dependency review |
| Stack | Pending user confirmation; Next/Nest/PostgreSQL/Prisma/Better Auth remain proposed, untested together | User decision, then T02/T03 pinned-version compatibility evidence |
| OAuth credentials/callbacks | Pending user/operator configuration; no secrets in repository | Installation operator provides through secret configuration; real provider smoke in T02 |
| Name/logo and identity | Rielia working name and v0.1 kit remain proposals, not final approval | User/brand review; availability not recertified by import |
| Landing | Current request is design planning for later development; no final design approved | Separate authorized design/implementation scope; use document 05 |
| Launch | One public launch, continuous updates; no access calendar/waitlist | Maintainer verifies T24 and applicable T34 checks before public access |
| Principal/authorship | Fixed invariant: delegated user is author; autonomous Agent has own identity; creator/assignee separate | T35 then relevant API/web/MCP/isolation evidence |
| Private-project admin visibility | Plan proposes owner/admin can read/administer all projects; requires B0 decision | User/maintainer ratification; communicate before implementation |
| Operations/public service | VPS capacity, budget/date, registration policy, public obligations not established | Maintainer records decisions and measured readiness in later tickets |
| Automated review | Latest-head evidence in PR #1; failure is a delivery blocker, never clean review | Worker inspects checks and all three review surfaces; coordinator handles infrastructure blockers |
| Review workflow exception | Coordinator explicitly authorized model env-scope repair in PR #1 after run 40140474241 failed before review | Retain fallback/override, triggers, permissions, provider restriction, credentials handling, and review-only prompt; require a real new-head review |

Pending product decisions do not block the bounded T00 import/governance work.
Record coordinator answers here without changing the historical source proposals.
No credentials should be pasted into this ledger, PR comments, or validation logs.

## Validation and PR evidence

- Import: 47 files and four subdirectories copied; 2,435,020 bytes. Source-relative
  names/hashes captured before copy; source and destination rechecked immediately
  after copy. See [import record](handoff-import.md) and [inventory](handoff-files.sha256).
- `python3 scripts/verify-handoff.py --source <original-directory>`: passed,
  including direct byte/directory comparison, all 47 inventory entries, 30 asset
  manifest hashes/sizes, and 272 local file links across 34 documents.
- Verifier portability/rejection checks in a disposable copy: passed from an
  unrelated working directory; altered asset, extra imported file, and broken
  local link correctly rejected. The original source was untouched.
- `git diff --check` and `git diff --cached --check`: passed at the import checkpoint.
  Review workflow was initially unchanged; the later coordinator-approved model
  env-scope repair is documented below. High-confidence credential-pattern scan
  found no matches; this is a bounded scan, not a comprehensive security audit.
- Coordinator independently reported the same direct-source/hash/asset/link
  results and no blocking documentation findings at the pre-PR checkpoint.
- Initial head `0fc9b80fb10444e05d8d98749a702de18f008f75` failed [OpenCode run
  40140474241](https://github.com/Ljrr3045/rielia/actions/runs/40140474241) before
  review: step-sibling env lookup produced `opencode-go/` and whitelist `[null]`.
  All three comment/review surfaces were empty at that checkpoint. This was a
  blocker, not a clean review. Coordinator authorized moving model resolution to
  job env scope in the same PR, with the existing review restrictions retained.
- Workflow repair validation: Ruby/Psych YAML parse and semantic comparison
  passed; moving model resolution from step to job env is the sole workflow
  behavior change. Synthetic unset/empty-secret fallback and model override
  checks produced matching config/action model strings and string whitelists.
  Triggers, concurrency, job guards, timeout, permissions, secret handling,
  provider restriction, and review-only prompt are identical to the base.
  `actionlint` is not installed; actual new-head review remains required. GitHub's
  [env syntax documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#env)
  explains why sibling env definitions cannot reference each other. No secret
  values were read or printed; fallback/override reasoning uses synthetic inputs.
- [Non-draft PR #1 to dev](https://github.com/Ljrr3045/rielia/pull/1) is the single
  T00 PR. Its review evidence section records the final head/run and inspection of
  issue comments, submitted reviews, inline comments, and technical dispositions
  before worker handoff. Check current PR evidence; this file does not assert
  successful review merely because a PR exists.
- Application, OAuth, runtime, UI, database, recovery, load, accessibility, and
  deployment tests: not run; no application exists in T00. No remote URL/heading
  fragment validation or fresh stack/brand research claimed.

The PR's checks/comments supply current-head evidence without a self-referential
commit hash in this file. After a pushed fix, this record's prior review evidence
does not imply review approval of the new head; wait for the synchronize run.
