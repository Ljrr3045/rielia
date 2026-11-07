# T36.4 workspace feature-administration extraction

This bounded batch starts from merged [PR #42](https://github.com/Ljrr3045/rielia/pull/42)
at `3fb40583dc0a212faf7d38e02348565df729bf78`. It preserves the existing
[workspace contract](workspace-flows.md) and [presentation](workspace-ui.md).
Traceability: existing T05/T35 within T36.4; P01–P11/P33/P38,
US01–US08/US11–US12/US24–US25, UXR01–04/06 and UX01–03/05–07/09/11.
T36.6, overall T36, T37 and T11 acceptance remain open.

## Owners and preserved authority

| Owner under `apps/web/src/app/workspaces` | Responsibility |
| --- | --- |
| `workspace-view.tsx` | Original locale provider, one real hook lifetime and screen JSX composition |
| `use-workspace-screen-actions.ts` | Existing local action label, remembered names, paging indicator and command bindings through a typed public port |
| `workspace-screen-model.ts` | Existing action/status types and finite display projections |
| `workspace-feedback.tsx` | Status, inbound invitation and operation feedback with the original focus effect |
| `workspace-entry.tsx` | Workspace chooser/bar and creation form |
| `workspace-invitations.tsx` | Invite, generated link/copy, revoke and paging views |
| `workspace-members.tsx` | Human member forms/confirmations and Agent member rows |
| `workspace-agents.tsx` | Agent registration, principal-state and custodian controls |
| `workspace-ui.tsx` | Original locale/primitives and four actually shared admin display helpers |

The obsolete `workspace-admin.tsx` is removed. The controller, transport, state,
request keys, session/selection and inbound/generated token authority remain in
`src/lib`. Route metadata, strings, CSS, JSX ancestry, child keys and effects are
preserved. The existing remembered-name ref and account-replacement clearing
semantics remain intact. Refresh closes a remounted member confirmation while
rehydrating its desired role; a later confirmation uses the current loaded
`member.version`. This batch preserves that observed timing.

Nine formatted candidates reuse independent finite source review. Actual lint
required removing one unused `draftMismatch` screen destructure, with the hook
return and JSX unchanged. New test lint required `globalThis.Headers` in its
boundary helper. Both initial diagnostics are retained; neither changes policy.

## Test and browser evidence

Accepted A is corrected PR42 C: 138 web / 380 total cases over 118 inputs.
One retained-test B passes all 380 cases over 124 inputs and preserves every web
covered count. Its new denominators are L3793/S4269/F1051/B5192, including the
new hook/function/module units. One C adds seven actual-hook cases and passes
145 web / 387 total: L1567/3793, S1734/4269, F323/1051, B1588/5192.
All existing tests remain. The new cases compose the real screen and workspace
hooks/controllers/transports with finite HTTP answers: pending guards,
exact-key/scope recovery, generated-link Done, offline/forbidden paging,
remembered scope labels/account replacement and dismiss/discard.

Independent review retains all 1,192 affected old raw zero outcomes through
1,191 scoped exact-AST pairs and one finite screen-root disposition. One new
function and two statement wrapper units are explicit. B→C retains all 3,462
covered normalized S/F/B outcomes and adds 183, with 6,867 still zero; emitted raw
coverage retains 3,761 and adds 194, with 7,246 still zero. Across A→B, all 59
untouched web maps/counters remain exact. Across B→C, all 68 web maps remain exact
while counters retain covered outcomes and add the stated gains. Twelve nonweb
report files remain exact across all phases. Twenty-two remaining model/hook raw
zero outcomes are explicitly owned debt, not omitted source.

Raw unknown positions are 162→163→163; all 797 normalized null endpoints and
47 implicit raw arms remain individually bound. Type-only inputs, UTF-16 bounds,
empty compiler endpoints and the existing zero-unit project port remain explicit.
No columns are fabricated and this is no general source-map precision waiver.
The coordinator accepted only current-web baseline bytes `15fd5321…b36fc35`,
with L/S/F/B floors 4131/4061/3073/3058 basis points. Seven other baselines,
provider/configuration/gates and coverage scope remain unchanged. The production
baseline manifest retains exactly eight keys; report-only selection, exclusions
and zero-unit metadata stays in reports.

Six actual Next/React/CSS browser schedules were captured before extraction on
reviewed `89316c4` / build `-q-Zrv3gK2KajB3sK7iT_`, then reused through exact
production-tree binding to the merged base. They were not recaptured on the merge.
The single AFTER build is `nbS-P6wEpvwQK1PQi8-K8`. All six paired observations
match exactly, including native confirmation/opener focus, current member version,
wrong-scope exact-key retry, clipboard selection, independent invitation tokens,
confirmed success after 403/503 read failure and Agent principal retirement.
All four emitted CSS files and stylesheet order are exact. Both paired widths
(1440/390) and 24 AFTER-only ES/EN/light/dark/reduced-motion observations at
320/375/390/768/1024/1440 show no page overflow.

Sandbox listener denial and screenshot compositor artifacts are retained.
Only affected capture fixtures were corrected and repeated; the final supplemental
viewport captures preserve exactly the same computed observations. HTTP fixtures
are not PostgreSQL persistence, authorization, durable replay or two-session SSE
proof. Physical touch/device, AT, OS keyboard, real desktop zoom, providers,
staging and user acceptance remain deferred. CSS cohesion remains explicit
coordinator-owned debt for T36.6 rather than a claimed redesign.

## Delivery state

Pinned formatting/lint, web types, focused cases, B/C and the single web build
pass. All remaining normal-check constituents pass using that build and web
typecheck; no duplicate whole `pnpm check` invocation is claimed. Twenty unit
infrastructure cases pass. The production comparable/numerical gates pass on all
four scopes against the exact 17 saved C reports, with four complete bounded
artifacts. Final formatting, handoff/link and staged/unstaged whitespace receipts
are retained in the external delivery report after the last documentation update.
Automatic full CI retains `pnpm check` and real PG/security/replay/SSE/runtime/
Docker checks; these real persisted/security/runtime suites were not rerun locally
for this presentation extraction. Current-head CI/Kilo, Draft publication and
final acceptance remain coordinator-owned. No new product behavior, dependencies,
permissions, T37/T11 work or deployment is included.
