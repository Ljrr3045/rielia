#!/usr/bin/env python3
"""Offline checks for the immutable T00 handoff and repository file links."""

import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
HANDOFF = ROOT / "docs/handoff"
INVENTORY = ROOT / "docs/development/handoff-files.sha256"


def files_under(directory):
    return {p.relative_to(directory).as_posix(): p for p in directory.rglob("*") if p.is_file()}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class FileLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        self.links.extend(value for key, value in attrs if key in ("href", "src", "xlink:href") and value)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, help="Optional original directory for direct byte comparison")
    args = parser.parse_args()
    errors = []
    expected = {}
    for line in INVENTORY.read_text(encoding="utf-8").splitlines():
        sha, separator, name = line.partition("  ")
        if not separator or not re.fullmatch(r"[a-f0-9]{64}", sha) or name in expected:
            errors.append("Malformed or duplicate inventory entry")
            continue
        expected[name] = sha
    actual = files_under(HANDOFF)
    if len(expected) != 47:
        errors.append(f"Expected the original 47-file inventory, got {len(expected)}")
    for name in sorted(expected.keys() - actual.keys()):
        errors.append(f"Missing imported file: {name}")
    for name in sorted(actual.keys() - expected.keys()):
        errors.append(f"Unexpected imported file: {name}")
    for name in sorted(expected.keys() & actual.keys()):
        if actual[name].is_symlink() or digest(actual[name]) != expected[name]:
            errors.append(f"Changed imported file: {name}")

    manifest = json.loads((HANDOFF / "assets/manifest.json").read_text(encoding="utf-8"))
    assets = manifest["assets"]
    if len(assets) != 30:
        errors.append(f"Expected 30 manifest assets, got {len(assets)}")
    for asset in assets:
        path = HANDOFF / "assets" / asset["path"]
        if not path.is_file() or path.stat().st_size != asset["bytes"] or digest(path) != asset["sha256"]:
            errors.append(f"Asset manifest mismatch: {asset['path']}")

    source_note = ""
    if args.source:
        source = args.source.resolve()
        if not source.is_dir():
            errors.append(f"Source directory does not exist: {source}")
        else:
            originals = files_under(source)
            if originals.keys() != actual.keys():
                errors.append("Source/import file sets differ")
            source_dirs = {p.relative_to(source) for p in source.rglob("*") if p.is_dir()}
            target_dirs = {p.relative_to(HANDOFF) for p in HANDOFF.rglob("*") if p.is_dir()}
            if source_dirs != target_dirs:
                errors.append("Source/import directory sets differ")
            for name in sorted(originals.keys() & actual.keys()):
                if originals[name].read_bytes() != actual[name].read_bytes():
                    errors.append(f"Source/import bytes differ: {name}")
            source_note = "; original directory compared directly"

    documents = set(ROOT.glob("*.md")) | set((ROOT / "docs").rglob("*.md"))
    documents.add(ROOT / ".github/pull_request_template.md")
    documents.update(HANDOFF.rglob("*.html"))
    documents.update(HANDOFF.rglob("*.svg"))
    link_count = 0
    for document in sorted(documents):
        content = document.read_text(encoding="utf-8")
        if document.suffix == ".md":
            # Current docs use inline links. Remove code examples before checking.
            content = re.sub(r"```.*?```", "", content, flags=re.DOTALL)
            links = re.findall(r"!?\[[^\]\n]*\]\(([^)\n]+)\)", content)
        else:
            html = FileLinks()
            html.feed(content)
            links = html.links
        for link in links:
            target = link.strip().split(' "', 1)[0].strip("<>")
            url = urlsplit(target)
            if url.scheme or url.netloc or not url.path:
                continue
            destination = (document.parent / unquote(url.path)).resolve()
            link_count += 1
            if not destination.is_relative_to(ROOT) or not destination.exists():
                errors.append(f"Missing/outside local link in {document.relative_to(ROOT)}: {target}")

    if errors:
        print("\n".join(f"FAIL: {error}" for error in errors), file=sys.stderr)
        return 1
    print(f"PASS: {len(actual)} imported files match SHA-256 inventory{source_note}")
    print(f"PASS: {len(assets)} asset manifest hashes and sizes")
    print(f"PASS: {link_count} local file links in {len(documents)} documents")
    print("Scope: offline file targets only; remote URLs and heading fragments are not checked.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
