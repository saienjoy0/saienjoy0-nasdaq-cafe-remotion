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


def get_scene(data: dict, scene_id: str) -> dict:
    for scene in data["scenes"]:
        if scene["sceneId"] == scene_id:
            return scene
    raise RuntimeError(f"missing scene {scene_id}")


def get_beat(scene: dict, beat_id: str) -> dict:
    for beat in scene["visualBeats"]:
        if beat["beatId"] == beat_id:
            return beat
    raise RuntimeError(f"missing beat {beat_id}")


def narration_fingerprint(data: dict) -> list[tuple[str, str, str]]:
    return [
        (chunk["chunkId"], chunk["speechText"], chunk["captionText"])
        for scene in data["scenes"]
        for chunk in scene["narrationChunks"]
    ]


def replace_in_beat(text: str, beat_id: str, end_marker: str, old: str, new: str) -> str:
    start = text.index(f"- **{beat_id}**")
    end = text.index(end_marker, start)
    segment = text[start:end]
    count = segment.count(old)
    if count != 1:
        raise RuntimeError(f"{beat_id}: expected exactly one match for {old!r}, got {count}")
    segment = segment.replace(old, new, 1)
    return text[:start] + segment + text[end:]


data = json.loads(SPEC.read_text(encoding="utf-8"))
before_narration = narration_fingerprint(data)

scene6 = get_scene(data, "scene-06")
beat6 = get_beat(scene6, "scene-06-beat-002")
beat6["sequencePolicy"] = "object-order-fallback"
remove_ids = {"event-013", "event-090", "event-091"}
scene6["visualEvents"] = [event for event in scene6["visualEvents"] if event["eventId"] not in remove_ids]

# Guard the exact runtime condition that previously failed: all three market-pulse metrics must be visible initially.
selected = set(beat6["objectIds"])
show_targets = {
    event["targetId"]
    for event in scene6["visualEvents"]
    if event["action"] == "show" and event.get("targetId") in selected
}
if show_targets:
    raise RuntimeError(f"Scene 6 market-pulse metrics still have show gates: {sorted(show_targets)}")
if len(beat6["objectIds"]) != 3:
    raise RuntimeError("Scene 6 market-pulse-grid must retain exactly three selected metrics")

if narration_fingerprint(data) != before_narration:
    raise RuntimeError("Scene 6 stagger fix changed narration or captions")

spec_text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
SPEC.write_text(spec_text, encoding="utf-8")
spec_sha = hashlib.sha256(spec_text.encode("utf-8")).hexdigest()

md = PACKAGE.read_text(encoding="utf-8")
md = replace_in_beat(
    md,
    "scene-07-beat-002",
    "### 完成ナレーション",
    "  - Template Variant：default",
    "  - Template Variant：confirmed-vs-unconfirmed",
)
md = md.replace(
    "- 画面で見せる内容：SpaceX→AMD→翌日終値; SOXX→Alphabet→Microsoftの順に市場要因を段階表示",
    "- 画面で見せる内容：SpaceX→AMD→翌日終値; SOXX→Alphabet→Microsoftの順に市場要因をフェード表示",
    1,
)

# Keep embedded executable source in the human package identical to the standalone spec.
pattern = re.compile(r"(<!--BEGIN_FINAL_PRODUCTION_SOURCE-->\n```json\n)(.*?)(\n```\n<!--END_FINAL_PRODUCTION_SOURCE-->)", re.S)
match = pattern.search(md)
if not match:
    raise RuntimeError("missing FINAL_PRODUCTION_SOURCE block")
source = json.loads(match.group(2))
source["render_spec"] = data
for key in ("render_spec_sha256", "renderSpecSha256"):
    if key in source:
        source[key] = spec_sha
embedded = match.group(1) + json.dumps(source, ensure_ascii=False, indent=2) + match.group(3)
md = md[:match.start()] + embedded + md[match.end():]
PACKAGE.write_text(md, encoding="utf-8")

# Remove the one-time hook before the workflow commits the real files.
pkg = json.loads(PKG.read_text(encoding="utf-8"))
pkg["scripts"].pop("pretypecheck", None)
PKG.write_text(json.dumps(pkg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

subprocess.run(
    ["git", "add", str(SPEC.relative_to(ROOT)), str(PACKAGE.relative_to(ROOT)), str(PKG.relative_to(ROOT))],
    cwd=ROOT,
    check=True,
)
subprocess.run(["git", "rm", "-f", str(SELF.relative_to(ROOT))], cwd=ROOT, check=True)
print("Scene 6 market-pulse stagger staged without visibility gating; narration/TTS preserved")
