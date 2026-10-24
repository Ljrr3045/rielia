# Rielia — Brand kit and asset guide

**Scope clarification — October 24, 2026:** this file inventories earlier proposals. The current landing direction is [05 — Design guidelines](05-landing-page-plan.en.md). The local view and previous compositions are not the selected design or mandatory assets. The current request is documentary planning; production and integration will be decided later.

**Date:** October 24, 2026.  
**Kit version:** 0.1, visual proposal for review and future integration.  
**Español:** [Kit de marca y guía de assets](06-brand-assets-guide.es.md).  
**Context:** [Branding](03-branding.en.md) · [UI/UX](04-ui-ux-development-guide.en.md) · [Landing](05-landing-page-plan.en.md).

## 1. Deliverables

Real files usable as a starting point: vector symbol/wordmark, logo variants, icons, banners, social cards, editorial illustration, empty-project graphic. Raster exports and a review gallery are included.

Rielia remains provisional. This is a concrete proposal; earlier UI-reference selection does not amount to final logo approval. No trademark availability or legally exclusive identity is claimed.

Logos, icons, text-free graphics are shared across ES/EN. Banners, social cards, copy, documentation, landing previews are localized. Do not duplicate identical assets merely to change a language label.

## 2. Gallery and catalog

The handoff ZIP excludes the previous landing prototype. The galleries below show the asset kit only; consult document 05 for the current design brief.

- [English asset gallery](assets/index.en.html).
- [Manifest with dimensions, formats, sizes, hashes](assets/manifest.json).

| ID | Resource | Main files | Use |
| --- | --- | --- | --- |
| AS01 | Horizontal logo | [SVG](assets/common/logo-horizontal.svg), [PNG](assets/common/logo-horizontal.png), [inverse SVG](assets/common/logo-horizontal-inverse.svg), [monochrome SVG](assets/common/logo-monochrome.svg) | Header, cover, footer, product communication |
| AS02 | Symbol and icons | [Symbol SVG](assets/common/logo-mark.svg), [favicon SVG](assets/common/favicon.svg), [16 px](assets/common/favicon-16.png), [32 px](assets/common/favicon-32.png), [192 px](assets/common/app-icon-192.png), [512 px](assets/common/app-icon-512.png), [Apple 180 px](assets/common/apple-touch-icon.png) | Browser, installed web shortcut, small surfaces |
| AS03 | Editorial illustration | [Original PNG](assets/common/hero-editorial.png), [WebP 1600](assets/common/hero-editorial-1600.webp), [WebP 800](assets/common/hero-editorial-800.webp) | Landing narrative, presentations, communication |
| AS04 | Landing banner | [English SVG](assets/en/banner-landing.svg), [English PNG](assets/en/banner-landing.png) | 1600×900 campaign/cover image; does not replace HTML text |
| AS05 | Sharing card | [English SVG](assets/en/social-card.svg), [English PNG](assets/en/social-card.png) | 1200×630 Open Graph/social; use PNG for compatibility |
| AS06 | Repository banner | [English SVG](assets/en/repository-banner.svg), [English PNG](assets/en/repository-banner.png) | 1600×480 documentation/repository cover |
| AS07 | Empty project | [SVG](assets/common/empty-project.svg) | 320×220 empty state; render heading/CTA separately |

PNG exports exist for all four logos; Spanish [banner](assets/es/banner-landing.png), [social card](assets/es/social-card.png), and [repository cover](assets/es/repository-banner.png) are included. The manifest lists actual delivered files, not future resources.

## 3. Identity concept

The symbol forms an R from two strokes sharing a direction. The illustration develops the same idea: two work paths converge into an ordered result. It evokes people/agents within one plan without depicting a robot or implying the app executes code.

The wordmark uses original SVG paths and needs no font download to render the name. Editorial banner text uses Arial/Helvetica/sans-serif fallback; no font files are redistributed. Inter remains a production-interface candidate, with license/files to review during integration.

