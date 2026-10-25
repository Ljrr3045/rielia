# Identity presentation (T02.2)

Status: presentation integrated on the merged T02.1 `useIdentity` contract. This
document records UI-owned decisions and evidence for the experimental `/identity`
page. It does not complete T02, US01, or P01 and claims no product
functionality, real OAuth, HTTPS callbacks, or domain permissions.

## Scope and ownership

- `apps/web/src/app/identity/identity-view.tsx` presents identity state. It
  renders props only, makes no HTTP calls, and owns no session or auth decisions.
  Its types are type-only imports from `apps/web/src/lib/identity-controller.ts`,
  so contract drift is a compile error.
- `apps/web/src/app/identity/page.tsx` calls `useIdentity()` and passes its state
  and actions to the view. It contains no logic of its own.
- `apps/web/src/app/globals.css` adds two semantic tokens (`--control-border`,
  `--danger-text`) and identity classes. `apps/web/src/app/page.tsx` links to
  `/identity` with `next/link`.
- No dependency, package manifest, lockfile, API route, `lib/` file, or backend
  file is changed by this presentation work.

Applicable criteria: P01/US01 for sign-in, logout, cancellation retry, and hidden
unconfigured providers; UXR03/UX07 for touch, keyboard, focus, and tokens; UX09
for nonideal states. Passing these checks in the fixture does not complete them.

## States

| State | Presentation |
| --- | --- |
| loading | "Checking session" in a live status region; no retry control |
| unavailable | Neutral failure copy and a "Check again" control |
| disabled | Identity disabled for this installation; no controls |
| signed-out, no providers | "No sign-in providers are configured"; no provider controls |
| signed-out, providers | Only configured providers are rendered as sign-in buttons |
| signed-in | Name and email from the server session, with a sign-out control |
| pending sign-in / sign-out | Progress text; buttons stay focusable and aria-disabled |
| message sign-in-incomplete / sign-in-failed / sign-out-failed | Alert text with retry guidance |

## Accessibility decisions

- Native `button` elements for every action; touch targets use the existing
  `.refresh` minimum height of 2.75rem (44px).
- Pending controls use `aria-disabled` instead of `disabled`, so keyboard focus is
  not dropped while an action is in flight. The handler ignores clicks while
  pending. The hook sets pending synchronously before its first await, so a second
  click is blocked by the next render.
- The status region is always mounted (`role="status"`, polite) so changes are
  announced; failure messages use `role="alert"`.
- Focus recovery: each action records its initiating button from the click event.
  When the action settles, focus moves to the section heading only if that control
  is now disconnected and focus is on `body` or null. A still-connected control is
  never focused programmatically, and focus on any other element is never moved.
  Recovery is keyed to the settled `pending` transition and disarms immediately, so
  background renders do not move focus. Browser-owned focus after pointer clicks is
  left as the browser sets it.
- Visible focus uses the existing `--focus` outline, including the programmatic
  heading target.
- Copy is bilingual (Spanish first, English in `lang="en"` spans) following the
  existing fixture pattern. The page states that it is an experimental check that
  creates no workspaces, tasks, or MCP access.

## Evidence

Integrated checks on the rebased branch (on `origin/dev` at `096a1a3`):

- `pnpm lint` passes (`eslint . --max-warnings=0`).
- `pnpm typecheck` passes.
- `pnpm check` passes end to end: lint, process smoke test, identity logic/client
  tests, typecheck, production build (`/identity` prerendered as static), and HTTP
  smoke including the identity proxy/disabled state and API-down fallback.
- Live production route `/identity` with the API running and identity disabled by
  default. The config endpoint returns `enabled:false`. Coordinator browser QA on the
  hydrated page confirmed the actual disabled status and a clean 320 px layout
  (scroll width equal to viewport width, 320 px).
- Live production route with the API stopped. Coordinator browser QA confirmed the
  neutral unavailable status, "Check again" activated with Enter, and focus landed
  on the section heading with a visible outline. The 320 px layout had no
  horizontal overflow.

Final focus QA on the narrowed focus policy (temporary props-only fixture, removed):
keyboard sign-in failure keeps focus on the provider button with the alert shown;
successful sign-out removes the button and focuses the section heading; failed
sign-out keeps focus on the sign-out button with the alert; unavailable retry
focuses the heading and stays there; choosing another control during a pending
action keeps that control's focus; clicking non-focusable content keeps focus on
the main element; clicking the page background during a failed sign-in leaves
focus on `body` with the provider still connected, with no focus theft. Safari and
touch-device focus behavior is not claimed.

Kody review finding on the focus recovery (inline review thread on the earlier
head) was valid: the `body` check alone could not distinguish a removed control
from one the browser never focused. The fix captures the initiating button and
moves focus only when that control is disconnected and focus is on `body`/null.

Earlier, on the pre-integration presentation:

- Headless Firefox screenshots of all 12 presentation states at 320, 390, 768,
  and 1440 px, using a temporary preview route (removed). No horizontal overflow;
  long names and emails wrap. Dark theme only.
- Coordinator browser QA on a temporary presentation-only fixture (simulated
  props, removed afterwards): 320 px long-identity wrapping without horizontal
  overflow; Tab reaches the sign-out control with a visible outline; sign-out
  pending keeps focus, then focus returns to the heading after removal; retry
  returns focus to the heading; a failed sign-out keeps focus on the control and
  announces the alert; a failed sign-in keeps focus on the provider control.

## Not verified

- Light theme visual capture. Headless Firefox ignored the profile override, so
  the light palette is checked only as token values.
- Screen reader output, touch-device behavior, and orientation changes.
- Real Google/GitHub consent, private-email flows, HTTPS callbacks, and staging.
- Enlarged text and 200% zoom.
- Real-person usability.

Screenshots and fixture evidence are supporting material only. They do not
establish accessibility compliance or usability.
