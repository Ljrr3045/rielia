# Rielia — Brand strategy and development

**Marketing and assets addition:** October 24, 2026; landing and v0.1 kit added to scope.

**Plan and research date:** October 18, 2026.  
**UI/UX direction update:** October 24, 2026; stack and brand availability research not repeated.  
**Status:** planning proposal; does not represent an implemented application.  
**Working name:** Rielia; commercial, trademark, and domain availability unconfirmed.  
**Audience:** founder and product, design, engineering, and community contributors.

**Spanish version:** [Estrategia y desarrollo de branding](03-branding.es.md).  
**Companion documents:** [Product plan](01-product.en.md) · [Architecture and technical plan](02-architecture-technical-plan.en.md) · [UI/UX development guide](04-ui-ux-development-guide.en.md) · [Landing](05-landing-page-plan.en.md) · [Assets](06-brand-assets-guide.en.md).  
**Agent entry point:** [START HERE](00-START-HERE.md).

## Contents

- [0. Context and scope](#0-context-and-scope)
- [1. Branding](#1-branding)

---

## 0. Context and scope

This document develops positioning, naming, voice, visual identity, and messaging for an open-source project, task, and sprint app, self-hostable through Dokploy and compatible with agents through MCP. The proposed initial audience is independent developers and small teams; it has not been validated through interviews.

Rielia is a provisional name. This deliverable includes a brand system and brief, not a final logo, confirmed legal availability, or publication. Searches and sources date to October 18, 2026 and have not been refreshed for this split or translation.

B0–B3 are internal work batches, not launch stages. The product has one public launch followed by continuous updates. Commercial promises must match the release actually available. The product document defines capabilities and UX; the technical document specifies implementation, permissions, and deployment.

## 1. Branding

### 1.1 Strategy and positioning

**Category:** open work-management and project-planning platform.

**Initial audience:** product builders and small teams alternating human execution with agents.

**Promise:** turn plans into clear, shared, traceable work.

**Reasons to believe, once implemented:** tasks/sprints with history, agent-connection permissions, documented API/MCP, export, and own deployment.

**Proposed positioning:**

> For people and teams building with agents, Rielia is an open platform for organizing projects, tasks, and sprints in one workflow. Plan on the web, delegate from your terminal, and review every change while retaining control of your installation.

Do not communicate unshipped features as facts. Production copy describes the available product and continuous improvements. Internal drafts are identified as concepts.

### 1.2 Brand territories

| Territory | Idea and personality | Conceptual names | Taglines | Advantage and risk |
| --- | --- | --- | --- | --- |
| Clarity and progress | Order, direction, calm progress; precise and approachable | **Rielia**, Cursena | “From idea to work in motion.” / “Every task, a clear next step.” | Understandable beyond AI; invented name needs explanation |
| Connected work | People, decisions, and agents sharing context; friendly and collaborative | Telora, Tandrio | “Your team and agents, working from one plan.” | Expresses collaboration; some names may suggest unrelated services |
| Autonomy to build | An open tool you can operate and extend; confident and technical | Riel Abierto, Forja Común | “Your work. Your way forward.” | Fits community; common words are less distinctive and may feel niche |

**Recommendation:** clarity and progress territory, with **Rielia** as provisional name. It evokes the Spanish word “riel” (rail), direction, and continuity; this is a creative interpretation, not an etymology or comprehension guarantee. Avoid names nearly identical to Trello, Linear, or ClickUp and avoid adding “AI” to the main name.

### 1.3 Naming and preliminary review

| Candidate | Approximate Spanish pronunciation | Fit | Risk or next test |
| --- | --- | --- | --- |
| Rielia | rie-lia | Short, no accent mark, suggests progress; conceptual favorite | Dictation, English pronunciation, trademark/domain checks pending |
| Cursena | cur-se-na | Direction and continuity | May evoke courses; test comprehension |
| Telora | te-lo-ra | Connection and human tone | Invented name with possible matches; not deeply researched |
| Tandrio | tan-drio | Working in tandem | Pronunciation and use as personal/surname; review required |
| Riel Abierto | Literal Spanish: Open Rail | Clear openness message | Descriptive and long; possible railway association |
| Forja Común | Literal Spanish: Common Forge | Building and community | Generic, likely collisions, less internationally neutral |

A general web search covered some exploratory candidates. **Nodara** was discarded because it matches a visual project-management product, and **Trazia** because software/productivity uses were already visible. **Tandria** also has visible commercial use and is not recommended. Sources for those matches: [Nodara](https://nodara.so/), [Trazia](https://www.trazia.pro/), and [Tandria](https://tandria.ai/features).

Rielia was included in an exploratory search; **the absence of a relevant match in retrieved results does not establish availability**. Trademark, company, domain, package, and handle registries have not been checked for all candidates. Do not purchase or present a final name until completing that process in chosen markets.

Selection criteria: comprehension, recall, pronunciation, dictation, category distinctiveness, availability, and ability to extend beyond Scrum. A beautiful name confused with another manager fails the filter.

### 1.4 Personality and voice

| Attribute | Expression | Avoid |
| --- | --- | --- |
| Clear | Verb, object, outcome; familiar labels | Ornamental jargon and ambiguous phrases |
| Calm | Discreet confirmations; recoverable errors | Artificial urgency or blaming the person |
| Capable | Explains permissions, limits, consequences | “Magical,” “infallible,” unsupported productivity claims |
| Open | Accessible documentation and visible decisions | Implying self-hosting eliminates every dependency or risk |
| Human | “You,” “your team,” simple language | Confusing client and author, hiding provenance, or presenting an autonomous agent as human |

Initial language: neutral Spanish with reviewed English translation. The Spanish UI uses **tarea**; “ticket” is a technical-documentation synonym. Keep “sprint” as a familiar term, explained on first use. Do not alternate “cycle” and “sprint” for the same object.

| Situation | Proposed copy |
| --- | --- |
| Empty project | “Your project starts with a task. Add the first thing you want to move forward.” |
| Create | “Create task” |
| Save pending | “Saving changes…” |
| Conflict | “This task changed while you were editing. Review the current version before saving.” |
| Offline | “We couldn't save your changes. We've kept this draft so you can try again.” |
| Agent connection | “Choose which projects this connection can read or modify.” |
| Revoked grant | “Connection revoked. New requests from this agent will be rejected.” |
| Close sprint | “There are 4 unfinished tasks. Choose whether they return to the backlog or move to another sprint.” |
| Proposed batch | “12 tasks will be created and 3 updated. Review the changes before applying them.” |

### 1.5 Proposed visual identity

**Direction:** restrained surfaces, readable content, clear states, and a color signal for actions. Avoid saturating a work tool with intense gradients, constant animation, or chatbot aesthetics.

**Conceptual symbol:** two parallel strokes moving forward and converging into an open shape, suggesting shared work paths. It must work as a distinctive single-color form; do not depict a literal board or copy reference-product symbols.

**Logo development brief:**

- Create editable vector SVG wordmark and symbol.
- Horizontal, symbol-only, monochrome, and reversed variants.
- Test recognition at 16, 24, and 32 px before adding detail.
- Define clear space from symbol stroke/height and minimum size after testing.
- Avoid convergence/arrows reading as an indistinguishable generic checkmark.
- Deliver favicon, app icon, repository cover, and usage guide after naming is fixed.

This direction is now made concrete in the [v0.1 asset kit](06-brand-assets-guide.en.md). Graphics and illustration are produced; logo/name remain proposals pending final approval.

### 1.6 Palette and tokens

Own proposed palette, pending complete component QA. Evaluate color pairs, not isolated colors.

| Token | Light theme | Dark theme | Use |
| --- | --- | --- | --- |
| `background` | `#F8FAFC` | `#0F172A` | Application background |
| `surface` | `#FFFFFF` | `#1E293B` | Panels and cards |
| `text-primary` | `#0F172A` | `#F8FAFC` | Primary text |
| `text-secondary` | `#475569` | `#CBD5E1` | Readable metadata |
| `brand-action` | `#0F766E` | `#5EEAD4` | Primary action and functional brand |
| `on-brand-action` | `#FFFFFF` | `#0F172A` | Text on primary button |
| `control-border` | `#64748B` | `#94A3B8` | Input/control boundaries requiring contrast |
| `divider` | `#E2E8F0` | `#334155` | Decorative separation; never sole control signal |
| `danger-text` | `#B91C1C` | `#FCA5A5` | Error/destructive action with text/icon |
| `warning-text` | `#92400E` | `#FDE68A` | Warnings on validated surface |
| `focus` | `#1D4ED8` | `#93C5FD` | Visible ring; validate against each surface |

Task status and priority use their own semantic tokens and text labels. Brand color does not simultaneously mean “completed” and every action. Calculated contrast for this proposal: light primary text on white surface **17.85:1**, light secondary text on background **7.24:1**, light primary button **5.47:1**, dark primary text on surface **13.98:1**, dark secondary text on surface **9.85:1**, dark primary button **12.07:1**. This verifies those solid pairs, not an implemented interface; hover, disabled, error, and focus states require separate review.

### 1.7 Typography, composition, and motion

- **Interface font:** Inter candidate with system sans-serif fallback. Self-host font files with reviewed license/notices; avoid loading Google Fonts on every page request.
- **Hierarchy:** 16 px mobile base; 14–16 px desktop lists according to density; page headings 24–32 px. Secondary metadata no smaller than 12 px and never sole carrier of information.
- **Data:** tabular numerals for points, dates, and counters; monospace reserved for IDs/technical snippets.
- **Spacing:** 4/8/12/16/24/32/48 scale; initial radius 8 px controls and 12 px panels.
- **Icons:** one consistent family, such as Lucide, with accessible labels. No emoji as navigation structure.
- **Motion:** 120–200 ms for common feedback; honor reduced motion and never delay actions. Animate transform/opacity, not decorative content rearrangements.
- **Brand imagery:** work diagrams and real screenshots when available; no fabricated testimonials, figures, or screens suggesting an already-launched product.

A UX/UI design guide was consulted as support; automatic suggestions were filtered against the product. A single-column landing layout or editorial typography should not be applied unquestioningly to a dense work board.

### 1.8 Messaging and landing page

**Proposed hero once a usable version exists:**

> **From idea to work in motion.**  
> Organize projects, tasks, and sprints in an open workspace. Work on the web, connect your agents, and retain control of your installation.

Production primary action: **Use Rielia**, with actual access. Install on my server and View the code are subordinate alternatives with verified destinations. Do not use a waitlist or a CTA tied to a launch stage.

Three messaging pillars:

1. **Clarity to move forward:** backlog, board, and sprints on the same work.
2. **Agents with context and permissions:** concrete actions and reviewable activity.
3. **Open to make it yours:** code, export, and installation guide.

Landing structure: promise → real three-step journey → tasks/sprints → MCP demonstration → installation → documentation/community → release status and limits. Screenshots must come from the delivered app.

### 1.9 Launch and brand validation

1. Choose two finalist names; test comprehension, recall, and dictation with target users.
2. Check commercial uses, trademarks in intended markets, domains, handles, and package names; record results and search scope.
3. Fix name, verbal guide, tokens, and symbol; then produce final assets.
4. Publish README and a real journey demo: plan → tickets → agent → review → sprint closure.
5. Invite a small group of regular agent users; observe installation and first session.
6. Make the single public launch after technical and operational checks pass; subsequently publish improvements and a changelog without invented dates.

Initial brand success: people identify work management, remember the name, and understand agent connection without believing the product itself executes code.

### 1.10 Approved interaction references and own identity

On October 24, 2026, the user approved the combination developed in the [UI/UX development guide](04-ui-ux-development-guide.en.md): Linear for work structure, Asana for collaborative clarity, Todoist for mobile, Trello for Kanban, and Plane/ClickUp for advanced views within planned scope.

That decision guides composition and interaction. Rielia retains this document's provisional name, voice, and visual system; it does not adopt those brands' logos, colors, or distinctive expression. Reference approval is not final approval of palette, typography, logo, or mockups.

Agents use this branding guide for tokens/microcopy and the UI/UX guide for patterns/review criteria. Maintain coherent identity across desktop, mobile, empty states, errors, and agent activity.

### 1.11 Tangible kit and marketing landing

A v0.1 proposal includes logo, symbol, light/inverse/monochrome variants, icons, ES/EN banners, social cards, editorial illustration. See the [Asset guide](06-brand-assets-guide.en.md) and [gallery](assets/index.en.html) for files, dimensions, provenance, usage. It is not final name/logo approval or verified trademark availability.

The landing is a required product deliverable for public marketing; copy, structure, stable CTA, capture conditions are defined in the [dedicated plan](05-landing-page-plan.en.md). Conceptual banners are labeled; do not use mockups as evidence of an available app. Retain identity/voice in both languages.

### 1.12 Authorship language and agent participation

Communication distinguishes **using your agent on your behalf** from **adding an autonomous agent with its own identity**. MCP is the channel, not a new author by default. Full model: [Product §2.5](01-product.en.md#25-identity-and-authorship-of-agent-actions).

| Situation | Message |
| --- | --- |
| Personal connection | Manage tasks with your agent, on your behalf. |
| Delegated creation | Luis created this task through Cursor. |
| Autonomous registration | Add an autonomous agent with its own name and permissions. |
| Autonomous creation | Rielia Builder · Agent created this task. |
| Different creator and assignee | Created by Luis through Cursor. Assigned to Rielia Builder · Agent. |

Do not replace Luis with Agent when his connection acts on his behalf, or present an administrator as the author of autonomous-agent work. Do not pass an agent member off as human. Visible channel does not imply manual approval for every action.

The landing communicates one launch and continuous improvements. Use Rielia is its primary CTA; updates describe published changes without a waitlist or access calendar. Name/logo and previous compositions remain proposals; correct conflicting authorship examples when preparing final assets.
