# T07.0/B1b project privacy and access logic

On 2026-10-29 the user ratified automatic private-project content access for
active workspace human owners/admins: they must be able to see everything created
inside their workspace. This resolves the proposal in
[architecture §2.5](../handoff/02-architecture-technical-plan.en.md).
It is a workspace policy, not privacy from the installation operator.
Delegated execution inherits its actual human subject's content entitlement,
intersected with current grant operations. Autonomous Agents never inherit the
custodian's or issuer's access. Every operation reloads current authority.

This bounded logic slice implements P02/P03/P04/P14/P38 and
US02/US03/US08/US12/US24–US25, with UX01/UX05/UX06/UX07/UX09/UX11 recovery and
authorship contracts. It follows the T06 presentation merge
[PR #16](https://github.com/Ljrr3045/rielia/pull/16),
`545473c3d381a7a532e8f5b9ad77f30d6b5a70bc`; the coordinator confirms both T06
worktrees were removed. T05 invitations, roles and membership workflows are reused.
No project lead, guest, new invitation/credential model or presentation is added.

## Policy and persistence

All active workspace members can read workspace-visible projects. Private
projects require active explicit access except for active human owner/admin
membership. Viewer remains read-only. Human/delegated/Agent content writes require
current project access, a writable workspace role and any current grant's write
operation. Losing administrative role immediately removes implicit access;
independent active explicit access can still authorize ordinary member work.

Only a human web owner/admin can create private projects, change visibility or
administer explicit access. Delegated owner/admin execution cannot do those
operations. Member/Agent workspace-visible creation remains available. Creation
never automatically assigns a task or grants explicit access to a creator,
assignee, owner, custodian or issuer. Administrators already have implicit access.

Explicit access is `active` or `revoked`, can be deliberately re-granted, and
cannot revive a revoked workspace membership. Rows remain across visibility
transitions: making a project workspace-visible exposes it to active workspace
members; making it private again uses the retained explicit rows plus current
automatic administrative entitlement. UI must explain both consequences.
Removing an administrator's explicit entry does **not** remove their automatic
access. Access pages distinguish `explicitAccess`, `implicitAccess` and
`effectiveAccess` so the UI does not make that false promise.

Archived projects freeze content and visibility, and freeze child writes as in
[T06](project-task-flows.md). Explicit revocation remains available while archived;
granting/re-granting access requires restoration. A policy edit advances the
project aggregate version, including same-value accepted requests. Assignment
history and immutable authorship remain; new assignments require current project
access. A historical assignee's `active: false` also indicates lost project
eligibility, without rewriting the stored assignee or creator.

The additive `20261029160000_project_access` migration retains every earlier SQL
file/checksum and existing workspace-visible rows. Composite FKs bind project
access to the same workspace/project/membership. Access DML joins the existing
policy fence, preserves row identity/history and advances the project version.
The assignment SQL guard applies the same read entitlement. Business policy
changes, version, activity, minimal outbox and successful receipt commit together.
Access activity retains the changed member's immutable scoped principal ID,
separate from its actor, without storing project/task contents.
Every read/count/anchor/detail/conflict/write/replay checks current access under
the fence. No stored receipt or stale context authorizes a response. Private key
collisions return a generic conflict with no hidden title, description or ID.

Revocation applies to every operation after its transaction commits. A read
already holding the shared fence can finish before revocation commits. There is
no SSE/browser invalidation channel in this slice; refresh, visibility/pageshow,
session expiry and subsequent requests recheck current policy. No instantaneous
erasure of already delivered browser content is claimed.

## Exact API and frontend contract

Existing [T06 routes/recovery](project-task-flows.md) retain their behavior and
add `visibility: 'workspace'|'private'` on Project. Paths below are relative to
`/api/v1/workspaces/:workspaceId/projects`. Every mutation uses existing exact
Origin/JSON/UUID-v4 idempotency protections; responses are no-store with server
request IDs. Missing/foreign/denied targets share generic 403. Invalid or no
longer authorized cursor anchors share generic 400. Authorized stale edits return
409 with current record; denied edits never include `current`.

| Route | Contract |
| --- | --- |
| `POST /` | Existing create payload plus optional `visibility`, default workspace; private requires human web owner/admin |
| `POST /:projectId/visibility` | `{expectedVersion,visibility}`; returns current Project |
| `GET /:projectId/access?cursor=...` | Human web owner/admin management page |
| `GET /:projectId/access/:principalId` | Human web owner/admin exact-target review, including targets beyond page one; `{project,member}` from one policy snapshot |
| `POST /:projectId/access/:principalId` | `{expectedVersion,state:'active'|'revoked'}`; existing workspace member only; returns current Project |
| `GET /:projectId/assignees?cursor=...` | Current eligible human/Agent page, authorized project reader only |

Public types are exported by `@rielia/contracts`, with no Nest/Prisma imports:

- `ProjectCapabilities` extends existing edit/archive/restore flags with
  `canManageAccess`, `canChangeVisibility`, `canGrantAccess`, `canRevokeAccess`.
  Archived management/revocation remains true for the authorized human;
  visibility/grant flags are false. Project pages also return
  `capabilities.canCreatePrivate`; existing `canCreate` remains the workspace
  creation ceiling.
- `ProjectAccessPage = {workspaceId,projectId,items,total,nextCursor,projectVersion}`.
  Each `ProjectAccessMember` contains normal `DomainPerson` identity/active state,
  `role`, `explicitAccess: 'active'|'revoked'|null`, `implicitAccess`,
  `effectiveAccess`, and `capabilities:{canGrant,canRevoke}`. Pages include scoped
  historical members so revoked entries remain manageable. Inactive members
  cannot receive access. No social email/session/credential is exposed.
- `ProjectAccessReview = {project:Project,member:ProjectAccessMember}` is used by
  exact-target review. Access version-conflict responses include `current:Project`
  plus `accessCurrent:ProjectAccessMember` from the same fenced snapshot;
  denied responses contain neither.
- `ProjectAssigneePage = {workspaceId,projectId,items:DomainPerson[],total,nextCursor}`
  contains only currently eligible active people/Agents. UI must use this page,
  including its pagination, rather than derive private policy from workspace
  roles or member lists. Archived project write affordances remain disabled.
- `ProjectTaskCommand` retains the existing content command union, with optional
  `visibility` on create-project. `ProjectPolicyCommand` adds
  `{type:'change-visibility',workspaceId,projectId,expectedVersion,visibility}` and
  `{type:'change-access',workspaceId,projectId,expectedVersion,principalId,state}`.
  `ProjectCommand` is their union. Policy commands return Project because their
  current authorized administrator always has content access.

`useProjectTasks` remains the entry point. `stage` accepts `ProjectCommand` and
uses the same submit/retry/returnToDraft/discard/cancel and conflict/rebase actions.
The hook exposes `projectAccess`, `assignees`, `policyDraft`, `policyPending`,
`policyRetryTarget` and `policyPageError`. Existing content-only
`draft/pending/retryTarget/pageError` are projections of the same controller state
that exclude policy commands/pages, preserving the already merged presentation.
No parallel mutation state or retry key is introduced. Only one content/policy
draft can be pending or recovering at once.
`accessConflict` contains the current target member beside the existing Project
`conflict`. `reloadConflict` fetches that exact member for a change-access draft,
independently of the loaded access page. Change-access `rebaseDraft` requires that
target review and adopts its matching Project version through the explicit review
action. A version-only/malformed conflict cannot silently authorize a rebase.

Use `projectAccess.projectVersion` or the current Project version when opening a
policy form. Staging repeated edits to the same form retains that captured
version; changing a target principal is a different form. Refresh/review and
explicit rebase are required after a 409. Use `loadMore('projectAccess')` and
`loadMore('assignees')` for those pages; their transient errors appear in
`policyPageError`. Success remains confirmed when a later read fails, but 403
clears record result/conflict/access/assignee data. Same-human unsent recovery is
memory-only; a different signed-in account clears it. Unknown outcomes retain
their exact command/key/target and cannot be replaced without explicit discard.
If the next access page has a different `projectVersion`, append is rejected:
the original rows/version/cursor remain and `policyPageError.reason` is `changed`.
Show Refresh; retrying the old cursor does not replace reviewing the full refreshed
collection. This prevents stale entries adopting an unseen aggregate version.

Project/task content becomes ready independently of access/assignee first pages.
Transient failures preserve that content, confirmed mutation success, selection
and draft, with separate `policyPageErrors.projectAccess` and
`policyPageErrors.assignees` entries containing `{requestId,reason?}`. Show Retry
for each failed collection, including simultaneous failures. `loadMore` on a null
policy page retries its first page and clears only its own error; it appends
normally once a page/cursor exists. Missing page/no error means still loading
(or unavailable by `canManageAccess` for access administration). Disable its
assignment/access controls until the authoritative page is available. The older
`policyPageError` remains a most-recent pager projection; use the per-collection
dictionary for independent recovery. `dismissPageError` clears shared feedback
while preserving independent policy-page errors and their Retry actions. A new
load or successful page fetch removes obsolete per-collection failures.
Neither data retry resubmits a mutation.

401/403 from either auxiliary request clears private data immediately and
invalidates its generation, so a late sibling cannot repopulate it. Navigation
and account changes retain the existing stale-response guards.

Presentation must visibly disclose that workspace owners/admins automatically
see private content, distinguish explicit entry removal from actual loss of
access, confirm workspace/private visibility consequences, and consume server
capabilities. This logic PR contains no JSX/CSS; mobile/desktop, keyboard/touch,
assistive technology and real-person evidence belong to the separate UI delivery.

## Validation and limits

The existing test-only real PG/Nest/Next harness supports privacy QA:

```sh
pnpm --filter @rielia/contracts build
pnpm --filter @rielia/api build
pnpm exec node apps/api/test/project-task-qa.mjs /tmp/rielia-project-access-qa.json
```

Add `--large-members` for 101 additional active private-project members and
eligible assignees, or `--smoke` for automatic proxy/private-matrix checks and
cleanup. It uses existing dependencies and a labelled disposable database.
Private mode-0600 state includes fixture URLs for owner/admin/member/viewer/
unavailable/outsider, workspace/project/task IDs, `privateProjectURL` and
`historicalTaskURL`. Only the separate loopback fixture server sets fictional
signed HttpOnly sessions; there is no product login bypass. The private project
grants member/viewer/Agent access; the unavailable human remains its historical
assignee with no current access. Owner/admin have automatic access without
explicit rows. Do not copy cookies, database values or private state into reports.

UI QA can compare owner/admin management with member/viewer affordances, remove
and re-grant the member/Agent, change visibility, inspect the historical assignee,
open multiple tabs for conflicts, and use large pages for Refresh/version mixing.
SIGTERM/SIGINT stops owned servers and removes the labelled container, volume and
private state. Stop Next dev before typegen/build; generated dev types are not
product changes. See the [T06 harness contract](project-task-flows.md).

Frozen install, 27 focused controller/client/proxy checks, real PG/Nest tests
(24 domain, 12 principal, 12 workspace, 23 identity), six-table restart/revocation
witness, final-migration Docker runtime smoke, enlarged QA smoke, audit and handoff
verification pass locally. Full `pnpm check` also passes after removing the
task-generated Next dev type cache left by QA. Runtime verifies all six migration
checksums and actual Express-free API/worker/migration dependency stores; owned
containers, volumes, servers and runtime tags are removed. Audit reports no known
vulnerabilities. Exact-head PR/CI/Kody evidence belongs in [progress](progress.md)
and the external delivery report before final settlement.

The assignment/archive regression initially caught a double aggregate version
increment from upsert's two before triggers; an after-change trigger now advances
it once. A runtime attempt during migration editing detected the changed checksum
and failed; the stable final-migration rerun passed. QA initially needed permitted
loopback/Docker execution. Next's retained dev route declarations caused the
documented duplicate typecheck failure, resolved by removing only generated dev
cache before the final passing full check. None of those intermediate failures is
reported as a passed run.

## PR #17 review dispositions

The [kind finding](https://github.com/Ljrr3045/rielia/pull/17#discussion_r4414843653)
is unreachable under the existing schema: principal kind is restricted to human,
Agent and the reserved System, and the original deferred membership consistency
guard rejects every System membership at commit. A real-PG adversarial insertion
confirms SQLSTATE `23514` and the access page retains its correct four-member
count. No backend query or existing migration was changed for that finding.

The [auxiliary failure finding](https://github.com/Ljrr3045/rielia/pull/17#discussion_r4414844781)
was valid. Its focused regression failed before the fix with `error` rather than
`ready`; content now survives independently, both missing first pages have
separate retry errors, and 401/403 clears immediately with late-sibling
invalidation. The 27 focused checks cover confirmed success, first-page retry,
simultaneous failures, auth failure and stale navigation. The first ready head's
Kody approval is prior-head evidence; changed source needs a fresh root trigger.

Excluded: Kanban/filters/sprints/comments/history UI, SSE, project-limited
credentials/MCP authorization adapter, RLS/deployment, SMTP, ownership transfer,
purge, real OAuth/HTTPS/staging and real users/projects. Current grants keep their
existing workspace/operation ceiling; T12 remains future work. API/worker do not
migrate; only the explicit one-shot does. Official Nest NodeAdapter and
Express-free runtime closure remain required. No full T07/T35 or public-launch
acceptance is claimed by this bounded delivery.
