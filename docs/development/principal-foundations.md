# T35.0 principal and authorship foundations

This bounded B1 slice follows merged [PR #11](https://github.com/Ljrr3045/rielia/pull/11)
at `70314c550b643fd5678375939535cdb93331c9b2`. It implements prerequisite storage,
backend policy and public types for T35 before T05/T06/T12 under the
[local sequencing decision](stack-validation-decisions.md). It completes none of
those full tickets. Source requirements are architecture §2.3–2.7/§3.1/§7.1/T35,
product §2.5/P38/US24–US25, and the principal portions of P03/P05/P10. The
[source handoff](../handoff/00-START-HERE.md) remains unchanged.

## Storage and invariants

The additive `20261028000000_principal_foundations` migration keeps storage in
`apps/api`; no shared database package is extracted. Existing identity SQL is
unchanged. `principal` stores human, agent and reserved system identities. The
agent's workspace and custodian columns are the bounded equivalent of the source
AgentIdentity relationship, with no separate social-login account for an agent.
Minimal `workspace`/`membership` tables are necessary to enforce scope; they do
not implement workspace registration, invitations, projects or settings.

- Every human principal has a unique real Better Auth User FK. SQL checks require
  the link for humans and prohibit it for agents/system. Existing users are
  backfilled; an AFTER INSERT trigger maps new users in their transaction. A lock
  on User during migration closes the backfill/trigger installation gap. No
  runtime migration or best-effort login hook is used.
- Principal ID, kind, user link, agent workspace and creation time cannot change.
  Deletion of principals, memberships, workspaces and policy grants is rejected;
  User deletion is restricted. Use suspension or terminal revocation; historical
  identity is never reassigned. Retention, account erasure and rejoining after
  terminal membership revocation require later explicit policy/migrations.
- A workspace retains its active human owner and active owner membership. Agent
  membership is confined to its one workspace and member/viewer roles; System
  cannot join a workspace or receive an ordinary assignment.
- Every agent retains its own membership and a human custodian. An active agent
  requires an active human owner/admin custodian in the same workspace. Principal,
  membership and workspace mutations all participate in deferred validation.
  Removing/demoting/suspending a custodian requires explicit management transfer
  or agent suspension first. Suspending an agent preserves all references.
- Internal `execution_grant` records contain policy only, never a credential.
  Delegated subject equals the authorizing human. Autonomous subject is an agent
  in that workspace; issuance requires a current human owner/admin. Neither
  authorizer nor custodian lends permissions. A viewer cannot receive a write
  grant, and immutable scopes prevent promotion from broadening an existing read
  grant. Subject, mode, workspace, limits and issuer cannot be edited; revoke and
  create another record instead. Revocation is terminal and idempotent.

Deferred constraints inspect the final transaction state, supporting atomic
workspace/owner creation and explicit transfers. All policy/session mutations
update a singleton SQL fence row. Backend policy operations acquire the same
fence **before** reading authentication/membership and hold it through mutation
and commit. Updating a row also produces a serialization failure for a competing
stale REPEATABLE READ/SERIALIZABLE snapshot, unlike relying on an advisory lock
alone. See PostgreSQL's [consistency guidance](https://www.postgresql.org/docs/current/applevel-consistency.html)
and [isolation behavior](https://www.postgresql.org/docs/current/transaction-iso.html).

Pure web/internal context resolution takes `SELECT ... FOR SHARE` on that row:
concurrent reads coexist while policy/session writers wait. A read never upgrades
to a mutation lock; subsequent service operations obtain an exclusive fence and
revalidate from their private evidence again. Missing fence rows fail closed.
The fence deliberately serializes policy/session writes, while deferred validation
scans the small foundation tables. It makes no throughput claim and
must be revisited with targeted locks/constraints before scale or task traffic.
Conflicting transactions roll back; callers can retry the whole operation after
refreshing state. No automatic mutation retry or generic idempotency framework is
claimed. Privileged database operators can bypass triggers/TRUNCATE; these are
ordinary DML invariants, not protection from the installation operator. RLS and
separate least-privilege deployment roles remain required before public launch.

## Services and HTTP boundary

`PrincipalService` owns bootstrap, human membership, agent registration/management,
policy-record creation/revocation and execution checks. Bootstrap is a trusted
installation/test seam, not registration or an HTTP route. Other management
methods require an opaque verified web context and current human administration.
Own delegated policy records may be created/revoked by their current human web
subject, including viewer read records. Owner/admin may revoke workspace records;
delegated/autonomous execution cannot administer or revoke through that seam.
Expired/revoked grants and inactive principals/memberships deny subsequent use.
An autonomous issuer's later demotion does not lend or replace the agent's rights.
Known structured uniqueness failures return generic 409; permanent storage
constraints return generic 400, and terminal membership reactivation is an
explicit 409 conflict. Unknown errors/outages retain generic 503. No SQL, driver
messages, private identifiers or configuration appear in these error responses.

The only new route is:

```text
GET /api/v1/workspaces/:workspaceId/execution-context
```

It uses the real Better Auth cookie/session lookup with cookie caching disabled,
then the current PostgreSQL session, human mapping and active membership. The
workspace path selects scope; it does not authorize. The response projects actor,
kind, workspace, human mode, web source, role and null grant. It is informational,
not a bearer capability. No-session requests return 401, denied membership 403,
disabled/unavailable identity 503, and all retain `Cache-Control: no-store`.
Renewal cookies are forwarded. Query/body payloads and identity-selection headers
are rejected. The existing browser identity API remains compatible; no frontend
route/proxy/presentation is added for this endpoint.

Internal execution objects are frozen and recognized by a private WeakMap;
copied, fabricated or serialized DTOs cannot authorize operations. Services reload
session/grant, principal and membership inside the fenced transaction on every
use, so stale contexts do not survive logout, expiry, suspension or revocation.
`internalGrantContext` is explicitly **internal policy evaluation after a future
trusted credential verifier**, not authentication. It has no public adapter or
request-field path. T12 must implement real credentials and verified connection
provenance before delegated/autonomous clients can authenticate. The reserved
System principal has no login, execution endpoint or ordinary assignment.

`creationAttribution` rejects author/subject/mode/source payloads and derives a
frozen creator/author/provenance value from verified current execution. Assignee
is independently null or an active same-workspace human/agent. It neither
auto-assigns the creator nor persists a fake task/comment. **T06 must still enforce
project access and persist immutable creator/comment author, activity and outbox
in the same domain transaction.** A returned foundation value alone cannot be
used later as authorization. Real task/comment changes, assignment transitions,
history/filter/export integration and durable authorship tests remain incomplete.

## Validation and migration operation

Run the existing commands; `pnpm test:identity` now includes the principal suite:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test:identity
pnpm test:runtime
pnpm audit --audit-level=high
python3 scripts/verify-handoff.py
git diff --check
```

The disposable PostgreSQL harness first creates the original identity schema and
an existing user, records that migration, and deploys the additive migration
twice. It waits for the image's final TCP server, not its temporary initialization
socket. Principal tests cover concurrent conflict-safe user insertion, direct SQL
kind/link/owner/custodian/grant invariants, two workspaces, signed-cookie HTTP
verification and raw body/header/query impersonation attempts. They also cover
independent/null assignment, delegated administration denial, viewer grant
ceilings after promotion, custodian/issuer independence and stale-context denial.
Two direct SQL connections observe actual fence blocking at READ COMMITTED,
REPEATABLE READ and SERIALIZABLE, prove rollback on conflicting final state/stale
snapshot and recover after explicit transfer. A service mutation blocked behind
session revocation is denied with no new agent after revocation commits.

The original 23 identity tests still exercise real Better Auth/Nest/Prisma/PG with
simulated provider HTTP. Their administrator-only disposable DB reset uses
TRUNCATE because production identity references cannot be deleted. Runtime smoke
asserts both migrations are packaged, repeatedly deploys them, corrupts/restores
each checksum by name, checks disabled identity/context and preserves diagnostic
worker boundaries. The existing checksum gate discovers migration directories;
API/worker still cannot migrate. Installed and deployed-store Express absence
remains required on official Nest NodeAdapter 12.3.2. No dependency pin changes.

Actual command results, PR and current-head CI/Kody evidence are recorded in
[progress](progress.md) and the PR. Real OAuth/HTTPS/staging, real users/projects,
remote credential authentication, full workspace/project/task CRUD, project
visibility policy, exports, RLS, production deployment and full T35 acceptance
remain OPEN/DEFERRED. No credentials or staging are requested by this slice.

## PR #12 review fixes

The initial Kody round's [constraint-error finding](https://github.com/Ljrr3045/rielia/pull/12#discussion_r4404439258)
and [exclusive-read-lock finding](https://github.com/Ljrr3045/rielia/pull/12#discussion_r4404439735)
were valid. Two added real-PG service regressions failed before the changes and
pass afterwards. They verify duplicate membership/workspace 409, invalid names
400, terminal membership reactivation 409, real Prisma/PG FK/check/restrict errors
mapped without driver details, and unavailable storage still returning sanitized
503 through the actual context HTTP boundary. A live shared reader permits
context resolution to complete, but an observed policy mutation waits for its
release. Original competing-writer and session-revocation regressions still pass.
There are now 12 principal checks plus the original 23 identity checks. The global
write-fence/scan limits remain explicit; no broad performance claim is added.
The initial submitted reviews reference an earlier head and are not final-head
approval. Every changed ready head still requires fresh coordinator review.
