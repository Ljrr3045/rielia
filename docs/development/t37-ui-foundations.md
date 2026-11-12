# T37.2 CSS foundations checkpoint

Status: **implementation checkpoint; T37.2 acceptance pending**. Prepared on
2026-11-11 America/Caracas, branch `feat/t37-ui-foundations`, from preparation
`ea7916b156bdf1afe9f3758e303b564f59fca618`. The coordinator authorized this isolated
CSS work while PR #45 completes review; its subsequent packaging correction is
separate. This checkpoint is not published and does not accept T37.1 or T37.

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

## Checkpoint validation and remaining evidence

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
