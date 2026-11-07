# T36 API, contracts and MCP formatting adoption

This mechanical T36 batch adopts the maintained API, shared contracts and diagnostic
MCP source before related extraction. It changes formatting only: no authorization,
schema, runtime, test behavior, appearance or dependency pin changes. T36 remains
**IN PROGRESS**; web/scripts adoption, extraction and acceptance precede T37 and T11.

## Inventory and retained behavior

The [explicit inventory](formatting-inventory.json) accounts for **208 eligible
source/config paths: 123 adopted and 85 remaining**. This batch selects 56 existing
API/shared/MCP inputs: 50 change bytes and six already formatted inputs gain
adoption only. Six additional merged lifecycle unit/helper files (four API and two
web) are already formatted and gain adoption without any byte change. The
[adoption list](../../format-adoption.json) names every enforced input. Broad web,
CSS and remaining scripts/config stay explicitly listed for later batches.
Immutable handoff/notices/assets, generated code/builds/coverage, dependencies,
locks and existing manually reviewed unsupported formats remain excluded.

Pinned Prettier 3.9.10 and TypeScript 6.0.3 semantic proof compare exact merged base
`be777b434b249fd039da1519d0146177b8e0d1c9` with formatting source head
`3b9507f5f8c2a046351885f7cccae527f5a5c154`. All 56 inputs preserve ordered complete
AST/scalar/literal/raw-template/regex/JSON semantics and all **132 comments**,
collected from parser token gaps. Only documented layout flags and actual simple
arrow AwaitContext enrollment differ. Two method-chain layouts require the
verified stable second formatter pass; all selected outputs are idempotent.
The prior independent proof executed 20 semantic negative controls. The fresh
author proof executes those 20 plus two inline-comment removal/change controls;
all reject as intended. No semantic mutation is accepted as formatting.

## Explicit reviewed coverage migration

The paired measurement uses the same 269 tests (API 129, web 114, contracts 7,
prototype 19), all 101 maintained source inputs (30/51/4/16), provider/compiler/
configuration/test-helper fingerprints and frozen tool resolution. A restores
only the selected 56 inputs to the accepted base; B formats them; a B repeat
retains the exact source/emitted provenance. All three phases pass 269 tests with
identical B/repeat manifests, summaries and complete mapped counter reports.
Actual API `tsc` output retains Nest decorator metadata; it is not tsx output.

| Scope | Accepted A lines | Formatted B lines | Statements A=B | Functions A=B | Branches A=B |
| --- | --- | --- | --- | --- | --- |
| API | 459/1095 | 597/1477 | 654/1617 | 140/396 | 469/1228 |
| Web | 975/3463 | 975/3463 | 1292/4255 | 230/1042 | 1300/5192 |
| Contracts | 78/78 | 99/99 | 113/113 | 64/64 | 355/363 |
| Prototype | 199/805 | 199/805 | 269/984 | 87/368 | 194/954 |

The coordinator explicitly approved the physical-line mapping exception:
**API line floor 41.91%→40.41%**. Other API floors remain 40.44/35.35/38.19;
contracts remain 100/100/100/97.79; web 28.15/30.36/22.07/25.03 and prototype
24.72/27.33/23.64/20.33 remain unchanged (L/S/F/B). Only current API/contracts
baselines migrate exact measured source hashes and line counts. Web/prototype and
all four historical pre-unit baselines remain byte-for-byte unchanged. The
pre-format current baselines remain immutable Git blobs under merged base
`be777b4`; this migration is explicit and does not auto-reset the ratchet.

All 32 changed measured inputs retain identical full statement/function/branch hit
dictionaries, IDs and topology; all 69 unchanged inputs retain their full maps and
counters. Per-file exact-ratio/uncovered-count gates remain active after migration.
Physical line expansion is not new test coverage. API adds 382 mapped lines,
138 covered and 244 uncovered. Of those 244 extra uncovered lines, 216 reflect
expansion of prior uncovered grouping and 28 separate pre-existing zero-hit
statements from dense lines that also held executed statements.

Four API files decrease exact line ratios:

