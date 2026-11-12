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

The initial fresh frontend session catalogued and explicitly loaded all three
intended local entries, alongside the preexisting global `ui-ux-pro-max` and an
unintended preserved-source entry. The preserved source is now archived under
`upstream/SKILL.md.txt`; post-fix fresh-session proof remains pending. Require the
explicit local top-level paths above for T37 dispatches: the catalog exposed both
local and global copies without a unique bare-name winner. Do not claim an
automatic override, edit global skills or infer discovery from a root session.

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
