# Rielia — Landing page design guidelines

**Current decision — October 24, 2026:** one launch followed by continuous updates. Copy distinguishes agents acting on behalf of users from autonomous agents with their own identity.

**Revision:** October 24, 2026.  
**Deliverable:** planning for agents; design and implementation follow later.  
**Status:** recommended direction based on Mobbin; not an approved final design. Rielia remains a working name.  
**Español:** [Lineamientos de diseño de la landing page](05-landing-page-plan.es.md).  
**Context:** [Product](01-product.en.md) · [App UI/UX](04-ui-ux-development-guide.en.md) · [Branding](03-branding.en.md) · [Architecture](02-architecture-technical-plan.en.md) · [Asset inventory](06-brand-assets-guide.en.md).

## 1. Scope and authority

This document defines how Rielia's future landing page should look, what it should communicate, and how it should behave. It lets an agent prepare the design and, once assigned development, implement it without improvising a generic SaaS template.

The requested deliverable is documentation. Previously created local HTML pages and compositions are not the selected design, approved references, or a foundation agents must reproduce. This brief replaces the previous landing direction. Existing assets are proposals to evaluate by purpose; their existence does not require using them.

The approved reference combination for the **application** remains in the UI/UX guide. The **marketing website** references researched here are a new recommendation. Product defines features and continuous evolution; branding defines identity; architecture defines contracts. This document specifies public presentation without expanding those scopes.

## 2. Landing research in Mobbin

Website sections were searched in Mobbin and their images inspected on October 24, 2026. They capture specific versions, including historical ones; they are not claimed to represent current websites. Observations describe visible composition, not measured conversion, accessibility, or performance outcomes.

