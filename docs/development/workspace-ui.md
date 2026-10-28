# T05.1/B1 workspace and membership UI

Updated: 2026-10-28 UTC. This bounded presentation delivery adds the
`/workspaces` product flow for the [T05.0 logic](workspace-flows.md). It is not a
full T05/T07/T35 delivery, a production announcement, or evidence of real-user
acceptance. The branch is rebased onto `origin/dev`
`01c9cc168bb9dde62b4290c049b982d62952c9a5`, the PR #13 merge; final UI PR/CI/Kody
evidence is recorded below after creation.

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

- `apps/web/src/app/workspaces/page.tsx` supplies noindex route metadata and
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
- External evidence kept outside the repository: native Orca dark/light desktop
  captures and 390/320 mobile captures, plus root and worker browser QA reports.
  They are referenced in the delivery handoff and PR #14, not committed as
  repository artifacts. The 1440 CDP captures are discarded as tiled viewport
  artifacts, not application defects.

## Validation

Final-base checks (Node 24.22.1, pnpm 12.15.0):

```sh
pnpm check
pnpm audit --audit-level=high
python3 scripts/verify-handoff.py
git diff --check
```

`pnpm check` passes lint, the Express-free backend closure, smoke-process cleanup,
identity logic/client (7), workspace logic/client (16), prototype (19), strict
typechecks, production builds, MCP subprocess/Inspector checks (17) and the
Next/API HTTP smoke. Audit reports no known vulnerabilities. Handoff verification
passes 47 imported files, 30 asset hashes/sizes and 390 local links; whitespace
checks pass. T05.0's Docker/PostgreSQL suites were not rerun for this UI-only
change; the merged logic PR #13 retains those checks and CI gates.

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
- Conflict and invitation-link-unavailable controller outcomes/recovery
  transitions are tested by the merged T05.0 logic/client regressions, but the
  corresponding JSX browser paths were not exercised end to end here. Their
  browser rendering remains unverified in this delivery; no UI duplicated the
  controller logic.
- Functional test code remains Sol-owned. This delivery adds no auth/session/data
  hook, proxy, contract, backend, fake production path or test logic.
- Full T05/T07/T35, projects/tasks, project visibility, SMTP, agent credentials,
  remote MCP, ownership transfer/deletion/reauthentication and deployment remain
  open. The route uses `noindex` metadata; API access is enforced by the backend,
  not by indexing metadata. Unavailable capabilities are labeled beside the
  relevant controls rather than presenting future sections as working.

## Final PR evidence

- PR: [#14](https://github.com/Ljrr3045/rielia/pull/14), English non-draft,
  targeting `dev`.
- Initial code/check head: `ec84b7c7992ea713f8491ec711d21df1fb1e2617`.
- Final-base validation: `pnpm check`, audit, handoff, whitespace and bounded
  browser QA pass as recorded above. The follow-up docs commit adds this URL and
  progress evidence without changing presentation behavior; the coordinator
  receives the exact final head for CI/Kody.
- Kody AI review/rounds: pending coordinator root trigger. Every pushed head needs
  a fresh trigger; a prior-head review never approves changed code. Only the
  coordinator merges.
