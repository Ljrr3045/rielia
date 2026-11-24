# T38.2a Sprint schema migration

**LOCAL IMPLEMENTATION/VALIDATION COMPLETE; PR REVIEW PENDING,
2026-11-23 America/Caracas.** This is the coordinator-released
H30–35/G03/X04 slice of [T38/issue 53](https://github.com/Ljrr3045/rielia/issues/53),
after [T38.1 acceptance in PR57](https://github.com/Ljrr3045/rielia/pull/57#issuecomment-7118652391).
PR57 reviewed `b12e3220f92125144fdb6309623a9ce042da14a8`, merged
`4dab85945568f5a1529c9a99ba53a722dbacd0d2`; reviewed/merged tree
`8573ea3d9f4e86a954367ac8f5cfba8cd1813783` is identical. Exact-merge
[validate 138135467847](https://github.com/Ljrr3045/rielia/actions/runs/45301675698/job/138135467847)
passed all 24 steps. Native Kilo round two `edb5b893-f38b-42d9-afb6-32206da0f03d`
was clean after five documentation findings were corrected. These are preserved
coordinator receipts, not checks rerun by this migration.

Prepared in [Draft PR58](https://github.com/Ljrr3045/rielia/pull/58), targeting
`dev`. The coordinator initially published implementation head
`f03cb064331cef8439042d5a11bdf5694a394943`, tree
`802b54c683c5345c40077cda0bba2b7a17abc9c2`. The local source/run receipts below
remain bound to that delivery; this subsequent reference-only documentation
batch does not regenerate or rebind application evidence. Current-head hosted
CI/native Kilo, feedback/base/ownership checks and final acceptance are pending.

## Scope and owners

Traceability: original T11; P09/P10/P38; US06/US11/US12; retained UX04/05/06
behavior. Planning configuration, create/edit Sprint, planning/list/detail and
confirmed mutation/reload retain their public protocol. The sole selected
compatibility correction rejects coercible arrays/objects for Sprint
`creator.kind` and `provenance.executionMode`, including active/closed Sprint
representations returned by the same endpoints. Valid scalar outputs and extra
response keys remain compatible.

- `packages/contracts/src/sprint-schemas.ts` owns the strict request schemas,
  response schemas and inferred types. It imports only Zod. `sprints.ts` retains
  default scale/commands, reexports the schemas/types and delegates its eight
  existing guards; the migrated handwritten G03 implementation is removed.
- Request exports are `configurePlanningInputSchema`, `createSprintInputSchema`
  and `editSprintInputSchema`; aliases use `z.input`. Settings/fields, planning,
  planned/active/closed/union Sprint and page DTOs derive from `z.output`.
  A local type-only known-key projection removes loose-object index signatures,
  distributing unions and preserving arrays/optional properties without parallel
  DTO declarations or casts. Pinned Zod's `exactOptional()` preserves omitted
  versus present-undefined capabilities at runtime and in inferred types.
- `apps/api/src/projects/sprint-input.ts` maps shared schema failures into the
  original BadRequest errors and preserves outer-admission → fields → version
  precedence. It retains the old `{version,fields}` and planning shapes, copied
  point scale, exact strings and therefore canonical idempotency hash inputs.
  `sprint-policy.ts`/`sprintInterval` retain IANA/Gregorian/DST and UTC boundaries.
- `apps/web/src/lib/sprint-client.ts` consumes the schema-backed guards, retains
  unknown response keys before scope checks and removes its two result casts.
  Same-origin requests, cancellation, exact command/key, scoped current/error
  mapping and the confirmed-write/reload controller remain their existing owners.
- `sprint-form-state.ts`, `sprint-commands.ts` and API `sprint-policy.ts` retain
  compatibility guard calls. G06 task participation/transition and G07 close
  result guards still consume `isSprint`; only their nested Sprint projection
  receives the selected scalar correction. G02 `isDomainPerson` and historical
  action coercion remain unchanged and outside this batch.
- Relevant persisted receipt owner `sprint-mutation.ts` stores sparse tagged IDs,
  not serialized public Sprint DTOs. It retains current-authority replay and
  rehydration. Public schemas cannot replace that private format. The other seven
  receipt/snapshot owners remain inventoried later T38.2 debt.

Strict inputs retain unknown-key rejection, presence/null, safe versions and
UTF-16 bounds. Loose output objects retain extra keys, exact IDs/cursors,
Gregorian/UTC formats, state/presence rules, provenance correlation and scoped,
unique bounded page items. No schema derives trusted execution or authorization.
HTTP admission, server policy, locks/transactions, activity/outbox, revisions,
idempotency, current authority, SSE and database schema are unchanged.

## Dependency, compiler and measurement boundaries

Only contracts gains a direct runtime dependency, exact `zod` **4.6.7**, using
the already locked package/snapshot. Root/app/provider pins, optional-peer rules,
patches, lifecycle allowlist and release-age policy remain unchanged. One frozen
app and one frozen isolated unit-tools install passed with verified direct
Node24.22.1/pnpm12.15.0. No project `pnpm exec` discovery was used. The only
dependency lifecycle observed was existing Prisma preinstall; linked-worktree
prepare explicitly left shared Git configuration unchanged.

The initial restricted-sandbox install hit registry DNS failures; its exact
task-owned process was stopped and the receipt preserved. The coordinator
released the same frozen install with normal registry/cache access. Native pnpm
rejected a dedicated `--fetch-retries` flag before installing; its supported
universal `--config.fetchRetries=0` setting was verified and used. Neither event
was a dependency failure or an automatic approval rejection. No store purge,
global configuration change, age exception or new lifecycle permission occurred.

The first candidate contracts build exposed Zod public declarations' standard
`URL` references under the original ES2023-only, `types:[]` compiler surface.
The coordinator released explicit **DOM** alongside ES2023 only in the contracts
config. `types:[]`, strict settings and `skipLibCheck:false` remain. This makes
ambient DOM types available more broadly than URL; it is a compile-time
accommodation, not permission to use browser-only APIs in shared runtime code.
No reference-lib directive, ambient shim, Node import or new type dependency is
added. Published declarations do not inject a consumer library directive;
existing consumers must still typecheck under their own configurations. P1's
different ambient surface did not prove this production compilation boundary.

The contracts unit mirror now links only its declared dependency directory,
allowing the real Zod edge under strict pnpm resolution. The existing isolation
regression checks absent dependency failure, permitted dependency resolution and
continued rejection of original maintained-source escapes. Source attribution,
exclusions and provider versions remain unchanged. The new flat schema owner is
added to maintained formatting. The contracts config fingerprint affects all
four numerical manifests, including prototype; unchanged prototype source,
tests and metrics require independent comparison. No baseline write is accepted
by a compiler/source/tooling fingerprint change alone.

## Local evidence and remaining gates

Stage A passed: strict contracts/API compilation, a TS6 no-emit type probe and
**139/139** focused retained/new cases, without skips. The probe checks both-way
assignability to pre-migration DTOs, state/id/version narrowing, scalar enum
rejection, arrays and exact optional capabilities. The same twelve malformed
array/object scalar cases are all accepted by preserved base G03 (expected red
witness) and all rejected by the candidate (green), with valid scalar/extra-key
controls passing both. Tests retain G07/PR52 regression evidence without claiming
G07 production migration. Existing controller/form schedules protect pending,
unknown, 401/403/409, same-key retry, session/SSE and confirmed/reload behavior.

The standard check sequence completed as an explicitly resumed equivalent,
not an uninterrupted successful `pnpm check`. Its first command passed format
and 24 quality cases, then stopped at one unused parser binding in lint. That
binding was removed; corrected lint and only the remaining sequence ran. Backend
installed closure passes for 286 packages without Express; protocol/recovery,
six real web integrations and all existing consumer typechecks pass. The build
completed contracts/API and web compilation/static generation, then stopped on
Next16.4.3's inherited security-upgrade reminder. The coordinator released one
identical web-only retry, which passed, followed by missing MCP build, 17 MCP
cases and smoke. Both build receipts and the upgrade recommendation remain;
no upgrade, suppression, pin/config change or vulnerability remediation is
claimed. Successful prefix/prerequisite steps were not replayed. Standard
workspace commands retain their existing internal scheduling.

### Historical proposal one — rejected before adoption

The first four-scope measurement passed **744/744**, without skips: API291,
web407, contracts27, prototype19. It exposed an unexecuted new configure-response
rejection branch. Two malformed/foreign-scope response cases were added to the
existing transport test, and only web measurement ran again (**407/407**),
removing that new uncovered debt. The proposal combines that explicit newer web
receipt with unchanged API/contracts/prototype reports from the first run; it
does not claim a fresh all-scope normal replay or manufacture complete status in
the scoped runner output.

| Scope | Lines | Statements | Functions | Branches |
| --- | --- | --- | --- | --- |
| API | 1397/2073 | 1518/2260 | 383/592 | 1222/1769 |
| Web | 3530/4941 | 3883/5605 | 834/1358 | 4643/6996 |
| Contracts | 205/205 | 232/232 | 124/124 | 688/696 |
| Prototype | 238/853 | 269/984 | 87/368 | 194/954 |

These are measurements, not accepted gate results. The new schema owner is
41/41 lines, 44/44 statements, 16/16 functions and 39/39 branches. Combined old
G03 versus new schema/facade ownership adds 19 covered lines/statements and six
functions while removing 94 covered handwritten branch units. Zod internals are
dependency code, excluded by the unchanged provider policy; first-party numbers
do not claim instrumented library implementation coverage. Eight pre-existing
uncovered contract branches remain byte/source-qualified in G02 (three), G04
(four) and G05 (one). None belongs to the migrated owner.

In the first proposal, this denominator change lowered the global contracts branch ratio from 782/790
to 688/696, despite unchanged uncovered count and fully covered migrated code.
The accepted **9898 basis-point** floor stayed protected; that candidate retained
it and **could not pass that normal gate**. No unrelated coverage expansion or
lower floor hid the issue. The coordinator rejected that proposal and released
the bounded response below. Prototype source/tests/totals/per-file metrics stayed
unchanged; only its shared contracts-config fingerprint needed a proposed
current-manifest update.

The infrastructure run passed **19/20**, including the extended declared-
dependency/source-isolation regression. Its existing first actual-four-scope
gate failed on missing API summary after the deliberate scoped web run cleared
other runner output. It would also require approved test fingerprints and
comparable baselines; it is not recorded as passed. No skip, assertion change,
synthetic complete status or broad rerun was used. The retained proposal records
the exact per-scope reports and this failure separately.

### Historical proposal two measurement — subsequently approved

The coordinator rejected the first numerical proposal without lowering its
9898 floor, then released only three independent compatibility cases in
`packages/contracts/test/guards.test.mjs`: non-null archive dates for Project/Task,
actual string delegated/autonomous grant IDs, and a non-null Task parent ID.
Each valid projection is otherwise complete; malformed date/non-string variants
reach the intended check independently. Null controls retain existing permissive
G02 projection behavior rather than importing Sprint policy. No G02 production
guard/type/coercion, G04/G05 source/test, or business rule changed.

Only contracts measurement ran again: **30/30**, no skips, with unchanged
205/205 lines, 232/232 statements and 124/124 functions; branches are now
**691/696**, above the protected floor. The measured proposed branch floor is
**9928**, an increase. These meaningful controls cover the three previously
unexecuted G02 units; the remaining five old uncovered units stay owned by
G04/G05, with no new uncovered code. Existing maps/provider/source identities
remain unchanged. Focused lint of the added cases passes.

The revised packet retains unchanged API/web/prototype reports from proposal
one and only replaces the contracts report/test fingerprint. Expected eventual
normal count is **747** (291/407/30/19); that is a prediction, not a normal replay.
Both proposal generations and their separate receipts remain preserved. No
install, successful build, full check, web measurement or infrastructure suite
was replayed for this test-only extension. The previous infrastructure 19/20
failure is not waived: fresh normal four-scope output plus approved comparable
baselines must precede its next complete run.

## Approved migration and normal replay

The coordinator numerically approved proposal two, bound to base `4dab8594`,
21-file working-tree binding
`535df06bd626062175b47aa78e5b5a7cf66653757f58c00081d4df345ae19bbe` and proposal
SHA-256 `1da950af5c238e6303b8a2b62cb88d54a98b17d00efb3d11b47c28760dc87042`.
The independent review checked all 16 reports, accepted-before archive equality,
every retained file's ratios/uncovered counts, ownership, test fingerprints and
floor monotonicity. Archive identity is
`2026-11-23-t38/t38-2a-proposal2-approved`. This is numerical acceptance, not final
feature/PR acceptance. Only these four approved current baseline bytes were
copied; all four historical pre-unit baselines remain byte-exact:

| Current baseline | Approved SHA-256 |
| --- | --- |
| API | `92ea60a2997594276e6e80b37b98fa56ab124ed05291534d14455f644fd174ee` |
| Web | `829b1290e268d33c9a8cdae6a5ec66934e1bf60786d8d22b803262114bca6af1` |
| Contracts | `75c912f266656f79c16fd9ea527949ae2341545a12c16dd4f0e988c1c1f25c0d` |
| Prototype | `aa02ac448391cc4bc3ab4bb748f25b6ca631c7297d10d813c5e72d64ae2b7541` |

One fresh normal `pnpm unit:coverage -- --built` passed **747/747**, no skips:
API291/web407/contracts30/prototype19. Actual count digest is
`17812a38338eac6e797c70b2ac902336661aecea943c465e6667c485bdc6884a`.
All **16 report hashes and sizes** exactly reproduce the approved proposal;
all four scope statuses are genuinely complete. Full infrastructure now passes
**20/20**, including its actual-report gate; `unit:artifacts` validates **17**
bounded files without upload. The historical 19/20 prerequisite failure remains
recorded above and is superseded by this normal run, not waived or hidden.

Final measured L/S/F/B are API 1397/2073, 1518/2260, 383/592, 1222/1769;
web 3530/4941, 3883/5605, 834/1358, 4643/6996; contracts 205/205, 232/232,
124/124, 691/696; prototype 238/853, 269/984, 87/368, 194/954. No floor decreases;
contracts branches ratchet **9898 → 9928**. Unchanged-source maps retain
API 3081/web 9249/contracts 928/prototype 550 covered S/F/B units with three G02 gains
and zero losses. No changed-source semantic-counter equivalence is claimed.
Map precision remains explicit: statement spans, function declaration/body spans
and branch-location spans have null/total endpoints API191/10426, web543/30634,
contracts21/2352, prototype69/5348. These use the same disclosed comparison
method; provider unknown columns are not perfect attribution.

## Real HTTP, deployment closure and remaining delivery

The focused existing `scripts/test-identity.mjs --sprints` run passed **44/44**
(planning10/scope-start17/close17), including the new planning/edit/detail/list
canonical readback assertions. It retains actual PostgreSQL/NodeAdapter tenant,
private/viewer/grant/revocation, date/DST, version/race/retry/rollback/journal and
indirect active/closed compatibility evidence. Its disposable database was
removed. This is affected regression validation, not a replay or reacceptance
of the full original T11 matrix or broader identity/provider surface.

One `test:runtime` run passed in 151.106 seconds, including frozen image
packaging, nonroot execution, migration/schema failure gates, readiness versus
liveness, locked-query/SIGTERM cleanup, DB recovery and durable diagnostic work
across stack recreation/worker restart. Complete deployed API/worker and
migration stores contain no Express. Inherited optional Prisma/Studio tooling
peers remain in the API/migration graph; migration also retains TypeScript.
No absence of all optional tooling is claimed. Owned containers, network, volume
and image tags were cleaned; identity stayed disabled and no real external
provider was used. Timings are observations, not comparative performance claims.

Offline handoff verification passes 47 imported files, 30 asset hashes/sizes and
1017 local links in 91 documents. Remote URLs and heading fragments are not
verified by that tool. Whitespace checks and normal pre-commit/commit-message
hooks passed for implementation commit `f03cb064`. This later documentation
batch retains its own applicable link/whitespace/hooks receipt.

Root and isolated-tool `audit --audit-level=high` gates pass: root reports one
low/fourteen moderate findings; tools report two moderate findings, with no
high/critical findings in those snapshots. The inherited Next security-upgrade
recommendation and advisory debt remain; no package upgrade/security remediation
is included. The bounded implementation was committed with normal hooks and
published by the coordinator as recorded above. Current-head CI/native Kilo,
feedback/base/ownership checks and final acceptance remain separate delivery
gates; the worker makes no remote action.

Ignored local evidence remains under `coverage/t38-sprint-schemas/`, including
both proposals, exact adoption/normal reproduction and all failure/continuation
receipts. Accepted-before reports are reused from the coordinator archive.

No Query/RHF/OpenAPI generator/testing-library/browser/diagnostic addition, UI
redesign, new DB migration, deployment, real providers/staging/users or credentials
are included. Omitted native external Cancel/Leave remains UNVERIFIED with
possible draft loss; filters remain T08/T10/US05. This local migration accepts
neither full T38 nor adjacent original tickets/device/accessibility conformity.
