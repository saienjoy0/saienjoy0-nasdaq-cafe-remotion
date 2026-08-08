#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from pathlib import Path

SPEC_PATH = Path("render-specs/2026-08-06/render_spec.json")
READY_PATH = Path("render-specs/2026-08-06/production_ready.json")
PACKAGE_PATH = Path("episode-packages/2026-08-06/episode_package_2026-08-06.md")
REPORT_PATH = Path("preview-status/2026-08-06/normalization_report.json")
SCENE_ID = "scene-07"
CARD_ID = "scene-07-card-001"
BEAT_ID = "scene-07-beat-002"
TITLE_BEFORE = "NVIDIA・AMD・Alphabet比較"
TITLE_AFTER = "NVIDIA・AMD・\nAlphabet比較"
VIEWER_BEFORE = [
    "半導体：採用証拠の差",
    "NASDAQ：大型テック安も重なる",
    "Dow +0.5%の混合相場",
]
LANES_AFTER = ["仮説を支える", "断定を弱める"]
VIEWER_AFTER = [
    "仮説を支える｜半導体：採用証拠の差",
    "断定を弱める｜NASDAQ：大型テック安も重なる",
    "断定を弱める｜Dow +0.5%の混合相場",
]

spec = json.loads(SPEC_PATH.read_text(encoding="utf-8"))
scene = next(scene for scene in spec["scenes"] if scene["sceneId"] == SCENE_ID)
card = next(card for card in scene["cards"] if card["cardId"] == CARD_ID)
beat = next(beat for beat in scene["visualBeats"] if beat["beatId"] == BEAT_ID)

if card["title"] != TITLE_BEFORE:
    raise SystemExit(f"unexpected Scene 7 card title: {card['title']!r}")
if beat.get("viewerTexts") != VIEWER_BEFORE:
    raise SystemExit(f"unexpected Scene 7 Beat 2 viewerTexts: {beat.get('viewerTexts')!r}")
if beat["templateConfig"].get("laneLabels") not in ([], None):
    raise SystemExit(f"unexpected Scene 7 Beat 2 laneLabels: {beat['templateConfig'].get('laneLabels')!r}")

card["title"] = TITLE_AFTER
if "".join(TITLE_AFTER.splitlines()) != TITLE_BEFORE:
    raise SystemExit("Scene 7 title wrap changed visible wording")
if any(len(line) > 18 for line in TITLE_AFTER.splitlines()):
    raise SystemExit("Scene 7 title wrap still exceeds 18-character line limit")

beat["templateConfig"]["laneLabels"] = LANES_AFTER
beat["viewerTexts"] = VIEWER_AFTER
for original in VIEWER_BEFORE:
    if not any(original in item for item in VIEWER_AFTER):
        raise SystemExit(f"Scene 7 viewer fact was lost: {original}")
for label in LANES_AFTER:
    if not any(item.startswith(f"{label}｜") for item in VIEWER_AFTER):
        raise SystemExit(f"Scene 7 lane has no prefixed item: {label}")

encoded = json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
SPEC_PATH.write_text(encoded, encoding="utf-8")
spec_sha = hashlib.sha256(encoded.encode("utf-8")).hexdigest()

repair = {
    "sceneId": SCENE_ID,
    "cardTitle": {
        "cardId": CARD_ID,
        "before": TITLE_BEFORE,
        "after": TITLE_AFTER,
        "reason": "exact public layout check requires card title lines to be 18 characters or fewer; insert only a line break",
    },
    "beatLaneLabels": {
        "beatId": BEAT_ID,
        "before": [],
        "after": LANES_AFTER,
        "viewerTextsBefore": VIEWER_BEFORE,
        "viewerTextsAfter": VIEWER_AFTER,
        "reason": "compiled tailwind-headwind surface requires two conceptual lanes; Scene 7 already separates evidence supporting the semiconductor hypothesis from evidence weakening a single-cause claim",
    },
    "wordingChanged": False,
    "narrationChanged": False,
    "captionsChanged": False,
    "numbersChanged": False,
    "sourcesChanged": False,
    "marketMeaningChanged": False,
}

ready = json.loads(READY_PATH.read_text(encoding="utf-8"))
ready["renderSpecSha256"] = spec_sha
ready.setdefault("rendererNormalization", {})["scene7LayoutRepair"] = repair
READY_PATH.write_text(json.dumps(ready, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
report["normalizedRenderSpecSha256"] = spec_sha
report["scene7LayoutRepair"] = repair
REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

package = PACKAGE_PATH.read_text(encoding="utf-8")
marker = f"- **{BEAT_ID}**"
start = package.index(marker)
bounds = [
    value
    for value in [
        package.find("\n- **", start + len(marker)),
        package.find("\n### 完成ナレーション", start),
    ]
    if value >= 0
]
if not bounds:
    raise SystemExit("episode package Scene 7 beat boundary not found")
end = min(bounds)
block = package[start:end]
old = "  - 視聴者向けテキスト：半導体：採用証拠の差 / NASDAQ：大型テック安も重なる / Dow +0.5%の混合相場"
new = "  - 視聴者向けテキスト：仮説を支える｜半導体：採用証拠の差 / 断定を弱める｜NASDAQ：大型テック安も重なる / 断定を弱める｜Dow +0.5%の混合相場"
if old not in block:
    raise SystemExit("episode package Scene 7 viewer text field not found")
block = block.replace(old, new, 1)
final_package = package[:start] + block + package[end:]
PACKAGE_PATH.write_text(final_package, encoding="utf-8")
package_sha = hashlib.sha256(final_package.encode("utf-8")).hexdigest()

ready = json.loads(READY_PATH.read_text(encoding="utf-8"))
ready["renderSpecSha256"] = spec_sha
ready["episodePackageSha256"] = package_sha
READY_PATH.write_text(json.dumps(ready, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

print(json.dumps({"status": "patched", "renderSpecSha256": spec_sha, "episodePackageSha256": package_sha, "repair": repair}, ensure_ascii=False))
