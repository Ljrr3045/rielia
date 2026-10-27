# T03.0 / B0 local MCP transport experiment

Status: bounded local stdio spike on the provisional fixture, authorized by the
coordinator while the user's stack decision remains pending. It adds one
experimental read-only diagnostic, `rielia_health`, which calls the existing
`GET /api/v1/health` REST route. Its result is exactly
`{"status":"ok","service":"rielia-api"}`. This is **process liveness only**:
it proves neither authentication, database health, product readiness, nor user
capabilities. Tool descriptions say so explicitly. There is no task data.

Traceability: architecture §5 and T03/B0, with T02 required for the future remote
auth portion. P12/P13/US10 remain future task/planning operations; P21/US17 remain
remote OAuth/discovery work; P38/US24/US25 remain identity/authorization boundaries,
not features satisfied by public health. The package is not the T13 catalog,
full T03 acceptance, or B0's signed-in task/agent vertical. It ratifies no stack
or license decision.

## Pins and official research

Verified 2026-10-26 against official documentation, package manifests and registry
metadata. Every direct external dependency is exact; the lockfile fixes transitive
versions and integrity. Existing Node 24.22.1/pnpm 12.15.0 satisfy both engines.

| Package | Pin | Evidence and use |
| --- | --- | --- |
| `@modelcontextprotocol/server` | 2.4.0 | [Official October 23 release](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/v2.4.0), [registry](https://registry.npmjs.org/@modelcontextprotocol/server/2.4.0); Node ≥20, core 2.4.0 and Zod ^4.2.0. Uses v2 `McpServer.registerTool` and factory-based [`serveStdio`](https://ts.sdk.modelcontextprotocol.io/v2/serving/stdio). |
| `@modelcontextprotocol/client` / `core` | 2.4.0 / 2.4.0 | [Client registry](https://registry.npmjs.org/@modelcontextprotocol/client/2.4.0), [core registry](https://registry.npmjs.org/@modelcontextprotocol/core/2.4.0). Development-only SDK child-process tests; core is pinned alongside client/server. |
| `zod` | 4.6.7 | [Registry](https://registry.npmjs.org/zod/4.6.7). Strict empty input and literal output schemas satisfy SDK v2's schema API. |
| `@modelcontextprotocol/inspector` | 2.12.0 | [Official repository](https://github.com/modelcontextprotocol/inspector), [registry](https://registry.npmjs.org/@modelcontextprotocol/inspector/2.12.0), [CLI guide](https://github.com/modelcontextprotocol/inspector/blob/main/clients/cli/README.md). Development-only independent terminal client, Node ≥22.19.0. Its own SDK client/core/server dependencies are 2.3.1, not our 2.4.0 test client. |

Inspector ships built CLI/web/TUI clients. Inspection of its published
`scripts/install-clients.mjs` confirmed the postinstall exits immediately under
`node_modules`; it installs subclients only in a source checkout. The unnecessary
script is explicitly disabled for **2.12.0 only** in `allowBuilds`. No dependency
agent skill was enabled, and no other lifecycle permission was added. This does
not adopt any upstream repository's contributor workflow or license for Rielia.

## Build and run

From the repository root, using the pinned toolchain:

```sh
pnpm install --frozen-lockfile
pnpm --filter @rielia/contracts build
pnpm --filter @rielia/api build
pnpm --filter @rielia/mcp-local build

# Terminal 1: actual Nest fixture, identity disabled; stop with Ctrl-C.
IDENTITY_ENABLED=false HOST=127.0.0.1 PORT=3001 node apps/api/dist/main.js

# Terminal 2: a host launches this command, keeping stdin open for protocol.
RIELIA_API_ORIGIN=http://127.0.0.1:3001 RIELIA_MCP_ALLOW_LOOPBACK_HTTP=true \
  node packages/mcp-local/dist/main.js
```

The host-facing executable is `node packages/mcp-local/dist/main.js`, resolved
relative to this repository. Use the corresponding absolute path in a host you
configure yourself. Build first; a package manager/build log must not be placed
on the protocol pipe. Package `start` is also available for manual operation.
Nothing is published, no host is configured automatically, and no machine-wide
settings, global client configuration or credential store is changed.

`RIELIA_API_ORIGIN` is required, supplied by the operator, and accepts an HTTPS
origin (optional trailing slash). Paths, userinfo (including empty userinfo),
queries, fragments and other schemes are rejected before serving MCP. The fixed
path is always `/api/v1/health`. HTTP is rejected unless
`RIELIA_MCP_ALLOW_LOOPBACK_HTTP=true` **and** the parsed host is `127.0.0.1` or
`[::1]`; this is only a local fixture allowance. `localhost` and other plaintext
hosts are rejected. The allowance accepts only `true`, `false` or absence.

HTTPS uses Node's normal certificate and hostname validation. The wrapper does
not add credentials, cookies, custom certificate trust, or proxy behavior.
Configure normal installation trust separately when appropriate; never disable
TLS verification. The tool takes no arguments, so a model cannot choose an
address, route, headers, credentials, or authentication identity.

## Independent terminal client

The pinned official Inspector runs in **non-UI CLI mode**, using no listening
Inspector socket. Create disposable settings, even though this stdio health tool
uses no OAuth. Use the same flags for each method:

```sh
session_dir=$(mktemp -d)
printf '{}\n' > "$session_dir/client.json"
MCP_INSPECTOR_SECRET_STORE=memory \
MCP_INSPECTOR_OAUTH_STATE_PATH="$session_dir/oauth.json" \
MCP_CATALOG_PATH="$session_dir/catalog.json" \
  pnpm --filter @rielia/mcp-local exec mcp-inspector --cli \
  --client-config "$session_dir/client.json" \
  --stored-auth-only --format json --quiet --protocol-era legacy \
  --connect-timeout 5000 --method initialize \
  -e RIELIA_API_ORIGIN=http://127.0.0.1:3001 \
  -e RIELIA_MCP_ALLOW_LOOPBACK_HTTP=true \
  node dist/main.js
```

`pnpm --filter ... exec` uses the package working directory, hence `dist/main.js`
above. Repeat with `--method tools/list`, then
`--method tools/call --tool-name rielia_health`. Repeat all three with
`--protocol-era modern`. Inspector's JSON stdout is an envelope:
`{"result":{"protocolVersion":"2025-11-25",...}}` for legacy initialization;
tool calls contain `result.structuredContent`. The automated command below
creates isolated settings, supplies the pinned Node executable directly, runs
these six actual CLI invocations, asserts their output and removes its temporary
files and task-owned Nest processes, avoiding manual setup:

```sh
pnpm test:mcp
```

## Transport and failure contracts

The wrapper imports SDK/schema, public contracts and Node HTTP facilities only;
there is no Nest, Prisma, database or domain import and no listening socket.
It uses the existing public contract guard then **projects only two literals**;
extra endpoint fields, including instruction-like text, are discarded. Read-only
annotations describe behavior and confer no authorization.

Each GET has a **2,000 ms total deadline**, **4,096-byte body limit**, 8,192-byte
response-header limit and JSON content-type requirement. Encoded/compressed
bodies are rejected. HTTP redirects are not followed (including same-origin
redirects). Dedicated request sockets close after completion/error/cancellation;
there are no retries or background polling. Stdio input buffering is capped at
16 KiB. Successful output is the bounded JSON text plus matching
`structuredContent`; it never includes arbitrary upstream text.

| Failure | Public result |
| --- | --- |
| Invalid operator configuration | Exit 1, generic startup diagnostic on stderr, no protocol stdout |
| Unknown tool / non-object or extra tool arguments | SDK tool/protocol error; no HTTP request |
| Refused connection, TLS failure, aborted/truncated response | `isError: true`, text `LIVENESS_UNAVAILABLE` |
| Total deadline, including stalled body | `LIVENESS_TIMEOUT` |
| Client cancellation | HTTP aborted; `LIVENESS_CANCELLED` if a response is still permitted by the protocol |
| HTTP status other than 200, including redirects | `LIVENESS_HTTP_ERROR` |
| Invalid JSON, public shape, content type or content encoding | `LIVENESS_INVALID_RESPONSE` |
| Body exceeds limit | `LIVENESS_TOO_LARGE` |

Tool failures contain no URL, raw body, headers, environment values, stack trace
or secrets. Configuration/transport diagnostics are generic and go to stderr;
stdout is reserved for MCP JSON-RPC. Transient failure does not poison the
connection: a subsequent healthy call succeeds. Closing stdin, SIGINT or SIGTERM
closes the SDK handle and aborts active upstream requests; there is no persistent
HTTP pool. The test harness also tracks its own child groups for signal cleanup.

## Observed evidence and limits

Local evidence on 2026-10-26, Node 24.22.1/pnpm 12.15.0:

| Client/check | Transport / backend | Observed result |
| --- | --- | --- |
| Official SDK client 2.4.0, default legacy | Child-process stdio → real Nest over explicit loopback HTTP | Actual negotiated `2025-11-25`; initialize/list/call pass, one tool and exact health output |
| Official SDK client 2.4.0, pinned modern | Same | Actual negotiated `2026-07-28`; list/call pass |
| **Official Inspector 2.12.0 CLI**, legacy | Independent terminal process → stdio → real Nest over loopback HTTP | Actual initialize result `2025-11-25`; list/call pass |
| **Official Inspector 2.12.0 CLI**, modern | Same | Actual initialize result `2026-07-28`; list/call pass |
| Raw JSON-RPC subprocess | Controlled loopback HTTP fixtures | Unknown tool/invalid args cause no HTTP; malformed/incorrect JSON, HTTP 503, oversized body, redirect, wrong content type, unavailable and stalled body return bounded errors; healthy retry projects only public fields |
| Shutdown and cancellation | Active stalled HTTP request | Client cancellation, EOF, SIGINT and SIGTERM release socket promptly; child exit and Nest port closure asserted |
| HTTPS negative case | Ephemeral self-signed local HTTPS fixture | Untrusted certificate rejected before HTTP handler; sanitized failure. No trusted remote HTTPS success was exercised |

The focused suite has 17 passing checks (including four shutdown and four upstream
lifecycle subtests), about 10 seconds locally, with a 60-second per-test timeout. It is included after builds
in `pnpm check`, so existing CI runs the actual Nest/SDK/Inspector integration.
The suite needs loopback permission and `openssl` for an ephemeral TLS test
certificate; it requires no DB or user/provider credentials. Sandboxed listeners
initially returned EPERM; those attempts are failures, and only the authorized
rerun counts. An initial harness cleanup ordering failure was corrected before
recording passing evidence; it did not indicate a runtime protocol defect.
Full `pnpm check`, frozen install, 20 existing real-library/PostgreSQL identity
checks (simulated provider HTTP), handoff verification (47 files/30 assets),
dependency audit (no known vulnerabilities) and whitespace checks also passed.

Kody's [truncated-body finding](https://github.com/Ljrr3045/rielia/pull/8#discussion_r4381459140)
was not reproduced on Node 24.22.1: fixed-length FIN, chunked FIN and mid-body
reset each return `LIVENESS_UNAVAILABLE` in about 30 ms through the built wrapper.
An open stalled body instead reaches the 2-second deadline. The existing response
`error` handler already covers the documented post-`aborted` `ECONNRESET` event;
see [Node's HTTP event contract](https://nodejs.org/docs/latest-v24.x/api/http.html#httprequestoptions-callback).
The retained wire regression checks this distinction without adding redundant
runtime handlers. The earlier review/check attached to a previous head does not
approve the regression's new head; current-head results remain in the PR.

PR #8 subsequently merged on 2026-10-26T19:31:05Z as `cb92d90`, after final
reviewed head `7ead11b` and [Kody approval 5657821543](https://github.com/Ljrr3045/rielia/pull/8#pullrequestreview-5657821543).
The coordinator removed its completed worktree. T04.0's later reconciliation
verified the merge/review through GitHub and the removal through Orca inventory;
this bounded delivery still closes no full T03 acceptance.

This matrix applies only to these tested versions and stdio profiles. No Cursor,
Claude Desktop, other host, universal client compatibility, real remote HTTPS
backend, remote MCP/Streamable HTTP, OAuth discovery/consent/PKCE/revocation,
PAT/service token, domain permissions or task/agent workflow was tested. Those
remain future T02/T03/T13/T20/T35 work in dependency order. Full T01/B0 real-user
validation, stack ratification, license and installation OAuth decisions remain
open. PR checks and current-head coordinator-triggered Kody evidence belong in
the PR and [progress](progress.md), without self-referential commit updates here.
