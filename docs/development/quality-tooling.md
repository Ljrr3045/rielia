# T36 formatting and commit tooling

This first T36.2/T36.3 slice adds developer enforcement while preserving app
behavior. T36 remains **IN PROGRESS**: application unit infrastructure, separate
coverage gates, extraction and the stable T37 UI baseline remain follow-up work.
The [roadmap](development-quality-roadmap.md) retains T36 → T37 → T11 ordering.

## Tools and installation

| Root development tool                                                                      | Exact version | Node engine | License |
| ------------------------------------------------------------------------------------------ | ------------- | ----------- | ------- |
| [Prettier](https://registry.npmjs.org/prettier/3.9.10)                                     | 3.9.10        | >=14        | MIT     |
| [Husky](https://registry.npmjs.org/husky/9.1.7)                                            | 9.1.7         | >=18        | MIT     |
| [commitlint CLI](https://registry.npmjs.org/@commitlint%2fcli/21.2.4)                      | 21.2.4        | >=22.12.0   | MIT     |
| [Conventional config](https://registry.npmjs.org/@commitlint%2fconfig-conventional/21.2.4) | 21.2.4        | >=22.12.0   | MIT     |
| [lint-staged](https://registry.npmjs.org/lint-staged/17.6.0)                               | 17.6.0        | >=22.22.1   | MIT     |

Official published metadata/tarballs were inspected and SHA-512 checked on
November 6, 2026. Publication dates are October 10, 2026; November 18, 2024;
October 18, 2026 (both commitlint packages); September 26, 2026, respectively.
No direct peer or install lifecycle needs a new approval. Transitive registry
packages' source-maintenance prepare scripts do not justify enabling builds.
The scratch tool graph's advisory query found no vulnerabilities; repository
validation is recorded below. These licenses do not select Rielia's license.

The repository high/critical audit passes with **one existing moderate**:
[minimatch globparts amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249),
version 10.2.6 through the ESLint/typescript-eslint/Next lint development graph.
Its base/current lock blocks and integrity are identical; no advisory path uses
the five new tools. Fixed version 11.0.1 is a new major, so this slice preserves
approved lint pins without an unverified override. Globs remain reviewed repository
configuration; the exposure remains explicit follow-up, not a zero-advisory claim.

Node24.22.1/pnpm12.15.0, TS6.0.3, ESLint10.13.0/typescript-eslint8.72.0,
Next16.4.3/React19.3.1 and Nest12.3.2 remain pinned. Strict peers, disabled
auto-peers, Prisma approvals, patches/qs override and backend closure are retained.
Use `pnpm exec node --version`: the shell Node can differ from devEngines.

```sh
pnpm install --frozen-lockfile
pnpm exec node --version
pnpm format:check
pnpm test:quality
```

Prepare exits before importing Husky for CI, HUSKY=0, production/no-dev,
no-Git and linked-worktree contexts. Docker copies only the installer from
`.husky` and sets HUSKY=0 before root install; final runtimes need no hooks.
A normal single-checkout clone uses upstream Husky. Custom hook paths, active
default Git hooks, or multiple worktrees cause a skip. Existing default hooks keep
their behavior; integrate quality checks deliberately or run the commands separately.
No global setting or worktreeConfig extension is enabled.
In linked worktrees use the same executable hook entries for one command:

```sh
git -c core.hooksPath=.husky commit -m "chore: describe the change"
```

Plain Git/GUI commits in linked worktrees do not automatically activate hooks.
Hooks need Node/pnpm on PATH; no GUI version-manager setup is installed. HUSKY=0
and --no-verify may skip hooks; independent CI remains required.

## Staged content and formatting adoption

Pre-commit uses lint-staged's supported function task with --no-stash,
--no-hide-partially-staged, --fail-on-changes and serial execution. It reads
stage-0 index bytes, then calls Prettier.check and ESLint.lintText with original
paths. No format/fix, staging, stash, network, build or DB operation occurs.
Renames check destinations; deletions have no content; symlink/submodule type
changes and conflicted indexes fail closed. Spaces, quotes, brackets, dollars
and newlines are tested. POSIX literal-backslash names are rejected before
lint-staged normalization; deliberately rename that candidate. Nothing is renamed
automatically.

If policy configs, quality helpers, hooks, tsconfigs or dependency manifests
differ between index and worktree, checks stop before loading tool configuration.
Stage the complete intended policy file or restore its unstaged part yourself.
Ordinary source can be partially staged: only staged content is checked. On
failure/interruption inspect `git diff` and `git diff --cached`; there is no
automatic stash to recover. Format only explicitly selected real files:

```sh
pnpm format:write -- apps/web/src/lib/selected-file.ts
git diff
git add -- apps/web/src/lib/selected-file.ts
pnpm quality:staged
```

Replace the example with an intended file. This writes its whole content, so
review and restage deliberately when partially staging. Directories, protected
files and paths through symlink directories are rejected. Every selected path
and parser input is validated before the first write; checks use the same path
protection. Negative tests preserve both external and immutable fixture bytes.
Whole-tree writes are rejected.

[format-adoption.json](../../format-adoption.json) names 19 tooling files checked
every run. CI also checks changed/new maintained JS/MJS/TS/TSX/CSS/JSON/YAML.
Staged checks use the same selection/options and existing lint/import boundaries;
no formatter ESLint plugin or new style-rule family is introduced.
The [exact inventory](formatting-inventory.json) accounts for 201 supported paths:
adopted files, remaining source and legacy Markdown follow-up. At the pre-tooling
base, 157 of 186 supported files needed formatting. This slice formats only root
tooling configuration. Legacy Markdown is manually reviewed and explicitly
pending adoption; this new formatted guide is recorded separately. App source and
large historical documents are not normalized.

Handoff/hash inventories, generated Prisma/Next/build/coverage, dependencies,
lockfile, patches/notices and supplied assets are excluded. SQL, Prisma, Python,
shell/Docker and TOML retain existing checks/review; no formatter plugin is added.
Bounded formatting-only batches must grow adoption and update inventory before
related extraction. Changed-only enforcement cannot complete T36's final accounting.

## Commit policy and independent CI

New nonmerge commits use Conventional Commits: optional scopes, standard type set
and 100-character header limit. Humans/bots follow the same policy. Message-based
default ignores are off: bare versions and fixup!/squash!/amend! fail; edit or
autosquash them before publication. Use `revert: ...` for new reverts instead of
Git's generated subject. Actual merges are exempt by parent count in CI and
MERGE_HEAD locally; text merely starting with Merge is not exempt.

The immutable legacy cutoff is `1c33560f2fca954cbac6d35a87881a41dd72b017`.
PR checks select nonmerge head commits minus base and legacy ancestry; dev/main
pushes select after minus before and legacy ancestry. Zero-before starts at the
cutoff; missing/unavailable SHAs fail. No date/author bypass or history rewrite
is used. Full checkout history preserves main/dev merge ancestry.

CI reads event JSON in Node and passes SHAs/messages via argv/stdin, without
untrusted shell interpolation. Existing pull_request/dev/main events, validate
job, 25-minute budget, pinned Actions/runtime, contents:read and every previous
check stay. No protection, required-check, secret, token or reviewer change.
Local equivalents (replace BASE/HEAD with full SHAs):

```sh
pnpm exec node scripts/quality/format.mjs --changed BASE HEAD
pnpm exec node scripts/quality/commits.mjs --range BASE HEAD
printf '%s\n' 'chore: final squash subject' | pnpm commit:check
```

**PR titles are not enforced by this CI slice.** No edited event is added. The
coordinator checks the exact final squash title/subject using commit:check
immediately before merge; native required checks do not establish title validity.
Draft/Ready/current-head CI/Kilo and coordinator-only merge rules remain.

## Separate unit-baseline audits and limits

Parallel disposable audits measured base `1c33560`:

| Scope                               | Lines             | Statements         | Functions         | Branches           |
| ----------------------------------- | ----------------- | ------------------ | ----------------- | ------------------ |
| Web production, 51 executable files | 682/3251 (20.97%) | 1092/4251 (25.68%) | 168/1041 (16.13%) | 1140/5185 (21.98%) |
| API maintained scope, 30 files      | 38/1095 (3.47%)   | 45/1617 (2.78%)    | 3/396 (0.75%)     | 36/1228 (2.93%)    |

Web ran 99 isolated cases (80 production/shared-boundary and 19 prototype), with
six HTTP cases separate. Hook/render units remain absent. API has one isolated
config unit; domain/application units are absent. Integration import-time
execution is not domain unit testing. Shared contracts need separate attribution;
prototype results cannot inflate production metrics.

Both audits favor retained node:test, TS6.0.3-emitted ESM/maps and nyc18.0.0
preinstrumentation with mapper4.0.1 for actual unexecuted AST units. Raw c8's
synthetic missing-file branch/function denominators were rejected. Web proved
repeated summaries and failing tests/metrics; API did not execute threshold-failure
witnesses or a second frozen recheck. The experimental coverage graph has two
moderate glob/minimatch advisories for follow-up review; it is not installed here.
DOM compatibility probes are bounded evidence, not a universal component harness.

These low values are audit findings, not repository coverage commands, accepted
numerical gates or sufficient T36 acceptance. Follow-up must add meaningful units,
freeze provider/source-map scope, include maintained unexecuted source, prove
each failure gate and establish numerical/nonregression rules and bounded CI
artifacts. Tooling regressions do not report app coverage.

Focused regressions cover formatting/lint failures, partial-stage preservation,
paths/interruption, installer contexts, strict messages and PR/push/merge/legacy
ranges, including skipped-hook CI failure. Actual validation and Draft PR evidence
are recorded in [progress](progress.md); final current-head review/acceptance is
coordinator-owned. No UI/domain/schema/auth change, extraction, T37 skill,
live-provider/staging request, deployment or full-ticket completion is included.
