# T05.1/B1 workspace and membership UI

Updated: 2026-10-28 UTC. This bounded presentation delivery adds the
`/workspaces` product flow for the [T05.0 logic](workspace-flows.md). It is not a
full T05/T07/T35 delivery, a production announcement, or evidence of real-user
acceptance. Final base/PR evidence is completed after the logic PR merges.

## Scope and traceability

| Area | Implemented presentation | Requirement |
| --- | --- | --- |
| Workspace selection and creation | Authorized workspace selector, current role/owner, explicit creation, empty/denied/error recovery and clear-selection escape | P02, US02, UX09 |
| Members | Compact human/agent rows, one role/state representation, custodian text, owner protection and versioned admin controls | P03, P33, US03, US24–US25, UX11 |
| Invitations | Human owner/admin invite, role choice, pending/expired/accepted/revoked states, explicit revoke confirmation | P03, US03, UX05 |
| Explicit acceptance | Received fragment is accepted only after an explicit action; signed-out recipients use a separate tab and Refresh | US03, UXR01, UX05/UX09 |
| Agent controls | Registration (member/viewer plus active human custodian), suspend/restore/retire and custodian transfer; no credentials | P03, P38, US24–US25 |
| Cross-cutting | Light/dark, keyboard/visible focus, live feedback, responsive 320–1440 layout, ES default with EN selector | P33, US08, UXR03, UX03/UX07/UX09 |

References used: UXR01 for stable workspace context and work structure, UXR03
for mobile-readable vertical rows and visible actions, and the branding/UI/UX
tokens and voice. External reference images were not inspected for this task;
the textual guide and approved repository assets were used.

## Composition

- `apps/web/src/app/workspaces/page.tsx` supplies private-route metadata and
  renders the client presentation. `workspace-view.tsx` owns shell/composition,
  status/recovery/invitation panels and the locale selector. `workspace-admin.tsx`
  owns the workspace/member/agent/invitation forms and compact lists.
  `workspace-ui.tsx` supplies shared presentation primitives; `strings.ts` owns
  the ES/EN dictionary; `workspace.module.css` is scoped to the route.
- Production data comes only from `useWorkspaces` in
  `apps/web/src/lib/use-workspaces.ts`. The page adds no fake adapter, task data,
  metrics, future navigation, credentials, SMTP behavior or owner-transfer/
  deletion/rejoin controls. Commands and public types stay in
  `@rielia/contracts`; permissions and current versions remain server-authoritative.
- The header exposes account-in-a-new-tab and Refresh. The language selector
  defaults to Spanish and switches the route subtree to English, including the
  `lang` attribute. No bilingual duplicate-label density is used in the product
  flow.
- Ready workspaces show a compact selector/role/owner bar, one-column member list,
  admin-only agent section, admin-only invitation section, and a secondary create
  disclosure. Member cards show kind/role/state once, with owner protection and
  distinctive Agent treatment. Irreversible removal, custodian change and
  invitation revocation require an inline confirmation.
- Forms hydrate from a matching `ws.draft` and call `stage` on edits, so Refresh,
  status remounts and session loss do not erase unsent create/invite/agent/
  member-role/custodian input. Captured retry/draft scope stays visible; users
  switch back or explicitly discard before replacing it. No presentation-owned
  recovery state machine exists.
- Received invitations render an explicit Accept/Dismiss panel. Created links are
  shown transiently in a read-only field with copy and Done; Done clears only the
  generated link, preserving a separately received token. Reusing the backend
  idempotency key is never attempted by the UI.
- Status handling covers loading, disabled identity, signed-out, empty, ready,
  forbidden and error. Forbidden/error views expose authorized-workspace selection
  and clear-selection using `selectWorkspace(null)`; the saved selection is never
  treated as authorization.
