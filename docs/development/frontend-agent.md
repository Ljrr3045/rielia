# Frontend agent decision

## Current decision — 2026-11-05

The user's additional **2026-11-06** rule requires all subsequently
coordinator-launched agents, including reused sessions before each new dispatch,
to use **Permissions: Approve for me**. Verify the
effective session's `approvals_reviewer=auto_review` and workspace-write/on-request
profile before task execution, alongside the model/effort receipt. Automatic
review retains sandbox/network boundaries; it is not Full Access or `never`.
See the [official OpenAI configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference).

The current Orca launch interface does not expose a permissions flag. Configure
the idle session through its supported selector, verify the effective result,
then dispatch; an unverified requested setting is insufficient. Report missing
support instead of silently substituting a mode. Never invent an Orca argument
or modify global settings. In the unit-integration session, runtime-injected
instructions explicitly confirmed automatic review and workspace-write after the
user selected that mode; this is session evidence, not proof of future launches.

The user assigns future UI/UX presentation development to **Codex `gpt-6-astra`,
effort `high`**, replacing OpenCode Go/DeepSeek. All logic remains **Codex
`gpt-6.1-sol`, effort `xhigh`**, including frontend hooks/state/data/auth/session,
command preparation, proxies and functional tests. T36's behavior-preserving
frontend/backend restructuring is SOL-owned even when moving existing components;
it retains appearance. T37's actual visual/interaction redesign is Astra-owned
after T36 acceptance. Mixed files require explicit coordination.

| Responsibility | Harness and model | Effort |
| --- | --- | --- |
| UI/UX research, composition and presentation | Codex, `gpt-6-astra` | `high` |
| All logic/tests and T36 structural refactoring | Codex, `gpt-6.1-sol` | `xhigh` |

Verify each launched worker's **effective** model/effort receipt before assignment;
a requested configuration or model self-description is insufficient. If unavailable,
report it to the coordinator rather than silently substitute. Keep each worker in
its own isolated worktree. These rules supersede older frontend-role assignments
in development documents; they preserve what historical workers actually used.
Native Kilo Code Reviews remains the external reviewer under the
[current policy](kilo-review.md); no Kilo model/setting/review rule changes here.

For this planning run the coordinator verified `launch.effective` as Codex
`gpt-6-astra` / `high` for the read-only UI researcher, and Codex `gpt-6.1-sol` /
`xhigh` for the technical researcher and documentation worker (November 6 UTC,
November 5 America/Caracas). This establishes the research dispatch configuration,
not completed redesign, model quality or later workers' configuration.

The [quality roadmap](development-quality-roadmap.md) defines T36 → T37 → T11 and
the requested frontend-local skill installation/verification, which remains future
work. Brand/UX/product/architecture instructions govern skill suggestions. Do not
overwrite an existing global customization or treat it as proof of local setup.

## Historical decision and verification — 2026-10-25

On 2026-10-25, the user authorized selecting DeepSeek 1017 with `max` for
frontend presentation after verifying its availability. This supersedes the
earlier Haiku 5.5 `high` assignment at that time. Historical delivery
records still identify the models that actually performed those tasks.

| Responsibility | Harness and model | Effort |
| --- | --- | --- |
| UI/UX presentation and visual implementation | OpenCode Go, `opencode-go/deepseek-v4.1-flash` (V4.1 Flash 1017) | `max` |
| All logic, including frontend auth/session/data hooks, proxies, and functional tests | Codex, `gpt-6.1-sol` | `xhigh` |

Each development worker and subagent retains its own isolated worktree. The
coordinator must verify its effective model and effort before assigning work;
do not silently substitute another model or effort. Native Kilo Code Reviews is
the external reviewer under the [current review policy](kilo-review.md), separate
from OpenCode Go's development role. The sequential PR-to-`dev`, review, merge and
worktree cleanup rules remain in effect.

### Historical verification

- [OpenCode's official announcement dated 2026-10-19](https://x.com/opencode/status/2112220734768779441)
  confirms that Go and Free were updated to DeepSeek V4.1 Flash 1017 without
  client changes. The coordinator retrieved the announcement through X's official
  oEmbed endpoint on 2026-10-25. This specifically establishes Go availability;
  DeepSeek's own API documentation alone would not establish Go's routing.
- The installed OpenCode model catalog (`GET /api/model`) lists the enabled
  provider `opencode-go`, model `deepseek-v4.1-flash`, and variant `max` with
  settings `reasoningEffort: "max"`.
- A stateless `POST /api/experimental/generate` request explicitly selecting
  `{ "id": "deepseek-v4.1-flash", "providerID": "opencode-go", "variant": "max" }`
  completed successfully with `READY`. It requested no code or tools. This checks
  connectivity with the selected configuration, not UI quality or a checkpoint
  fingerprint; the response exposes only generated text.
- [DeepSeek's thinking-mode documentation](https://api-docs.deepseek.com/guides/thinking_mode/)
  documents `reasoning_effort: "max"` as the maximum reasoning effort.
- The Go model ID is a mutable alias, not a dated checkpoint pin. The 1017
  identification rests on the provider's announcement; the local catalog does
  not expose a served-checkpoint fingerprint. Do not claim independently
  inspected weights or use model self-identification as version evidence.

The model-selection checkpoint was a coordination decision only and did not
itself resume development. The user subsequently resumed development on
2026-10-25 and authorized the bounded T01/B0 prototype, with logic and future
presentation assigned separately. The verification limits above still apply;
resumption adds no served-checkpoint fingerprint or UI-quality evidence.
