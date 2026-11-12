# T37.1 frontend-local skill preparation

The user authorized starting T37 on **2026-11-11, America/Caracas**. SOL owns this
technical installation/integrity/documentation batch. Astra high owns independent
surface/state inventory, reference research and visual decisions in a separate
checkout. This package changes no application behavior, dependencies, permissions,
unit/coverage baseline or handoff bytes; T11, landing and new product surfaces are
excluded. Delivery: merged PR #45 at `8065c07895640da228accbd50295d79517d2afa1`
from reviewed `57ee1641aa453b6f08d81d29f0b5f294afece35c`; [T37.1 acceptance](https://github.com/Ljrr3045/rielia/pull/45#issuecomment-6811811563).
The coordinator also authorized integrating Astra's prepared research documents
below. Initial fresh discovery succeeded with a nested archive catalog finding;
post-fix fresh verification passes at `325d732`. The acceptance above supersedes
dated pending preparation notes below. UI implementation and full T37 acceptance
remain separate; no new discovery, vendor execution or install is implied.

T36.1–T36.6 were accepted in [PR #44](https://github.com/Ljrr3045/rielia/pull/44),
merged as `92d480dcc3c35f2bc340b99ff2dd084097c7457c` from reviewed head
`37f2a8ccfcb021dab859432c48b1fc4107e33f15`. Validate check 128542524120 /
[run 42418787393](https://github.com/Ljrr3045/rielia/actions/runs/42418787393)
and native 128544891139 passed; the coordinator supplied successful postmerge
[run 42419900016](https://github.com/Ljrr3045/rielia/actions/runs/42419900016).
The earlier proposed closure wording remains a historical pre-review snapshot.
The accepted [stable UI contract](t36-stable-ui-contract.md) and its owned debt
govern T37; 387 cases / 124 inputs / 242 adopted inputs are T36 evidence reused
without a new local app/test/audit claim in this preparation.

Traceability: T37.1; existing P01–P11/P33/P38,
US01–US08/US11–US12/US24–US25, UXR01–UXR04/UXR06 and
UX01–UX03/UX05–UX07/UX09/UX11 as relevant. Preparation implements none of the
unshipped capabilities appearing in those broader requirements.

## Reviewed packages and revision decision

All three immutable revisions match the roadmap's researched snapshots. Official
GitHub metadata was read on November 12 UTC (November 11 Caracas). Newer heads
were observed, recorded and **not upgraded to or reviewed as installed content**.

| Local name | Installed repository/revision/path | Observed default `main` head | Contents/license |
| --- | --- | --- | --- |
| `frontend-design` | [anthropics/skills at ca45fc4](https://github.com/anthropics/skills/tree/ca45fc496a3436251f191354091d557da31c15b5/skills/frontend-design) | `2c5958ecac7cee2b583967a2c4981d0f4a75c579` | Two original files; Apache-2.0 `LICENSE.txt`; composition/copy guidance, no runtime |
| `impeccable` | [pbakaus/impeccable at c3bb418](https://github.com/pbakaus/impeccable/tree/c3bb418ee38ee49a6b999b7752c1368f3123a2bd/.agents/skills/impeccable) | `b4bff1626c344067788c2679f048a20057c7cc5a` | v4.8.0; all 63 skill files plus root LICENSE/NOTICE/README and two supplemental MIT notices, 68 files; Apache-2.0 with retained attribution |
| `ui-ux-pro-max` | [nextlevelbuilder source at b7d5353](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/b7d5353e0130feb8c5574ef1251f8a1db1873ccb/.claude/skills/ui-ux-pro-max) | `6ae86f61f520d6ca229d2f40e070410638c908c5` | All 74 skill resources, MIT LICENSE, original SKILL and Codex layout receipt; 77 files |

The [installation manifest](../../apps/web/.agents/skill-installation.json)
records complete revisions, timestamps, archive URLs/digests and every installed
file's upstream path, source SHA-256, installed SHA-256, bytes and executable mode.
Its 147-file set contains no symlinks. Archive metadata contained no links in any
selected tree; UI UX Pro Max's unrelated `gallery/data/styles.csv` link was outside
the selected package and was not installed. Package resources are copied in full,
not replaced by a global copy or an incomplete SKILL-only installation.

The sole local instruction adaptation replaces 11 Claude-plugin search paths in
UI UX Pro Max with `<skill-base-dir>/scripts/search.py` and adds a modification
notice after its frontmatter. Original bytes remain at `upstream/SKILL.md.txt` and the
pinned Codex platform layout at `upstream/codex.json`. The scripts, data and
references are unchanged. The verifier reconstructs the adaptation exactly.

Impeccable's root NOTICE attributes its iOS/Android references to
`ehmo/platform-design-skills` under MIT. Supplemental complete MIT texts are
included from [platform-design-skills dc2be82](https://github.com/ehmo/platform-design-skills/blob/dc2be825d8b439caea78e9eaa8fb3ac23b0ff3e9/LICENSE)
and [modern-screenshot 792d6db](https://github.com/qq15725/modern-screenshot/blob/792d6db7411839c62940a6e930161f8e376e817f/LICENSE).
These are notice-source pins; upstream does not identify the bundled minified
modern-screenshot version. They do not assert that those revisions produced the
bundled code. Catalog provenance/font-license metadata is retained; font binaries
are not installed. No notice adopts a repository license for Rielia.

## Installation and review boundary

Read the available `skill-installer` SKILL.md and inspect its helper before use.
The helper used here has its SHA-256 recorded in the manifest. It downloaded each
reviewed pinned tree with explicit `--ref`, `--dest` and `--method download`:

```sh
python3 "$CODEX_HOME/skills/.system/skill-installer/scripts/install-skill-from-github.py" --repo anthropics/skills --ref ca45fc496a3436251f191354091d557da31c15b5 --path skills/frontend-design --dest apps/web/.agents/skills --method download
python3 "$CODEX_HOME/skills/.system/skill-installer/scripts/install-skill-from-github.py" --repo pbakaus/impeccable --ref c3bb418ee38ee49a6b999b7752c1368f3123a2bd --path .agents/skills/impeccable --dest apps/web/.agents/skills --method download
python3 "$CODEX_HOME/skills/.system/skill-installer/scripts/install-skill-from-github.py" --repo nextlevelbuilder/ui-ux-pro-max-skill --ref b7d5353e0130feb8c5574ef1251f8a1db1873ccb --path .claude/skills/ui-ux-pro-max --dest apps/web/.agents/skills --method download
```

These are installation receipts, not commands to run over existing destinations.
`CODEX_HOME` denotes the reader's installed Codex data directory; locate the helper
in that installation. No Orca installation, user-specific absolute path, npm CLI,
global skill overwrite or optional engine is needed. The helper aborts on existing
destinations. Supplemental root notices/resources and executable bits were copied
from the same inspected archives; the sole adaptation is described above.

Review covered entry instructions, referenced-resource packaging, launcher and
command paths, Python imports/read/write behavior, agent descriptors, license
notices and archive link metadata. This is a bounded integration review, not an
audit of every minified statement or a security certification of optional engines.

User/repository/product/UX/brand/architecture instructions outrank all three
packages. Frontend Design's heroic composition and Impeccable's new-world/asset
guidance do not authorize marketing screens, invented copy, mandatory fonts,
generated assets or replacing Rielia's proposed identity. Read the Operate guidance
for work surfaces. Design suggestions never grant backend policy or logic ownership.

Impeccable's launcher can execute a local/PATH/home binary or download an engine
into a user cache, and its context command is therefore excluded too. Read the
existing project context and relevant references directly. Engine/hooks/live
server/Apply, update/pin/doctor changes, catalog requests and bundled-agent
activation are not enabled or executed. Its README documents an Apply fallback
that spawns Codex/Claude with approval/sandbox checks disabled; that path remains
forbidden and Apply must remain off. No `npx latest`, implicit agent launch,
global config, approvals bypass or backend-local Prisma skill change occurred.

UI UX Pro Max's runtime imports are Python-standard-library modules and local
siblings. Read-only `--stack`/`--domain` searches read packaged CSVs; `--persist`
can write design-system files, so it and `--force`/catalog refresh are excluded
from routine use. Search output is advisory and cannot become the product brief.
Keep queries generic and free of private project data. The smoke is a tool check,
not Astra's research or approval of its recommendations.

## Safe discovery and precedence

Start a **fresh frontend worker with cwd `apps/web`**, after this commit is present
in its own checkout. Require the effective Astra high and Approve for me receipts
under [frontend-agent.md](frontend-agent.md). A root-started session must not be
assumed to discover descendant skills. Installed files become candidates on the
next turn/fresh session; this existing technical session's catalog is not proof.

Record the actual catalog/loaded `SKILL.md` paths for all three names, the checkout
head and cwd, and the local `ui-ux-pro-max` Next/React guidance/resources. Every
T37 dispatch must explicitly select the local top-level
`apps/web/.agents/skills/<name>/SKILL.md` paths (relative to repository root),
or `.agents/skills/<name>/SKILL.md` from `apps/web`. Do not claim an automatic
local/global override or change global skill/config settings.

Initial discovery task `task_ba6ec966ff00`, fresh Astra high session
`01a1cd29-5fae-72b3-97a7-834947304c3d`, ran with cwd `apps/web` at checkpoint
`bc2fb2eaaf0d4d430720b72f8d2e9ea7a004f6f1`. Verified permissions were
auto_review/on-request/workspace-write. Its actual injected catalog contained
all three intended local top-level entries; the worker fully read them and
sampled their local references/license/Next.js/React data successfully, without
running vendor code. The catalog also exposed the global customized
`ui-ux-pro-max` and a fourth local entry at `ui-ux-pro-max/upstream/SKILL.md`.
No unique bare-name winner was observable; the local top-level entry was selected
explicitly. The archival entry's relative reference/script paths did not resolve.

The follow-up renames only that original source to non-discoverable
`upstream/SKILL.md.txt`, preserving its exact SHA-256
`9aa50bd44076db28624ea976056d915905ab9357748f90263a004fa0ef087147`.
Installed and upstream source paths remain distinct in the manifest: the upstream
source is still `.claude/skills/ui-ux-pro-max/SKILL.md` at the original pin.
The adapted entry's notice points to the archival filename. Integrity now enforces
exactly the three intended top-level catalog filenames and rejects nested entries
even if a changed manifest lists them. The package still has 147 files, now
5,930,875 bytes (four extra bytes in that notice); no original source bytes change.
**Post-fix fresh-session catalog verification: PASS.** Task `task_016c2e3ce98c`,
fresh Astra high session `01a1cd31-7804-7bf3-b496-f9e2282d9352`, used cwd
`apps/web` at `325d73211b859debecb4e780ee7fefc0433a8172`; the coordinator verified
auto_review/on-request/workspace-write, with network access false. Its actual
injected catalog contained all three intended local top-level entries and the
global duplicate, with no nested upstream or archival-text entry. The worker
explicitly selected and fully read the three local files. It observed the archive
and metadata without rerunning integrity or resource sampling; the
[focused integrity checks](#integrity-formatting-and-validation) are SOL evidence.
No vendor code or app checks ran in that session.

The [local usage entry](../../apps/web/.agents/README.md) gives the exact read-only
search command from `apps/web`. No Impeccable binary probe is needed for discovery.
The coordinator accepted this bounded discovery evidence for integration. This
preparation still requires current-head CI/native review and coordinator acceptance;
it does not implement or close full T37. The initial terminal footer's two unexplained warnings
are not attributed to skill loading. No backend-session isolation, UI quality,
accessibility or persistence conclusion follows from discovery.

## Independent Astra research integration

The coordinator reviewed and authorized byte-exact integration of the prepared
[current-source inventory](t37-ui-inventory.md) and
[design direction](t37-design-direction.md) from `docs/t37-ui-research`, task
`task_8846f535f733`, based on `92d480dcc3c35f2bc340b99ff2dd084097c7457c`.
The source worker used verified GPT-6-Astra high and Approve for me. It produced
staged documents without a source commit because its local hooks runtime was
absent; SOL integrates them here with required hooks and without modifying the
source checkout. Source file SHA-256 values are:

- Inventory: `f1d0cbdedcaf43a5d4428f67b57768a231f2d08b7001f5524fc0cccc21172fcb`.
- Direction: `c636e6aedab7d3189e9401ebd7268be96f67646ee4444c52ae4b8a5d4384f764`.

These hashes bind the original byte-exact research integration. Later dated
discovery addenda update only current discovery status; they are distinct from
the preserved research snapshot and naturally change the whole document hashes.

Their source/base labels are preserved, including the then-absent local skills;
the installed package state is recorded separately above. Astra reports actual
Mobbin image inspection and mismatched results with explicit limits; SOL did not
repeat that research or claim its images as technical-worker observations.
The inventory, proposed composition, two project-recovery proposals, mixed-file
ownership and future evidence matrix guide later explicitly scoped work. They
are not visual implementation, final design acceptance or fresh local discovery.

## Integrity, formatting and validation

From the repository root:

```sh
python3 -B scripts/verify-frontend-skills.py
python3 -B scripts/test_frontend_skills.py
python3 scripts/verify-handoff.py
```

The verifier reads no network and executes no vendor code. It validates the three
pins, exact file set, each path component/type, SHA-256, byte length, executable
mode, exactly three top-level catalog entries, required entry/license/notice and
exact adaptation. Missing/extra/tampered
resources, path traversal, symlink files/directories/manifest and mode drift fail.
The focused Python suite now has 16 cases, including stripped transformation
metadata with an adjusted source hash, duplicate transformations and a transformation
at the wrong target. The verifier requires exactly one `codex-search-path-v1`
entry at `apps/web/.agents/skills/ui-ux-pro-max/SKILL.md` before reading resources;
that path's adaptation check cannot be disabled by removing its marker.
Focused Python failure witnesses and the verifier also run in CI. The reviewed
manifest is the trust input: changing both a file and its reviewed manifest is a
source change requiring review, not cryptographic proof of upstream authenticity.

Preserve vendor bytes with exact three-directory `-text` attributes and exceptions
in `.prettierignore`, ESLint and quality selection. Three named upstream files
retain trailing spaces through file-specific whitespace attributes; no first-party
whitespace rule is relaxed. One additional upstream file retains its blank EOF,
and the Windows launcher retains CRLF, through file-specific attributes.
No broad `.agents` exclusion exists: the first-party
manifest is adopted, existing source gates stay enforced, and quality regressions
check those boundaries. The Python verifier/witnesses use direct checks/review;
Markdown is manually reviewed under the existing policy. T36's 242/242 historical
adoption becomes 243/243 solely through the new first-party manifest. No app/unit
source enters a different coverage scope and no baseline/threshold changes.

Local validation results and the Draft PR are recorded in [progress](progress.md).
Current-head full hosted CI, completed native Kilo after coordinator Ready, and
coordinator acceptance remain final delivery gates. No new app build/unit/PG/
Docker/device/AT/provider/staging/audit execution is claimed by this preparation.
