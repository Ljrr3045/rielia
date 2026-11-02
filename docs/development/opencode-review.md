# OpenCode Go pull-request review

On 2026-11-01, the user replaced Kody with OpenCode Go review before T11.
This supersedes the earlier OpenCode retirement and Kody-trigger instructions.
Historical PR evidence keeps the reviewer that actually ran. This is delivery
infrastructure/governance work, not T11 implementation or full T16 acceptance;
no product P/US/UX scope, application code, handoff, credentials, deployment or
repository protection settings change is included.

Implementation and local checks are prepared. Real GitHub App/OIDC, Go inference,
fork relay and formal-review event acceptance remain **OPEN until activation**.
The repository secret was configured by the user out of band; workers never
read its value, local OpenCode auth, or personal tokens.

## Official integration and the adapter decision

The [official manual setup](https://opencode.ai/docs/github/) installs
[`opencode-agent`](https://github.com/apps/opencode-agent), uses a provider secret,
and exchanges Actions OIDC for an installation token. We use that installed App,
the same `opencode-github-action` audience and
`https://api.opencode.ai/exchange_github_app_token` protocol. No PAT or elevated
`GITHUB_TOKEN` substitutes for the App.

The official composite action is `anomalyco/opencode/github@latest`, not `@dev`.
Its inspected immutable source is
[`77fc88c8ade8e5a620ebbe1197f3a572d29ae91a`](https://github.com/anomalyco/opencode/blob/77fc88c8ade8e5a620ebbe1197f3a572d29ae91a/github/action.yml).
Pinning that action alone does not pin its CLI: it queries the latest release,
uses `actions/cache@v4`, and runs a moving `curl .../install | bash` installer.
The associated [GitHub runner source](https://github.com/anomalyco/opencode/blob/77fc88c8ade8e5a620ebbe1197f3a572d29ae91a/packages/opencode/src/cli/cmd/github.ts)
rejects `pull_request_target`, requires write access from the automatic event
actor, checks out local/fork PR code, installs the App token in Git configuration,
and can push modifications. It publishes conversational comments without a
deterministic formal-review/freshness boundary.

Those behaviors conflict with automatic fork review without untrusted execution
and autonomous edits. The coordinator accepted a small **trusted adapter instead
of invoking the stock composite action or `opencode github run`**. This is a new
integration; the retired workflow is not restored.

The adapter pins the official [CLI 1.19.5 release](https://github.com/anomalyco/opencode/releases/tag/v1.19.5),
source [`810c0eba1a7348036f8bdf61e6632d0c36c6876c`](https://github.com/anomalyco/opencode/tree/810c0eba1a7348036f8bdf61e6632d0c36c6876c).
The Linux baseline archive SHA-256 is
`17c200fd4b2289954cc01552559f9b6d03ec157b2ddfb5eb54144f491656333d`.
Installation verifies the digest and version; it runs no repository dependency
installation. Updating the binary or its digest is a reviewed source change.

## Configuration

| Setting | Source | Default/contract |
| --- | --- | --- |
| `OPENCODE_API_KEY` | Actions repository secret | User-provisioned Go key; absent key fails closed |
| `OPENCODE_MODEL` | Actions repository variable | `opencode-go/deepseek-v4.1-flash`; other providers are rejected |
| `OPENCODE_VARIANT` | Actions repository variable | `max`; passed as CLI variant with explicit compatible-provider reasoning effort |
| App authentication | Actions OIDC | Installed `opencode-agent`; token acquired only for publication and revoked afterwards |

The public [models.dev catalog](https://models.dev/api.json) inspected on
2026-11-01 lists the Go provider, `OPENCODE_API_KEY`, this model, and
`low`/`high`/`max` reasoning efforts. The [pinned provider implementation](https://github.com/anomalyco/opencode/blob/810c0eba1a7348036f8bdf61e6632d0c36c6876c/packages/opencode/src/provider/transform.ts)
supports provider reasoning variants. Local fake-provider evidence confirms
`reasoning_effort: "max"` on the actual review call. The CLI also makes an
auxiliary title-generation call at `low`; this is not the review call.
The model ID is a mutable provider alias, not a checkpoint fingerprint. A new
Go model/variant requires provider support and validation; unsupported settings
must fail rather than silently fall back to a different provider.

## Events and commands

| Trigger | Behavior |
| --- | --- |
| PR opened, synchronized, reopened, ready for review | Full review, including fork and draft PRs, for every live base except `main` |
| PR edited with a changed base | Full review after retarget; title/body-only edits do not rerun |
| Push to a non-main base branch | Full review of open PRs targeting that branch; deleted branches/tags skip |
| Root PR comment `/oc`, `/opencode`, or either followed by `review ...` | Full current-head review, from a current human maintainer |
| Root/inline `/oc <question>` or `/opencode <question>` | Reply only; no formal approval or code changes |
| Inline reply to an `opencode-agent[bot]` thread | A current human maintainer may follow up without repeating the mention |
| Actions “Run workflow”, with PR number | Full current-head review, with the same live maintainer and base checks |

Mentions are case-insensitive whitespace-delimited tokens; `/octopus` and URL
substrings do not invoke the assistant. Root follow-ups repeat `/oc` or
`/opencode`. Ordinary issues and bot requests are ignored. Manual requests require
live `write`, `maintain` or `admin` permission, checked again before publication;
external authors can receive automatic reviews but cannot spend credentials on
arbitrary commands. Requests to edit, push, merge, deploy, or administer stay
outside the assistant's capabilities.

The [main workflow](../../.github/workflows/opencode-review.yml) handles trusted
PR-target events, root comments, base pushes and manual dispatch. It always
checks out support code from the trusted default branch, with credentials not
persisted. No PR/fork tree is checked out. Changed files, base/head contents,
guidance and discussion are fetched through GitHub APIs at immutable SHAs and
passed as JSON reference data. Fork head files are read from the fork repository.

GitHub withholds secrets for fork `pull_request_review_comment` events. The
[unprivileged inline relay](../../.github/workflows/opencode-inline.yml) therefore
has no checkout, secrets or token permissions. It uploads only PR/comment/run/
attempt identifiers. The trusted `workflow_run` consumer validates the live run,
workflow path/event/conclusion/repository/head against GitHub-owned metadata,
artifact identity/size, comment PR/author/time, original thread and maintainer
permission. It parses one bounded JSON ZIP entry without extracting or executing
artifact files. It deliberately does not equate runner merge-ref `GITHUB_SHA`
with the Actions API's source `head_sha`. Delayed (>10-minute creation lag),
expired, missing, forged or ambiguous relay data fails closed. GitHub may require
approval before running a first-time fork contributor's unprivileged relay;
automatic PR-target review and a maintainer root `/oc` remain available.

Manual requests have separate concurrency identities so newer pending commands
cannot replace older ones. Automatic runs share a per-PR group; GitHub may replace
an older pending automatic run with the newest one. Each survivor captures the
latest head/base, rather than approving an event's obsolete commit.

## Isolation and formal outcomes

The model subprocess has an empty temporary working directory, isolated child
HOME and all XDG directories, an explicit environment allowlist, disabled project
configuration/session sharing, and wildcard tool denial. No GitHub token, OIDC
request credential, inherited OpenCode config/auth, PR plugin, MCP server,
install hook or shell command enters that subprocess. PR content is supplied
through stdin as data. The parent shell's HOME is unchanged. Generated text has
no GitHub write capability; deterministic trusted code owns publication.

JSONL must contain normal `stop` completion and exactly one valid review JSON
object. A tool attempt, error, missing completion, malformed schema, wrong head/
base, inconsistent file coverage, output bound or timeout blocks publication.
Inline findings must identify a changed file and an actual changed diff line.

Full reviews use GitHub's formal `APPROVE`, `REQUEST_CHANGES` or `COMMENT`, with
explicit `commit_id` and batched inline findings. Approval requires complete
coverage and no actionable findings; change requests require concrete findings.
Drafts and incomplete coverage use `COMMENT`. A question reply always stays a
reply in the root discussion or original inline thread, regardless of any model
verdict. Missing coverage is stated explicitly and leaves the job failed; it is
never a clean review. Network-ambiguous writes are not automatically retried;
inspect the PR before rerunning. A same-run publication marker prevents blind
duplicate retries.

Before and after publication the adapter rechecks open state, head SHA/repository,
base ref/SHA/repository and draft state. `main` is checked dynamically for all
entry points and before each write. GitHub provides no atomic head-and-base
compare-and-swap for review creation: a remaining publication race fails the job
and attempts to dismiss an obsolete approval. If dismissal is denied, the
coordinator must dismiss it and obtain a fresh review before merging.

The current repository rules do not dismiss all stale approvals automatically.
This PR does not change those settings. An old green check or GitHub APPROVED
badge alone cannot satisfy the **coordinator's exact-current-head-and-base review
gate**. Always inspect issue comments, submitted reviews, inline comments and
applicable checks; handle all findings and re-review after source/base changes.
Only the coordinator merges, through normal repository requirements.

## Runtime bounds and limitations

| Bound | Outcome on excess |
| --- | --- |
| 80 changed files; 48,000 bytes per whole file | Partial context, explicit incomplete COMMENT |
| 600,000 bytes combined file context; 200,000 patch bytes | Partial context, explicit incomplete COMMENT |
| 80,000 discussion characters | Bounded recent/thread context, incomplete COMMENT |
| Missing/truncated patch, binary, symlink, unavailable context | Explicit incomplete COMMENT; never APPROVE |
| Ten 100-row pages per API list | Fail closed, no assumed complete review |
| 100 open PRs per base-push fanout; three parallel jobs | Fail if fanout is larger; each PR can be requested explicitly |
| 20 findings; 1 MB CLI output; 10-minute model / 20-minute job | Fail closed on excess/timeout |
| Relay ZIP 8 KB metadata / 32 KB download / 4 KB JSON | Reject before using identifiers |

No tests or install hooks from a PR are executed by review. Applicable product CI
still runs separately; a model cannot claim it executed those checks. Large or
binary changes need a maintainer to arrange complete review or split the change.
App exchange, public Go availability, API rate limits and Actions/fork approval
policy are external dependencies; a failure remains a blocker.

## Validation and activation

Local evidence: 20 event/auth/fork/main-exclusion/relay/coverage/verdict/current-
head/base-race/token-isolation tests pass; all workflows pass checksum-pinned
actionlint 1.7.12; immutable handoff and whitespace checks pass. The real CLI
1.19.5 macOS archive was verified with SHA-256
`c1c9e62521192192ef4c3ed1355ada2144055bddb61682217e997b03c55203c1`.
Its loopback fake-provider smoke verifies JSONL transport, effective review `max`,
no exposed tools and rejection of an unsolicited malicious tool call. It uses
only generated fake credentials and no local auth. This does **not** verify Go
billing/inference, App exchange, fork event delivery or real GitHub publication.

```sh
node --test .github/scripts/opencode-review.test.mjs
# After verifying/installing the official pinned CLI outside the repository:
OPENCODE_BIN=/absolute/path/to/verified/opencode node .github/scripts/opencode-cli-smoke.mjs
actionlint -shellcheck=
python3 scripts/verify-handoff.py
git diff --check
```

[Review support CI](../../.github/workflows/review-support-ci.yml) repeats the
unit checks, workflow lint and actual Linux pinned-CLI fake-provider smoke without
real secrets. The existing product CI remains required.

Activation/bootstrap steps, owned by the coordinator:

1. Confirm the App is installed for this repository and `OPENCODE_API_KEY` exists
   by name only. Optional model/variant variables can remain unset for defaults.
2. Independently review this infrastructure PR and pass no-secret CI. Because
   trusted support code must first exist on `dev`/default, the new assistant
   cannot review its own bootstrap PR. Satisfy normal repository human/code-owner
   approval requirements and record the transition evidence; no direct merge,
   bypass, pretend review or Kody trigger is authorized by this guide.
3. After a legitimate coordinator merge, use an authorized disposable PR targeting
   `dev` to verify automatic review and `/oc review`, root question/follow-up,
   inline request/follow-up and formal GitHub verdict/inline findings with the
   App identity. Verify effective model/variant and current head/base markers.
4. Verify an external fork PR receives automatic review and that an authorized
   maintainer inline request crosses the unprivileged relay. Test unauthorized
   comments/bot loops, retarget to `main`, a source push/base advance during
   generation, failed/incomplete coverage, and fresh review after corrections.
5. Preserve actual run/review/comment URLs and exact head/base evidence in this
   guide/progress. Operational acceptance stays OPEN until these pass. Never
   replace a failed live review with an assumed approval.
