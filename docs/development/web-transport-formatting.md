# T36 web transport formatting adoption

This T36.3 W1 batch adopts exactly 20 existing web transport, proxy, controller,
hook and small state/markdown modules. Pinned Prettier 3.9.10 changes 15 files;
five already formatted files remain byte-identical. The exact lists are in
[the inventory](formatting-inventory.json). The project task controller and
`useProjectTasks` retain the exact PR #35 lifecycle correction bytes. There are
no presentation, CSS, prototype, test, policy, dependency or pipeline changes.
This preserves P01–P11/P33/P38 and existing UXR01–04/06 and
UX01–03/05–07/09/11 contracts; it adds no product behavior or coverage.

The actual base is merged [PR #36](https://github.com/Ljrr3045/rielia/pull/36),
`2340ba788be7ab4fe13c62248e3287dd579db94e`. All 20 before sources match the
captured PR #35 merge `be777b434b249fd039da1519d0146177b8e0d1c9` exactly.
The eligible denominator remains 208: adoption moves 123→143 and remaining
work 85→65. Presentation/prototype and scripts/config formatting, structural
extraction and T36 acceptance remain open before T37, then T11.

## Mechanical proof and limits

All 20 real before/after pairs pass TypeScript 6.0.3 source-tree, emitted-runtime,
literal and ordered comment comparisons; original file modes and a second
Prettier pass are stable. The private comparative helper is independently
reviewed evidence, not a newly installed repository command. Its sealed W1
revision is `986042f0c484d6b1eeb2ba96a419d7868738fc288bcddb061d131af07f0106de`.
It retains the original 52 controls and passes 15 targeted additional controls.

The original comparator refused three files before any source write. Two
narrow, reviewed comment-anchor cases resolve those refusals: parser-proven
optional leading union bars may shift token ordinals, and a sole ordinary
multiline comment within the same empty catch block may move its preceding
line break. The latter retains exact payload, following-line relation, catch
and try ownership paths, named owners and associated try-tree digest on both
sides. Single-line comments, pragmas, comment loss/relocation, changed owners,
nonempty catches, multiple comments and nonleading operators remain strict.
This enrollment does not approve arbitrary comment movement or establish TSX,
CSS or YAML equivalence. No such file is changed in W1.

## Paired coverage migration

Fresh accepted-base A, formatted B and repeat runs use the same Node 24.22.1,
pnpm 12.15.0, TypeScript 6.0.3 and accepted Istanbul/nyc provider, compiler,
tests, configs and exclusions. Each stage separately builds real contracts/API
prerequisites through native pnpm, then runs
`node scripts/unit/run.mjs --measure --built`. All 269 cases pass each time:
API 129, web 114, contracts 7 and isolated fictional prototype 19. All 101
source inputs remain: 30/51/4/16. A's 16 scope reports match the accepted
PR #36 hosted reports byte-for-byte; B's 16 reports match repeat byte-for-byte.
Each stage also preserves its status report, making 17 reports per stage.

| Scope               | A covered/total lines | B and repeat | B line floor |
| ------------------- | --------------------- | ------------ | ------------ |
| API                 | 597/1477              | 597/1477     | 40.41%       |
| Web                 | 975/3463              | 1177/3721    | 31.63%       |
| Contracts           | 99/99                 | 99/99        | 100.00%      |
| Fictional prototype | 199/805               | 199/805      | 24.72%       |

All per-file statement/function/branch IDs, topology, names, arity and full hit
counters are identical. Web S/F/B remain 1292/4255, 230/1042 and 1300/5192;
their floors remain 30.36%, 22.07% and 25.03%. The other three scopes retain
their exact maps and counters. The 36 unchanged web inputs also retain their
full maps and counters. Formatting is not a semantic coverage gain.

The coordinator explicitly accepted 15 changed input fingerprints and 12
physical-line rows in the current web baseline, including its aggregate and
line floor 28.15→31.63. The other seven baseline files remain byte-identical,
including all four historical pre-unit baselines. No input is removed, ignore
added, provider changed or unexecuted-source/failure gate weakened. The existing
`assertComparable`/`assertGate` pass for all four scopes on both saved B and
repeat, without rerunning the 269 cases merely to rewrite JSON.

The per-file physical-line ledger is deliberately explicit:

| Changed line row     | A       | B       | Extra uncovered lines |
| -------------------- | ------- | ------- | --------------------- |
| workspace route      | 0/4     | 0/5     | 1                     |
| identity-controller  | 44/45   | 54/55   | 0                     |
| identity-proxy       | 0/16    | 0/17    | 1                     |
| project-task-client  | 61/73   | 99/130  | 19                    |
| project-task-proxy   | 40/41   | 55/61   | 5                     |
| safe-markdown        | 34/34   | 59/59   | 0                     |
| task-events-client   | 39/39   | 88/92   | 4                     |
| use-identity         | 7/7     | 8/8     | 0                     |
| use-workspaces       | 16/16   | 26/26   | 0                     |
| workspace-client     | 25/33   | 35/54   | 11                    |
| workspace-controller | 104/109 | 148/162 | 9                     |
| workspace-proxy      | 0/18    | 0/24    | 6                     |

Five line ratios decrease: project-task-client, project-task-proxy,
task-events-client, workspace-client and workspace-controller. Eight rows gain
uncovered lines, including the three wholly unexecuted proxies/routes. Of 56
extra uncovered line units, 19 come from formerly covered dense lines and 37
from splits of formerly uncovered lines. No old uncovered group disappears. No new mapped line combines origins
from both formerly covered and formerly uncovered old line groups
(`mixedOriginNewLines=0`); an old dense line can contain both hit and zero-hit
statements. Independent raw-map
reconciliation and eight synthetic plus eight real-web corruption controls
support the ledger; summaries alone are not its proof.

All 44,596 endpoint lines are valid; every known column is within its source
UTF-16 line bounds. Null columns remain unknown. Web unknown columns rise
596→639: exactly 43 new END-column fields across 10 changed files, with zero
new unknown START columns. This exact-span precision loss is an explicitly
reviewed limitation, not proof of complete source maps. No unit, hit or start
line is lost and no missing position is invented. The exact field IDs are
enumerated in `webTransportFormattingAdoption.newUnknownEndColumnFields` in
the inventory; the exception applies only to this migration. Other scopes'
unknown-column counts remain unchanged. Low coverage, unexecuted views and
previous source-map limitations remain visible debt.

## Validation and delivery state

All 20 infrastructure/upload cases, immutable handoff/link verification and
`git diff --check` pass. One actual native `pnpm check` passes serially: adopted
formatting, 24 tooling regressions, ESLint, 286-package Express-free closure,
retained logic/real-loopback HTTP suites, typechecks, optimized builds, 17 MCP
cases and final HTTP smoke. It uses the real pinned pnpm executable, without
the narrower paired-measurement observer in its PATH. Local runtime reuse preserves the existing installed
dependency graph and pinned tools; it does not install, repair caches, copy
host execution records or alter lockfiles. Runs are serial, with
`PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN=error` and
`PNPM_CONFIG_WORKSPACE_CONCURRENCY=1` in the native parent/children. Exact
owned metadata/cache/task-record changes and a bounded frozen dependency-host
monitoring set are recorded, rather than claiming to hash every dependency.
Owned workspace validation-cache bytes remain exact; legitimate new owned
task records are explicitly recorded, never copied from another checkout. The monitored frozen-host set and immutable metadata remain exact;
all four validation process groups exit without retained children.

No new local PostgreSQL, Docker, browser, provider or physical-device run is
claimed for this mechanical batch. Existing integration evidence is retained;
mandatory current-head hosted CI must still run native check, real identity/
security/PostgreSQL/runtime checks and audits and publish the validated coverage
artifacts. Independent final review, Draft publication and coordinator-controlled
Ready/Kilo/merge remain pending. This does not complete T36.