| ID | Reference and visible observation | What to adapt for Rielia | What to leave behind |
| --- | --- | --- | --- |
| LPR01 | [Linear — hero](https://mobbin.com/sites/sections/40a46191-a57a-4bab-9a92-94fc14cad817). Centered headline, brief explanation, one prominent action, and a wide product view underneath | Message → action → product evidence hierarchy. The board explains the category before any decoration | Dark background, gradients, reference-site promotions, or another product's promises |
| LPR02 | [ClickUp — product section](https://mobbin.com/sites/sections/2e29fbe7-7bdd-4574-8b48-138f7770994f). Copy on the left, interface on the right, categories above the block | Pair each benefit with a specific view; use two columns in the planning section | Mandatory tabs, multiple modules, pink/purple identity, or competitor replacement claims |
| LPR03 | [Linear — capabilities](https://mobbin.com/sites/sections/2754727c-0d9b-426e-8f87-f3bf560afda4). Issues, cycles, projects, and backlog modules with small visual examples | Name recognizable capabilities and support them with specific evidence | Copying the six-card grid, showing unimplemented capabilities, or making every feature decorative |
| LPR04 | [Height — Code to Task](https://mobbin.com/sites/sections/4661d2d5-6de0-4c89-abe6-79f1d910ef02). Message focused on a specific action, contextualized by an editor view | Explain the agent connection with a sequence and a task/activity example | Claiming TODO extraction, code execution, or unplanned capabilities. The image does not demonstrate MCP support |
| LPR05 | [Campsite — hero](https://mobbin.com/sites/sections/5b4cf5f9-0ea7-4e3b-be27-9ec83d68b42a). Light background, short headline, dominant CTA, product below | Economy of elements and enough space for content to breathe | Video messaging, trial terms, funding announcement, or competitor identity |

**Recommended combination:** LPR01/LPR05 organize the opening; LPR02 guides explanatory sections; LPR03 helps make capabilities concrete; LPR04 guides the agent workflow narrative. Each reference contributes a purpose within one original visual system.

Results about aviation, corporate pages, and other services' integrations were discarded. A query name does not make them task management landing pages. Use the table links as sources, not temporary Mobbin image URLs. Agents should study references without copying logos, copy, or screenshots into the product.

## 3. Visual direction and message

**Direction:** a clear, calm page centered on the product. Light background, strong headlines, teal actions, few surfaces, and recognizable work examples. Character comes from language, rhythm, and the relationship between human planning and agents.

**Primary audience:** independent developers and small teams that plan projects and work with agents. Self-hosting is a second reason to choose the product. A collaborator unfamiliar with MCP must still understand the page.

**Promise:** organize projects, tasks, and sprints with shared context for people and agents while retaining control over work and deployment.

Within the first few seconds, visitors should identify what it is, who it serves, what the agent connection adds, available features, and how to get started.

| Element | Guideline for later design |
| --- | --- |
| Background | Light `background` `#F8FAFC`; white `surface` for product views. Avoid changing background in every section |
| Text | `text-primary` `#0F172A`, `text-secondary` `#475569`; use branding tokens |
| Action | Teal `#0F766E` with white text. Mint `#5EEAD4` as a limited accent, never small text on white |
| Typography | Inter candidate and system sans fallback; one family. Monospace only for IDs or technical examples |
| H1 | Starting point: 56–64 px desktop, 44–48 tablet, 34–40 mobile; line height 1.08–1.15. Adjust with actual copy and zoom |
| Other text | H2 36–40 px desktop / 28–32 mobile; body 18 / 16 px with line height 1.5–1.65; helper text 14 px |
| Widths | Maximum container 1200 px; hero copy up to 800 px; reading paragraphs around 55–70 characters per line where space permits |
| Rhythm | Branding scale, extended to 64/80/96 px for marketing. Section gaps 80–96 px desktop and 48–64 mobile; internal gaps 16–32 px |
| Surfaces | Initial radius 8 px controls and 12 px views; subtle borders and at most one soft shadow on the main frame |
| Icons | One consistent SVG family; support labels rather than replace explanations |

Light theme is the first landing's baseline. Do not add a theme switcher or dark band solely for appearance. Screenshots reflect the real app and remain legible within their frame.

## 4. Page structure and section composition

Journey: **understand → recognize the work → understand the agent connection → assess control and usage → take the next step**.

Documentary outline: navigation → hero/board → backlog/sprint → agents → open source/self-hosting → optional updates → FAQ → final action/footer. A problem section that repeats the hero or a wall of features does not improve the journey.

### S00. Navigation

Logo/name on the left; Product, Agents, Open source, and Questions link to sections. Visible Español / English and one stable primary CTA. Indicative height 72 px desktop / 64 mobile. If sticky, use a solid surface and reserve space; anchors must not hide headings or focus.

On mobile: brand, language, and Menu; links and CTA inside the menu. Switch to this pattern before items become cramped. Sign in, documentation, and repository appear only with real destinations. Do not add pricing, sales, or a mega menu without content to justify them.

### S01. Hero with product as the focal point

**Goal:** identify category and difference without an abstract introduction.

Centered composition: category → H1 → paragraph → action → wide board view. The image goes **below** the message rather than competing in another column. References LPR01/LPR05.

Proposed production landing copy:

> **Open-source task and sprint management**
>
> **Your team and your agents, working from one shared plan.**
>
> Organize projects and sprints. Manage tasks from the web or through your agent while retaining your authorship and team context.
>
> **Use Rielia**
>
> Open source. Shared work. Continuous improvements.

The action opens the actual application entry; if a session is required, continue through login and return to a valid destination. How it works may link to S02 as a subordinate secondary action. Code and installation belong in their section. Internal design annotates pending destinations; publish no empty link or access-stage variant.

**View:** one project, a board with named statuses, legible tasks, and assignee/priority context. Front-facing frame, without 3D perspective, floating windows, or overlaid charts. Until a real screenshot exists, design may specify a diagram labeled **Interface concept — product in development**, without presenting it as available software.

On mobile, prioritize message and action. Use a real mobile screenshot when available, or a simplified and labeled conceptual detail. Do not shrink the entire desktop interface into an unreadable thumbnail. No essential explanation depends on reading the image.

### S02. Planning: from backlog to sprint

**H2:** From backlog to your next sprint, with the work clearly defined.

**Copy:** Prioritize what is next, set a goal, and gather the tasks your team can take on. Keep assignees, priorities, and context in the same project. Production copy must match actually implemented capabilities.

Two columns on desktop, approximately 40% text / 60% sprint planning view. Short list under the copy: tasks and subtasks; backlog and board; sprint goal and history. References LPR02/LPR03. Do not turn it into three identical cards.

The view shows a goal and associated tasks. Avoid velocity, calendar, dependencies, or roadmap unless present in the communicated version. On mobile: H2, explanation, benefits, and view, in that order.

### S03. Agents: on your behalf or with their own identity

**H2:** Work with your agent while keeping your authorship.

**Copy:** Connect your development agent through MCP to manage tasks on your behalf. If your team uses autonomous agents, add them with their own identity and permissions. Explain MCP once as a protocol for authorized project access.

The primary mode is personal. Show three simple steps:

1. **Connect on your behalf:** settings state Acts as Luis.
2. **Manage your tasks:** client reads, creates, or updates within granted projects and permissions.
3. **Keep the context:** task creator is Luis; history says Luis created this task through Cursor.

Below, briefly explain autonomy: An autonomous agent participates under its own name, can create tasks and receive assignments, and always carries an Agent label. Separate example: Rielia Builder · Agent created this task. The registering administrator is not the ticket author.

One task/history visual compares both cases and separates creator from assignee. Personal agent use creates no extra member or automatic assignment. Reference LPR04: an action and outcome, without a decorative terminal. Client/connection is provenance, not a second person in delegated mode.

Do not simulate chat, executable calls, or code execution. Rielia organizes work; agents develop in their own environment. Only show tested clients, permissions, and transports, without promising universal manual approval. On mobile, stack sequence/comparison with explicit labels. Any future video is optional with a text alternative.

### S04. Open source and deployment control

**H2:** Your work, on an installation you control.

Explain the open-source project, self-hosting, available export, and operational documentation. Link to code/installation only when available.

Copy and three verifiable points, without another grid. Docker/Dokploy may appear in a technical note; do not lead with commands. Explain that self-hosting involves server maintenance, updates, and backups. Do not promise zero cost or maintenance.

### S05. Product updates — optional

Small block: Rielia improves with you, with New features and continuous improvements for the way you work. View updates links to a changelog containing published changes.

Show this block only with real content. Do not include launch calendars, version-based access, promotional roadmaps, promised dates, or waitlists. Without updates, omit the block instead of inventing content. It is not another dominant section.

### S06. Frequently asked questions

Reading width around 760 px. Five initial questions, brief answers, and accessible controls if using an accordion:

| Question | Answer content |
| --- | --- |
| How do I start? | Explain actual access through Use Rielia and enabled login providers; own-installation alternative with a verified guide |
| Does Rielia execute code for me? | The agent develops in its own environment; Rielia organizes tasks and provides authorized MCP access |
| Can I install it on my server? | Link verified self-hosting requirements/guide; explain maintenance and backups |
| Will it work on mobile? | A responsive web app is planned; do not promise native apps |
| Who is the author of tasks created through MCP? | Personal connection: Luis with visible provenance. Registered autonomous agent: own author with Agent label. Document compatible clients after testing |

State that the name is provisional while naming remains open, within project status. Remove that notice once identity is finalized.

### S07. Final action and footer

A clear plan for what you will build, followed by the Use Rielia CTA. Light background and separator, without another dominant illustration or artificial urgency.

Footer: brand, one-line description, language, and real documentation, repository, contact, and applicable policy links. Do not invent a company, address, users, customers, or testimonials. Product and status provide evidence until social proof exists.

## 5. Conversion, states, and microcopy

One stable primary CTA: **Use Rielia**. Communicate the product and continuous improvements without segmenting visits by an access calendar.

| Action | Hierarchy | Destination |
| --- | --- | --- |
| Use Rielia | Primary in navigation, hero, closing | Actual app entry; login when required |
| How it works | Optional secondary | S02 and product journey |
| Install on my server | Contextual in S04/footer | Verified guide and package |
| View the code | Contextual in S04/footer | Actual public repository |
| Get updates | Optional in footer | Ongoing updates subscription without early-access promises |

One primary action per block. Do not give equal emphasis to trying, installing, viewing code, and subscribing; no entry popups or reading gates. Verify destinations before publishing. Drafts remain design documentation rather than a public waiting page.

If subscription is enabled: Your email label, Get updates button, purpose, privacy. Design empty, invalid, submitting, received, recoverable error, pending/expired confirmation, and unsubscribe. Generic response: If applicable, you will receive an email to confirm your request. Submission is not confirmed subscription. Without email/backend, omit active form; future contract in section 10.

## 6. Responsive behavior and interactions

| Review range | Expected behavior |
| --- | --- |
| 320–767 px | One column, 16–24 px margins, no fixed hero height, CTA at least 44 px tall; no page-level horizontal scrolling |
| 768–1023 px | 32 px margins; columns only if copy/views remain legible. Compact menu when navigation does not fit |
| From 1024 px | Centered container, margins at least 32 px, two-column explanatory sections, centered hero with view below |

These are composition ranges, not device identification. Review 320/390/768/1024/1440 px, landscape, and enlarged text, in ES/EN. Do not size buttons for one translation's length.

Links navigate; buttons act. Mobile menu has visible close, Escape support, and focus return. If modal, contain focus and block background interaction; if expanded in normal flow, preserve natural reading order. FAQ announces expanded state; anchors leave destination headings visible.

Use 120–200 ms feedback without moving adjacent elements; respect reduced motion. No scroll hijacking, parallax, custom cursor, automatic carousels, or content hidden by failed animations. Main navigation and content remain available when interactive enhancement fails.

## 7. Asset brief for later production

| Asset | Purpose and specification | Condition |
| --- | --- | --- |
| Horizontal brand/mark | SVG, light and monochrome variants; legible in header and favicon | Evaluate v0.1 kit; do not assume approval or redesign just to fill the hero |
| Main board | Own front-facing screenshot; initial reference 1600×1000 and specific mobile variant | Sanitized and linked to release; labeled concept until then |
| Planning | Sprint goal and tasks, legible crop | Capability described in S02 and actual delivery status |
| Agent-assisted authorship | Compare Luis through Cursor / Rielia Builder · Agent with separate creator/assignee | No secrets or invented capabilities; supports S03 |
| ES/EN social image | Working format 1200×630; brand, promise, and identified view | Check destination crops; existing variants are candidates |
| Optional illustration | Human/agent work convergence, only if it adds explanation | Not required in first version; does not replace product evidence |

Headings and CTAs are selectable text, never a complete rasterized banner. Keep selected assets local with dimensions, provenance, license, and release. Text-free graphics can be shared across languages. Do not load every resolution or use competitor screenshots as your own product.

## 8. Rules against generic AI landing design

| Generic signal | Required correction |
| --- | --- |
| Revolutionize productivity without context | Name tasks, backlog, sprint, and the supported action |
| Three identical cards in every block | Compose by function: hero, editorial view, sequence, list, FAQ |
| Gradients/glow/spheres as the focal point | Hierarchy and visible work; color for action and status |
| Fictional dashboard full of metrics | Coherent tasks, labeled concepts, purposeful data |
| Everything depends on AI | Explain app/agent roles and permission boundaries |
| Copying five references at once | One typography, color, spacing, radius, and control system |
| Filler figures, testimonials, and logos | Omit until evidence and permission exist |
| Image controls that appear functional | Identified screenshot; no simulated active controls |

Each section answers a different question. Simplify any section removable without losing visitor information or a decision. References justify structure rather than decoration.

## 9. Planned accessibility, SEO, and performance

Target WCAG 2.2 AA. Check normal text contrast ≥4.5:1, visible focus, keyboard, headings, labels, image alternatives, and zoom. Do not announce decoration as information. These are acceptance criteria, not achieved certification. [W3C reference](https://www.w3.org/WAI/WCAG22/quickref/).

Plan `/es` and `/en` within `apps/web`, with title, description, canonical, social image, visible language control, and reciprocal alternatives. Public-only sitemap; private routes retain server authorization. Configure final domain/URLs when available. [Google Search: localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions), [Next.js: metadata and OG](https://nextjs.org/docs/app/getting-started/metadata-and-og-images).

Prioritize content/first image, reserve dimensions, optimize formats, and defer lower media. Avoid autoplay video and decorative scripts. Targets to measure after implementation: LCP ≤2.5 s, INP ≤200 ms, and CLS ≤0.1 at the 75th percentile of visits, separating mobile/desktop; lab tests help before traffic exists. [Web Vitals](https://web.dev/articles/vitals).

Proposed minimum measurement: visits, CTA clicks, documentation opens, and confirmed subscription if enabled. No emails, tokens, or project data in events. Resolve provider and consent before enabling measurement; do not add a purposeless banner.

## 10. Technical boundaries and future lead capture

The landing will use the planned Next.js frontend and shared tokens. It requires no separate hosting and does not change auth, workspace, API, or MCP. Preserve Docker/Dokploy and technical contracts.

If lead capture is developed: `POST /api/v1/marketing/leads` validates email/language, deduplicates, limits abuse, and responds generically. Backend stores a pending request and random hashed expiring token; existing worker sends SMTP confirmation. GET does not change subscription: confirmation/unsubscribe are explicit actions. Include idempotent retries and recovery.

Store pending/confirmed/unsubscribed state, purpose, text version, and necessary timestamps. Leads are accessible only to installation administration, not workspace roles/MCP/exports. Subscription creates no account.

Proposed operational values, to review before activation: token 24 hours; pending requests purged after 7 days; confirmed retention reviewed 90 days after first launch or when consent is withdrawn. These are operational hypotheses. Define real operator/contact, purpose, policy, and provider before collecting data.

## 11. Agent deliverables and acceptance

When assigned design: content wireframe and desktop/mobile specification traceable to S00–S07 and LPR01–LPR05. Confirm actual features/links and select screenshots. When assigned implementation: apply design and deliver review evidence. A planning request is fulfilled with documentation, without advancing code, publication, or asset production.

| ID | Verifiable criterion |
| --- | --- |
| LP01 | At least 4 of 5 target visitors identify category, difference, usage, and next action without help; provisional initial threshold |
| LP02 | Hero has message, stable CTA, and identified own view; content remains prioritized on mobile |
| LP03 | One launch with continuous updates; no access calendar or waitlist; implemented capabilities only |
| LP04 | Agents: Luis authors delegated actions; autonomous agent has own identity; separate creator/assignee and visible provenance |
| LP05 | Review ES/EN at 320/390/768/1024/1440 px, zoom/keyboard; no overflow, overlaps, or hidden headings |
| LP06 | Menu, FAQ, language, and CTA work by keyboard/touch; clear focus, states, and errors |
| LP07 | Coherent identity; review against section 8 and record adapted patterns/original decisions |
| LP08 | Assets have provenance/dimensions; sanitized screenshots, labeled concepts; no competitor resources in production |
| LP09 | Valid links, canonical, languages/metadata; measure performance recording environment and method |
| LP10 | With capture: verify submission, errors, confirmation, unsubscribe, access. Without capture: no form pretending to work |

Keep backlog IDs: **T30** asset selection/integration; **T31** ES/EN landing; **T32** optional capture; **T33** SEO/measurement; **T34** review and eventual launch. Linked to P35–P38 and US21–US25; T35 defines identity/authorship. This brief does not mark them complete.

Resolve at development start: final naming/identity, implemented capabilities, domain, repository/access, screenshots, and capture. Defaults meanwhile: light theme, centered hero, at most three product views, Use Rielia CTA, and continuous-update communication.
