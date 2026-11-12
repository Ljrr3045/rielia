"""Focused integrity failure witnesses; no app code or vendored tools execute."""

import importlib.util
import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import unittest


SCRIPT = Path(__file__).with_name("verify-frontend-skills.py")
SPEC = importlib.util.spec_from_file_location("frontend_skills", SCRIPT)
VERIFIER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VERIFIER)


class FrontendSkillsIntegrity(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="rielia-skills-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        shutil.copytree(VERIFIER.ROOT / "apps/web/.agents", self.root / "apps/web/.agents")
        self.manifest = self.root / VERIFIER.MANIFEST
        self.skill = self.root / VERIFIER.SKILLS / "frontend-design"

    def edit_manifest(self, change):
        data = json.loads(self.manifest.read_text())
        change(data)
        self.manifest.write_text(json.dumps(data))

    def test_exact_snapshot(self):
        self.assertEqual(VERIFIER.verify(self.root)[0], 3)

    def test_changed_resource(self):
        (self.skill / "SKILL.md").write_text("unreviewed instructions")
        with self.assertRaisesRegex(ValueError, "Hash/size mismatch"):
            VERIFIER.verify(self.root)

    def test_missing_resource(self):
        (self.skill / "LICENSE.txt").unlink()
        with self.assertRaises(OSError):
            VERIFIER.verify(self.root)

    def test_unlisted_resource(self):
        (self.skill / "extra.sh").write_text("unreviewed")
        with self.assertRaisesRegex(ValueError, "Resource set mismatch"):
            VERIFIER.verify(self.root)

    def test_nested_skill_catalog_is_rejected_even_when_listed_in_manifest(self):
        target = self.skill / "archive/SKILL.md"
        target.parent.mkdir()
        shutil.copyfile(self.skill / "SKILL.md", target)
        def change(manifest):
            skill = next(s for s in manifest["skills"] if s["name"] == "frontend-design")
            entry = next(e for e in skill["files"] if e["path"].endswith("/SKILL.md"))
            skill["files"].append(dict(entry, path=target.relative_to(self.root).as_posix()))
        self.edit_manifest(change)
        with self.assertRaisesRegex(ValueError, "only three top-level SKILL.md"):
            VERIFIER.verify(self.root)

    def test_resource_symlink_even_to_same_bytes(self):
        source = self.skill / "SKILL.md"
        outside = self.root / "external.md"
        source.rename(outside)
        source.symlink_to(outside)
        with self.assertRaisesRegex(ValueError, "Symlink forbidden"):
            VERIFIER.verify(self.root)

    def test_directory_symlink(self):
        outside = self.root / "external"
        self.skill.rename(outside)
        self.skill.symlink_to(outside, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, "Symlink forbidden"):
            VERIFIER.verify(self.root)

    def test_manifest_symlink(self):
        outside = self.root / "external.json"
        self.manifest.rename(outside)
        self.manifest.symlink_to(outside)
        with self.assertRaisesRegex(ValueError, "Symlink forbidden"):
            VERIFIER.verify(self.root)

    def test_escaping_manifest_path(self):
        self.edit_manifest(lambda d: d["skills"][0]["files"][0].update(path="../external"))
        with self.assertRaisesRegex(ValueError, "Invalid manifest path"):
            VERIFIER.verify(self.root)

    def test_duplicate_manifest_entry(self):
        self.edit_manifest(lambda d: d["skills"][0]["files"].append(d["skills"][0]["files"][0]))
        with self.assertRaisesRegex(ValueError, "Duplicate or out-of-skill"):
            VERIFIER.verify(self.root)

    def test_unapproved_revision(self):
        self.edit_manifest(lambda d: d["skills"][0].update(revision="0" * 40))
        with self.assertRaisesRegex(ValueError, "reviewed skill revisions"):
            VERIFIER.verify(self.root)

    def test_mode_drift(self):
        (self.skill / "SKILL.md").chmod(0o755)
        with self.assertRaisesRegex(ValueError, "Executable mode mismatch"):
            VERIFIER.verify(self.root)

    def test_adaptation_cannot_hide_drift_with_only_an_installed_hash_change(self):
        path = VERIFIER.SKILLS + "/ui-ux-pro-max/SKILL.md"
        target = self.root / path
        target.write_text(target.read_text().replace(VERIFIER.NEW_SEARCH, "unreviewed.py"))
        data = target.read_bytes()
        def change(manifest):
            entry = next(e for s in manifest["skills"] for e in s["files"] if e["path"] == path)
            entry.update(sha256=hashlib.sha256(data).hexdigest(), bytes=len(data))
        self.edit_manifest(change)
        with self.assertRaisesRegex(ValueError, "Unexpected command-path adaptation"):
            VERIFIER.verify(self.root)


if __name__ == "__main__":
    unittest.main()
