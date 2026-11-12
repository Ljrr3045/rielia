#!/usr/bin/env python3
"""Verify the reviewed frontend-only skill snapshot offline; never execute it."""

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import stat
import sys


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = "apps/web/.agents/skill-installation.json"
SKILLS = "apps/web/.agents/skills"
ADAPTED_SKILL = SKILLS + "/ui-ux-pro-max/SKILL.md"
TRANSFORMATION = "codex-search-path-v1"
PINS = {
    "frontend-design": "ca45fc496a3436251f191354091d557da31c15b5",
    "impeccable": "c3bb418ee38ee49a6b999b7752c1368f3123a2bd",
    "ui-ux-pro-max": "b7d5353e0130feb8c5574ef1251f8a1db1873ccb",
}
OLD_SEARCH = '${CLAUDE_PLUGIN_ROOT}/.claude/skills/ui-ux-pro-max/scripts/search.py'
NEW_SEARCH = '<skill-base-dir>/scripts/search.py'
ADAPTATION = (
    "<!-- Rielia T37.1 adaptation: replace Claude plugin command paths with the "
    "resolved local skill base. Original: upstream/SKILL.md.txt; see ../../README.md. -->\n"
)


def safe_path(value):
    if not isinstance(value, str) or not value or any(c in value for c in "\\\x00:"):
        raise ValueError("Invalid manifest path")
    path = PurePosixPath(value)
    if path.is_absolute() or any(p in ("", ".", "..") for p in value.split("/")):
        raise ValueError("Invalid manifest path: " + value)
    return path


def regular(root, relative):
    path = root
    parts = safe_path(relative).parts
    for index, part in enumerate(parts):
        path = path / part
        mode = path.lstat().st_mode
        if stat.S_ISLNK(mode):
            raise ValueError("Symlink forbidden: " + relative)
        expected = stat.S_ISREG if index == len(parts) - 1 else stat.S_ISDIR
        if not expected(mode):
            raise ValueError("Nonregular path: " + relative)
    return path


def tree_files(directory):
    result = set()
    for path in sorted(directory.iterdir()):
        mode = path.lstat().st_mode
        if stat.S_ISDIR(mode):
            result.update(tree_files(path))
        elif stat.S_ISREG(mode):
            result.add(path)
        else:
            raise ValueError("Symlink or special resource forbidden: " + str(path))
    return result


def verify(root):
    root = root.resolve()
    manifest = json.loads(regular(root, MANIFEST).read_text(encoding="utf-8"))
    if manifest["schemaVersion"] != 1 or manifest["destination"] != SKILLS:
        raise ValueError("Unsupported manifest schema or destination")
    skills = manifest["skills"]
    if len(skills) != 3 or {s["name"]: s["revision"] for s in skills} != PINS:
        raise ValueError("Expected exactly the three reviewed skill revisions")
    transformations = [
        (entry.get("path"), entry["transformation"])
        for skill in skills for entry in skill["files"] if "transformation" in entry
    ]
    if transformations != [(ADAPTED_SKILL, TRANSFORMATION)]:
        raise ValueError("Expected exactly one " + TRANSFORMATION + " transformation at "
                         + ADAPTED_SKILL)
    expected = set()
    total_bytes = 0
    for skill in skills:
        name = skill["name"]
        prefix = SKILLS + "/" + name + "/"
        paths = set()
        for entry in skill["files"]:
            relative = entry["path"]
            safe_path(relative)
            safe_path(entry["sourcePath"])
            if not relative.startswith(prefix) or relative in expected:
                raise ValueError("Duplicate or out-of-skill resource: " + relative)
            for key in ("sha256", "sourceSha256"):
                if not re.fullmatch(r"[a-f0-9]{64}", entry[key]):
                    raise ValueError("Invalid SHA-256: " + relative)
            path = regular(root, relative)
            data = path.read_bytes()
            if len(data) != entry["bytes"] or hashlib.sha256(data).hexdigest() != entry["sha256"]:
                raise ValueError("Hash/size mismatch: " + relative)
            if bool(path.stat().st_mode & 0o111) != entry["executable"]:
                raise ValueError("Executable mode mismatch: " + relative)
            if relative == ADAPTED_SKILL:
                original = regular(root, prefix + "upstream/SKILL.md.txt").read_bytes()
                if hashlib.sha256(original).hexdigest() != entry["sourceSha256"]:
                    raise ValueError("Original source mismatch: " + relative)
                adapted = original.decode("utf-8").replace("\n---\n", "\n---\n\n" + ADAPTATION, 1)
                adapted = adapted.replace(OLD_SEARCH, NEW_SEARCH)
                if data != adapted.encode("utf-8") or OLD_SEARCH not in original.decode("utf-8"):
                    raise ValueError("Unexpected command-path adaptation: " + relative)
            elif entry.get("transformation") or entry["sha256"] != entry["sourceSha256"]:
                raise ValueError("Unrecorded source modification: " + relative)
            expected.add(relative)
            paths.add(relative[len(prefix):])
            total_bytes += len(data)
        required = {"SKILL.md", "LICENSE.txt" if name == "frontend-design" else "LICENSE"}
        if name == "impeccable":
            required.add("NOTICE.md")
        if not required.issubset(paths):
            raise ValueError("Missing skill/license/notice entry: " + name)
    # Checking a regular sentinel first validates every ancestor of the vendor root.
    regular(root, SKILLS + "/frontend-design/SKILL.md")
    actual = {p.relative_to(root).as_posix() for p in tree_files(root / SKILLS)}
    catalog = {p for p in actual if PurePosixPath(p).name.casefold() == "skill.md"}
    intended_catalog = {SKILLS + "/" + name + "/SKILL.md" for name in PINS}
    if catalog != intended_catalog:
        raise ValueError("Expected only three top-level SKILL.md catalog entries; got "
                         + str(sorted(catalog)))
    if actual != expected:
        raise ValueError("Resource set mismatch; missing=" + str(sorted(expected - actual))
                         + "; unexpected=" + str(sorted(actual - expected)))
    return len(skills), len(expected), total_bytes


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT, help="Repository root (also used by failure witnesses)")
    args = parser.parse_args()
    try:
        skills, files, size = verify(args.root)
    except (OSError, ValueError, KeyError, TypeError) as error:
        print("FAIL: " + str(error), file=sys.stderr)
        return 1
    print(f"PASS: {skills} pinned frontend skills; {files} exact files; {size} bytes; exactly three top-level SKILL.md entries; no symlinks/extra resources")
    print("Scope: reviewed local manifest integrity, not upstream authenticity or fresh-session discovery.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