Base palette: slate `#0F172A`, teal `#0F766E`, mint `#5EEAD4`, paper `#F8FAFC`. Compositions follow restrained branding direction; product graphics are original concepts with clearly identified fictitious data.

## 4. Logo usage

- Primary logo on light surfaces; inverse on dark. Do not recolor per screen.
- Minimum clear space around lockup: 25% of symbol height.
- Starting guideline: symbol at least 24 CSS px in UI; specific favicon for 16 px. Horizontal lockup at least 112 CSS px; check context legibility.
- Do not stretch, tilt, add shadows/glows, or enclose wordmark in another decorative card.
- Do not make the logo an action's only accessible name. For home links, `alt="Rielia"` or equivalent; avoid duplicate announcements.
- Monochrome retains geometry. Its SVG uses `currentColor`; check inline-SVG versus external-image integration.

These are initial production guidelines; favicon readability and varied backgrounds need real-device review before launch.

## 5. Banner and image integration

Banners disclose “Visual concept / application in development.” Retain that disclosure while used as proposals. A later launch campaign replaces conceptual images with evidence from an available release or keeps unambiguous labeling.

Implement landing headlines/buttons in HTML. Use banners for campaigns, not as a full-page screenshot containing all text. Label the conceptual board; later use sanitized real app screenshots.

AS03 is an editorial illustration produced with built-in ImageGen; SVGs/wordmarks are editable native graphics. WebP variants are optimized exports of the original with no creative content change. Mobbin screenshots were not used as redistributable kit artwork.

The [exact prompt and method](assets/generation-prompt.txt) are retained for reproducibility. No app/landing asset depends on an expiring generation URL: all are saved in the package.

## 6. Accessibility and performance

Functional logo has an accessible name; decorative illustrations use `alt=""`; informative screenshots have equivalent descriptions and nearby benefit text. PNG text must not be the only explanation of a capability.

Declare dimensions to reserve space. Use AS03 `srcset` and lazy-load below-fold content. Retain original PNG for editing/archive and prefer WebP on the web. Do not load every campaign banner on the home page.

Light/inverse versions do not establish app-wide contrast. Verify actual buttons, focus, states, backgrounds against UI/UX criteria.

## 7. Agent handoff and repository integration

Delivered structure:

```text
assets/
  common/              # language-independent logos, icons, illustrations
  es/                  # Spanish banners and social card
  en/                  # English banners and social card
  index.es.html
  index.en.html
  manifest.json
  generation-prompt.txt
```

Keep this review package with documentation. For production integration, T30 copies selected assets to `apps/web/public/brand/` or an agreed stable static location and updates paths. Do not automatically publish the entire gallery/documents inside the public app.

Select from the manifest; do not recreate the logo with emoji, library icons, or a word typed in another font. If name/identity changes, create a new kit version and update references together.

## 8. Kit acceptance and next steps

- Verify well-formed SVG, readable PNG/WebP, banner dimensions, no clipped text.
- Review light/inverse/monochrome logo and favicon, not only the large version.
- Preserve hashes, language, provenance in manifest. Shared resources use language `und`.
- Test mobile/desktop galleries/landing, downloads, language switching.
- Before commercial publication, finalize name and approve identity. This kit does not itself change proposed code licensing or establish final trademark policy.

**Delivery status:** files, exports, galleries, local preview produced. Application integration, final brand approval, real lead capture, publication are not presented as completed.

## 9. Messaging review for later integration

Apply document 05's single launch/continuous updates and [Product §2.5](01-product.en.md#25-identity-and-authorship-of-agent-actions) authorship. If a composition uses a generic Agent participant, replace it with Luis through Cursor in delegation or Rielia Builder · Agent in autonomy, with assignee separate from creator. Do not reuse conceptual imagery suggesting access stages or incorrect identity.

This documentary revision does not regenerate v0.1 graphics; they remain candidates. When producing final assets, update SVGs and localized exports together and verify both modes. Logos and graphics without authorship require no change for this decision.
