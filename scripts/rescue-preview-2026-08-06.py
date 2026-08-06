#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
spec = json.loads(path.read_text(encoding="utf-8"))
if spec.get("episode", {}).get("id") != "2026-08-06" or spec.get("schemaVersion") != "2.4.0":
    raise SystemExit("unexpected rescue source")

for key in ("expectedConfirmed", "imageSelection", "tts", "visualGrammarContractVersion"):
    spec.pop(key, None)
for scene in spec["scenes"]:
    for visual_beat in scene["visualBeats"]:
        visual_beat.pop("visualBeatId", None)
        visual_beat.pop("visualGrammar", None)

def beat(scene_number: int, beat_number: int):
    return spec["scenes"][scene_number - 1]["visualBeats"][beat_number - 1]

def set_template(scene_number: int, beat_number: int, name: str, variant: str):
    visual_beat = beat(scene_number, beat_number)
    visual_beat["visualTemplate"] = name
    visual_beat["templateConfig"]["variant"] = variant

beat(2, 1)["returnScreenState"] = "Chart"
beat(2, 1)["sequencePolicy"] = "explicit"
set_template(2, 2, "evidence-boundary", "confirmed-vs-unconfirmed")
set_template(3, 1, "tailwind-headwind", "two-lane")
set_template(3, 2, "evidence-boundary", "confirmed-vs-unconfirmed")
set_template(4, 1, "tailwind-headwind", "two-lane")
beat(4, 2)["templateConfig"]["variant"] = "confirmed-vs-unconfirmed"
beat(5, 1)["returnScreenState"] = "Chart"
beat(5, 1)["sequencePolicy"] = "explicit"
set_template(5, 2, "tailwind-headwind", "two-lane")
set_template(6, 1, "evidence-boundary", "confirmed-vs-unconfirmed")
set_template(6, 2, "tailwind-headwind", "two-lane")
set_template(7, 1, "evidence-boundary", "confirmed-vs-unconfirmed")
set_template(7, 2, "tailwind-headwind", "two-lane")
beat(8, 1)["templateConfig"]["variant"] = "strengthen-vs-weaken"

spec["scenes"][7]["visualMode"] = "verification-points"
for visual_beat in spec["scenes"][7]["visualBeats"]:
    visual_beat["visualMode"] = "verification-points"

spec["scenes"][8]["sceneRole"] = "closing-recap-sendoff-goodnight"
spec["scenes"][8]["visualMode"] = "conclusion-card"
spec["scenes"][8]["transition"] = {"type": "none", "durationMs": 0}
beat(9, 1)["visualMode"] = "conclusion-card"
beat(9, 1)["visualTemplate"] = "final-assembly"
spec["scenes"][8]["cards"][0]["lines"][0]["value"] = "AMD -7.04%"
spec["scenes"][8]["cards"][0]["lines"][1]["value"] = "NVIDIA +3.43%"

for scene_number in (3, 4, 7):
    scene = spec["scenes"][scene_number - 1]
    scene["visualMode"] = "text-focus"
    for visual_beat in scene["visualBeats"]:
        visual_beat["visualMode"] = "text-focus"

allowed_expected_basis = {
    "official-consensus",
    "company-prior-guidance",
    "major-reporting",
    "analyst-view",
    "price-inference",
    "unconfirmed",
}
for scene in spec["scenes"]:
    if scene.get("expectedBasisType") not in allowed_expected_basis:
        scene["expectedBasisType"] = None

spec["schemaVersion"] = "2.2.0"
spec["sources"] = [
    source
    for source in spec["sources"]
    if re.fullmatch(r"source-[0-9]{3}", str(source.get("sourceId", "")))
]
for source in spec["sources"]:
    if source.get("sourceType") == "company-ir":
        source["sourceType"] = "company"

path.write_text(
    json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
    encoding="utf-8",
)
