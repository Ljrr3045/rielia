# T37.3 shell and entry-flow presentation checkpoint

**2026-11-11, America/Caracas — implementation checkpoint, not acceptance.**
Prepared in `feat/t37-shell-entry` from frozen T37.2 PR #46 head
`1e2ed071283ad5da4d52f6658a75d2f87db62aee`, on the accepted T37.1 ancestry.
The coordinator authorized isolated work during PR #46 native review; this does
not accept or publish T37.2/T37.3. See the [direction](t37-design-direction.md),
[foundation evidence](t37-ui-foundations.md), [inventory](t37-ui-inventory.md)
and [stable behavioral contract](t36-stable-ui-contract.md).

## Scope and composition

This is T37.3 presentation under P01–P11/P33/P38,
US01–US08/US11–US12/US24–US25 and UX01–03/05–07/09/11. UXR01 informs the
stable work rail; UXR03 supports readable narrow layouts. The recorded Linear
member/invitation pattern informs aligned rows, without importing its domain.
Existing reference observations are reused; no new Mobbin search or copied asset.
P09/US06/UX04 sprint work, T11, UXR05, task/list/board/detail/discovery interiors,
landing, new routes/capabilities and final branding remain excluded.

| Surface | Presentation intent |
| --- | --- |
| Identity | A 36rem maximum reading column with a compact session panel, vertically grouped configured-provider actions and separated return guidance. A plain text wrapper keeps bilingual button copy in one text flow. All original ES/EN words, English spans, states and action nodes remain |
| Project shell | A 14rem desktop rail at the existing 1024 CSS px threshold; sentence-case group labels, wrapping project names and separate secondary workspace administration. Work area gutters are 16px narrow/24px desktop at the default root. The mobile title wraps beside the existing menu/create controls, and the existing drawer receives safe-area padding |
| Workspace entry | A 68rem content measure, visible wrapping current-workspace heading, selector and aligned role/owner summary. Projects is a global entry beside Back home; account, locale and Refresh remain in the existing header |
| Members and Agents | One contiguous list surface with row dividers, name/status alignment on wide screens and stacked narrow rows. Existing type/state badges, owner protection, inactive/revoked explanations, custodians and target-specific controls remain visible. Native disclosure markers return through list-item styling; no new disclosure state |
| Invitations and recovery | Form/list spacing and aligned recipient metadata; revoke confirmation spans its whole row. Inbound Accept/Dismiss, generated-link Copy/Done/manual-copy fallback and operation feedback retain their actual parents, conditions and lifetime. Read loading remains distinct from mutation feedback |

The existing global semantic palette, system fonts, 44px control minimum,
16px mobile fields, focus outlines and reduced-motion behavior are reused.
No new palette, icon, font, asset, package, theme preference or animation.
These dimensions describe authored CSS, not measurements of this checkpoint.

## Source boundaries and coordinator decision

Astra edits only the three existing CSS families, presentation markup in
`identity/page.tsx`, `identity-view.tsx`, `project-shell.tsx`,
`workspace-view.tsx`, `workspace-entry.tsx`, and one workspace copy entry.
All hooks, handler bodies, conditions/capabilities, keys, refs, IDs, existing
hrefs/queries, form submission, state and commands remain untouched.
The Bilingual helper gains a text span; no stateful component is replaced.
No test/controller/transport/proxy/service/contract/backend/dependency/lock/
coverage/tooling-policy source changes. `/` stays technical and `/prototype`
stays isolated. The 1280 contextual-detail threshold is unchanged.

Source inspection found **no Projects link in the workspace page**, despite the
dispatch's reference to an existing entry. The coordinator explicitly authorized
one additive plain Next Link to `/projects` as global navigation, with localized
Projects wording and no callback, query, selection persistence, guard or route
default change. It does not promise to open the currently displayed workspace.
Contextual workspace-to-project transfer and draft-safe route departure remain
SOL-owned; this new link has ordinary route-navigation semantics and does not
add draft retention. Existing memory/return disclosures are retained.

Generated invitation feedback currently lives outside ready-state administration
so it can survive failed reads and session recovery. Moving it under InviteForm
would alter component lifetime. The coordinator confirmed preserving that
lifetime for this checkpoint. Copy/Done and copy-failure text stay together;
bringing the generated result closer to its originating invitation form remains
an explicit SOL composition/lifecycle follow-up, not a completed acceptance claim.
Workspace confirmed-write/read403/read503 success and scoped-row clearing retain
their source behavior. The three inherited project/collaboration recovery debts
remain SOL T37.4 work and are not concealed by CSS.

## Evidence and next validation

Coordinator verification binds the session to `gpt-6-astra` high,
auto_review/on-request/workspace-write and frontend cwd. All three intended local
`.agents/skills/<name>/SKILL.md` paths were explicitly loaded. Project context and
Impeccable Operate/craft references were read directly; no engine, launcher,
hooks, Apply, bundled agent, global duplicate or configuration change was used.

Three retained T37.2 images were inspected only as baseline evidence: workspace
populated light EN 1440, identity signed-out dark 390, and corrected board light
EN 1440. Their provenance remains in the foundation guide; none depicts this
checkpoint. The workspace capture shows separate member cards and the identity
capture shows bilingual button text splitting into parallel flex items, informing
the changes above. No new rendered result is claimed.

One authorized offline frozen install reused 541 packages with zero downloads;
pnpm 12.15.0/Node 24.22.1, lock unchanged, shared Git config preserved. No suggested
package skill was approved. Checkpoint verification is limited to source-diff
review, adopted formatting, immutable handoff/local links, whitespace and mandatory
staged-source/commit-message hooks. Exact command outcomes and changed-file SHA-256
hashes accompany the external delivery report. No functional unit is added for
this presentation-only ownership; independent SOL behavior validation is required.

SOL next validates the exact committed source in a separate checkout: identity
pending/unavailable/disabled/cancel/retry/sign-out; workspace roles/owner, long
names, membership/Agent states, invitations and copy failure; retained success
after read403/503; draft/session replacement; drawer inertness/focus return and
modal consumed Escape. Cover ES/EN, light/dark, 320/375/390/768/1024/1440 and
844×390, plus affected threshold crossings. Measure actual contrast, 44px targets,
16px fields, native disclosure behavior, wrapping, focus and reachable controls.
Check the narrower rail at 1280 contextual detail, long shell context and short
landscape. Astra then inspects the actual captures and corrects demonstrated issues.

No runtime/server/build/browser/Docker/full suite ran in this checkpoint.
Persistence, actual browser-chrome zoom, physical device/virtual keyboard, manual
AT, real OAuth/providers/staging and real-user acceptance are unperformed here.
Screenshots do not prove persistence. Coordinator base sync after PR #46,
independent SOL validation, later consolidated Draft publication, current-head
CI/native review and bounded acceptance remain required. No push, PR creation,
Ready/review/merge/deploy or worktree deletion is authorized in this checkpoint.
