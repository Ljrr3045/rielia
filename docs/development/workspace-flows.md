# T05.0/B1 workspace and membership logic

This bounded slice follows [PR #12](https://github.com/Ljrr3045/rielia/pull/12),
merged as `b87dadb165971d0594429f6a08c047626f9d596e` on
2026-10-28T18:36:55Z. It implements P02/P03 and US02/US03 with the applicable
P01/US01 session and P38/US24–US25 principal rules from the unchanged
[product](../handoff/01-product.en.md) and
[architecture §2/T05](../handoff/02-architecture-technical-plan.en.md).
The coordinator authorized the invitation/role subset overlapping T07 in this
T05.0 task. Full T05/T07/T35 acceptance stays open. Presentation is separately
owned and is not included; client recovery follows UX07/UX09.

## Backend contract

All routes are below `/api/v1`. Every route resolves a real Better Auth session
with caching disabled, then reloads the current session, active human principal,
and required membership under the existing policy fence. Workspace selectors
never authenticate. Lists use shared fence locks; mutations use exclusive locks
through commit. The additive `20261028190000_workspace_flows` migration preserves
the two earlier migrations and all imported handoff files. No Better Auth
organization or parallel membership system is introduced.

| Method and path | Contract |
| --- | --- |
| `GET /workspaces` | Current human's active memberships, with workspace summaries |
| `POST /workspaces` | `{name}` creates a workspace and active human owner atomically |
| `GET /workspaces/:workspaceId` | Current scoped summary/role; selection reauthorizes |
| `GET /workspaces/:workspaceId/members` | Scoped human/Agent names, kind, role, membership/principal state, custodian ID, version |
| `POST /workspaces/:workspaceId/members/:principalId` | Human owner/admin; `{version, role?, state?}`; owner cannot change |
| `GET /workspaces/:workspaceId/invitations` | Human owner/admin; recipient/role/issuer/expiry/state, never token/hash |
| `POST /workspaces/:workspaceId/invitations` | Human owner/admin; `{recipientEmail, role}`; returns `{invitation, token}` once |
| `POST /workspaces/:workspaceId/invitations/:invitationId/revoke` | Human owner/admin; `{}`; terminal revoke |
| `POST /workspace-invitations/accept` | Authenticated verified recipient; `{token}`; no prior membership required |
| `POST /workspaces/:workspaceId/agents` | Human owner/admin; `{name, role, custodianPrincipalId}`; own Agent membership, no credential |
| `POST /workspaces/:workspaceId/agents/:principalId` | Human owner/admin; `{version, state?, custodianPrincipalId?}` |

Lists return `Page<T> = {items,total,nextCursor}`, at most 100 records per page,
ordered by ID; optional `?cursor=<last ID>` is the only list query. Totals and
pagination remain tenant scoped. There are no search/export endpoints in this
slice. Member responses exclude social email/account/session data. Historical
revoked members remain visible and cannot regain access through invitations.

Every mutation requires exact configured `Origin`, JSON, an optional browser
`Sec-Fetch-Site` limited to same-origin/none, and a UUID v4 `Idempotency-Key`.
Unknown DTO fields, identity-selection headers, query impersonation and read
bodies are rejected. All responses use `Cache-Control: no-store`; successful
session-renewal cookies are forwarded. No-session is 401, denied scope/role is
403, malformed input is 400, existing/stale/terminal state is 409, and
disabled/unavailable identity/storage is sanitized 503. A library session-renewal
racing deletion may also fail closed as 503; a subsequent lookup is signed out.

`WorkspaceService` owns workspace/invitation/request-receipt writes.
`PrincipalService` owns principal/membership changes and the backend-only fenced
transaction seam. Version and authority-invalidation SQL triggers also cover
internal/ordinary SQL changes. They are not a defense against a privileged
installation operator. The global write fence and deferred substrate scans
deliberately favor correctness; no scale claim is made. RLS and least-privilege
runtime roles remain future public-launch prerequisites.

## Invitations, roles, and retry

Invitation tokens contain 32 random bytes. Only SHA-256 hashes enter PostgreSQL;
raw tokens appear only in the first successful create response. Seven-day expiry,
single consumption, immutable recipient/issuer/role/scope, terminal revocation,
and a composite issuer-membership FK are enforced. Expired pending invitations
are revoked before replacement; one unconsumed/unrevoked invitation per recipient
and workspace is allowed. Email is trimmed and lowercased; this does not merge
social accounts. Acceptance requires the current verified identity email, the
issuer's current active human owner/admin rights, and no existing membership.
Owner is never an invitation role. Admin/member/viewer are allowed for humans;
agents remain member/viewer only.

Revocation remains terminal. Existing active, suspended, or revoked membership
conflicts with an invitation, rather than silently inventing rejoining. A human
administrator can explicitly restore a suspended membership using its version.
Revoked membership cannot be restored. Owner removal/demotion and ownership
transfer/deletion are unavailable. An active agent's custodian must retain active
human administration: explicitly transfer management or suspend the agent before
demoting/removing that custodian. Historical identity/authorship is retained.

Losing active administrative membership or principal state revokes that issuer's
pending invitations. Terminal subject removal/revocation revokes its grants;
demotion to viewer revokes write-bearing subject grants. Temporary suspension
denies execution while suspended. Legitimate read-only delegated grants remain;
an existing autonomous grant remains the independent agent's authority when its
original issuer leaves. Issuer role never lends rights to that agent. Existing
session/principal/membership/grant revalidation continues on every operation.

Successful mutation receipts are actor/key scoped and commit with all effects.
Request hashes include the route and canonical field ordering. An identical key
replays its result only after current authorization; accepted-invitation replay
also rechecks recipient verification and current membership. Receipt data contains
no raw token. Reusing a key for different input returns 409. Membership versions
guard human edits; changing agent state/custodian also bumps its member version.
Transactions have no automatic mutation retry. Failed transactions leave no
membership, consumed token, workspace, or successful receipt.

If invitation creation commits but the response is lost, replay returns 409 with
`code: invitation-link-unavailable`. Refresh the authorized invitation list,
explicitly revoke the pending invitation and create a new one. A token is never
recoverable from storage. Do not blindly create a second invitation after an
unknown outcome.

## Presentation integration

Import `useWorkspaces` from `apps/web/src/lib/use-workspaces.ts`; public command,
summary, member, invitation, and page types live in `@rielia/contracts`.
The hook uses actual same-origin API data. There is no fake product-data path,
new page, JSX, CSS, or presentation component in this PR.

State fields: `status` (loading/disabled/signed-out/ready/empty/forbidden/error),
`session`, `workspaces`, `selectedWorkspaceId`, `workspace`, `members`,
`invitations`, `pending`, `outcome`, `draft`, `retryTarget`, `invitationLink`,
`hasInvitation`, and `capabilities.canCreateWorkspace/canAdminister`.
Outcomes distinguish success, invalid, forbidden, conflict, error, and
invitation-link-unavailable. Lists expose `total/nextCursor`; a ready workspace
can have an empty member/invitation page without becoming a global empty state.

Actions: `refresh`, `selectWorkspace(id|null)`, `stage(WorkspaceCommand)`,
`submit`, `retrySave`, `loadMore('workspaces'|'members'|'invitations')`,
`acceptInvitation`, `clearInvitation`, `discardDraft`, `cancelPending`, and
`dismissOutcome`. Draft commands cover creation, invitation/revoke, versioned
member/agent changes and agent registration. UI passes server member versions,
renders capabilities as affordances, and always handles server denial. It must
not expose owner transfer/deletion or agent credentials.

Switching/canceling aborts requests and invalidates stale completion. An aborted
mutation has unknown commit outcome; its captured key and original scope survive.
`retryTarget` labels that scope. Switch back before retrying a scoped command;
never silently retarget it to the currently selected workspace. While recovery
exists, `stage` preserves it and `submit` uses the original key. Use `retrySave`
or explicitly discard recovery before a new draft. Discard/cancel does not undo
an already committed server effect. A successful write stays successful if its
subsequent read fails; Refresh recovers data without resubmitting the write.
Conflict preserves the editable draft and requires refresh/review, not blind
overwrite. Explicit retry never expands a grant or changes an actor.

Expiry/401 clears visible data and preserves an in-memory draft/retry for the
same human. Visibility/pageshow and session expiry recheck identity. A different
signed-in user clears private recovery. Only a selected workspace ID is stored
in sessionStorage, keyed to user; it is reauthorized before display. Data,
drafts, tokens, links and request keys are not persisted in browser storage.

The hook creates copyable links from the actual browser origin:
`/workspaces#invitation=<token>`. It captures the fragment in memory and immediately
replaces the current history entry to clear it. No token GET, external Host-built
link, emailed invitation, or log is used. `hasInvitation` prompts an explicit
POST acceptance. Display a newly created link only transiently; never persist or
log it. `clearInvitation` clears the received token and displayed link.

For a signed-out recipient, open `/identity` in a separate tab and explain
returning to the original workspace tab and Refresh. Same-tab OAuth navigation
or reloading closes the memory-only draft/token; reopen the original link after
sign-in in that case. Do not put bearer tokens in auth URLs or durable storage.
Presentation owns accessible labels/focus and explicit copy/revoke/recreate
choices. Mobile/desktop, keyboard/touch, assistive technology and real-person
acceptance belong to that separate UI delivery.

## Validation and exclusions

Use the existing operator setup in [identity](identity-spike.md),
[principals](principal-foundations.md), and [local runtime](local-runtime.md).
Identity remains opt-in. The one-shot alone applies migrations; API/worker never
migrate. NodeAdapter 12.3.2 and Express-free dependency/runtime closure are retained.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test:identity
pnpm test:runtime
pnpm audit --audit-level=high
python3 scripts/verify-handoff.py
git diff --check
```

The focused client/proxy command is `pnpm test:workspaces:logic`, included in
`pnpm check`. It covers cancellation/stale scope, unknown-outcome keys, draft and
same-user recovery, account switching, fragment acceptance/link handling, malformed
payloads, HTTP deadlines, structured conflicts, and proxy cookies/origin/header
filtering. `pnpm test:identity` additionally runs real PostgreSQL/HTTP workspace
checks beside the 12 principal and original 23 identity checks. It exercises two
tenants, role/owner/custodian restrictions, forgery/origin rejection, hash-only
storage, verified/wrong recipient, expiry/revocation/single use, concurrent
consumption and issuer/session removal, versions/grants, and transactional rollback.
Docker smoke corrupts/restores the new migration checksum as well as both earlier
ones and retains the diagnostic worker boundaries. Provider HTTP remains simulated.

Command results and current PR/CI/Kody evidence belong in [progress](progress.md)
and [PR #13](https://github.com/Ljrr3045/rielia/pull/13). All applicable local
commands passed; the real-PG suite has 9 workspace checks, 12 principal checks
and 23 original identity checks; the client/proxy suite has 11. Owned test
databases, Docker runtime resources and external QA-harness smoke resources were
removed. Audit reported no known vulnerabilities. Excluded: real OAuth/HTTPS/staging and real users/projects,
SMTP/email delivery, projects/tasks, project visibility, remote MCP/agent
credentials, execution hosting, ownership transfer/deletion/reauthentication,
full audit/activity/outbox product integration, RLS/deployment and full-ticket
acceptance. Their deferral does not weaken the local automated review gates.
