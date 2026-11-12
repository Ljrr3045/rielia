# T37.2 CSS foundations checkpoint

Status: **Corrected-source native evidence reviewed; CI/native review and T37.2 acceptance pending**.
The initial implementation was committed as `d533cc03b364fa31035a1a8398c3ebdaba71b3a1`
on `feat/t37-ui-foundations`. [T37.1 acceptance](https://github.com/Ljrr3045/rielia/pull/45#issuecomment-6811811563) now governs the preparation:
PR #45 merged as `8065c07895640da228accbd50295d79517d2afa1` from reviewed
`57ee1641aa453b6f08d81d29f0b5f294afece35c`. That accepted base is merged with
ancestry retained; the original dated preparation and research proposals remain
historical. [PR45 postmerge CI](https://github.com/Ljrr3045/rielia/actions/runs/43135834271)
completed successfully on that exact merge SHA. This implementation does not accept T37.

## Scope and ownership

Implements foundations for the current P01–P11/P33/P38,
US01–US08/US11–US12/US24–US25 surfaces and UX01–03/05–07/09/11, following the
[direction](t37-design-direction.md), [inventory](t37-ui-inventory.md) and
[stable contract](t36-stable-ui-contract.md). P09/US06/UX04 sprint implementation,
T11, landing, routes, capabilities and theme/density settings remain excluded.
This is the CSS checkpoint of [T37.2](development-quality-roadmap.md), not the
later shell, task composition or recovery redesign.

Astra owns these three presentation files:

- [globals.css](../../apps/web/src/app/globals.css): the single shared semantic
  token source and existing identity/fixture controls.
- [workspace.module.css](../../apps/web/src/app/workspaces/workspace.module.css):
  token consumers under the existing `.shell` ancestry.
- [projects.module.css](../../apps/web/src/app/projects/projects.module.css):
  token consumers under the existing `.app` and overlay/menu ancestry.

No TSX, handlers, effects, controllers, contracts, runtime tests, dependency/lock,
coverage or prototype source changes. No CSS package or mechanical feature-file
split. Definitions remain in the existing adopted global stylesheet, so adding
an import or a new formatting-policy input is unnecessary. Canonical server
permissions, draft/retry/version behavior and focus lifecycle remain unchanged
in source; SOL must establish functional parity on this committed source.

The exact fresh session was verified by the coordinator as Astra high with
`auto_review`, on-request, workspace-write and frontend cwd. All three local
`.agents/skills/<name>/SKILL.md` entries were explicitly read: frontend-design,
impeccable and ui-ux-pro-max. Existing Rielia context and Impeccable's Operate/
craft references were read directly; no launcher, engine, hook, Apply, bundled
agent, catalog persistence or global configuration was used. Existing bounded
Mobbin evidence was reused; no new reference search or competitor asset import.

## Shared foundation and visible intent

| Family | Implementation and rationale |
| --- | --- |
| Theme | Existing background, surface, text, action, divider, border and focus palette values are preserved. Shared `surface-muted`, `surface-hover`, `surface-inset`, brand/feedback soft-and-ink pairs, danger action/hover and disabled colors replace duplicated feature definitions. The system preference still selects the theme |
| Typography | One `font-ui` system stack and `font-mono` for existing IDs/code; no Inter preference/download. Shared 12/14/15/16/18/20px type steps at a 16px root and 24–32px page title; scoped body leading 1.5 and control leading 1.25. Existing canonical sizes consume the scale; project metadata below 12px is raised to 12px. Specialized intermediate sizes remain for later composition work |
| Spacing and shape | Shared 4/8/12/16/24/32/48px spacing, 8px controls, 12px panels. Existing exact scale values consume tokens; layout-specific spacing remains local. Standard controls share 8px by 12px padding and a 44px minimum height at a 16px root, with wrapped labels and no fixed label height |
| Native inputs | Preserve native select/checkbox behavior. Explicit readable placeholders, themed caret/accent, error border using the existing `aria-invalid`, and a minimum 16px font on narrow or coarse-pointer inputs/selects/textareas. No validation timing or field content change |
| Buttons | Shared primary/secondary/danger vocabulary and explicit enabled hover colors. Anchor variants explicitly outrank the existing scoped link color so primary links retain their on-action text. Disabled controls use solid readable neutral colors rather than whole-control opacity. Disabled hover treatments are suppressed on the shared buttons. Identity's focusable `aria-disabled` controls retain their existing handler guard and waiting cursor |
| Focus | Shared 3px ring and 2px scoped offset, retaining the preexisting 4px global offset and programmatic heading/focus-panel rules. No focus trap, tab order or focus restoration change |
| Feedback | Existing semantic info/success/warning/danger classes and labels remain separate. Busy identity/read-state panels have a neutral dashed boundary; operation feedback retains its solid semantic treatment and existing pending text. Remove opacity from supporting feedback text. No added spinner, animation or premature success state |

Intentional palette reconciliations: dark workspace information/warning fills
now use the deeper existing project values; the project muted surface uses the
workspace value. Dark project destructive actions use the workspace's pale-red
surface/dark text treatment. The light action hover uses `#115e59` consistently.
Existing project task-status/priority colors, overlay/shadow values, breakpoint
panel placement and Move-menu ancestry remain local. There is no new state,
status classification or semantic meaning inferred from these colors.

The palette is still the [branding proposal](../handoff/03-branding.en.md), not
final identity ratification. Text and native semantics remain necessary; color
alone is not a status or authorization signal.

## Source calculations, not browser measurements

Computed from the authored opaque sRGB hex pairs using relative luminance and
`(lighter + 0.05) / (darker + 0.05)`. These calculations do not measure rendered
state, opacity blending, antialiasing, native menus, actual focus geometry or
perceived usability. Sampled normal-text pairs exceed 4.5:1:

| Foreground / background token | Light | Dark |
| --- | --- | --- |
| `text-primary` / `surface` | 17.85:1 | 13.98:1 |
| `text-secondary` / `surface` | 7.58:1 | 9.85:1 |
| `text-secondary` / `surface-muted` | 6.92:1 | 10.96:1 |
| `text-secondary` / `surface-hover` | 6.15:1 | 8.45:1 |
| `on-brand-action` / `brand-action` | 5.47:1 | 12.07:1 |
| `on-brand-action` / `brand-hover` | 7.58:1 | 9.59:1 |
| `on-danger-action` / `danger-action` | 6.47:1 | 9.41:1 |
| `on-danger-action` / `danger-hover` | 8.31:1 | 12.34:1 |
| `disabled-text` / `disabled-surface` | 6.92:1 | 10.96:1 |
| `brand-ink` / `brand-soft` | 6.73:1 | 7.52:1 |
| `info-ink` / `info-soft` | 6.59:1 | 10.46:1 |
| `success-ink` / `success-soft` | 6.78:1 | 7.58:1 |
| `warning-ink` / `warning-soft` | 6.37:1 | 12.03:1 |
| `danger-ink` / `danger-soft` | 6.80:1 | 11.16:1 |

For `control-border`, `focus` and `danger-text` against background, surface,
muted/hover surfaces and all five feedback/selection fills, the sampled minimum
is **3.86:1 light / 3.70:1 dark**. This is a proposed boundary/focus-pair check,
not proof that every native control renders that pair. The retained status and
priority markers are outside these calculations and still need contextual QA.
44px/16px values above are CSS intent, not measured targets or device evidence.

## Initial checkpoint validation and then-pending evidence (d533cc0)

One authorized `pnpm install --frozen-lockfile` completed with pnpm 12.15.0,
Node 24.22.1, 541 reused packages and zero downloads. Lockfiles are unchanged;
prepare preserved shared Git config. No suggested package skill was approved.
Focused Prettier parsing/format checks pass for the three CSS files. No changed
file is ESLint-eligible under the existing policy. CSS/prose changes add no
behavioral unit test; functional regression evidence remains SOL-owned.
Full `pnpm format:check` passes over the 243 adopted inputs. The offline handoff
verifier passes 47 immutable files, 30 asset hashes/sizes and 795 local file links
in 78 documents; remote URLs and fragments are not checked. `git diff --check`
passes. Source reference inspection finds no unresolved custom property in this
three-file CSS family. Mandatory commit-hook results accompany delivery.

| Required follow-up | Current result and owner |
| --- | --- |
| Native identity/workspace/project states in ES/EN and both themes | **Pending**: populated/long/empty/loading/error/disabled/pending, placeholder/error/hover/focus pairs and read-versus-mutation feedback; Astra inspects actual captures/views with SOL fixture support |
| 320/375/390/768/1024/1440, short landscape, reflow and real 200% zoom | **Pending**: no server/browser/build started in this checkpoint; check actual target dimensions, input text, clipping/wrapping and existing overlays/menus |
| Keyboard/touch/focus/reduced motion | **Pending** native verification; existing reduced-motion spinner/skeleton rules retained, no motion added. CSS source is not interaction evidence |
| Fixture `/` and isolated `/prototype` | **Pending** rendered regression inspection. Source review confirms the old global base palette is preserved and prototype CSS/adapter are unchanged. Fixture refresh intentionally consumes the shared control treatment |
| SOL functional and persisted-flow parity | **Pending** on the exact committed source in SOL's own checkout; no app units, coverage, runtime, PG, Docker or functional harness executed here |
| CI/native Kilo/publication/base sync | **Pending** coordinator sequencing after PR #45; no push, PR creation, Ready transition, review request, merge or deploy in this task |

Physical devices, OS keyboard, AT/screen readers, cross-browser certification,
real OAuth/providers/staging and real-user acceptance are not claimed. The two
existing project recovery debts remain assigned to T37.4; this stylesheet change
does not fix or redefine either. No screenshot proves a save or authorization.

## Native visual review and bounded correction (2026-11-11)

SOL ran compiled Next routes from `d533cc03b364fa31035a1a8398c3ebdaba71b3a1`,
build `s8nqehi89fhGwKchoacwA`, with disposable public HTTP DTO fixtures in a
headless native Brave 157.0.8103.39 engine. Astra inspected 33 retained PNGs with
their matching measurements, rather than rebuilding or recreating the fixture.
The retained `visual-inspected.json` records exact viewed image/measurement hashes.
SOL's completed baseline index records 13 passing reused route schedules, six
passing focused native checks and 38 representative scenarios with 123 captures.
The focused checks cover synthetic touch/keyboard, locale-preserved drafts,
duplicate submit/exact retry, checkboxes, landscape actions and session reset.
No unresolved computed variables or whole-page overflow were found in sampled
metadata; reduced-motion samples report no animation. These are observations of
that initial source, not evidence for the correction commit. The document root language in some metadata is ES while the product
subtree visibly uses EN; language below describes the inspected product copy.

| Inspected sample | Observation and limit |
| --- | --- |
| Project list, light EN 375 and long dark ES 320 | Controls and long heading wrap inside the viewport. Measurements confirm Move selects at 12.8px and List/Board segments at 40px: both need the CSS correction below. Native select truncation is visible; opening options was SOL's interaction check, not inferred from the PNG |
| Workspace light EN 1440 / long dark ES 390 | Section headings, member roles, Agent identity and owner context remain readable. Long owner text wraps; the selected native workspace label truncates within its control. No new administration hierarchy is introduced |
| Workspace invalid dark EN 375 and field-focus light EN 1440 | Visible label, hint, textual error, 2px error border and a separate 3px focus outline. The focused input is 44px high with 16px text; light normal-field text measures 17.853:1 and dark 13.982:1 |
| Identity dark 390 focus / light 768 sign-out error | Bilingual copy and provider controls wrap, and keyboard focus is visible. `identity-pending-light-768` actually shows the unconfirmed sign-out error, so this image is not counted as pending-state evidence |
| Project create light EN 390 / edit dark EN 844×390 | Form labels, native controls and full-width mobile actions remain distinct. The landscape top capture alone does not establish reachability; the later scrolled `project-landscape-actions-dark-844` shows Save/Cancel and focused Cancel. SOL separately records keyboard reach and nested Escape |
| Task-title focus light EN 390 / board dark EN 1440 | The list title focus rectangle is only 18px high; board title bounds are about 19.86px. Rows are not clickable. Both native links receive the bounded target correction below |
| Project board dark ES 768, light EN 1024, dark EN 1440 | Cards retain status labels, native Move alternatives and local horizontal board scrolling, without whole-page overflow in the sampled measurements. Existing shell/card composition is retained for later T37 work |
| Project edit light ES 390 hover/disabled | Enabled hover uses white on `#115e59` at 7.584:1; disabled fields/buttons use `#475569` on `#f1f5f9` at 6.917:1 and opacity 1. Saving text remains explicit, with no false success message |
| Project dark EN 375 pending / workspace light EN 390 pending / workspace dark EN 768 loading | Mutation messages retain blue information treatment and operation text; read loading uses a neutral dashed panel. Pending is visually distinguishable from success and read loading |
| Primary links, dark EN project 375 hover / light ES workspace 320 focus | Intended on-action text is preserved. Dark hover measures 9.590:1; light hover-plus-focus measures 7.584:1. The 3px focus outline and 2px offset are visible; contrast against the adjacent panel matters, not only against the button fill |
| Checklist light/dark EN 390 | Native checked/unchecked marks, textual item labels and focus remain visible. Glyph bounds are about 19.19px, with actual associated labels measured at 44×44px; a glyph alone is not its hit area |
| Technical home light 1440 / dark 375 and prototype light 320 / dark 1440 | Readable initial viewport, theme and isolated demo presentation remain. This is a sampled global-regression inspection, not exhaustive visual equivalence. Prototype has preexisting smaller controls and remains excluded from this control migration |

These computed text ratios use SOL's observed foreground/effective background
colors. Generic border-to-own-fill and outline-to-own-fill numbers in raw control
metadata are not treated as adjacent-surface contrast failures or certification.
SOL's focused adjacent-surface measurements give 6.70:1 light and 8.11:1 dark
for the 3px outline with 2px gap. Focus visibility was inspected in the PNGs;
the authored solid-pair calculations
above remain separately labelled. Native popup rendering, physical touch and AT
are not established by these captures.

### Bounded presentation corrections

1. `.viewSegment` uses `min-height: var(--control-height)` instead of `2.5rem`,
   raising the default minimum from 40px to 44px without changing segment state.
   The observed class is `viewSegment`; early dispatch wording `viewButton`
   referred to the same List/Board controls.
2. `.app .moveStatusSelect` explicitly joins the existing narrow/coarse-pointer
   media rule with `font-size: max(var(--text-base), 16px)`. Its two-class
   selector previously outranked the generic input rule; matching specificity
   later in the stylesheet resolves that exception while retaining desktop
   density, menu ancestry, native behavior and breakpoints.
3. `.app a.taskTitleButton` and `.app .cardTitleButton` use a centered flex box
   with the shared 44px minimum height and width. List titles remain content-width
   within their parent's available width; board titles retain their full width.
   Existing wrapping, typography, focus treatment, native links and handlers stay
   intact. The discovery title's existing full-width 44px override is retained.

SOL must remeasure these selectors and the affected wrapping/focus/Move behavior
on the corrected commit, including short and long list/board titles and discovery
links. No after-correction browser result is claimed here. No app build, server,
Docker, installation or functional harness was run in Astra's review task.
Initial fixture-selector/DTO failures were corrected by SOL at the HTTP test
boundary and are not recorded as product bugs; the completed report selects the
corrected evidence. Neither fixture checks nor screenshots prove persistence.

### Inherited collaboration recovery follow-up

SOL separately reproduced simultaneous **“The outcome could not be confirmed”**
with Retry save/Discard and **“Saving change…”** while a checklist POST is still
pending. Astra inspected both `project-checklist-pending-light-390` and
`project-checklist-pending-dark-390`: both contradictory panels are visible.
The coordinator identifies the responsible `task-collaboration.tsx` source as
unchanged from preparation `ea7916b`; it is not a CSS regression.

This is an explicit **SOL-owned T37.4 collaboration recovery** follow-up, in
addition to the two previously recorded project recovery debts. SOL must define
and test the pending-versus-unknown discriminator, exact-key retry and disabled
actions; Astra then reviews the resulting feedback. Do not conceal the conflict
with CSS or infer that a color change resolves it. Final T37 acceptance must
revisit this finding. No logic or runtime test is changed in this batch.

Actual 200% browser-chrome zoom remains unperformed in SOL's headless engine;
viewport resizing or CSS/page scale is not substituted. Width samples include
320/375/390/768/1024/1440 and short 844×390 landscape, with browser preference
emulation for theme/reduced motion. Physical devices, virtual keyboard, manual
AT, real-user/provider/staging evidence and DB/security proof remain deferred.
SOL's route/HTTP fixtures are distinct from real persisted-flow evidence.


## Corrected-source revalidation and publication preparation (2026-11-11)

Independent SOL revalidation uses `999aba720cc9485f5e1ac1a3c817c3a260a802c8`,
build `WI1g2MAenwElnKRcG-YBH`; baseline results above remain bound to `d533cc0`.
Eight targeted list/board cases pass across 320/390/768/1440, both themes and
ES/EN, plus a shared discovery-link sample. Mobile/coarse Move selects measure
16px; view segments measure 44px high and title links at least 44×44px. Long
text wraps without sampled page overflow or painted overlap. Native href/URL,
Enter/click activation, detail return/focus and Move behavior pass the targeted
fixture assertions. List return may focus the equivalent remounted link;
board refresh instead returns focus to the project-heading fallback. Same-node
identity is not claimed. Fine-pointer desktop Move text remains 12.8px.

Astra viewed nine actual corrected PNGs: four list, four board and one discovery.
Short-title focus boundaries remain visible; long titles wrap, metadata stays
separate and native field text is readable. No new CSS defect was demonstrated.
All three final CSS files match SOL's tested hashes; subsequent publication
commits contain documentation only and do not change those bytes:

| CSS file | SHA-256 at tested source and publication |
| --- | --- |
| `globals.css` | `2c4ae524473124db78bf72e2fca26330455e9083367126321d469b63262cdd12` |
| `workspace.module.css` | `90011906e28006293a1b5a0e4cfead32a15dac48b28749ae8bc8151d377f5a70` |
| `projects.module.css` | `25165e70e289dee9fb3800eb672e86da8da1dd45c2f66767397e1493161ff6b4` |

SOL's report/index and Astra's `publication-inspected.json` retain source/build
and image hashes. Runtime cleanup is confirmed. No duplicate runtime, broad
suite or installation ran in Astra's publication task. The inherited T37.4
recovery findings and real zoom/device/AT/persisted-flow limits above remain;
corrected selector evidence does not establish full T37 acceptance. Current-head
CI/native Kilo and coordinator review remain required before acceptance.
