# Later landing direction

Decision date: **2026-11-05, America/Caracas**. This records the user's later
marketing narrative and Astro direction for **existing T30–T34**. It adds no
third priority ticket. The [quality roadmap](development-quality-roadmap.md)
puts T36 → T37 → T11 first, then remaining dependencies. No landing is built,
scaffolded, published or deployed by this documentation change.

## Relationship to the original plan

Preserve the [original landing brief](../handoff/05-landing-page-plan.en.md),
[brand strategy](../handoff/03-branding.en.md),
[product](../handoff/01-product.en.md) and
[architecture §10](../handoff/02-architecture-technical-plan.en.md#10-marketing-surface-and-product-assets)
unchanged. This dated decision supersedes the explicit Next.js-in-`apps/web`
landing location/stack and the narrower agent-builder-first marketing emphasis.
It does not ratify every proposed ADR, token, asset or license. Product remains
authoritative for features, UX/landing for interaction, branding for voice/identity,
and architecture for data/permissions and operations.

## Narrative for later design

Lead with **free ticket and project management software for everyone**: people,
small teams, communities and builders, including those who do not use agents.
Explain the open-source intent and self-hosting as a way to control data and
reduce dependence on recurring paid software subscriptions. The agent workflow
is a concrete capability to explain after the basic work-management purpose;
retain delegated human versus autonomous Agent authorship when describing it.

This is intended product positioning, not a claim that a released service exists.
There is no adopted repository license yet; **open-source intent** must be
distinguished from granted licensing rights until the maintainer chooses a license
and notices. Do not adopt Apache-2.0 from the handoff proposal or promise rights
that have not been granted. Final name/logo remain undecided.

Free software does not mean cost-free infrastructure or operations. Explain that
self-hosting may involve a server, domain, storage, backups, email, updates and
maintenance. No unlimited/free managed hosting, SLA, pricing plan or funded public
service is approved. Avoid competitor savings percentages or cost comparisons
without evidence. Broad availability as an aspiration does not remove isolation,
quotas or registration controls.

Proposed internal copy direction, subject to release/brand/license review:

> Free ticket and project management, for everyone.
> Keep your work organized on an installation you control, with less dependence
> on paid software subscriptions.

At implementation, refine ES/EN copy against what is actually delivered and the
license decision. Show actual capabilities only. Preserve one public launch with
continuous updates, the eventual **Use Rielia** primary CTA with a real destination,
and subordinate code/self-hosting links. Do not publish a waiting page, launch
calendar, fake form, testimonial or unsupported feature claim. A concept remains
labeled as a concept; local technical fixture/product screenshots are not proof
of public availability.

## Proposed monorepo boundary

Use a separate **Astro app, proposed path `apps/landing`**, while `apps/web` remains
the Next.js application. This path is a future target, not an existing package.
Astro's content-focused rendering should keep public copy usable as HTML with
minimal interactive enhancement. Select exact versions/adapters and validate
compatibility, license/advisories, build/container behavior and maintenance at
T31 implementation; no dependency pin or hosting choice is approved by naming
Astro here.

The research checked [Astro rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
and [internationalization](https://docs.astro.build/en/guides/internationalization/):
prefer prerendered public ES/EN content, and make any on-demand endpoint's
adapter/deployment requirement explicit before implementation.

Share selected identity/tokens/assets only through an agreed minimal boundary;
do not create a UI package merely for a second app. Keep landing public content
free of sessions, workspace data and business rules. Links to the Next app must
respect its existing identity/auth, API, event and MCP routes. Record canonical
origin, routing/reverse-proxy and cookie/callback implications before changing
infrastructure. A separate app does not imply separate hosting, new domains,
duplicate backend or authorization logic. Private app authorization never depends
on robots/noindex or marketing navigation.

## GitHub star link and resilient count

Link visibly to [Ljrr3045/rielia](https://github.com/Ljrr3045/rielia), with an
accessible text label such as **Star Rielia on GitHub**. The implemented success
path must show the repository's real GitHub `stargazers_count` from a successful
fetch or valid cache; the page remains usable without it during failures.
Do not omit the requested numeric count entirely or copy a mockup number as
social proof.

Plan a bounded, nonblocking build/server fetch with caching and a timeout; choose
and document cache age, revalidation and rate-limit/backoff behavior during T31.
Prefer a usable stale cached value to blocking the page, and fall back to the
plain repository link if the count is missing, invalid or unavailable. Do not
replace errors with zero or a fabricated number, and do not present a cached
number as a live measurement. No client-side secret or personal token; any future
authenticated server fetch needs separate approved configuration and must not
embed credentials in HTML, bundles, URLs or logs.

Verify success, stale cache, timeout, invalid response, rate limit and offline
behavior. The link stays keyboard/touch accessible without fetch/JavaScript.
Validate the repository identity and a finite nonnegative integer; genuine zero
is valid, while failure is not zero. Use `stargazers_count`, not watchers, under
the [GitHub repository endpoint](https://docs.github.com/en/rest/repos/repos#get-a-repository).
Handle 403/429/5xx and conditional requests/rate resets according to
[GitHub REST practices](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api).
Counter updates avoid layout shifts and noisy announcements. Any motion is
optional, subtle and respects reduced motion. A star click opens GitHub; the
landing cannot imply it has starred the repository for the visitor.

## Existing ticket updates and acceptance

| Ticket | Updated bounded scope | Required later evidence |
| --- | --- | --- |
| T30 | Review/select brand assets and semantic tokens for application and proposed Astro landing | P37/US23, LP07–LP08; final/provisional status, provenance, formats/dimensions/alt, correct delegated/autonomous examples; no automatic publication of the kit |
| T31 | Build ES/EN Astro landing in a separate monorepo app with the broader free-software/self-hosting narrative and real GitHub star link/count fallback | P35/US21; UX10; S00–S07/LPR01–LPR05/LP02–LP08 as applicable. Real app/code/installation links, rendered HTML, mobile/keyboard/touch/zoom/reduced motion, resilient fetch/cache/error checks, routing/auth isolation and measured performance |
| T32 | Optional confirmed updates capture remains backend/worker/SMTP work | P36/US22/LP10; existing installation-only lead isolation, generic response, confirmation/unsubscribe, abuse controls and actual service/policy prerequisites. No form without that backend; no waitlist |
| T33 | Astro-appropriate metadata/localized SEO and minimal approved measurement | LP09; real canonical/hreflang/sitemap/social URLs, ES/EN, no private app pages or email/token/project data in analytics; verify performance using recorded environment. Replace Next-specific metadata implementation assumptions only |
| T34 | Verify eventual public marketing launch with application release gates | LP01–LP10 and original T31/T33/T32-if-active dependencies, real visitors when scheduled, actual destinations/capabilities/license/brand, hosting/routing/backup evidence where relevant; T24/T15 and public launch acceptance remain separate required work |

Retain source dependency prerequisites and the later placement of this track;
this record neither completes T30–T34 nor authorizes publication. T37's Astra
high presentation and SOL xhigh logic/test ownership rules apply when future
landing work is dispatched, with effective model/effort verified. The unchanged
Mobbin section references are composition evidence, not redistributable product
art or measured conversion/accessibility results.