| File | A lines | B lines | Added uncovered lines | Split from covered dense lines |
| --- | --- | --- | --- | --- |
| Principal service | 72/134 | 79/168 | 27 | 8 |
| Project task service | 136/271 | 174/365 | 56 | 9 |
| Task collaboration service | 61/100 | 78/133 | 16 | 6 |
| Task events service | 50/50 | 94/96 | 2 | 2 |

Workspace service 56/113→74/149 increases its ratio but adds 18 uncovered physical
lines, including three split from covered dense lines. Every affected S/F/B
counter remains identical, including its zero-hit statements. The complete
old/new per-file ledger retains exact ratios, denominators and uncovered counts;
no input or low-coverage file is hidden. Concrete stable statement-ID witnesses
include principal ID 11 (old line 31/new 59), project ID 1 (9/45), collaboration ID 30
(41/147), events ID 43 (34/75) and workspace ID 7 (12/31), all zero hits before/after.

Source-map null columns remain unknown, never replaced with fabricated zeroes.
Recursive endpoint counts (including repeated outer branch locations) remain
API 8596, web 28272, contracts 1356, prototype 6372; null-column endpoints change
API 86→149 and contracts 0→17, with web 596 and prototype 98 unchanged. This limits
column-precision claims; numeric S/F/B identity and mapped line totals remain
proved. Eight aggregate-total corruption controls independently reject malformed
covered/total sums before floor calculation, retaining the positive control.

The preserved review packet identifies every raw report and compiler/source/schema
manifest. Canonical ledger SHA256:
`f5d2c7e5dc1e3d58d97b5d050cb1633ac44682ab0c20f7ef678b63fd68c2462c`.
Fresh author semantic proof SHA256:
`220c49ba4e5275b77b0c5afe734d7ec62e79b786988837f86dd31cee189caff9`.
The independent reviewer re-derived accepted parity, repeated results, full
semantic counters, line origins and compiler/output isolation before the
coordinator accepted this bounded migration on November 7, 2026.

## Validation and limits

Two native pnpm prebuild attempts failed closed before any tests: first on an
unsafe owned execution-state symlink, then on workspace-structure verification.
Their logs and exact source restoration remain preserved. Only explicitly approved task-owned
metadata leaves were isolated; the foreign workspace-state bytes remained
unchanged. No dependency repair, guard relaxation, installation or fabricated
cache restoration occurred. The exact pnpm internal trigger is not claimed proven.

The coordinator then approved direct installed Prisma generation and actual
TypeScript compilation in the owned contracts/API directories for paired
measurement. Stock compiler commands are identical to the package build scripts;
there are no skipped pre/post scripts. Both phases record exact compiler/schema/
source/generated/emitted hashes and owned output paths without symlink ancestors.
The runner then uses its existing `--measure --built` mode. Pnpm verification
remains `error` and workspace concurrency 1 in parents/children. All 90 frozen-host
metadata/output/state guards, borrowed tool metadata and real owned workspace-cache
bytes remain unchanged. Direct compilation is not a native `pnpm check` pass.

The serial affected local batch passed: adopted formatting; all 24 tooling
regressions; ESLint with zero warnings; the 286-package Express-free backend
closure; handoff/hash/local-link verification; all eight saved B/repeat scope
pairs through the existing `assertComparable` and `assertGate`; 20 infrastructure/
upload cases; actual MCP TypeScript compilation and 17 subprocess/Inspector cases.
These checks use installed pinned programs and preserve all metadata/output guards.
The first adopted-format check rejected the newly edited inventory JSON layout;
that one owned file was normalized and the resumed batch passed. The failed
formatter result is preserved, with no later job run before its correction.

No local Next/PG/Docker/browser repetition is claimed for this semantic-equal batch.
Fresh required hosted validate must still execute the full native `pnpm check`,
coverage/infrastructure, real PG/security/runtime and both high audits within the
existing 25-minute budget. The documented root one-moderate and isolated two-moderate
dev-tool risk dispositions remain; no new audit or advisory fix is claimed.

[Draft PR #36](https://github.com/Ljrr3045/rielia/pull/36) targets `dev`;
[progress](progress.md) records publication and current-head CI evidence.
Hosted final-head validate and external review remain pending; this local batch
does not complete T36. Only the coordinator controls Ready and merge.
