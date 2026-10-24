# Rielia — Product plan

**User decision — October 24, 2026:** one public launch with continuous updates; personal MCP acts on behalf of its user, while autonomous agents have their own identity.

**Marketing and assets addition:** October 24, 2026; landing and v0.1 kit added to scope.

**Plan and research date:** October 18, 2026.  
**UI/UX direction update:** October 24, 2026; stack and brand availability research not repeated.  
**Status:** planning proposal; does not represent an implemented application.  
**Working name:** Rielia; commercial, trademark, and domain availability unconfirmed.  
**Audience:** founder and product, design, engineering, and community contributors.

**Spanish version:** [Plan de producto](01-producto.es.md).  
**Companion documents:** [Architecture and technical plan](02-architecture-technical-plan.en.md) · [Brand strategy and development](03-branding.en.md) · [UI/UX development guide](04-ui-ux-development-guide.en.md) · [Landing](05-landing-page-plan.en.md) · [Assets](06-brand-assets-guide.en.md).  
**Agent entry point:** [START HERE](00-START-HERE.md).

## Contents

- [0. Quick overview and recommended decisions](#0-quick-overview-and-recommended-decisions)
- [1. Product strategy](#1-product-strategy)
- [2. Functional scope and continuous updates](#2-functional-scope-and-continuous-updates)
- [3. User experience and responsive design](#3-user-experience-and-responsive-design)
- [4. Stories and acceptance](#4-stories-and-acceptance)
- [5. Validation and metrics](#5-validation-and-metrics)
- [6. Open source and sustainability](#6-open-source-and-sustainability)

---

## 0. Quick overview and recommended decisions

Build an open-source, self-hostable platform for projects, tasks, and sprints that can be used through a web interface or development agents under the same permissions and rules.

The opportunity is to combine **clear planning, control over data, and practical collaboration between people and agents**. Trello, Linear, and ClickUp provide the functional horizon; attempting to reproduce them completely in the first version would make a coherent experience difficult to deliver.

| Decision | Recommendation | Main reason |
| --- | --- | --- |
| Initial audience | Independent developers and small teams using agents | Tests the workflow motivating this project |
| Complete product | Work management with Kanban, Scrum, and alternative views | Covers the requested scope without imposing Scrum on everyone |
| Work core | Projects, tasks, basic collaboration, sprints, and terminal MCP | Already supports managing a real project from start to finish |
| Architecture | Next.js + NestJS in a TypeScript monorepo | API and domain independent of the interface; reuse through MCP |
| Backend | Modular monolith and an asynchronous job process | Avoids microservices while retaining useful operational separation |
| Identity | Better Auth hosted inside the backend, subject to an initial spike | Fits self-hosting and the current direction of the Auth.js ecosystem |
| Data | PostgreSQL + Prisma; PostgreSQL-backed queue | Reduces required VPS services |
| MCP | Verified local `stdio` adapter and remote OAuth access | Transports for one product, without launch stages |
| Deployment | Versioned Docker images, Dokploy, and private PostgreSQL | Portability and reproducible recovery |
| Interface | Responsive web for phones, tablets, and desktops; Spanish and English | Full access without initially building native apps |
| Brand | Clarity and progress territory; Rielia as a provisional candidate | Communicates order without limiting the product to AI or Scrum |
| Proposed license | Apache-2.0 | Prioritizes adoption and contribution; decide before publishing |

**Expected outcome:** a person can create a project, turn ideas into tickets, prioritize, plan a sprint, delegate to an agent, review changes, and close work with an understandable history.

### 0.1 Document scope

The original master plan covered the three requested deliverables:

1. **Product:** problem, users, capabilities, UX, priorities, stories, metrics, and validation.
2. **Architecture and technical plan:** decisions, data, identity, API, MCP, Docker/Dokploy, operations, and engineering backlog.
3. **Branding:** positioning, territories, names, voice, visual direction, and launch messaging.

These are now separate companion documents. This product document retains the overall decision context; detailed architecture and brand work live in their respective files.

The files `product-development-strategist.md` and `development-planning-architect.md` were used as **methodological references**. Their internal instructions are distinguished from the user's requirements: they do not authorize implementation, deployment, purchases, or new external actions. Their evidence, simplicity, traceability, and verifiable acceptance principles informed this plan.

This work is planning. No application has been built, capacity tested, VPS configured, or brand published.

### 0.2 Evidence and assumptions

| Type | Content | Consequence |
| --- | --- | --- |
| Confirmed by the user | Personal and third-party use; open source; tasks and sprints; social login; VPS with Dokploy; Docker; PostgreSQL or another DB in Dokploy; MCP; responsive | Baseline constraints |
| Planning assumption | New project, initially maintained by one person or a small team | Small architecture and vertical delivery |
| Product assumption | First users: independent developers and teams of 2–15 people | Simplify hierarchy and onboarding; validate the segment |
| Deployment assumption | One installation can contain multiple isolated workspaces | Multiuser and multitenant data model from the outset |
| Access assumption | Open, invitation-only, or closed registration configured per installation | Supports a personal instance and an open installation |
| Language assumption | Spanish and English, without automatic translation of user content | Internationalization foundations from the start |
| Unknown | Current VPS resources, budget, availability, and target date | No promised schedule or measured capacity |
| Unknown | Launch countries, local obligations, and monetization policy | Review before opening a public service |
| Researched | Linked public documentation, consulted on October 18, 2026 | Supports documented capabilities; does not prove compatibility in this project |

Recommendations are reasoned design decisions, not interview findings, benchmarks, or integration test results.

## 1. Product strategy

### 1.1 Thesis and problem

**Hypothesis:** people combining human development with agents need a shared place where the plan and work status remain understandable, editable, and verifiable.

Today they may use a task manager, repositories, Markdown, and separate conversations. The cost appears when copying context, losing decisions, duplicating tickets, or updating statuses manually. This problem is inferred from the user's stated need; it still needs validation with other people.

**Main job:** “When I have an idea or a set of changes, I want to turn them into organized, delegable work so I can move forward without losing context or control over decisions.”

**Vision:** an open workspace where people and agents share projects, tasks, priorities, and outcomes.

### 1.2 Users, actors, and needs

All the following segments are hypotheses, except the founder as the explicitly stated first user.

| Actor | Context, need, and current alternative | Barrier or trigger | Priority and impact |
| --- | --- | --- | --- |
| Independent developer | Multiple projects; needs to know what to do and delegate; uses tickets, notes, or Markdown | Keeping the board updated costs more than writing a list | Primary: quick capture, personal mode, MCP, and export |
| Small development team | Shares backlog and deliveries; uses Linear, Trello, ClickUp, or GitHub Issues | Priority changes, incomplete tickets, and scattered context | Primary: roles, sprints, comments, and history |
| Product or project lead | Prioritizes and reviews scope; uses documents and work views | Needs to understand blockers and changes without reading every conversation | Primary: backlog, sprint goal, filters, and reports |
| Occasional collaborator | Reviews or comments on specific projects | Excessive access or complex navigation | Collaboration: limited permissions and direct links |
| Installation administrator | Operates Dokploy, backups, users, and upgrades | Fear of losing data or breaking an upgrade | Primary: documented installation, recovery, and diagnostics |
| Delegated MCP client | Tool used on behalf of a person | Confusing channel and author | Human author with visible provenance |
| Autonomous agent | Agent-type member with external execution and own identity | Needs its own permissions and accountability | Work actor: attributable tasks, comments, assignments |
| Open-source contributor | Wants to fix or extend the project | Difficult setup and unclear contribution rules | Primary: reproducible environment and documented modules |

The user, administrator, and potential payer may be different people. A buyer is not required in the first stage.

### 1.3 Alternatives and lessons

| Alternative | Relevant documented fact | Pattern to adopt | Our design decision |
| --- | --- | --- | --- |
| Trello | Provides boards and views such as table, calendar, and timeline; supports automation | Immediate visual understanding and simple rules | A board is a view of tasks, not another database |
| Linear | Documents cycles and an MCP for reading and modifying objects such as issues, projects, and comments | Fast ticket workflow, cycles, and agent access | Keep interactions fast with clear public contracts |
| ClickUp | Documents sprints, views, custom fields, and an official MCP | Flexibility and multiple ways to see the same work | Add flexibility progressively without showing everything initially |
| Plane | Presents self-hosting options | Study the actual cost of installing and upgrading an alternative | Compare before investing; self-hosting is not an exclusive differentiator either |
| GitHub Issues + Markdown | Work alternative to assess with users; its full capabilities are not inventoried here | Proximity to code and easy document versioning | Import and repository links before bidirectional synchronization |
| Notes and spreadsheets | Hypothetical low-friction substitute | Freeform, fast capture | Initially require only a title and project to create a task |

Sources: [Trello views](https://trello.com/views), [Trello automation](https://support.atlassian.com/trello/docs/automation-overview/), [Linear cycles](https://linear.app/docs/use-cycles), [Linear MCP](https://linear.app/docs/mcp), [ClickUp sprints](https://help.clickup.com/hc/en-us/articles/6310087298327-Monitor-and-report-on-your-sprints), [ClickUp fields](https://help.clickup.com/hc/en-us/articles/6330455628439-Show-Custom-Fields-in-tasks-and-views), [ClickUp MCP](https://help.clickup.com/hc/en-us/sections/37731627018647-ClickUp-MCP), and [Plane](https://plane.so/).

**Strategic inference:** “we have MCP” is not a sufficient differentiating promise. The bet is the quality of the complete workflow, understandable permissions, traceability, and an installation you can maintain yourself. No complaints or preferences are attributed to competitors' users without research.

### 1.4 Three possible routes

| Route | Value | Cost and risk | Assessment |
| --- | --- | --- | --- |
| General manager for any department | Broad potential market | Large functional surface and many different workflows | Horizon, not entry point |
| Manager for developers and small teams with agents | Matches personal use and a specific need | Competition exists; the benefit must be demonstrated | **Recommended** |
| MCP layer over an existing manager | Fast automation validation | Less product control and dependence on another platform | Alternative if saving development time becomes the dominant goal |

Before building the complete product, run a real-project exercise in a self-hostable alternative. If it sufficiently solves the need, compare contributing there with maintaining a separate product. The proposed decision remains to build, given the explicit objective of creating your own application and integrated experience.

### 1.5 Product principles

1. A task represents the same work in list, board, sprint, API, and MCP.
2. Capture requires little; planning supports depth.
3. Scrum is optional: a project can use Kanban without sprints.
4. Agents act with permissions and attribution; they do not receive implicit administrator access.
5. The interface shows who changed what and supports recovery from common mistakes.
6. Data can be exported and an installation restored.
7. Advanced features appear when they help address a concrete need.

## 2. Functional scope and continuous updates

### 2.1 Definition of “core”

The objective is to cover the essential work-management flows present in the references, not to promise parity with all their products, commercial plans, integrations, or AI capabilities.

The product has **one public launch followed by continuous updates**. The landing does not expose access stages or a sequence of launch versions.

Engineering dependencies retain internal work batches without turning them into public stages:

- **B0 — Foundations:** decisions, technical spikes, and contracts.
- **B1 — Work core:** projects, tasks, collaboration, sprints, local MCP, and both agent identity modes.
- **B2 — Readiness and complementary capabilities:** isolation, public operations, remote MCP, and the remaining agreed initial scope.
- **B3 — Continuous evolution:** customization, automation, and integrations prioritized by use.

Initial scope combines B1/B2 and their technical checks; B3 organizes subsequent improvements. B labels do not appear on the landing or imply separate launches. Applicable security, authorship, and recovery controls, T24, and T34 must pass before public opening. Later updates ship when verified without recasting the product as another launch stage.

### 2.2 Capability map

| ID | Capability and minimum expected behavior | Internal batch | Rationale and value signal |
| --- | --- | --- | --- |
| P01 | Google and GitHub; session, logout, and providers configurable per installation | B1 | Access without maintaining application passwords |
| P02 | Personal and shared workspaces; selector and isolation | B1 | Separate projects and organizations without mixing data |
| P03 | Human and autonomous-agent members; human invitations; owner, admin, member, viewer | B1 | Limited agent roles; human ownership |
| P04 | Projects, name, key, description, archive, and visibility | B1 | Stable context for tasks and permissions |
| P05 | Tasks with title, Markdown, type, priority, human/agent assignee, dates, labels, checklist; separate creator | B1 | Planning without confusing authorship and assignment |
| P06 | One level of subtasks; parent–child relationship | B1 | Decompose without infinite hierarchy |
| P07 | Configurable statuses and semantic categories; Kanban and Scrum templates | B1 | Adapt without losing report meaning |
| P08 | Prioritized backlog, list, and Kanban board; essential filters | B1 | Find and order the next work |
| P09 | Sprints, goal, dates, points, start/close, and explicit carryover of unfinished work | B1 | Iterative planning with history |
| P10 | Comments/history with effective author and provenance: user through agent, autonomous agent, or system | B1 | Clear attribution without confusing client and member |
| P11 | My tasks, ID/title search, and quick navigation | B1 | Low-friction daily use |
| P12 | Create, read, update, and comment on tasks through local MCP | B1 | Manage tickets from agent terminals |
| P13 | Create projects and plan sprints through local MCP with appropriate roles | B1 | Delegate planning, not only status changes |
| P14 | JSON and CSV export; archive and restore tasks | B1 | Portability and recovery from mistakes |
| P15 | Private attachments with quotas, authorized download, and backup | B2 | Evidence and execution materials |
| P16 | Mentions, following, and notification inbox; optional configurable email | B2 | Attention to relevant changes without noise |
| P17 | Saved filters/views and bulk operations with preview | B2 | Manage larger volumes of work |
| P18 | Date calendar and table with configurable columns | B2 | Review commitments from another perspective |
| P19 | Sprint reports: scope, completion, burndown, and historical velocity | B2 | Understand predictability and scope changes |
| P20 | Directed dependencies and cycle detection; visible blocking | B2 | Coordinate work sequences |
| P21 | Remote MCP with OAuth consent, revocation, and local-client fallback | B2 | Connect compatible remote clients |
| P22 | Guest access limited to specific projects | B2 | Bring in external reviewers without opening the workspace |
| P23 | CSV and native JSON import with prior validation | B2 | Reduce migration barriers |
| P24 | Epics, milestones, and roadmap/timeline view | B3 | Plan above ticket level |
| P25 | Typed custom fields with filters and inherited permissions | B3 | Adaptation to third-party processes |
| P26 | Simple automations: trigger, condition, and action; execution limits | B3 | Reduce repetitive work predictably |
| P27 | Recurring tasks and project/task/sprint templates | B3 | Reuse common processes |
| P28 | GitHub: PR/issue links, verified webhooks, and explicit rules | B3 | Connect execution and planning |
| P29 | Signed outgoing webhooks, retries, and delivery logs | B3 | Integrate with other systems |
| P30 | Estimated time and manual time tracking; per-person workload | B3 | Support capacity when users need it |
| P31 | Short project-linked documents and expanded text search | B3 | Preserve stable context without building a document suite |
| P32 | Specific importers for reference tools | B3 | Easier migration; prioritize according to demand |
| P33 | Light/dark themes, keyboard support, accessibility, and responsive layout | B1 and evolution | Cross-cutting requirement, not a final add-on |
| P34 | Administration, quotas, audit, backups, and self-hosting guide | B1; hardening B2 | Make operating someone else's installation viable |
| P35 | Public ES/EN landing: proposition, benefits, available features, stable CTA | B1 / before launch | One launch and continuous improvements, no access roadmap |
| P36 | Optional confirmed updates capture, unsubscribe, abuse controls | B1, only with ready service/policies | Confirmed leads without creating accounts/exposing addresses |
| P37 | Shared app/landing brand kit with variants/localized assets | B0 proposal; B1 integration | Visual consistency and agent-usable assets |
| P38 | User-delegated connections and autonomous agents with own identity; consistent authors, permissions, assignment, revocation | B1 | Luis through MCP remains Luis; an autonomous agent acts under its identity |

### 2.3 MVP boundaries and initial-horizon exclusions

B1 supports creating a real project, inviting a collaborator, organizing its backlog, working in sprints or Kanban, and using an agent without duplicating the plan.

Initially excluded: general chat, whiteboards, video calls, CRM, billing, payroll, plugin marketplace, agents hosted by the application itself, vector search, Google Docs-style document coediting, synchronized offline writes, and native mobile applications. These are additional products or risks and are reconsidered only with demand evidence.

The app does not need a model subscription to manage tasks: users connect their own agents. Future AI assistance inside the interface would be a separate decision.

### 2.4 Functional rules to agree before coding

- **Task:** belongs to one project and workspace; has one primary assignee in B1. Followers are not additional assignees.
- **Identifier:** internal UUID and stable human-readable key, such as `RIE-123`; numbers are never reused.
- **Hierarchy:** project → task → subtask. Epics arrive in B3 without redundant folders/spaces/lists.
- **Statuses:** free names mapped to `backlog`, `todo`, `in_progress`, `done`, or `canceled` for rules and reports.
- **Blocking:** condition separate from status, with a reason; in B2 it may derive from dependencies. Blocked does not mean finished.
- **Project mode:** Kanban by default; Scrum adds backlog/sprints and reports. Changing mode preserves tasks and history.
- **B1 sprint:** belongs to a project. Only one active sprint per project; multiple planned upcoming sprints may coexist.
- **Sprint scope:** a task has at most one current sprint; previous participations are retained.
- **Closing:** `done` and `canceled` tasks are no longer pending; canceled tasks are reported separately and do not count as delivery. Others move to backlog or a chosen sprint after reviewing the summary.
- **Points:** optional estimate, simple configurable scale; never automatically convert into hours. Show unestimated work separately.
- **Subtasks:** do not automatically complete their parent. Closing a parent with open children shows a warning; it does not silently modify children.
- **Dates:** a due date without a time remains a local date; events and timestamps use UTC. A sprint uses the project's IANA time zone and an exclusive interval end.
- **Archive:** removes work from active views without losing links. Permanent purge is owner-only and is not exposed to agents in B1/B2.
- **Conflicts:** concurrent editing does not overwrite changes without warning; compare versions and request review.

### 2.5 Identity and authorship of agent actions

Connecting a personal MCP client **does not create a new member or make the agent an independent author**. There are two explicit modes:

| Case | Task/comment author | Visible provenance | Permissions |
| --- | --- | --- | --- |
| Luis works from the web | Luis | Web | Luis's current membership and access |
| Luis connects his MCP to Cursor and the agent creates a task | Luis | Luis created this task through Cursor | Luis's current permissions narrowed by connection/projects/scopes |
| Registered autonomous agent Rielia Builder creates a task | Rielia Builder, labeled Agent | Rielia Builder · Agent created this task | Agent's own membership, projects, and credential |

**Default mode: on my behalf.** The connection belongs to the user and actions are attributed to that user. Client/connection provenance is retained in comments and history too. The channel remains visible: attribution to Luis does not mean he personally wrote, read, or approved each change.

**Autonomous mode: own identity.** Owner/admin explicitly creates an agent-type member with a name, human custodian, limited role, and authorized projects. The agent can create tasks, author comments, and receive assignments as a work participant. Always label it Agent; do not impersonate a person or use its administrator's social login. Identity does not host or execute the agent within Rielia: its process remains external.

**Author, assignee, and authorizer differ.** Creating a task does not automatically assign it. A task created by Luis through Cursor may be assigned to Ana or Rielia Builder. An autonomous agent's administrator/authorizer is not its tickets' creator. Internal automations retain System authorship and their cause.

History retains each action's actor: a task created by Luis keeps its creator after an autonomous agent edits it. Revoking a connection, suspending a member, or removing access blocks new operations without reassigning historical authorship. Do not silently switch connection mode: create a new connection with an explicitly confirmed subject.

Created by Luis filters include delegated actions. Created by Rielia Builder includes the autonomous agent's actions. MCP provenance can be filtered separately. My tasks is based on assignee, not creator. Before credential issuance, settings display Acts as Luis or Acts as Rielia Builder · Agent.

## 3. User experience and responsive design

### 3.1 Information architecture

```text
Workspace selector
├── My work
│   ├── My tasks
│   └── Inbox [B2]
├── Projects
│   └── Project
│       ├── Overview
│       ├── Backlog
│       ├── List / Board / Table [B2] / Calendar [B2]
│       ├── Sprints [when using Scrum]
│       ├── Reports [B2]
│       ├── Roadmap and documents [B3]
│       └── Settings
├── Search
└── Settings
    ├── Members and permissions
    ├── Agent connections
    ├── Export / import
    └── Preferences
```

A project contains tasks. A “board” is a savable project view, not a parallel work hierarchy.

### 3.2 Main journeys

**First access:** choose Google/GitHub → create or accept workspace → create project → choose Kanban/Scrum → create first task. Offer optional, removable sample data. Introduce agent connection after the first useful task.

**Daily work:** open My tasks → filter by priority or sprint → open task → execute/comment → change status → see save confirmation. Returning from detail preserves list position.

**Sprint planning:** review backlog → estimate and order → create sprint with goal and dates → select tasks and see totals → start → review scope changes → close with summary and destination for unfinished tasks.

**Agent delegation:** choose workspace/project → create connection with visible scope → copy configuration instructions → check connection → ask the agent to read and propose → apply authorized actions → review web activity.

**Failure recovery:** keep a local draft while the session is active, explain errors next to the field, allow idempotent retry, and show whether the change is pending or confirmed. Local drafts are deleted on logout; never store tokens there.

### 3.3 Device layouts

| Indicative width | Navigation and work | Required adaptation |
| --- | --- | --- |
| 320–767 px | Top bar, selector, and bottom navigation with up to four destinations; contextual menu | Default list; full-screen detail; filter panel; visible create button |
| 768–1023 px | Collapsible sidebar and broad main content | Detail panel if space permits; touch controls and landscape |
| 1024–1439 px | Persistent sidebar, list/board, and side detail | Shortcuts and multiselect; comfortable density by default |
| ≥1440 px | Multiple panels when they add context | Limit description reading width; use additional space for useful information |

Breakpoints are validated against content, not specific phone models.

**Mobile Kanban:** show one selected column, count, and status selector; provide visible controls to change columns. A horizontal board can be an explicit alternative without overflowing the entire page. Moving tasks must work through “Change status / Move to…” as well as drag and drop.

**Calendar and timeline:** vertical agenda on mobile; full timeline on tablet/desktop and a milestone-list alternative. All essential actions remain available.

### 3.4 Structural sketches

```text
Desktop
┌──────────────┬──────────────────────────────────────┬───────────────────┐
│ Workspace    │ Project · Sprint · Search            │ Task detail       │
│ My work      │ List | Board            + New task   │ Status / priority │
│ Projects     │ Filters · Sort · Group               │ Description       │
│ Settings     │ RIE-12  Fix login        In progress  │ Checklist         │
│              │ RIE-13  Document MCP     To do        │ Comments          │
└──────────────┴──────────────────────────────────────┴───────────────────┘

Mobile
┌───────────────────────────┐
│ Project              +    │
│ My tasks · Filters        │
│ RIE-12 · In progress      │
│ Fix login                 │
│ High · Assigned to you    │
│───────────────────────────│
│ RIE-13 · To do            │
│ Document MCP              │
│───────────────────────────│
│ Work  Projects  Search    │
└───────────────────────────┘
```

These are navigation sketches, not final screens or usability evidence.

### 3.5 Interaction system

- Quick creation with title; reveal other fields as needed.
- Optimistic saving for small changes, with pending status and rollback on failure. Closing sprints or applying batches waits for server confirmation.
- Readable history: “Ana changed priority from Medium to High” or “Luis created 4 tasks through Cursor” or “Rielia Builder · Agent created 4 tasks.”
- Group agent activity by run with detail available; avoid one notification per field.
- Discoverable shortcuts for task creation, search, and navigation. Disable while typing and avoid interfering with browser or assistive functions.
- Share filters through URLs; refresh and back navigation preserve project, view, and valid selection.
- Helpful empty states explain the view and offer a relevant action.
- Individual density and theme preferences do not change the team's view.
- Notifications for assignment, mentions, and following; batch summaries, preferences, and per-project mute.
- Never declare “saved” before a valid response. On lost connection, indicate potentially stale data and disable operations that cannot be confirmed.

### 3.6 Accessibility and responsive acceptance

Implementation target: **WCAG 2.2 AA**, without claiming certification. Adopt normal-text contrast ≥4.5:1, appropriate component/focus contrast, keyboard navigation, labels, semantic structure, and drag alternatives. Normative reference: [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/).

Product-specific requirements:

- Touch areas of at least 44×44 CSS px as a design guideline; do not present this as WCAG's exact general minimum.
- Visible focus restored when closing panels; no keyboard traps.
- Announce moves, errors, and outcomes to screen readers without excessive announcements.
- Status and priority use text/icons as well as color.
- Zoom, larger text, reduced motion, and light/dark themes.
- Mobile inputs at least 16 px; do not block zoom.
- Respect safe areas and virtual keyboard; no essential button hidden.
- Check 320, 375, 390, 768, 1024, and 1440 px, landscape, and 200% zoom; review reflow equivalent to 320 CSS px.
- Validate desktop browsers and mobile Safari/Chrome in supported versions defined during implementation.

### 3.7 Approved UI/UX direction for development

On October 24, 2026, the user approved Linear for desktop structure and development work, Asana for card clarity and collaboration, Todoist for personal work and mobile, Trello for Kanban simplicity, and Plane/ClickUp for comparing advanced views when in scope.

The [UI/UX development guide](04-ui-ux-development-guide.en.md) centralizes Mobbin links, screen decisions, reference boundaries, responsive behavior, UX01–UX11 criteria, and the agent workflow. Read it with relevant P/US requirements before implementing interfaces. This approval fixes a direction; it does not yet validate final mockups, usability, or every reference product behavior.

Retain internal B1/B2/B3 priorities and one task with multiple views. Table/calendar remain B2; roadmap/timeline remain B3. Branding retains its own voice and tokens.

## 4. Stories and acceptance

Stories are contracts for expected behavior. Their technical dependencies are developed in the engineering backlog.

| ID / priority | Story | Observable acceptance criteria |
| --- | --- | --- |
| US01 / B1 | As a user, I want to sign in with Google or GitHub to start without creating a password | Login and logout work; provider cancellation permits retry; an unconfigured provider is hidden; expired sessions lead to reauthentication without losing a recoverable draft |
| US02 / B1 | As an owner, I want to separate personal and shared projects | Creating/switching workspace preserves correct context; search or a foreign ID returns no data; membership is mandatory |
| US03 / B1 | As an administrator, I want to invite with a limited role | Single-use invitation with expiry; acceptance requires an authorized identity; viewer cannot modify; removing a member invalidates their access and workspace grants |
| US04 / B1 | As a creator, I want to capture a task quickly | Only title and project required; returns ID and link; duplicate submission/retry does not duplicate when sharing an idempotency key; invalid text shows a clear error |
| US05 / B1 | As a collaborator, I want to find tasks and change status from list or board | Filters for status, assignee, priority, label, and sprint; both views reflect the same record; menu/keyboard alternative to dragging |
| US06 / B1 | As a planner, I want to run a sprint | Defines goal, dates, and scope; blocks a second active sprint; closing shows done/canceled/pending tasks and requires a destination for pending work |
| US07 / B1 | As a developer, I want to break down a task and comment on progress | One level of subtasks, checklist, and comments; identifiable author/date; closing parent does not hide open children |
| US08 / B1 | As a mobile user, I want to complete the same essential actions | Create, search, edit, comment, and plan from 320 px without page overflow; forms and controls usable by touch and keyboard |
| US09 / B1 | As a user, I want to connect my agent to act on my behalf | Shows Acts as Luis, projects/scopes, expiry; creates no agent member; credential shown once; revocation blocks next operation |
| US10 / B1 | As a user, I want to turn a plan into tickets and a sprint through my agent | Authorized operations, links/versions, idempotency; creator/comment author is the user with MCP provenance; payload cannot select another identity |
| US11 / B1 | As a reviewer, I want to recognize each change author and channel | Distinguishes Luis through Cursor, Rielia Builder · Agent, and System; inspect connection/run without secrets; later changes do not rewrite creator |
| US12 / B1 | As a collaborator, I want to preserve my edit against another user or agent | If version changed, server rejects conflicting mutation and offers reload/compare; never silently overwrites |
| US13 / B1 | As an owner, I want to keep and recover my data | Documented JSON export; task CSV; archive/restore preserves ID; backup tested in an empty instance before storing important data |
| US14 / B2 | As a reviewer, I want to attach evidence privately | Project-authorized file with size limit and type checking; no permanent public URL; revoked access denies new downloads |
| US15 / B2 | As a collaborator, I want useful notifications | Mentions and assignments create inbox items; batches do not spam; preferences respected; email errors do not roll back tasks |
| US16 / B2 | As a planner, I want consistent dates, blockers, and reports | Calendar respects time zone/date; dependencies are acyclic; report distinguishes original, added, removed, canceled, and completed scope |
| US17 / B2 | As a remote MCP client user, I want to authorize access through the browser | Sees client, projects, and scopes; PKCE authorization; wrong audience denied; grant revocation blocks new operations; compatible client documented |
| US18 / B2 | As a migrating team, I want to review an import before applying it | Preview, field mapping, row errors, and duplicate policy; canceled import leaves no unexplained partial tasks |
| US19 / B3 | As a team, I want to adapt and automate my process | Typed fields, filters, and explicit rules; loops and quotas controlled; inspectable failures; automatic changes attributed to system and cause |
| US20 / B3 | As a developer, I want to link execution and planning | Signed, deduplicated webhook; a PR does not close tasks without an enabled rule; evidence link shown |
| US21 / B1 | As a visitor, I want to understand the proposition before signing up | Public ES/EN landing, available benefits/capabilities and continuous updates, real CTA, no login, usable mobile/keyboard |
| US22 / optional B1 | As an interested visitor, I want updates and the ability to stop them | Generic request, email confirmation, effective unsubscribe, visible purpose; no enablement without backend/email/policies |
| US23 / B1 | As a user, I want to recognize the same product across app/landing | Consistent logo/tokens, localized images/copy, accessible assets, identified conceptual mockups |
| US24 / B1 | As owner/admin, I want to register an autonomous agent with its own identity | Named Agent member, human custodian, role/projects, own credential; creates/comments as itself; can receive assignments; gains no human administration |
| US25 / B1 | As a team, I want preserved authorship and access control in both modes | Consistent author/provenance filters; revocation/suspension blocks writes; reassignment/removal does not change creator/history; new credentials cannot impersonate another subject |

**Cross-cutting acceptance:** every access applies server-side permissions; negative tests cover two workspaces and private projects. Web/agent equivalence refers to domain and policy, not access to administrative actions reserved for people.

## 5. Validation and metrics

### 5.1 Assumptions to try to disprove

| Hypothesis | Low-cost experiment | Decision signal |
| --- | --- | --- |
| Agent workflow saves planning work | Use a real project over two sprints; compare manual creation/updates against MCP | Total time, corrections, and duplicates; continue if it improves without more errors |
| Other teams share the problem | Interview 5–8 existing agent users and observe their current workflow | Repeated problem without suggesting the solution; reframe if interest is only curiosity |
| Proposed hierarchy is understandable | Prototype sessions creating, moving, and sprint-planning a task | At least 4 of 5 complete essential journeys without intervention, as a provisional threshold |
| Self-hosting brings real value | Two independent people install a release in documented environments | Achieve login, task, MCP, and restoration; record each blocker |
| Trust is sufficient to grant agents write access | Test consent and activity review with users | Understand what the connection can change and how to revoke it |
| Brand communicates the product | Comprehension test using names, phrase, and a screen | Recall purpose and distinguish product from chatbot or consultancy |

Sample sizes and thresholds are learning proposals, not existing findings or statistical significance.

### 5.2 Indicators

**Primary metric:** workspaces with a useful weekly work cycle: they plan or prioritize at least one task and subsequently record execution/comment/completion. Separate human web, delegated, and autonomous actions while retaining effective authorship, without counting automatic synchronization as meaningful use.

| Area | Metric | Proposed initial target |
| --- | --- | --- |
| Activation | New user creates project and first task | Median <5 minutes in a minimally guided test |
| MCP activation | Connections completing a read and first valid mutation | Measure funnel and main errors; set target after initial testing |
| Recurring use | Cohort weekly retention and active workspaces | Establish own baseline; do not invent a market target |
| Plan quality | Agent-created tasks corrected for duplication or wrong context | Record causes; zero duplicates from retries using the same key |
| Trust | Reverted changes, denied permissions, and revocations | Review incidents; no accepted cross-tenant access |
| Operations | Successful-request rate, latency, and pending jobs | Technical targets in [§8](02-architecture-technical-plan.en.md#8-quality-risks-and-decisions) |
| Self-hosting | Installations and restorations completed using documentation | Two reproducible independent installations before public launch |

Do not measure individual productivity through ticket or story-point rankings. Collect aggregate telemetry without titles, descriptions, tokens, or code; disabled by default for self-hosting. Administrative events required to operate the instance are documented separately.

## 6. Open source and sustainability

### 6.1 Distribution model

The repository contains the complete self-hostable core: web, API, MCP, worker, migrations, containers, and documentation. Social login, export, and agent access must not depend on a commercial edition to fulfill the initial promise.

An installation may be personal with closed registration, shared by invitation, or public with limits. Open-source code does not imply your VPS must accept everyone without quotas or an operating policy.

### 6.2 License and contributions

**Proposal:** Apache-2.0 if the primary goal is enabling anyone to use, modify, and adopt the project with few barriers, including acceptance of commercial derivative services. It includes redistribution, notice, and patent-grant conditions; it does not itself grant trademark rights. Source: [official Apache-2.0 text](https://www.apache.org/licenses/LICENSE-2.0).

If the actual goal includes requiring publication of modifications to derivative services, reopen license selection before launch; do not infer that requirement merely from “open source.” Audit dependency-license compatibility and retain notices. Open code and name/logo usage policy are documented separately.

Minimum materials:

- `README`: purpose, own demo when available, installation, current limits.
- `LICENSE`, notices, and dependency/license inventory.
- `CONTRIBUTING`: setup, architecture, tests, conventions, proposing changes.
- `CODE_OF_CONDUCT`, `SECURITY.md`, and private vulnerability-reporting channel.
- Issue/PR templates, changelog, support policy, releases.
- Upgrade, backup, restoration, and OAuth-provider configuration guides.
- `AGENTS.md`: repository workflow, module boundaries, tests, secrets management, and required evidence. Never store production credentials or instructions inside tickets.

### 6.3 Governance and sustainability

Initially one maintainer decides and records ADRs/RFCs for relevant changes. Prioritize reproducible problems and usage, not request counts alone. Publish supported-version matrix once the first release exists.

Future sustainability hypotheses: donations/sponsorship, self-hosting support, and managed hosting. Validate demand/cost before adding payments. Do not build billing in MVP or promise unlimited free hosting.

## 7. Public landing, marketing, and brand assets

The landing explains the proposition, benefits, capabilities, and product use to potential users. Its specification is [Landing guidelines](05-landing-page-plan.en.md); visual proposals are inventoried in [Assets](06-brand-assets-guide.en.md).

Communicate **one public launch followed by continuous improvements**. The page shows no B0–B3, access versions, launch table, or waitlist. The production primary action is Use Rielia; access, installation, and code need real destinations. Internal design may remain labeled as a concept until the product exists; that notice does not create a prelaunch campaign.

Before launch, verify content, links, languages, responsive behavior, actual capabilities, SEO, and data handling. Optional subscription offers ongoing product updates, never access to a supposed future stage. T30–T34 describe later implementation; the landing has not been published. The previous view and v0.1 kit remain explorations without final brand approval.

MCP messaging distinguishes actions on behalf of users from autonomous agents with their own identity. A personal MCP client is not an independent author. This revision keeps P35–P37 and adds P38 and US24–US25 for that identity model.
