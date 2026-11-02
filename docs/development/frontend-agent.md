# Frontend agent decision

On 2026-10-25, the user authorized selecting DeepSeek 1017 with `max` for
frontend presentation after verifying its availability. This supersedes the
earlier Haiku 5.5 `high` assignment for future UI/UX workers. Historical delivery
records still identify the models that actually performed those tasks.

| Responsibility | Harness and model | Effort |
| --- | --- | --- |
| UI/UX presentation and visual implementation | OpenCode Go, `opencode-go/deepseek-v4.1-flash` (V4.1 Flash 1017) | `max` |
| All logic, including frontend auth/session/data hooks, proxies, and functional tests | Codex, `gpt-6.1-sol` | `xhigh` |

Each development worker and subagent retains its own isolated worktree. The
coordinator must verify its effective model and effort before assigning work;
do not silently substitute another model or effort. The separate
[OpenCode Go PR reviewer](opencode-review.md) supersedes Kody under the user's
2026-11-01 decision; development model assignments are unchanged. Sequential
PR-to-`dev`, current-head/base review, coordinator merge and worktree cleanup
rules remain in effect. Historical evidence below describes development sessions.

## Verification

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
