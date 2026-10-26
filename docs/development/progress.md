# Delivery progress and decisions

Updated: 2026-10-26 UTC. This is repository delivery tracking, separate from the
unchanged [handoff](../handoff/00-START-HERE.md). Plans describe intended outcomes,
not completed implementation. This checkout has the T02.0 fixture, merged T02.1/
T02.2 identity experiment, and a fictional T01/B0 task-prototype logic adapter plus
its responsive presentation, plus the T03.0 experimental local MCP health wrapper.
It has no production task product, deployment, or
software release. The coordinator owns integration and status across workers.

## Current delivery

| Field | Evidence/state |
| --- | --- |
| Scope | T03.0/B0 bounded local stdio transport, one experimental public process-liveness tool; architecture §5/T03. P12/P13/P21/P38 and US10/17/24/25 constrain future catalog/auth work and are not completed. No task data, credentials, remote transport or domain policy |
| Base | `origin/dev` at PR #6 merge `a869e317fd05e87d9afd62597842e5fc125e57ee` |
| Branch | `feat/t03-local-mcp`; purpose prefixes without usernames are the user convention |
| Worktree | Isolated Orca checkout `feat-t03-local-mcp`; sole logic owner Codex `gpt-6.1-sol`, `xhigh`, no subagents. Coordinator corrected Orca's automatic username prefix before development |
| Current PR | [#8](https://github.com/Ljrr3045/rielia/pull/8), one non-draft English PR to `dev`; current-head CI, coordinator Kody trigger and review dispositions are recorded in the PR before delivery |
| T01 presentation PR | [#6](https://github.com/Ljrr3045/rielia/pull/6) merged 2026-10-25T08:13:36Z as `a869e317fd05e87d9afd62597842e5fc125e57ee`; reviewed head `043c4507eb385e43720849f43fc1812f43689ce0`, [Kody approval 5642187480](https://github.com/Ljrr3045/rielia/pull/6#pullrequestreview-5642187480), [CI 40175255312](https://github.com/Ljrr3045/rielia/actions/runs/40175255312). Fresh GitHub reads confirm PRs #5/#7/#6 all merged; full T01/B0 real-user acceptance remains open |
| T01 logic PR | [#5](https://github.com/Ljrr3045/rielia/pull/5) merged 2026-10-25T06:01:32Z as `5099b39aef53d5b7e2f0205f3168727cb1dc9471`; reviewed head `55481ffb3613ccaadcb37f3e6dd3ad3118afb8c3`, [Kody approval 5641785181](https://github.com/Ljrr3045/rielia/pull/5#pullrequestreview-5641785181), [CI 40166748588](https://github.com/Ljrr3045/rielia/actions/runs/40166748588); logic worktree removed |
| T01 context PR | [#7](https://github.com/Ljrr3045/rielia/pull/7) merged 2026-10-25T07:25:09Z as `bfaf24d790daa2cebd1a92a5ecc5b3f9bbea6e3f`; reviewed head `c90b437ca5948301b790b655256c8a460b3bef21`, [Kody approval 5642060409](https://github.com/Ljrr3045/rielia/pull/7#pullrequestreview-5642060409), [CI 40172013213](https://github.com/Ljrr3045/rielia/actions/runs/40172013213) |
| T02.2 PR | [#4](https://github.com/Ljrr3045/rielia/pull/4) merged 2026-10-25T02:57:42Z as `ae67fcc321a0cbb152a0137141d8d6a05abae631` after reviewed head `f9c4cc70e51cadf7722dcac775b402f926fbf9a8`, [Kody approval 5641248403](https://github.com/Ljrr3045/rielia/pull/4#pullrequestreview-5641248403), and [CI 40156199016](https://github.com/Ljrr3045/rielia/actions/runs/40156199016); live PR evidence reread during this reconciliation |
| T02.1 PR | [#3](https://github.com/Ljrr3045/rielia/pull/3) merged 2026-10-25T02:33:47Z as `096a1a31bd45a536017bffb4a424cd4c50062101` after reviewed head `b0dc76a062f301433b25fcf583f28aa125602eb3`, Kody approval [5641185728](https://github.com/Ljrr3045/rielia/pull/3#pullrequestreview-5641185728), and CI run [40154146443](https://github.com/Ljrr3045/rielia/actions/runs/40154146443) |
| Fixture PR | [#2](https://github.com/Ljrr3045/rielia/pull/2) merged 2026-10-25T01:10:25Z as `629932ad282c27c0b71c6b8d5daf15e3cc199965`; [Kody approval](https://github.com/Ljrr3045/rielia/pull/2#pullrequestreview-5640882613), [CI](https://github.com/Ljrr3045/rielia/actions/runs/40148711191) |
| T00 | Complete: [PR #1](https://github.com/Ljrr3045/rielia/pull/1) merged 2026-10-24T23:56:43Z as `8dd7c31f454c1989d017dbf7b40e6646112d2d2a` after final-head Kody SUCCESS/APPROVED |
| T01–T35 | No full ticket complete; T01 logic and presentation are bounded partial evidence only |
| Prior resource cleanup | Coordinator reports all prior completed worktrees removed, preview stopped and evidence preserved outside the repository; current worker never deletes its active checkout |
| Automated review | Kody AI: coordinator alone posts exact root `@kody start-review` for each ready head; prior-head evidence never approves changed code |

T00 acceptance: complete byte-identical import with links/assets/hashes/proposal
status; practical repository instructions and docs; truthful dependency/state
tracking; passing whitespace/integrity checks; one non-draft PR to `dev`; latest
head Kody review handled with passing applicable checks. The user retired OpenCode
and requested deletion of its entire workflow, including the inherited version.
The coordinator alone posts each ready head's Kody trigger and merges after
validation and feedback handling. T00 itself added no app/scaffold scope; its
final Kody approval covered head `53243fbea2ae6c4f5a1ab3e47d6e1dc8cc296cec`.

## T02.0 technical fixture

T02.0 (Orca task `task_cfe35a018420`) adds an executable Next/Nest/pnpm fixture
after the coordinator's explicit T00-merged authorization. It includes a bilingual
development page, live/API-down status, Nest liveness endpoint, shared public
health contract, strict TypeScript, lint/build/typecheck/HTTP smoke, and CI with
handoff integrity plus dependency advisory checks. The root/three workspace
packages contain only used tooling/dependencies. See the
[fixture guide](technical-fixture.md) for exact versions, primary research,
commands, boundaries, and detailed evidence.

It uses Node 24.22.1 LTS, pnpm 12.15.0, Next 16.4.3/React 19.3.1, Nest 12.2.0
with Express 5.3.0, TypeScript 6.0.3, and ESLint 10.13.0. A scoped Multer 2.5.0
override addresses the Nest adapter's affected 2.4.0 pin
([GHSA-q7qp-rjg7-q26m](https://github.com/expressjs/multer/security/advisories/GHSA-q7qp-rjg7-q26m)).
Audit subsequently reported no known vulnerabilities. Source handoff and inventory
baselines are preserved; the retired OpenCode workflow is not restored.

This was not full T02/T03/T04 completion or complete stack ratification. At T02.0 no
DB/schema, identity, OAuth, worker/queue, MCP, sprint, deployment, or product
functionality is implemented. License, complete stack, and OAuth user answers
remain pending. UI DOM checks are bounded: screenshots and native Tab traversal
were unreliable in the background Orca browser and remain unverified, not passed.

## Dependency-based first wave

T00, T02.0, T02.1 and T02.2 are accepted/merged. The user resumed development on
2026-10-25 with the bounded T01/B0 fictional prototype, keeping logic/presentation
ownership separate. The coordinator can
assign/continue these bounded starts without bypassing their source acceptance:

1. **T01 / B0, UX prototype:** no ticket prerequisite. Select a real project/backlog
   and review the five mobile/desktop journeys and friction. The authorized
   fictional slice has merged logic/context (PRs #5/#7) and presentation (PR #6);
   its demo journeys are not real-project or real-person evidence. Use
   P/US and UXR/UX criteria; this is prototype validation, not a complete app or
   landing design.
2. **T02 / B0, identity/proxy spike:** no ticket prerequisite, but stack confirmation
   and provider credentials/callbacks are pending. Record pinned versions and real
   Google/GitHub, private-email, session, expiry/logout, and HTTPS/proxy evidence.
   An offline/mocked result cannot complete its real OAuth acceptance.
3. **T03 / B0, local MCP portion:** coordinator explicitly authorized the reversible
   T03.0 diagnostic-only stdio split on the provisional stack while the user answer
   remains pending. The [local MCP guide](local-mcp.md) records bounded public
   liveness, exact versions, real terminal-client and negative/lifecycle evidence.
   Remote discovery/auth still depends on real T02; this split completes no full T03.

Convergence: T02 + T03 → T04 → **T35** → T05 → T06. The principal/authorship model
must precede workspaces/tasks/credentials despite T35's number. T01 supplies UI
evidence; the B0 exit still requires the reviewed prototype and technical vertical.
T02.0 is separately authorized supporting scope, not T00 expansion. Full source acceptance remains in
[Architecture §7.3](../handoff/02-architecture-technical-plan.en.md#73-execution-ready-engineering-backlog).

## Ticket ledger

`Not started` means no full-ticket implementation or acceptance evidence is
recorded here. T02.0's fixture does not satisfy the full identity spike.
Dependencies below reproduce the plan, not inferred completion. B labels
are internal sequencing; T30–T34 form a separate future marketing track. T35 is a
foundational prerequisite within the B1 track, not the final ticket to execute.

| Ticket | Internal batch/track | Planned outcome | Dependencies | State |
| --- | --- | --- | --- | --- |
| T00 | Pre-B0 governance | Import, instructions, contribution/review process, ledger, Kody adoption/OpenCode removal | None | Complete, merged PR #1; final-head Kody success/approval |
| T02.0 | B0 supporting scope | Runnable Next/Nest fixture and partial T04 tooling | T00 merge gate | Complete bounded scope; merged PR #2 with Kody approval and passing CI |
| T02.1 | B0 experiment | Backend identity, minimal auth persistence, web protocol/state logic | Coordinator experimental gate; does not ratify full stack | Merged in PR #3; see [identity evidence](identity-spike.md) |
| T02.2 | B0 presentation | Experimental identity page consuming T02.1 hook | T02.1 merge; UI/UX ownership | Merged PR #4 with exact-head Kody approval and passing CI; see [identity presentation](identity-ui.md); real-provider/HTTPS and documented browser limits remain |
| T03.0 | B0 experiment | Runnable diagnostic-only local MCP stdio wrapper | Coordinator's provisional-stack experimental authorization | Implemented with SDK/Inspector evidence; checks/review tracked in current PR and [guide](local-mcp.md), without closing T03 |
| T01 | B0 | Navigation and task prototype validation | None | Bounded fictional frontend logic/context/presentation merged in PRs #5/#7/#6; [logic contract](task-prototype.md) and [presentation evidence](task-prototype-ui.md) record states, demo journeys, checks and limits. Full ticket and real-person validation remain incomplete |
| T02 | B0 | Identity/proxy integration spike | None; stack/OAuth decisions pending | T02.1/T02.2 are merged partial experimental evidence; real provider/staging acceptance remains open |
| T03 | B0 | MCP SDK/wrapper/minimal remote profile spike | T02 for remote auth; stack decision pending | Partial T03.0 local public liveness only; remote discovery/auth, product catalog/credentials and full acceptance remain open |
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
| Stack | Pending user confirmation; coordinator authorized reversible T02.1 evaluation of Better Auth/Prisma/PostgreSQL, without full stack ratification | User decision plus remaining real T02/T03 evidence; see [identity spike](identity-spike.md) |
| Local MCP split | Coordinator authorized T03.0 public health-only stdio on the existing provisional stack, before stack ratification | [Versions, actual terminal-client matrix and limits](local-mcp.md); no remote OAuth/credential/domain acceptance |
| Branch names | User requires `feat/**`, `fix/**`, `refactor/**`, `docs/**`, `chore/**`, `test/**` by purpose, never username prefixes | Worktree names correspond; coordinator renamed the empty Orca-created branch before development and verified `feat/t03-local-mcp` |
| OAuth credentials/callbacks | Pending user/operator configuration; no secrets in repository | Installation operator provides through secret configuration; real provider smoke in T02 |
| Name/logo and identity | Rielia working name and v0.1 kit remain proposals, not final approval | User/brand review; availability not recertified by import |
| Landing | Current request is design planning for later development; no final design approved | Separate authorized design/implementation scope; use document 05 |
| Launch | One public launch, continuous updates; no access calendar/waitlist | Maintainer verifies T24 and applicable T34 checks before public access |
| Principal/authorship | Fixed invariant: delegated user is author; autonomous Agent has own identity; creator/assignee separate | T35 then relevant API/web/MCP/isolation evidence |
| Private-project admin visibility | Plan proposes owner/admin can read/administer all projects; requires B0 decision | User/maintainer ratification; communicate before implementation |
| Operations/public service | VPS capacity, budget/date, registration policy, public obligations not established | Maintainer records decisions and measured readiness in later tickets |
| Automated review | Kody AI replaces OpenCode; every ready PR/head needs an explicit root `@kody start-review` request | Coordinator alone posts trigger; worker verifies reviewed head, issue comments, formal reviews, inline comments, and applicable checks |
| Development models | User's 2026-10-25 rule: UI/UX presentation uses OpenCode Go DeepSeek V4.1 Flash 1017 (`opencode-go/deepseek-v4.1-flash`, `max`); all logic uses Codex `gpt-6.1-sol` `xhigh`, including browser auth/data/hooks/proxy/tests | [Model evidence and limits](frontend-agent.md); verify effective sessions and isolated worktrees. User resumed bounded T01/B0 development after the model-only pause checkpoint; OpenCode development does not restore its retired review workflow |
| Completed worktree cleanup | User explicitly requested removal after PR merge and finished delivery, without recurring confirmation | Coordinator verifies merged PR, clean tree, and preserved evidence, safely stops/settles task resources, then removes via Orca; workers never delete active/coordinator checkouts |
| Retired reviewer | User explicitly requested full OpenCode workflow deletion, including the inherited version; no further repairs/runs or secret changes | Deletion merged in PR #1; keep it absent and preserve the historical handoff |

Pending product decisions did not block T00 and do not ratify the provisional fixture.
Record coordinator answers here without changing the historical source proposals.
No credentials should be pasted into this ledger, PR comments, or validation logs.

## T00 validation and merged PR evidence

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
  High-confidence credential-pattern scan
  found no matches; this is a bounded scan, not a comprehensive security audit.
- Coordinator independently reported the same direct-source/hash/asset/link
  results and no blocking documentation findings at the pre-PR checkpoint.
- Historical OpenCode runs failed before a completed review: [40140474241](https://github.com/Ljrr3045/rielia/actions/runs/40140474241)
  had invalid model configuration; [40140743384 attempt 2](https://github.com/Ljrr3045/rielia/actions/runs/40140743384/attempts/2)
  reached GitHub reaction/comment 403s after an earlier version-fetch failure.
  Coordinator-authorized configuration/permission repairs were locally validated,
  but are superseded by the user's retirement/removal decision.
- On head `fbc969eea29db86292340b4f09fb098932fb409e`, [run 40140951885](https://github.com/Ljrr3045/rielia/actions/runs/40140951885)
  posted a bot reaction, then waited on an unattended external-directory permission
  prompt. The coordinator cancelled it when the user paused work to replace the
  reviewer; it produced no completed review. That cancellation is historical
  evidence, not a clean review or a current OpenCode gate.
- Kody's [prior-head review 5640595445](https://github.com/Ljrr3045/rielia/pull/1#pullrequestreview-5640595445)
  covered `fbc969eea29db86292340b4f09fb098932fb409e`. Its [inline finding](https://github.com/Ljrr3045/rielia/pull/1#discussion_r4368936447)
  correctly identified mutable third-party action execution with a write-scoped
  token. The user-directed full workflow deletion removes that executable path;
  pinning a retired action is unnecessary. A substantive thread reply follows the
  pushed deletion. This prior-head review does not approve the replacement head.
- After reviewer replacement, direct-source/inventory comparison (47 files),
  manifest checks (30 assets), and local file links (272 across 34 documents) pass
  again. Worktree and staged whitespace checks pass; the retired workflow is
  absent. The final [Kody approval](https://github.com/Ljrr3045/rielia/pull/1#pullrequestreview-5640660780)
  applies to head `53243fbea2ae6c4f5a1ab3e47d6e1dc8cc296cec`, with `Kody Code Review`
  SUCCESS on the same head. PR #1 is merged as
  `8dd7c31f454c1989d017dbf7b40e6646112d2d2a`.
- [Non-draft PR #1 to dev](https://github.com/Ljrr3045/rielia/pull/1) is the single
  T00 PR. Its review evidence section records the final head/Kody round and inspection of
  issue comments, submitted reviews, inline comments, and technical dispositions
  before worker handoff. Check current PR evidence; this file does not assert
  successful review merely because a PR exists.
- At T00, application, OAuth, runtime, UI, database, recovery, load, accessibility,
  and deployment tests were not run; T00 contained no application. No remote URL/heading
  fragment validation or fresh stack/brand research claimed.

## T02.0 validation and PR evidence

- Clean temporary copy without `node_modules`, `dist`, or `.next`:
  `pnpm install --frozen-lockfile` and complete `pnpm check` passed with
  Node 24.22.1 / pnpm 12.15.0. The latter covers lint, strict typechecks,
  contracts/API/web production builds, and actual production HTTP smoke.
- Smoke confirms exact API health JSON, content type/no-store, no task route,
  bilingual web HTML, live API status, and API-down fallback. Temporary API/web
  processes are stopped in cleanup; the separate visual-check server and browser
  tab were also stopped/closed. No existing developer server is used or killed.
- `pnpm audit --audit-level=high` reported no known vulnerabilities after the
  scoped Multer patch. This is dated registry evidence, not a security guarantee.
- DOM checks: one main region; no horizontal overflow at 320/375/768/1440 and
  812×375 CSS px, or 375 px with 200% root text; button height ≥50 px. Computed
  light palette matched intended background. Screenshot stitching/theme capture
  and native Tab traversal were unreliable; no full visual/keyboard/AA acceptance
  is claimed. See the fixture guide for exact limitations.
- Post-T00 integration adds `python3 scripts/verify-handoff.py` to CI and updates
  active docs without modifying the import/inventory. Post-integration `pnpm check`,
  `pnpm audit --audit-level=high`, `python3 scripts/verify-handoff.py`, and
  `git diff --check` passed. The verifier reports 47 unchanged imported files,
  30 matching assets, and 278 local file links across 35 documents. The fixture
  [non-draft PR #2](https://github.com/Ljrr3045/rielia/pull/2) records current-head
  CI/Kody request, outcome, and any findings/dispositions before coordinator acceptance.
- Real OAuth/provider/proxy/session flows, MCP clients/discovery, DB/migration,
  worker/queue persistence/restart, Docker/deployment, load, and full accessibility
  acceptance: not run/not implemented. Full T02/T03/T04 remain unverified.
- Kody's [CI action pin finding](https://github.com/Ljrr3045/rielia/pull/2#discussion_r4369146492)
  and [failed-spawn cleanup finding](https://github.com/Ljrr3045/rielia/pull/2#discussion_r4369146777)
  were accepted. Actions now use full verified upstream commit SHAs. Smoke lifecycle
  helpers guard missing PID before signal/wait setup; a focused built-in Node
  regression failed on same-tick shutdown before the asynchronous spawn error and
  passes after the guard, preserving `ENOENT` and stopping the live sibling.
  This is defensive cleanup hardening, not a claimed production startup failure.
  A changed head requires fresh CI and the coordinator's new Kody request.

The PR's checks/comments supply current-head evidence without a self-referential
commit hash in this file. After a pushed fix, this record's prior review evidence
does not imply approval of the new head; wait for the coordinator-requested Kody
round for that head. Workers do not post duplicate trigger comments.

## T02.1 scope and validation

The coordinator approved a reversible experiment while user stack/OAuth answers
remain pending. [Identity research/operator/evidence](identity-spike.md) records
the exact pins, supported Nest/Express mounting, identity-only migration, DB-backed
session/cookie/origin/proxy behavior, Google verifier hook, browser state logic,
and declaration-only compatibility patch. No domain principal, role, workspace,
task, MCP catalog, deployment, license, or full T04 acceptance is included.

Local real-library/PostgreSQL tests pass, including repeated migration deployment,
simulated Google and GitHub responses, private-email handling, no implicit linking,
session persistence/restart/refresh/logout/revocation/expiry, failed DB lookup,
malicious return URLs/origins, forwarded-header spoofing, and disabled identity.
Browser logic/proxy tests pass, including stalled-request timeout and retry recovery.
Provider HTTP/JWKS responses are test fixtures; no production test login bypass exists.
Real Google/GitHub consent/private-email flows and deployed HTTPS/Traefik behavior
remain **unverified**, so full T02 is partial. T02.2 owns presentation and its
keyboard/touch/mobile/accessibility checks. A fresh copy without dependencies,
build output or generated code passed frozen install and complete `pnpm check`,
including the declaration patch, strict checks and actual Next proxy smoke.
The source checkout passed 20 real-library/DB tests and seven browser logic/client
tests. Final audit reported no known vulnerabilities; handoff and whitespace
checks passed. CI and exact-head Kody evidence for
[PR #3](https://github.com/Ljrr3045/rielia/pull/3) were recorded in its review
surfaces before the coordinator merged it. A previous-head result never approves a
changed head.

PR #3's first Kody round exposed a valid raw-path normalization bypass in the
callback origin exemption. A raw Node HTTP regression failed with 200 instead of
403 before the fix; normalized exact callback matching and malformed-path rejection
now pass, with state-validated callback behavior preserved. The parser argument
suggestion was a false positive against the public Nest 12.2.0 application API;
core inserts the adapter's raw-body argument, and nested URL-encoded parsing passes.
See [technical dispositions](identity-spike.md#pr-3-findings-and-dispositions) and
the PR threads. The changed code head needs a fresh coordinator-triggered round.

## T02.2 presentation

The UI-only slice adds the experimental `/identity` page and its presentation
component on the merged T02.1 `useIdentity` contract. The component renders only
server-agreed state and calls hook actions; it adds no HTTP, session, or
validation logic and no dependency. Unconfigured providers are hidden, and
bilingual states cover loading, unavailable API, disabled identity, no providers,
signed-out, signed-in, pending sign-in/sign-out, and the typed sign-in/sign-out
messages. Keyboard focus moves to the section heading only after a user action
removes its control. Evidence, limits, and unverified checks are in
[identity presentation](identity-ui.md). Full T02/US01 acceptance remains open
pending real Google/GitHub consent, private-email flows, HTTPS/staging, and
the remaining documented browser/assistive checks. The bounded presentation was
merged as recorded above; this does not close real T02/US01 acceptance.

## T01/B0 prototype logic

The [typed prototype contract](task-prototype.md) records the fictional hierarchy,
18 seeded tasks, independent assignee/creator/provenance, shared selectors,
draft/create/edit/status/filter actions, planned sprint scope, one-active-sprint
guard, explicit unfinished-work destination and frozen done/canceled summary.
The adapter is isolated from identity, backend and public contracts, and keeps no
durable data. Reset invalidates in-flight saves and can restore seeded/empty data.
Deterministic pre-commit failure preserves drafts and the captured retry without
duplicate creation. A local stale task draft receives a version conflict.

`pnpm install --frozen-lockfile` passed. Thirteen action/invariant tests pass
through `pnpm test:prototype` and `pnpm check`; the full check also passes lint,
process cleanup, seven identity logic/client checks, strict types, production
builds and real production HTTP smoke. The existing `pnpm test:identity` suite
also passes 20 real-library/PostgreSQL tests with simulated provider HTTP; its
disposable database is removed afterwards. Audit reports no known vulnerabilities.
Handoff verification confirms all 47 imported files, 30 asset hashes/sizes and 311
local links; whitespace checks pass. No route, JSX, CSS, identity/backend logic,
credentials, DB or MCP change is included in the logic PR. Mobile/desktop,
keyboard/touch, screen-reader behavior and real-person journeys remain outside that
logic evidence and are handled separately by the presentation slice.

PR #5's malformed-collection and captured-retry findings were fixed with
actual-action regressions. The final reviewed head `55481ff` passed CI and Kody
approval [5641785181](https://github.com/Ljrr3045/rielia/pull/5#pullrequestreview-5641785181)
and was merged as `5099b39`; a prior-head result does not approve changed code.
No full T01/B0 or later ticket is completed by these tests.

The requested round then found a valid [captured-retry loss](https://github.com/Ljrr3045/rielia/pull/5#discussion_r4369810021)
after rejecting a malformed patch. A real failed task/sprint save followed by a
rejected patch and retry failed pre-fix. Rejected/no-op actions now retain the
unchanged draft and captured retry; current field feedback is independent of
`canRetry`. The contract tells presentation to label this "Retry previous save".
The regression verifies eventual single creation/scope update and that a valid
new edit clears the old retry. This fix is included in the merged final head.

## T01/B0 prototype presentation

The [presentation evidence](task-prototype-ui.md) records composition, states,
accessibility decisions, browser evidence, commands and limits for the responsive
`/prototype` route. It covers default My tasks, project list/board/sprints, detail,
minimal capture/edit, visible simulated save failure and draft-preserving retry,
closed-sprint retained/current versus frozen summary wording, and seeded/empty
reset. The UI imports the merged adapter/hook, `getSprintSummary`, and the typed
save/retry context; it adds no business rules, controller, API, identity,
persistence or functional tests.

The current presentation also consumes the PR #7 `save.context`/`retryContext`
contract: current feedback and captured retry are rendered independently by target,
close destination is restored only for a matching captured close retry, and global
current/retry outcomes are labelled with the task key or sprint name. This is the
presentation fix for PR #6's two Kody findings; the focused post-fix regressions
passed on local head `eddbd84` (RIE-12→RIE-15 foreign feedback/retry removed,
unrelated retry leaves close destination enabled, own close retry restores/uses
the captured destination and moves the expected unfinished tasks).

A later same-head round found that wide-desktop foreign feedback was hidden while a
detail remained open. The global strip now renders unmatched current/retry outcomes
with their target, while matching detail feedback stays only in the detail; the
recovery-only panel can appear when the current outcome is handled locally but the
captured retry is not. A third-round comment described the global strip as inert on
narrow. Analysis found no functional defect: the 69dd narrow modal contract never
claimed recovery behind the modal, and root's 390 check confirmed background inert,
close/back exposing the labelled RIE-12 retry, and own-task retry reachable inside
detail. The final head adds shared `backgroundInert` mount suppression as optional
structural cleanup (DOM mounting only), preserving the documented close/back
contract. Root's earlier 1920/390 evidence applies to the 69dd interaction; final
code-tree QA on 411ab8c separately confirmed desktop labelled global recovery,
narrow main inert with zero global retry DOM and no overflow, close/back restoring
the RIE-12 retry successfully, and own-detail status failure/retry remaining
reachable and succeeding. Final reviewed head `043c4507` subsequently passed
CI and Kody approval and merged as recorded above.

Local validation on the integrated branch: full `pnpm check` passes, including 19
prototype tests, strict types, production builds and HTTP smoke; `/prototype` is
statically generated. Handoff integrity, advisory audit and whitespace checks pass.
Independent coordinator Brave QA exercised all five demo journeys at 1440, 390,
320 and 768 px before the context follow-up, including failure/retry,
filtered-detail focus return, keyboard sidebar isolation, search recovery and
reset; its report is preserved outside the repository and summarized without
claiming real-person validation. The UI owner added light-theme 1440,
32 px-default-font (200% text) 1440/390, English, desktop drag, closed-sprint
retention and search-label checks. Orca viewport captures that tiled were
excluded. Safari, screen readers, real touch hardware, real 200% browser zoom
traversal and long-session persistence remain unverified, as do all product flows
outside the fictional adapter.

The presentation PR #6 merged after exact-head CI/Kody approval recorded above.
Its review surfaces preserve the coordinator trigger and technical dispositions.
Full T01/B0 remains open.

## T01/B0 save/retry context follow-up

PR #6 review found that failed task A feedback/retry could appear in task B's
detail, and an unrelated task retry could lock sprint closure destination. The
coordinator accepted an additive `SaveContext` contract: latest `save.context`
and independently captured `retryContext`, with task/sprint ID, status-operation
value and copied close destination as applicable. Navigation preserves the
original target; unbound validation has no target. Rejected/no-op actions preserve
captured recovery, accepted edits/new valid saves clear/replace it, and reset
invalidates pending context. See the [integration contract](task-prototype.md#feedback-and-retry-targets).

Six new actual-action tests bring the prototype suite to 19 passing tests. The
first five failed against the pre-fix adapter (13 old passed, five missing-context
failures); the sixth checks malformed runtime target/status/destination values.
No JSX/CSS, identity/backend, dependencies, production policy or source-handoff
changes are included. This prerequisite merged via PR #7 at
`bfaf24d790daa2cebd1a92a5ecc5b3f9bbea6e3f` after reviewed head `c90b437`,
Kody approval [5642060409](https://github.com/Ljrr3045/rielia/pull/7#pullrequestreview-5642060409)
and [CI 40172013213](https://github.com/Ljrr3045/rielia/actions/runs/40172013213).
Presentation consumes it; focused post-fix browser regressions passed on local
head `eddbd84`, followed by final-head validation and the PR #6 merge above.

Local checks pass on Node 24.22.1/pnpm 12.15.0: frozen install, 19 prototype
tests, full `pnpm check`, 20 existing PostgreSQL/real-library identity tests,
advisory audit (no known vulnerabilities), handoff integrity (47 files, 30 assets,
313 local links), and whitespace. The initial sandboxed identity loopback tests
were blocked by `EPERM`; the authorized full-check rerun passed. Identity removed
its disposable database and smoke servers exited. Exact-head CI and coordinator
Kody review on the presentation head subsequently passed; all three surfaces
were handled before its merged delivery.

## T03.0 local MCP transport

The [local MCP guide](local-mcp.md) records official SDK server/client/core 2.4.0,
Inspector 2.12.0 (its own SDK 2.3.1), Zod 4.6.7, operator setup and compatibility
limits. One strict argument-free `rielia_health` calls the fixed public Nest
`/api/v1/health`, validates/projects two literals and explicitly disclaims auth,
database health, product readiness and capabilities. The wrapper has no listening
socket, backend/database import, credential or task endpoint. Explicit numeric
loopback development HTTP is the only plaintext allowance; HTTPS retains normal
certificate validation. Bounded total deadline/body/header sizes, no redirects,
sanitized errors, EOF/signal/client cancellation and stdout discipline are covered.

Seventeen focused checks pass locally: real Nest through SDK child processes and
independent official Inspector CLI initialize/list/call, actual `2025-11-25` and
`2026-07-28`, invalid tool/arguments/config, malicious/malformed upstream data,
HTTP failure, oversized body, redirect, refusal, timeout, recovery and active
request shutdown. Self-signed HTTPS is rejected; no trusted remote HTTPS or remote
MCP/OAuth discovery was exercised. The coordinator independently reran all 12
successfully before the additional lifecycle regression. Initial sandbox-denied listeners and a corrected test cleanup-hook
ordering failure are not passing evidence. `pnpm check` includes this real client
suite after builds. Frozen install, full `pnpm check`, 20 existing real-library/
PostgreSQL identity tests with simulated provider HTTP and database cleanup,
audit (no known vulnerabilities), handoff integrity (47 files/30 assets/327 links)
and whitespace pass locally; current-head CI/Kody evidence is recorded in the PR
before delivery. No full ticket, real-user acceptance,
stack/license or provider decision is closed.

Kody's truncated-response timeout claim did not reproduce: real wrapper wire
probes return unavailable promptly for fixed-length/chunked FIN and mid-body
reset; an open stalled stream instead times out. A focused retained regression
guards that documented contract; the existing Node response error handler is
sufficient. See the [measured disposition](local-mcp.md#observed-evidence-and-limits)
and PR review surfaces. No speculative runtime handler or auth scope was added.
