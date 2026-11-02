# OpenCode Go pull-request review

On 2026-11-01, the user replaced Kody with OpenCode Go review before T11.
This supersedes the earlier OpenCode retirement and Kody-trigger instructions.
Historical PR evidence keeps the reviewer that actually ran. This is delivery
infrastructure/governance work, not T11 implementation or full T16 acceptance;
no product P/US/UX scope, application code, handoff, credentials, deployment or
repository protection settings change is included.

On 2026-11-02, bootstrap sources `bf3ce99` and `390cff2` each produced a complete
real Go review and App formal `CHANGES_REQUESTED` with four inline findings.
The dated [review evidence below](#validation-and-activation) records the failed
attempt and successful unchanged retry separately. This proves review/publication,
not approval of subsequent corrections. Fresh changed-head review and automatic/
fork/root/inline event acceptance remain **OPEN until activation**.
The later `ce20845` run passed real dual-token authorization but failed finding
validation with publication skipped; no current corrected-head approval exists.
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
| Review output cap | Fixed isolated child environment | 384,000 tokens; pinned CLI clamps to the model output limit; no repository variable or inherited override; accepted in the dated tiny/full live requests below, without a completion guarantee |
| App authentication | Actions OIDC | Installed `opencode-agent`; token acquired only for publication, revocation attempted afterwards; cleanup errors are reported separately and fail the job |

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

Coordinator-only manual triggering governs supervised worker delivery: workers
report readiness and never invoke review. Ordinary authorized human maintainers
may use these commands. Runtime account-type/permission checks cannot distinguish
a person from automation using the same human credentials; there is no
coordinator login allowlist. The main plan job skips ordinary non-PR issue
comments before checkout. This guard leaves inline relay events and implicit
App-thread follow-ups unchanged.
Planning treats an explicit account/permission denial as ineligible and emits
no review work. Transport, API and relay failures still fail; permission loss
during preparation or publication still blocks the request.

The [main workflow](../../.github/workflows/opencode-review.yml) handles trusted
PR-target events, root comments, base pushes and manual dispatch. It always
checks out support code from the trusted default branch, with credentials not
persisted. No PR/fork tree is checked out. Changed files, base/head contents,
guidance and discussion are fetched through GitHub APIs at immutable SHAs and
passed as JSON reference data. Fork head files are read from the fork repository.
Base/head Git tree metadata supplies actual file modes; raw Git blobs avoid the
Contents API's automatic symlink dereference. Mode-only executable changes stay
visible even with zero textual additions/deletions. Symlinks, gitlinks and
unavailable/truncated tree metadata cannot establish approval.
Fatal UTF-8 decoding preserves an initial BOM as file data, including BOM-only
files. Byte limits, invalid UTF-8 and NUL/binary rejection remain enforced before
lossless projection and canonical patch reconstruction.

The [workflow token is repository-scoped](https://docs.github.com/en/actions/concepts/security/github_token).
Same-repository reads retain it; foreign head repositories use an anonymous,
GET-only Git client after exact-name/public-visibility metadata confirmation.
No base/App token is forwarded to the fork, and private/inaccessible metadata
cannot establish full context. GitHub documents public unauthenticated
[commit](https://docs.github.com/en/rest/git/commits#get-a-commit),
[tree](https://docs.github.com/en/rest/git/trees#get-a-tree) and
[blob](https://docs.github.com/en/rest/git/blobs#get-a-blob) reads. This avoids
assuming a cross-repository credential guarantee; it does not claim every old
public-fork request was proven to fail. Immutable SHA/tree/blob/mode/bounds checks
remain unchanged. Anonymous `403/429` stops further anonymous requests for that
run, with explicit incomplete limitations and no credential fallback/retry.

Public-fork access has a practical [60 requests/hour/IP quota](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api).
The configured 80-file bound is an upper bound, not guaranteed anonymous coverage;
quota or unavailable context blocks approval. No PAT or broader credential is used.

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

The dedicated `agent.review.prompt` supplies trusted review-only, no-tools,
untrusted-input and final-JSON policy at system priority. Embedded role/policy/
`<system-reminder>` tags remain data; missing context requires incomplete COMMENT,
not a search for unavailable tools. The [pinned request assembly](https://github.com/anomalyco/opencode/blob/810c0eba1a7348036f8bdf61e6632d0c36c6876c/packages/opencode/src/session/llm/request.ts#L53)
uses this agent prompt instead of the generic provider [coding prompt](https://github.com/anomalyco/opencode/blob/810c0eba1a7348036f8bdf61e6632d0c36c6876c/packages/opencode/src/session/prompt/default.txt).
Actual pinned fake-provider wire checks confirm the review policy is system
content, generic coding/lint/reminder-authority instructions are absent and PR
tag text stays in the user message. Tool denial/isolation and deterministic
validation remain independent controls; prompt text does not replace them.

Only the model's serialized view uses lossless references. The parent retains
the full immutable input and original patches for validation/publication; all
file/context bounds are still applied before projection. Every supplied head,
file path/status/mode, rename path, limitation and discussion remains present.

| Model-view field | Exact representation |
| --- | --- |
| `base` with `encoding: head-edges-v1` | First `prefixLines` complete head lines + literal `middle` + last `suffixLines` head lines; the ranges never overlap |
| `patch` with `encoding: whole-file-patch-v1` | Original header and side, with the whole addition/removal reconstructed from complete head/base text; `trailingNewline` preserves the patch's terminal LF |

Lines retain their LF; a final unterminated line also counts, with CR and Unicode
unchanged. Whole-file patch reconstruction preserves the no-final-newline marker.
The trusted system policy fixes these semantics; file text cannot redefine them.
Each projected file must decode to its exact original JSON and use fewer bytes
for each replacement. Unsupported/noncanonical/small patches retain their full
original form. Modified patches are never rewritten or assumed to apply to the
current base: their merge-base semantics are independent of the captured current-
base text. A divergent current base is preserved through direct text equality.

Measured frozen PR #25 input at `8921b41` has 18/18 files and no limitations:
771,046 input JSON bytes become 524,489 (**31.98% fewer**), with 11 base references
and seven whole-added-file patch descriptors. Its old user prompt was 773,051
bytes; with the new encoding policy, the same corpus is 774,066 bytes unprojected
or 527,509 projected. These are UTF-8 byte measurements, not token estimates or
proof that context caused the provider failure. New-head metrics and CI/audit
evidence are reported separately before any root-authorized live run.

JSONL must contain normal `stop` completion and exactly one valid review JSON
object. A tool attempt, error, missing completion, malformed schema, wrong head/
base, inconsistent formal-review file coverage, output bound or timeout blocks
publication. Reply paths must be typed, unique and drawn from supplied files.
Inline findings must identify a changed file and an actual changed diff line.

Full reviews use GitHub's formal `APPROVE`, `REQUEST_CHANGES` or `COMMENT`, with
explicit `commit_id` and batched inline findings. Approval requires complete
coverage and no actionable findings; change requests require concrete findings.
Drafts and incomplete coverage use `COMMENT`. A question reply requires model
`COMMENT` and no findings, and stays in the root discussion or original inline
thread. It may name an empty/subset file list and answer with limited or empty
file context; its outcome always records `complete=false` and `REPLY`, with no
formal coverage claim. Successfully posting that answer does not fail solely
for missing formal coverage. Schema, authorization, freshness, write and token
cleanup failures still fail the reply job. Missing formal-review coverage is
stated explicitly and leaves the job failed; it is never a clean review.
Network-ambiguous writes are not automatically retried;
inspect the PR before rerunning. A same-run publication marker prevents blind
duplicate retries.

Host-generated metadata uses fixed code spans containing ASCII JSON string
literals. Limitations, base refs, model names and variants escape backticks,
mentions, HTML and non-ASCII/control characters; decoding the literal recovers
the original value. Raw input/projection and normal model-authored prose remain
unchanged. Run/repository/SHA fields retain their validated fixed grammars.

Before and after publication the adapter rechecks open state, head SHA/repository,
base ref/SHA/repository and draft state. `main` is checked dynamically for all
entry points and before each write. GitHub provides no atomic head-and-base
compare-and-swap for review creation. An ambiguous approval POST or failed
post-write confirmation fails the job and attempts bounded approval recovery;
it never repeats the approval POST.

The current repository rules do not dismiss all stale approvals automatically.
This PR does not change those settings. An old green check or GitHub APPROVED
badge alone cannot satisfy the **coordinator's exact-current-head-and-base review
gate**. Always inspect issue comments, submitted reviews, inline comments and
applicable checks; handle all findings and re-review after source/base changes.
Only the coordinator merges, through normal repository requirements.

Recovery uses a fully matched returned approval or one re-list bounded by the
existing ten-page limit. Only safe-ID APPROVED reviews with the actual App's
`opencode-agent[bot]` login and Bot type, exact PR URL/head, and exact trailing
trusted run-marker footer qualify. A marker quoted inside an untrusted summary
does not qualify. Matching IDs are dismissed at most once each; transient check
failure is not treated as successful review. The original publication error
remains primary and static recovery categories report the attempt only.

This is best effort, not an atomic guarantee. A lost/malformed response, read
failure, pagination bound, eventual consistency or dismissal denial can leave an
approval unobserved or undismissed. A failed workflow stays blocked even after
an accepted dismissal request. The coordinator must inspect actual publication,
dismiss any unverified approval and obtain fresh complete review before merging.

App-token revocation is always attempted after publication work. A failure emits
`APP_TOKEN_REVOCATION_FAILED` with a fixed confirmed/unconfirmed publication
flag; it preserves an existing ReviewFailure, Obsolete or incomplete-review
failure. If publication was confirmed and only cleanup fails, that distinct
cleanup failure records the published outcome instead of calling it an unknown
verdict. Cleanup failure still blocks delivery; inspect publication and token
state without inferring successful revocation.

## Runtime bounds and limitations

| Bound | Outcome on excess |
| --- | --- |
| 80 changed files; 160,000 bytes per whole file | Partial context, explicit incomplete COMMENT |
| 5,000 entries per immutable base/head Git tree | Incomplete COMMENT if missing/truncated/oversized |
| 1,000,000 bytes combined file context; 300,000 patch bytes | Partial context, explicit incomplete COMMENT |
| 1,024,000 UTF-8 bytes of complete raw discussion JSON | Bounded recent/thread fallback above this limit, explicit incomplete formal COMMENT |
| 2,000 title / 12,000 body UTF-16 code units | Existing slice bounds; any omitted text adds an explicit limitation and prevents APPROVE |
| Missing/truncated patch, binary, symlink, unavailable context | Explicit incomplete COMMENT; never APPROVE |
| Ten 100-row pages per API list | Fail closed, no assumed complete review |
| 100 open PRs per base-push fanout; three parallel jobs | Fail if fanout is larger; each PR can be requested explicitly |
| 20 findings; 1 MB CLI output; fixed 384,000-token generation cap; 45-minute model / 60-minute job | Fail closed on excess/timeout; token cap also clamps to the known model limit |
| Relay ZIP 8 KB metadata / 32 KB download / 4 KB JSON | Reject before using identifiers |

No tests or install hooks from a PR are executed by review. Applicable product CI
still runs separately; a model cannot claim it executed those checks. Large or
binary changes need a maintainer to arrange complete review or split the change.
App exchange, public Go availability, API rate limits and Actions/fork approval
policy are external dependencies; a failure remains a blocker.
The 160 KB whole-file limit permits the existing 103,545-byte progress ledger
and 33,722-byte changelog (measured before this update), which normal deliveries
must edit. Exactly-at-limit and over-limit file cases are tested; the combined
budget still bounds total context rather than silently truncating large files.

## Validation and activation

The root-authorized one-time bootstrap
[run 41368385352](https://github.com/Ljrr3045/rielia/actions/runs/41368385352)
used audited support `14cc8ab` and fixed PR #25. Preparation and pinned CLI setup
passed; generation failed after about four minutes, and App publication was
skipped. The old generic failure log and deleted temporary state do not establish
the precise cause. No bad-key diagnosis, successful review or approval follows
from that failure. Live operational acceptance remains OPEN.

The next root-authorized
[run 41369790351](https://github.com/Ljrr3045/rielia/actions/runs/41369790351)
used independently reviewed `2abd2bc` and failed `JSONL_COMPLETION`, before review
JSON parsing; publication again did not run. This establishes a finish-count/
reason rejection, not which finish condition occurred. A follow-up diagnostic
refinement preserves exactly-one-stop acceptance and the user-confirmed `max`
effort/provider. It replaces that broad code with finite
`JSONL_FINISH_MISSING`, `MULTIPLE`, `LENGTH`, `TOOL`, `CONTENT_FILTER`, `ERROR`,
`UNKNOWN` and `OTHER` suffixes under the same `JSONL_FINISH_` prefix.

Rejected completion failures and model timeouts carry a fixed sanitized
completion metadata object:
finish/text counts capped at3 (3means3+), exact known-reason booleans, duplicate-
finish-ID and complete-ID-presence booleans (IDs compared privately), and reported
output/reasoning counts capped at1,000,000 or null. Usage is null for multiple
finishes rather than summing possibly repeated parts. No raw ID, reason, model
text or arbitrary key/value is copied. Duplicate identical IDs still fail; no
deduplication or continuation acceptance is introduced.

The coordinator subsequently authorized a controlled, fixed **128,000-token
output cap** in only the isolated child environment through
`OPENCODE_EXPERIMENTAL_OUTPUT_TOKEN_MAX`. The parent environment, repository
settings and user-confirmed `max` effort are unchanged. The pinned provider
transform still clamps this to the known model output limit. The experiment
initially retained the ten-minute model and 20-minute job deadlines, 1 MB output
and every completion/schema/coverage guard.
At that head, pinned-CLI loopback smoke asserted `max_tokens: 128000`, `max` reasoning
and zero tools on the review request, using only generated fake credentials.
This bounded experiment does not establish that either earlier failure was
caused by length, and it requires fresh independent review/CI before live use.

The third root-authorized
[run 41372213130](https://github.com/Ljrr3045/rielia/actions/runs/41372213130)
used independently audited `110d2d2` and reached `CLI_TIMEOUT` at the ten-minute
model deadline. App publication was skipped and cleanup passed. That log cannot
distinguish ongoing generation from completed output whose process did not exit;
it establishes neither a provider cause nor successful review. The coordinator
then authorized a **20-minute model / 30-minute job** bound with the same output
cap, `max`, provider and strict gates. This needs fresh independent review/CI
before any further root-authorized live attempt.

Timeout-only progress metadata adds stdout/stderr byte counts capped at 1,000,000,
parsed-event count capped at 1,000, and fixed `malformedJsonl`,
`normalStopWithText` and `reviewJsonParsed` booleans. The latter two indicate
exactly one stop and one string text without observed error/tool events, and
whether that text parses as JSON. They do not establish schema, binding,
coverage or review success. No raw stream, reason, ID or exception is copied;
every timeout kills the child and fails even if all output appears complete.

The fourth root-authorized
[run 41374467405](https://github.com/Ljrr3045/rielia/actions/runs/41374467405)
used `02c8073`: App OIDC exchange, PR read and token revocation preflight passed;
generation then failed `JSONL_FINISH_LENGTH`, with one finish, zero text events
and reported output/reasoning counts of 0/128000. Publication was skipped and
cleanup passed. This establishes a length/no-text result for this attempt only;
earlier causes remain unknown. A separately verified prompt-boundary correction
adds the dedicated reviewer system policy above: previously the agent inherited
generic coding instructions while review policy was only in user stdin. No
claim is made that this caused the length failure or that the correction will
make live inference succeed. Model, `max`, cap, deadlines and strict gates remain.
Fresh head audit/CI and root approval precede any further live attempt.

The fifth root-authorized
[run 41377729585](https://github.com/Ljrr3045/rielia/actions/runs/41377729585)
used `8921b41`: App preflight and a tiny synthetic Go reply control passed; the
control returned `complete=true` in six seconds without publication. The real
full review then failed `JSONL_FINISH_LENGTH` after 9m42s, with zero text events
and reported output/reasoning counts of 0/128000. Publication was skipped,
cleanup passed and all three review surfaces remained empty. The control is
protocol evidence, not full-review acceptance. The separately authorized lossless
projection above reduces redundant input while retaining the full parent and
all gates; it is not a proven causal remedy. No new paid run is implied.

The sixth authorized
[run 41383485431](https://github.com/Ljrr3045/rielia/actions/runs/41383485431)
used projected source `e2be745`. App preflight and a complete synthetic
review-mode control passed (four seconds), but full generation again failed
`JSONL_FINISH_LENGTH` after 9m59s, with one finish, zero text and reported
output/reasoning counts of 0/128000. Publication was skipped, cleanup passed and
all review surfaces remained empty. The measured reduction did not resolve that
attempt; no successful review or precise underlying cause is established.

The coordinator then authorized the fixed **384,000 output cap / 45-minute model
/ 60-minute job** bounds, retaining the same model, `max`, lossless projection
and every strict gate. The live [native DeepSeek API specification](https://api-docs.deepseek.com/api/create-chat-completion/)
allows `max_tokens` from 1 to 393216 (384K); omitted max-effort requests default
to 128K. That native default is not a maximum, and the native endpoint/model IDs
do not establish Go alias support. The previously captured [models.dev Go catalog](https://models.dev/api.json)
lists output 384000 for this alias. The pinned CLI still clamps the fixed child
cap to its actual model limit; fake-provider wire smoke confirms 384000 with
`max` and zero tools. Catalog-fetch errors are not provider-inference evidence.
Before the seventh attempt, live Go parameter acceptance required a separately
authorized tiny review control; the following actual evidence records its
acceptance and the separate full-review result. This is an explicit larger
budget, not a new reasoning variant or automatic retry.

The seventh authorized
[run 41385907633](https://github.com/Ljrr3045/rielia/actions/runs/41385907633)
used `bf3ce99`: App preflight, complete tiny review control, full generation,
publication and cleanup succeeded. The actual App
[review 5732005666](https://github.com/Ljrr3045/rielia/pull/25#pullrequestreview-5732005666)
states complete supplied-file review at that exact head/base with DeepSeek/max,
formal `CHANGES_REQUESTED` and four real inline findings. No approval or complete
post-activation event smoke is claimed. Source corrections require fresh current-
head review; this earlier review cannot approve changed code.

| Actual finding | Disposition and evidence |
| --- | --- |
| [4438840988](https://github.com/Ljrr3045/rielia/pull/25#discussion_r4438840988): fork token scope | Accepted scope assumption; public metadata + anonymous immutable GETs, real-client namespace/credential/403/404/429/private regressions; quota limitation disclosed |
| [4438840994](https://github.com/Ljrr3045/rielia/pull/25#discussion_r4438840994): transient confirmation dismissal | Keep required fail-closed dismissal; reject preserving unverified approval, correct inaccurate stale wording, test transient read with dismissal success/failure |
| [4438840996](https://github.com/Ljrr3045/rielia/pull/25#discussion_r4438840996): tool shape | Accept only absent tools or an actual empty array; null/object/nonarray/length-zero-object negative checks |
| [4438840998](https://github.com/Ljrr3045/rielia/pull/25#discussion_r4438840998): canary evidence | Unique task-temp canary, presence-detector self-check, valid pinned Bash command schema, absent before/after both actual CLI runs |

The smoke's fake malicious command uses only the pinned
[Bash input schema](https://github.com/anomalyco/opencode/blob/810c0eba1a7348036f8bdf61e6632d0c36c6876c/packages/core/src/tool/bash.ts)
and an owned temporary path. Filesystem uncertainty fails the absence check;
the canary and CLI homes are removed in cleanup. These are fake-provider local
checks, not permission to execute PR code or post model-trigger comments.

The four findings themselves exposed a bounded follow-up input issue: complete
raw discussion JSON measured 94,701 bytes, including 79,482 characters of server
diff hunks; the former 80,000-character guard marked it truncated. The coordinator
explicitly raised `LIMITS.discussionBytes` to **512,000 actual UTF-8 bytes**.
Every raw authored body, identity, thread/binding, metadata and diff hunk below
that bound is retained; no new encoding, normalizer or evidence deletion is used.
Above it the existing honest incomplete fallback still prevents approval.
The captured current `bf3ce99` files occupy 797,715 JSON bytes; complete parent
input is 912,518 bytes including that discussion, and projected user input is
648,368 bytes. Mutable discussion may grow; larger input can lengthen review and
does not guarantee completion. Exact-bound and multibyte-overflow regressions
verify the finite byte guard rather than silently clearing limitations.

On 2026-11-02, exact `390cff2` passed [support CI41390031083](https://github.com/Ljrr3045/rielia/actions/runs/41390031083),
[product CI41390031068](https://github.com/Ljrr3045/rielia/actions/runs/41390031068)
and independent immutable source audit with40 focused tests/pinned fake wire.
These dated results apply to that head only. The eighth
[run41391130696, attempt1](https://github.com/Ljrr3045/rielia/actions/runs/41391130696/attempts/1)
then passed App/preparation and a4s complete control but failed full generation
after20m37s: `JSONL_FINISH_MULTIPLE`, two distinct complete finish IDs, unknown+
stop reasons, zero text; token totals are unavailable for multiple completions.
Publication was skipped and cleanup passed. No provider/gateway/context cause
is established; no parser relaxation or reasoning-to-answer conversion occurred.

Root authorized exactly one unchanged
[attempt2](https://github.com/Ljrr3045/rielia/actions/runs/41391130696/attempts/2).
It succeeded and published App [CHANGES_REQUESTED5732507392](https://github.com/Ljrr3045/rielia/pull/25#pullrequestreview-5732507392)
on `390cff2` at2026-11-02T05:40:20Z, with four new inline findings:

| Actual finding | Bounded disposition |
| --- | --- |
| [4439247089](https://github.com/Ljrr3045/rielia/pull/25#discussion_r4439247089): merge-base status hides an existing snapshot side | Read every existing head/base entry even for removed/added status; retain required-side errors and explicit limitations for directories, symlinks or unavailable blobs; regression covers divergent full text, modes, absent legitimate sides and lossless projection |
| [4439247096](https://github.com/Ljrr3045/rielia/pull/25#discussion_r4439247096): title/body truncation | Keep the existing2,000/12,000 bounds; mark either cut as incomplete COMMENT, with exact-bound, missing/null and Unicode-overflow regressions |
| [4439247102](https://github.com/Ljrr3045/rielia/pull/25#discussion_r4439247102): collaborator endpoint token permission | Do not add Administration or widen credentials. On2026-11-02, [official endpoint documentation](https://docs.github.com/en/rest/collaborators/collaborators#get-repository-permissions-for-a-user) specifies Metadata read for App installation tokens. Existing workflow/token routing and fail-closed authorization remain; real GITHUB_TOKEN/App endpoint acceptance is pending a separately authorized preflight |
| [4439247104](https://github.com/Ljrr3045/rielia/pull/25#discussion_r4439247104): stale progress | Replace current pending-CI wording with dated390 results and both actual attempt outcomes; changed source still requires its own audit, CI and current-head review |

These corrections add three focused regressions (43 total). They do not claim
that old-head checks or either CHANGES_REQUESTED review approves the changed
source. Root owns technical replies, invocation, activation and merge; automatic/
fork/question/inline acceptance and T11 remain OPEN.

At exact `ce20845`, both [support CI41396562223](https://github.com/Ljrr3045/rielia/actions/runs/41396562223)
and [product CI41396562272](https://github.com/Ljrr3045/rielia/actions/runs/41396562272)
plus independent audit passed. On2026-11-02,
[run41397290916](https://github.com/Ljrr3045/rielia/actions/runs/41397290916)
proved the existing Actions and App clients can authorize the owner through the
Metadata-read endpoint, including token revocation; its complete tiny control
also passed. Full generation then failed `REVIEW_FINDING` after32m20, publisher
SKIPPED/cleanup PASS, with no new App review on that head. The generic code does
not identify the rejected finding field or line; no cause is established.

Root authorized explicit existing summary20000/body8000 UTF-16/nonblank limits
and exact path/side/integer rules in the trusted policy, plus sorted/coalesced
inclusive LEFT/RIGHT ranges derived only from original full patches. A separate
model-prompt section carries these ranges; its path strings and every INPUT
string remain untrusted data. LEFT is merge-base diff position, not current-base
whole-text position. Full parent, original patches, project/expand equality and
accepted-result guards remain unchanged: no remapping, dropping or shortening
findings.46 focused tests include boundaries, gaps/sides/divergent base, encoded
patches, hostile path data and process-level static-code redaction. This is a
prospective contract clarification, not a proven fix for the failed run; fresh
head audit/CI/root-authorized live review remain required.

Historical2026-11-02 checkpoint: exact `4c88974` passed both CIs and independent
audit, then [run41403692735](https://github.com/Ljrr3045/rielia/actions/runs/41403692735)
completed generation (19m21), App publication and cleanup. App
[CHANGES_REQUESTED5733195211](https://github.com/Ljrr3045/rielia/pull/25#pullrequestreview-5733195211)
at07:22:04Z raised three findings: ambiguous approval-write recovery, revocation
masking the primary failure, and stale current-table wording. The bounded
corrections above retain no-repeat writes and failed-gate semantics, add real-
client failure regressions (50 focused checks total), and separate historical
checkpoints from the live PR gate. This review does not approve changed code;
new source still requires its own audit/CI/current-head review.

Historical 2026-11-02 checkpoint: exact `410e069` passed support
[CI41408268722](https://github.com/Ljrr3045/rielia/actions/runs/41408268722), product
[CI41408268838](https://github.com/Ljrr3045/rielia/actions/runs/41408268838) and
independent audit. [Run41409281560](https://github.com/Ljrr3045/rielia/actions/runs/41409281560)
completed generation (18m34), App publication and cleanup; App
[CHANGES_REQUESTED5733637006](https://github.com/Ljrr3045/rielia/pull/25#pullrequestreview-5733637006)
at 08:13:17Z raised BOM decoding loss, ambiguous coordinator/manual authorization
wording and ordinary issue plan-job starts. The next bounded corrections retain
runtime permission checks and every review/freshness gate. Actual post-review
discussion measured 498,466/512,000 raw JSON bytes with 13,534 bytes remaining,
18/18 files and no input limitations; no capacity workaround was used. This is
historical measurement and review evidence, not approval of changed source or
completed event acceptance.

Historical 2026-11-02 checkpoint: exact `111c70e` passed both CIs and independent
audit. [Run41414538419](https://github.com/Ljrr3045/rielia/actions/runs/41414538419)
completed generation (20m18), App publication and cleanup. Complete App
[CHANGES_REQUESTED5734110898](https://github.com/Ljrr3045/rielia/pull/25#pullrequestreview-5734110898)
at 08:59:07Z raised reply coverage, literal host-metadata rendering and expected
manual-authorization denial. The bounded corrections above preserve every
formal-review gate and add focused reply/publication/error-path regressions.
Post-review full raw discussion measured 621,484 bytes, exceeding the then-current
512,000 bound; no history was deleted or truncated to establish approval.
The coordinator authorized a single bounded increase to 1,024,000 actual UTF-8
bytes, leaving 402,516 bytes at that captured history size. Exact 1,024,000 and
1,024,001-byte ASCII/multibyte preparation regressions preserve every raw field
at/below the bound and keep overflow incomplete. Pagination, file/patch bounds,
model/max/output/time limits and formal approval rules stay unchanged. This
addresses a measured local coverage bound, not a provider token-capacity guarantee.
Changed source needs fresh immutable audit, CI and complete current-head review.

The diagnostic follow-up preserves strict parsing/coverage and adds only
allowlisted static failure codes. Main logs a fixed sentence containing a code
and, for rejected completion or timeout only, the bounded primitive metadata above;
publication may add fixed recovery categories or a revocation category and
confirmed/unconfirmed outcome flag;
it never prints raw stdout/stderr, model text, provider responses, exception
message/stack or credential values. Unknown exceptions and unrecognized shapes
remain generic. Temporary generation state is still removed.

| Static code | Meaning; every case fails closed |
| --- | --- |
| `CLI_SPAWN`, `CLI_EXIT`, `CLI_INPUT` | Child start failure, nonzero/signal exit without a recognized structured model error, or failed prompt input |
| `CLI_TIMEOUT`, `CLI_OUTPUT_LIMIT` | Fixed model deadline or combined stdout/stderr byte bound reached |
| `MODEL_HTTP_AUTH`, `MODEL_HTTP_LIMIT` | Structured numeric HTTP 401/403 or 429 in an error event |
| `MODEL_HTTP_REQUEST`, `MODEL_HTTP_SERVER` | Structured numeric HTTP 400/422 or 5xx in an error event |
| `MODEL_ERROR_EVENT`, `MODEL_TOOL_EVENT` | Other model/CLI error event or prohibited tool event |
| `JSONL_PARSE`, `JSONL_ENVELOPE` | Invalid JSONL or invalid/empty event envelope |
| `JSONL_FINISH_*` | Missing/multiple finishes or one non-stop reason, with only the finite codes and bounded metadata above |
| `JSONL_TEXT_MISSING`, `JSONL_TEXT_MULTIPLE`, `JSONL_TEXT_SHAPE` | Missing, multiple, or non-string text events |
| `REVIEW_JSON_PARSE`, `REVIEW_JSON_FENCE` | Invalid review JSON; the latter indicates an outer Markdown fence, which remains rejected |
| `REVIEW_SCHEMA`, `REVIEW_BINDING`, `REVIEW_COVERAGE` | Invalid result shape, wrong head/base, or mismatched reviewed-file set |
| `REVIEW_FINDING_COUNT`, `REVIEW_FINDING_SHAPE` | Too many findings or a finding that is not an object |
| `REVIEW_FINDING_PATH`, `REVIEW_FINDING_SIDE`, `REVIEW_FINDING_LINE`, `REVIEW_FINDING_BODY` | Unknown path, invalid side, ineligible/noninteger line, or invalid/blank/oversized body; no field values or exception text are emitted |
| `REVIEW_FINDING` (historical), `REVIEW_VERDICT` | Earlier generic finding failure; inconsistent findings/verdict/reply remains rejected |
| `REVIEW_INCOMPLETE` | Published COMMENT has incomplete coverage; the review gate remains failed |
| `APPROVAL_RECOVERY_READ_FAILED`, `APPROVAL_RECOVERY_NOT_OBSERVED`, `APPROVAL_RECOVERY_DISMISS_FAILED`, `APPROVAL_RECOVERY_DISMISS_REQUESTED` | Secondary static recovery status; never proves an approval cannot remain or turns a failed attempt into success |
| `APP_TOKEN_REVOCATION_FAILED` | Secondary cleanup failure preserves the primary error; cleanup-only failure explicitly distinguishes previously confirmed publication |
| `REVIEW_CONFIGURATION`, `REVIEW_OBSOLETE`, `REVIEW_UNKNOWN` | Missing/invalid required generation configuration, stale PR/request, or unclassified failure |

The numeric HTTP field follows the pinned
[CLI error serialization](https://github.com/anomalyco/opencode/blob/810c0eba1a7348036f8bdf61e6632d0c36c6876c/packages/opencode/src/session/message-v2.ts).
Only those finite groups are emitted, including when a structured error also
causes CLI exit 1. No message/body is inspected to guess a cause, and an auth
category does not prove a particular key is wrong. A nonzero CLI exit never
becomes successful review even if stdout contains plausible review JSON.

All 59 focused event/auth/review/diagnostic/trust/representation checks pass on
Node 24.22.1. A real adapter-process test uses an inert fake executable with
secret-shaped strings, provider URLs and workflow commands in both streams;
only the expected static code appears and no result artifact is written.
No paid model or live App call is part of that check. Previous source audit/CI
at `14cc8ab` does not approve the new diagnostic head; independent review and
root-approved live feedback remain required before another bootstrap attempt.
An independent actual-CLI loopback probe also observed one stop finish on normal
responses, one length finish with no continuation, and distinct unknown+stop
finishes when the CLI continued after an unknown result. Split reasoning and
final usage chunks did not produce duplicate IDs in those fixtures. These fake-
provider observations do not establish the live run's reason/count. Pinned CLI
request preparation defaults to a32,000-token output cap; the authorized fixed
384,000 cap supersedes the earlier 128,000 experiment while retaining `max`.
New-head review and actual Go acceptance/completion evidence remain required.

Local evidence: 59 event/auth/fork/main-exclusion/relay/coverage/verdict/current-
head/base-race/token-isolation/diagnostic tests pass; all workflows pass checksum-pinned
actionlint 1.7.12; immutable handoff and whitespace checks pass. The real CLI
1.19.5 macOS archive was verified with SHA-256
`c1c9e62521192192ef4c3ed1355ada2144055bddb61682217e997b03c55203c1`.
Its loopback fake-provider smoke verifies the projected wire payload decodes to
the full unchanged parent, the dedicated system policy and untrusted tags,
JSONL transport, effective review `max`
and the fixed 384,000 output cap on the wire,
no exposed tools and rejection of an unsolicited malicious tool call. It uses
only generated fake credentials and no local auth. This does **not** verify Go
billing/inference, App exchange, fork event delivery or real GitHub publication.

Independent SOL audit identified the Contents API symlink/mode gap; Git commit/
tree/blob reads now pass mode-only, misleading dereferenced-symlink and truncated-
tree regressions. [PR #25](https://github.com/Ljrr3045/rielia/pull/25) tracks final
audit/CI evidence. Initial Linux support CI
[41367097671](https://github.com/Ljrr3045/rielia/actions/runs/41367097671) passed
at `ffdfae02`; later source changes need fresh evidence. Initial feature-push
[review 41367051504](https://github.com/Ljrr3045/rielia/actions/runs/41367051504)
failed with `MODULE_NOT_FOUND` because trusted default `dev` lacks the adapter
before bootstrap merge. No model/App call ran; this is not successful review.

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
2. Independently review this infrastructure PR and pass no-secret CI. Normal
   workflows load trusted support from `dev`/default. The user/coordinator has
   explicitly authorized a one-time bootstrap exception: a temporary branch
   with independently audited immutable support and a fixed PR/head target for
   a manual run. Only the coordinator accepts the pins and authorizes each
   attempt; no PR code executes. Satisfy normal repository-required approval/
   code-owner rules and record actual results; no direct merge, admin bypass,
   protection weakening, pretend review or Kody trigger is authorized.
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
