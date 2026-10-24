# T00 handoff import record

Imported on 2026-10-24 from the user-supplied `rielia-agent-handoff` directory
without modifying the original source. All 47 files (2,435,020 bytes) and four
subdirectories were copied, including the bilingual entry point, six English/
Spanish document pairs, both HTML galleries, generation prompt, original asset
manifest, and 30 SVG/PNG/WebP assets. No source file was omitted or rewritten.

The complete source-relative file set and SHA-256 values were captured before
copying in [handoff-files.sha256](handoff-files.sha256). The source was checked
again after copying; the destination and source matched that initial snapshot.
The asset manifest retains `proposed identity; final approval pending`. The old
landing prototype is absent in the supplied source; T00 does not recreate it.

The imported START HERE mentions historical `sources/` and synchronized AGENTS
references; neither is a file/directory in this supplied package. They were not
invented or imported from elsewhere. Repository instructions live separately in
[AGENTS.md](../../AGENTS.md). The archive's illustrative future `docs/` paths are
left verbatim; effective instructions use `docs/handoff/`.

## Reproduce

Run from any location using the script's absolute or relative path. It locates the
repository relative to itself and requires Python 3.9+ with the standard library.

```sh
python3 scripts/verify-handoff.py
```

If the original directory is available, pass it explicitly for a complete file/
directory-set and byte comparison. Replace the example path with your source:

```sh
python3 scripts/verify-handoff.py --source /path/to/rielia-agent-handoff
```

This does not write to either directory. Hash comparison against the captured
inventory is always performed, including when `--source` is supplied. The check
also validates the 30 asset manifest hashes/sizes and local file targets in root
and development Markdown, the PR template, imported Markdown, HTML, and SVG.
Remote URL availability and heading fragments are outside this check; no new
research, browser inspection, runtime verification, or compatibility certification
is implied by the import.

[Git attributes](../../.gitattributes) disable text conversion for the archive,
preserving its bytes across Git configurations. The imported Markdown's original
63 lines with trailing whitespace are preserved (including hard line breaks).
Only those Markdown paths disable `blank-at-eol`; normal whitespace checks remain
active for new repository docs. Do not normalize the archive to satisfy a linter.

## Evidence and later decisions

Current validation and PR evidence are recorded in [progress](progress.md).
The base review workflow came from `origin/dev` commit
`188a760c36f8ec6d09f10f5027d162facce13875`. The coordinator authorized a narrow
T00 repair after the reviewer failed: move model resolution from step to job
environment scope. That exception does not change the imported archive, triggers,
permissions, provider restriction, credentials handling, or review-only behavior.

Do not refresh the inventory after an accidental edit. Restore the imported file
and rerun the check. Later corrections or ratifications belong in separate
development records with source references and decision ownership; a separately
authorized replacement archive must document provenance and baseline changes.
