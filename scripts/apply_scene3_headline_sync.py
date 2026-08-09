from __future__ import annotations

import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = ROOT / "render-specs/2026-08-06/render_spec.json"
PACKAGE = ROOT / "episode-packages/2026-08-06/episode_package_2026-08-06.md"
PKG = ROOT / "package.json"
SELF = Path(__file__).resolve()


def fingerprint(data: dict) -> list[tuple[str, str, str]]:
    return [
        (c["chunkId"], c["speechText"], c["captionText"])
        for s in data["scenes"]
        for c in s["narrationChunks"]
    ]


data = json.loads(SPEC.read_text(encoding="utf-8"))
before = fingerprint(data)
scene3 = next(s for s in data["scenes"] if s["sceneId"] == "scene-03")
scene3["headline"] = "AMD決算｜実績と見通し"
changes = data.setdefault("review", {}).setdefault("changesApplied", [])
change = "Scene 3のScene見出しをQ2実績とQ3見通しの両Beatを包む表現へ統一"
if change not in changes:
    changes.append(change)
if fingerprint(data) != before:
    raise RuntimeError("Scene 3 headline sync changed narration/captions")

spec_text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
SPEC.write_text(spec_text, encoding="utf-8")
spec_sha = hashlib.sha256(spec_text.encode("utf-8")).hexdigest()

md = PACKAGE.read_text(encoding="utf-8")
old = "- 大テロップ：Q3見通し 130億ドル"
new = "- 大テロップ：AMD決算｜実績と見通し"
if md.count(old) != 1:
    raise RuntimeError(f"expected one Scene 3 telop match, got {md.count(old)}")
md = md.replace(old, new, 1)
pattern = re.compile(r"(<!--BEGIN_FINAL_PRODUCTION_SOURCE-->\n```json\n)(.*?)(\n```\n<!--END_FINAL_PRODUCTION_SOURCE-->)", re.S)
m = pattern.search(md)
if not m:
    raise RuntimeError("missing FINAL_PRODUCTION_SOURCE block")
source = json.loads(m.group(2))
source["render_spec"] = data
for key in ("render_spec_sha256", "renderSpecSha256"):
    if key in source:
        source[key] = spec_sha
md = md[:m.start()] + m.group(1) + json.dumps(source, ensure_ascii=False, indent=2) + m.group(3) + md[m.end():]
PACKAGE.write_text(md, encoding="utf-8")

pkg = json.loads(PKG.read_text(encoding="utf-8"))
pkg["scripts"].pop("pretypecheck", None)
PKG.write_text(json.dumps(pkg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

subprocess.run(["git", "add", str(SPEC.relative_to(ROOT)), str(PACKAGE.relative_to(ROOT)), str(PKG.relative_to(ROOT))], cwd=ROOT, check=True)
subprocess.run(["git", "rm", "-f", str(SELF.relative_to(ROOT))], cwd=ROOT, check=True)
print("Scene 3 headline synchronized; narration/TTS preserved")