- Operational feedback distinguishes success, invalid, forbidden, conflict,
  network/unknown and invitation-link-unavailable. A successful write remains
  successful if its follow-up read fails. Conflict keeps the draft and asks for
  Refresh/review. Invitation-link-unavailable shows the affected email and
  workspace and directs Refresh, explicit revoke and recreation. Retry/success
  context is captured at submit time rather than inferred from the current
  selection.
- Session loss keeps an in-memory invitation/draft: the page explains opening
  `/identity` in another tab, returning to the original tab and Refresh, and warns
  that reloading loses memory-only state. The account link always opens a new tab
  so memory is not silently discarded.

## Accessibility and responsive evidence

- Native labels, fieldsets/sections, headings, lists, disclosure summaries,
  status/alert live regions and 44 px minimum control targets are used. Focus moves
  to confirmation headings and operation feedback; buttons remain reachable by
  keyboard and touch. No drag-only action exists in this flow.
- Light/dark color pairs use the shared semantic tokens plus scoped soft-surface
  variants; long names, emails, custodian IDs and invitation links use
  `overflow-wrap:anywhere`/non-overflowing fields.
- Measured with the live integrated app: `innerWidth`/document scroll width were
  390/390, 320/320 and 768/753, with no horizontal page overflow. Root browser QA
  separately verified 1440 desktop and 320/390 mobile, including create, select,
  invite/recipient, role and stale-forbidden recovery.
- Saved native Orca screenshots (outside the repository):
  `/private/tmp/rielia-t05-ui-desktop.png` (1285 dark),
  `/private/tmp/rielia-t05-ui-desktop-light.png` (1285 light),
  `/private/tmp/rielia-t05-ui-mobile-390-dark.png` and
  `/private/tmp/rielia-t05-ui-mobile-320-light.png`. The 1440 CDP captures are
  discarded as tiled viewport artifacts, not application defects. Root's global
  evidence is `/private/tmp/rielia-t05-root-browser-qa.md`; own bounded QA notes
  are `/private/tmp/rielia-t05-ui-qa.md`.

## Validation

Provisional integrated head checks (final base re-runs follow the logic merge):

```sh
pnpm --filter @rielia/contracts build
pnpm --filter @rielia/web typecheck
pnpm --filter @rielia/web build
pnpm exec eslint apps/web/src/app/workspaces apps/web/src/app/page.tsx
git diff --check
```

Additional interactive evidence from the integrated local harness: real workspace
creation/selection; invite creation and verified-recipient acceptance; agent
registration, suspend/restore and custodian transfer; owner protection; explicit
invitation acceptance; unsent invite draft surviving session loss and restored
after second-tab sign-in plus Refresh; blocked-API error state and recovery with
draft restored; Spanish/English selection; dark/light; and 320/390/768 width checks.
Direct Orca CLI Tab/Enter input did not move page focus in this browser profile, so
that input path is recorded as unavailable; root Brave keyboard evidence covers
Tab from skip link to navigation and Enter on disclosure/confirmation. No screenshot
is counted as a completed flow.

## Limitations and remaining work

- Root owns shared browser QA; this delivery does not claim real OAuth,
  HTTPS/staging, real-person usability or cross-browser certification.
- Conflict and invitation-link-unavailable were not cheaply induced through the
  live browser for this delivery; their state rendering and recovery copy are
  covered by the T05.0 logic/client regressions. No UI duplicated that logic.
- Functional test code remains Sol-owned. This delivery adds no auth/session/data
  hook, proxy, contract, backend, fake production path or test logic.
- Full T05/T07/T35, projects/tasks, project visibility, SMTP, agent credentials,
  remote MCP, ownership transfer/deletion/reauthentication and deployment remain
  open. The route is private (`noindex`) and explicitly labels unavailable
  capabilities beside the relevant controls rather than presenting future
  sections as working.

## Pending finalization

Final `origin/dev` base, exact-head checks, PR URL, CI and Kody evidence are added
after the coordinator confirms the logic PR is merged and this presentation is
rebased. Until then this document is provisional integration evidence.
