# T09.0/B1b task collaboration logic

This bounded slice follows merged T08.1 [PR #20](https://github.com/Ljrr3045/rielia/pull/20),
`a93cb85e1e4a4175b1ea7a93ca89d922032fa3fa`, reviewed `a46a5e47`,
[Kody approval 5723763333](https://github.com/Ljrr3045/rielia/pull/20#pullrequestreview-5723763333),
Kody check `124591980449` and CI check `124590250125`. The coordinator confirms
both completed T08 worktrees were removed. Scope is the collaboration portion of
P05/P06/P10/P14/P33/P38 and US07/08/11/12/24/25 under
[T09 and consistency rules](../handoff/02-architecture-technical-plan.en.md).
It preserves [T06](project-task-flows.md), [T07 policy](project-access.md) and
[T08 ordering](task-views.md). Presentation consumes the existing UX01/02/03/05/06/
07/09/11 and UXR01/02/03/04/06 contracts; no JSX/CSS/copy is included here.

## Decisions and storage

- Tasks have one nullable parent in their existing workspace/project. A parent
  cannot be a child; self-links, cycles, grandchildren and cross-project links
  are rejected. Create-child, link/reparent and unlink preserve task identity,
  creator, assignment and canonical flat list/board position. Creation never
  auto-assigns. Linking is performed from the detail of the task receiving its
  parent; a root with children cannot receive a parent.
- Archive retains relationships. An archived task/project cannot change them,
  and an archived parent cannot gain/lose children. Archiving or closing a
  parent does not archive, hide, freeze or change its independently active
  children. Archived projects still freeze every child write. Relations include
  archived children; open counts include archived open children explicitly.
- A transition into `done`/`canceled` through either content edit or board/list
  move warns with 409 `open-children` if any child is open. Explicit acknowledgment
  names the current project task revision; a changed revision cannot silently
  acknowledge a changed child set. The original intended fields/destination
  remain staged. The acknowledgment never modifies children.
- Checklist text is nonblank, single-line, at most 500 UTF-16 units; at most 100
  live items per task. Create/edit/toggle, explicit before-item/end movement and
  retained removal are available. Removal tombstones the item; no purge or
  restore endpoint exists. Completion never changes task status.
- Comments contain nonblank Markdown source up to 10,000 UTF-16 units. The
  coordinator's implementation default permits only the immutable author to edit,
  intersected with current write access and both task/comment expected versions.
  Human delegation shares its human author; an autonomous Agent is its own author.
  Owner/admin role cannot rewrite another author's comment. Creation provenance
  remains fixed; version >1 and `editedAt` identify edits. Old comment bodies are
  not revision history. There is no delete/moderation/retention policy expansion.

The additive `20261031170000_task_collaboration` migration leaves earlier SQL and
checksums unchanged. Composite FKs fence parent/checklist/comment scope and
comment author/grant subject; statement policy fences and deferred hierarchy
checks prevent concurrent write skew. IDs/authorship/creation provenance are
immutable, comments cannot be deleted, and removed checklist items stay retained.
The existing explicit one-shot alone migrates; API/diagnostic worker cannot.
No dependency or runtime adapter changes are introduced.

Hierarchy constraint triggers enqueue only a parent-bearing insert or an actual
parent-link change. At commit they reload the final row and inspect its parent
and direct children through scoped indexes; rank/content-only updates enqueue
no hierarchy checks. This preserves multi-update final-state correctness without
per-row project scans during compaction. PostgreSQL requires constraint triggers
to be [AFTER ROW](https://www.postgresql.org/docs/18/sql-createtrigger.html);
`WHEN` is evaluated before enqueueing, independently of deferred execution.

The existing exclusive transaction fence rechecks principal/session/grant,
membership, private-project entitlement, archive state and expected versions.
Task/checklist/comment changes, task version, project task revision, immutable
activity, minimal outbox and successful receipt commit together. Original-key
replay checks current authority and returns the current Task without another
effect. A version is monotonic, not an exact increment promise: relationship
composition and existing rank compaction can advance it more than once. The
conservative global fence makes no throughput/scale claim.

## HTTP and public data

Paths are relative to `/api/v1/workspaces/:workspaceId/projects/:projectId`.
Existing JSON/Origin/Fetch-Site/idempotency, no-store, request-ID and session-renewal
boundaries remain shared through `ProjectTaskHttp` on the official NodeAdapter.
Missing/foreign/denied scope gives generic 403; invalid anchors give generic 400;
authorized conflicts never confer access. `TaskCollaborationService` composes
current task policy/receipts through the existing domain service in one transaction.

| Route | Contract |
| --- | --- |
| `POST /tasks` | Existing fields plus optional `parentTaskId` and required corresponding `expectedParentVersion` |
| `POST /tasks/:taskId/parent` | `{expectedVersion,parentTaskId:string|null,expectedParentVersion?}` |
| `GET /tasks/:taskId/relations` | Parent reference, child page, total/open/archivedOpen, current capabilities |
| `GET /tasks/:taskId/parent-candidates` | Authorized eligible root parents for this selected leaf/child; no search |
| `GET /tasks/:taskId/checklist` | Complete bounded active checklist and canonical movement affordances |
| `POST /tasks/:taskId/checklist` | `{expectedVersion,text,beforeItemId:string|null}` |
| `POST /tasks/:taskId/checklist/:itemId` | `{expectedVersion,text?,completed?}`, at least one change |
| `POST /tasks/:taskId/checklist/:itemId/move` | `{expectedVersion,beforeItemId:string|null}` |
| `POST /tasks/:taskId/checklist/:itemId/remove` | `{expectedVersion}` |
| `GET /tasks/:taskId/comments` | Paged current bodies with immutable author/provenance, versions, dates and `canEdit` |
| `GET /tasks/:taskId/comments/:commentId` | `{task,comment}` from one authorized snapshot for exact-target conflict review |
| `POST /tasks/:taskId/comments` | `{expectedVersion,body}` |
| `POST /tasks/:taskId/comments/:commentId` | `{expectedVersion,expectedCommentVersion,body}` |
| `GET /tasks/:taskId/history` | Paged typed activity projection; no raw event JSON |
| Existing task edit/move | Optional `acknowledgedChildrenVersion`; warning response contains current Task and `closeWarning:{open,archivedOpen,childrenVersion}` |

All collaboration mutation results are Task. `Task.parentTaskId` is nullable.
All page DTOs have workspace/project/task IDs, revision, items/total/nextCursor.
Relations/candidates use project task revision; checklist/comments/history use
task version. Opaque cursor envelopes bind scope, collection, revision and visible
anchor; changed revisions return 409 `page-changed`. Pages contain at most 100
rows plus one lookahead. Relations/candidates use ascending task number (Load
more); checklist is complete, position then ID. Comments use **most recently
updated first**, `updatedAt DESC,id DESC` (Load older comments), so creation and
editing older comments are immediately discoverable in canonical first-page
data. History uses `createdAt DESC,id DESC` (Load older activity). These are
revision-checked pages, not a durable snapshot or SSE invalidation channel.

History allowlists actions/field tokens, actor/date/provenance and entity version.
New task edits/moves add bounded before/after status/type/priority/due-date values.
Title/description/comment/checklist bodies, related-entity contents, request IDs,
credentials and arbitrary JSON are excluded. Legacy events retain field-only
history; absent values are never reconstructed from current records. Creator,
comment author and each later event actor stay separate from assignment. The
typed actor supports reserved System/internal provenance; this delivery creates
no System authentication/automation seam or fictional System events. Real
delegated/autonomous authentication/catalog remains T12/T13 work.

Comment source is untrusted data. Reuse `parseSafeMarkdown` and normal React
text/elements: raw HTML/scripts/images are text, unsafe schemes are not links,
and external links use `rel="noopener noreferrer"`. No HTML string renderer or
`dangerouslySetInnerHTML` path is introduced. This is the existing bounded
Markdown subset, not full CommonMark/HTML or an instruction execution channel.

## Frozen presentation integration contract

Types/validators are exported from `@rielia/contracts` in
`task-collaboration.ts`; use `useProjectTasks` for all state/actions.

| Need | Hook/data contract |
| --- | --- |
| Independent sections | `collaboration.relations`, `collaboration['parent-candidates']`, `.checklist`, `.comments`, `.history`: `{status:'idle'|'loading'|'ready'|'error'|'changed',data:Page|null,requestId}` |
| Capabilities | Relations `canCreate/canLink/canUnlink`; candidates `canSelect`; checklist page `canCreate/canEdit`, item `canEdit/canRemove/canMoveUp/canMoveDown`; comments page `canCreate`, row `canEdit` |
| Checklist placement | Item `moveUpBeforeItemId` / `moveDownBeforeItemId` are canonical anchors; null is end only when the corresponding move capability is true |
| Commands | `create-task` with parent fields; `TaskCollaborationCommand` includes set-parent, checklist add/edit/move/remove, comment add/edit. Capture Task.version and comment.version where required |
| Shared draft/key lifecycle | `stage`, `submit`, `retrySave`, `returnToDraft`, `discardDraft`, `cancelPending`; `collaborationDraft/Pending/RetryTarget` are projections of the same single command/key slot used by content/policy/moves |
| Candidate picker demand | `parentCandidatesWanted`, `setParentCandidatesWanted(true)` opens/loads first page; false always closes/clears and invalidates late responses, including during save/reload. Same-task refresh/save preserves explicit demand; navigation/account/auth clears it. The other four inline sections load together |
| Whole-flow guard | `mutationPending`; `draftGuard:{kind:'none'|'draft'|'pending'|'recovery',atTarget,canReturn,canDiscard,canStageNew}`; unsent collaboration drafts cannot be replaced by another target/form without explicit discard |
| Conflict | `outcome`, `conflict:Task`, `commentConflict` and `checklistConflict`; `reloadConflict` fetches exact comment or complete checklist content at the matching task revision before rebase; `rebaseDraft` explicitly adopts both current versions after review. Parent/move destinations require refreshed deliberate selection |
| Parent warning | `closeWarning` plus retained content `draft` or `moveDraft`; `acknowledgeClose()` stages reviewed acknowledgment and preserves intent; subsequent `submit()` uses a fresh key. Generic rebase cannot bypass a warning |
| Paging/retry | `loadCollaborationMore(collection)` loads the next page or retries a failed missing first page; error preserves data/cursor. `changed` requires full `refresh()`, preserving unsent draft/unknown recovery |

An absent page is not zero rows. Auxiliary failures preserve readable detail,
confirmed mutation success and other section/policy/content errors. A changed or
mixed detail/page revision disables use of that stale section until Refresh.
Parent candidates stay `idle` until requested by the picker; `loadCollaborationMore`
pages/retries them only while wanted. No optimistic order or fake comment row is committed. Success remains confirmed
if a follow-up read fails; retrying data never resubmits a mutation. Navigation
retains memory-only drafts and original-key unknown recovery; Return is explicit.
401/403 clears private pages/result/conflict and invalidates late siblings.
Same-human recovery can remain in memory; a different account clears it. Nothing
enters durable browser storage. Presentation owns focus/keyboard/touch, labels,
accessible reading and mobile/desktop evidence after this logic merges.

## Validation and limits

Run frozen install, `pnpm test:projects:logic`, `pnpm check`, `pnpm test:identity`,
`pnpm test:runtime`, `pnpm audit --audit-level=high`, the handoff verifier and
whitespace checks as documented in [CONTRIBUTING](../../CONTRIBUTING.md).
The focused suite covers staged drafts, navigation/unknown-key return, independent
auxiliary recovery/auth clearing, exact comment review, explicit close warning,
proxy scope and raw HTML/script/image/unsafe-scheme XSS cases. Real PG tests cover
the actual migration on archived legacy rows, hierarchy/tenant constraints,
opposing-link and checklist races, close acknowledgment, own/delegated/autonomous
authorship, private/viewer/grant/archive/revoked replay, >100 relation/candidate/
comment/history pages, newly added/edited first-page visibility, deferred rollback
at every durable stage and actual aborted HTTP recovery. The eight-table digest
includes checklist/comments across a real PostgreSQL restart.

The test-only real PG/Nest/Next fixture adds:

```sh
pnpm exec node apps/api/test/project-task-qa.mjs /tmp/rielia-t09-qa.json --collaboration --large-collaboration --smoke
```

Omit `--smoke` to retain the owned local runtime for presentation QA. It seeds
children, an archived open child, candidates, checklist states, edited/other-author/
delegated/Agent comments and malicious Markdown; the large flag adds >100 rows.
Its real Next proxy checks reads, duplicate-free creation/replay, close warning/
acknowledgment/child visibility and viewer denial. Private state contains only
fictional sessions and is never report material; SIGTERM/SIGINT cleans owned
servers, labelled database/volume and state. It is excluded from production images.

Command outcomes and [PR #21](https://github.com/Ljrr3045/rielia/pull/21)
evidence are recorded in [progress](progress.md); exact-head CI and root-triggered
Kody remain required before coordinator merge. The
existing moderate development-only minimatch advisory
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)
remains; the high/critical audit gate passes, with no dependency change here.
No UI/browser accessibility certification, real OAuth/staging/users, T10 search/
SSE, T11 sprints, T12 credentials/MCP catalog, B2 mentions/notifications/attachments,
deployment or full T09/P05/P14/P38/public-launch completion is claimed.


## PR #21 review dispositions

The [hierarchy performance finding](https://github.com/Ljrr3045/rielia/pull/21#discussion_r4432604965)
was valid. Indexed final-row/parent/direct-child checks and parent-change-only
enqueueing replace repeated full-project scans. Actual PostgreSQL regression
forces rank compaction over parent/child rows while a deliberately failing
hierarchy function proves no rank-only invocation; it also verifies transient
invalid/final valid multi-update transactions and invalid final-state rollback.
The suggested statement-level constraint trigger is unsupported by PostgreSQL.

The [eager collection finding](https://github.com/Ljrr3045/rielia/pull/21#discussion_r4432605125)
is partially applicable: the approved detail renders relations/checklist/comments/
history together, so those four bounded independent reads remain. Parent
candidates are picker-only and now load on explicit demand, with scope/auth
clearing and stale-response invalidation. Focused regression asserts no initial
candidate request, wanted refresh, closure, navigation and auth-denial behavior.
Changed source requires fresh exact-head CI and coordinator-triggered Kody.

The later [picker-close finding](https://github.com/Ljrr3045/rielia/pull/21#discussion_r4432656992)
was valid: the opening/fetch preconditions also blocked a local close while a
mutation or reload was pending. Clearing demand/data now runs unconditionally
before the network guards. Focused regression closes during a pending save and
a refresh with null task/session, then proves the later load requests no candidates.
No backend/schema/API change or broader optimization is involved.
