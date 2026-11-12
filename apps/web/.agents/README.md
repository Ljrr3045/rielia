# Frontend-local skill snapshots

These three reviewed packages support T37 work on the existing web interface.
Read [web rules](../AGENTS.md) and the
[installation and discovery guide](../../../docs/development/frontend-skills.md)
before using their instructions. User/project/product/UX/brand/architecture rules
govern every suggestion; installing a package grants no execution or scope authority.

Start a **fresh frontend session with working directory `apps/web`**, then verify
that its skill catalog resolves each name to this checkout's `.agents/skills`:

- [frontend-design](skills/frontend-design/SKILL.md)
- [impeccable](skills/impeccable/SKILL.md)
- [ui-ux-pro-max](skills/ui-ux-pro-max/SKILL.md)

The preexisting global `ui-ux-pro-max` can differ from this package. Require the
local path for T37; if duplicate-name resolution is unclear, read the local file
explicitly and report automatic discovery as unverified. Do not edit global skills
or infer discovery from a root session. Fresh-session proof is pending separately.

Impeccable's engine/launchers, hooks, pin/update/doctor actions, live server/Apply
and bundled agent activation are **excluded**. Read its references directly and
use the existing Rielia context; do not run its setup command or a binary probe.
The launcher itself can fetch/execute binaries. Live-copy Apply must remain off;
no approvals/sandbox bypass, implicit agent launch or global change is authorized.

UI UX Pro Max's adapted `<skill-base-dir>` means the resolved directory containing
its local `SKILL.md`, not a literal shell variable. From `apps/web`, the reviewed
read-only form is:

```sh
python3 -B .agents/skills/ui-ux-pro-max/scripts/search.py "server components" --stack nextjs --json
```

Use generic, nonprivate queries and inspect relevance before applying guidance.
Do not use `--persist`, `--force`, catalog refresh, package installation, or generated
design-system authority as a side effect. No new font/icon/runtime dependency is
installed by the data catalogs. No optional third-party script other than this
reviewed read-only search is authorized by the snapshot installation.

From the repository root, verify offline with:

```sh
python3 -B scripts/verify-frontend-skills.py
python3 -B scripts/test_frontend_skills.py
```

[The manifest](skill-installation.json) records every file's source, SHA-256, size,
executable mode and the sole command-path adaptation. Preserve upstream resources
and notices; their licenses do not select Rielia's license. Never regenerate the
manifest to hide drift. Updates require a reviewed immutable revision and fresh
integrity/discovery evidence, not `npx latest` or a mutable branch installation.
