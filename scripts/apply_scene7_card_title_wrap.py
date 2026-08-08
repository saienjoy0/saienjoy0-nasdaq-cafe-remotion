#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from pathlib import Path

SPEC_PATH = Path("render-specs/2026-08-06/render_spec.json")
READY_PATH = Path("render-specs/2026-08-06/production_ready.json")
PACKAGE_PATH = Path("episode-packages/2026-08-06/episode_package_2026-08-06.md")
REPORT_PATH = Path("preview-status/2026-08-06/normalization_report.json")

spec = json.loads(SPEC_PATH.read_text(encoding="utf-8"))

# Scene 7: line-wrap the existing card title and provide the two conceptual
# lanes required by the normalized tailwind-headwind surface.
scene7 = next(scene for scene in spec["scenes"] if scene["sceneId"] == "scene-07")
card7 = next(card for card in scene7["cards"] if card["cardId"] == "scene-07-card-001")
beat7 = next(beat for beat in scene7["visualBeats"] if beat["beatId"] == "scene-07-beat-002")
title_before = "NVIDIA・AMD・Alphabet比較"
title_after = "NVIDIA・AMD・\nAlphabet比較"
viewer7_before = [
    "半導体：採用証拠の差",
    "NASDAQ：大型テック安も重なる",
    "Dow +0.5%の混合相場",
]
lanes7 = ["仮説を支える", "断定を弱める"]
viewer7_after = [
    "仮説を支える｜半導体：採用証拠の差",
    "断定を弱める｜NASDAQ：大型テック安も重なる",
    "断定を弱める｜Dow +0.5%の混合相場",
]
if card7["title"] != title_before:
    raise SystemExit(f"unexpected Scene 7 card title: {card7['title']!r}")
if beat7.get("viewerTexts") != viewer7_before:
    raise SystemExit(f"unexpected Scene 7 Beat 2 viewerTexts: {beat7.get('viewerTexts')!r}")
if beat7["templateConfig"].get("laneLabels") not in ([], None):
    raise SystemExit(f"unexpected Scene 7 Beat 2 laneLabels: {beat7['templateConfig'].get('laneLabels')!r}")
card7["title"] = title_after
beat7["templateConfig"]["laneLabels"] = lanes7
beat7["viewerTexts"] = viewer7_after
if "".join(title_after.splitlines()) != title_before:
    raise SystemExit("Scene 7 title wrap changed visible wording")
if any(len(line) > 18 for line in title_after.splitlines()):
    raise SystemExit("Scene 7 title wrap still exceeds 18-character line limit")
for original in viewer7_before:
    if not any(original in item for item in viewer7_after):
        raise SystemExit(f"Scene 7 viewer fact was lost: {original}")

scene7_repair = {
    "sceneId": "scene-07",
    "cardTitle": {"cardId": "scene-07-card-001", "before": title_before, "after": title_after},
    "beatLaneLabels": {
        "beatId": "scene-07-beat-002",
        "before": [],
        "after": lanes7,
        "viewerTextsBefore": viewer7_before,
        "viewerTextsAfter": viewer7_after,
    },
    "wordingChanged": False,
    "narrationChanged": False,
    "captionsChanged": False,
    "numbersChanged": False,
    "sourcesChanged": False,
    "marketMeaningChanged": False,
}

# Scene 8: the verification matrix has three existing checks. Group the two
# AMD-specific checks in one lane and the sector-breadth check in the other.
# This only adds structural headers required by the renderer contract.
scene8 = next(scene for scene in spec["scenes"] if scene["sceneId"] == "scene-08")
beat8 = next(beat for beat in scene8["visualBeats"] if beat["beatId"] == "scene-08-beat-001")
viewer8_before = ["大型顧客の獲得", "粗利率・供給制約", "SOXXへの広がり"]
lanes8 = ["AMD側", "市場側"]
viewer8_after = [
    "AMD側｜大型顧客の獲得",
    "AMD側｜粗利率・供給制約",
    "市場側｜SOXXへの広がり",
]
if beat8["visualTemplate"] != "verification-matrix":
    raise SystemExit(f"unexpected Scene 8 template: {beat8['visualTemplate']}")
if beat8.get("viewerTexts") != viewer8_before:
    raise SystemExit(f"unexpected Scene 8 viewerTexts: {beat8.get('viewerTexts')!r}")
if beat8["templateConfig"].get("laneLabels") not in ([], None):
    raise SystemExit(f"unexpected Scene 8 laneLabels: {beat8['templateConfig'].get('laneLabels')!r}")
beat8["templateConfig"]["laneLabels"] = lanes8
beat8["viewerTexts"] = viewer8_after
for original in viewer8_before:
    if not any(original in item for item in viewer8_after):
        raise SystemExit(f"Scene 8 verification axis was lost: {original}")
for label in lanes8:
    if not any(item.startswith(f"{label}｜") for item in viewer8_after):
        raise SystemExit(f"Scene 8 lane has no prefixed item: {label}")

scene8_repair = {
    "sceneId": "scene-08",
    "beatId": "scene-08-beat-001",
    "before": {"laneLabels": [], "viewerTexts": viewer8_before},
    "after": {"laneLabels": lanes8, "viewerTexts": viewer8_after},
    "reason": "verification-matrix requires two conceptual lanes; the existing checks separate into AMD-specific evidence and market-breadth evidence",
    "narrationChanged": False,
    "captionsChanged": False,
    "numbersChanged": False,
    "sourcesChanged": False,
    "marketMeaningChanged": False,
}

encoded = json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
SPEC_PATH.write_text(encoded, encoding="utf-8")
spec_sha = hashlib.sha256(encoded.encode("utf-8")).hexdigest()

ready = json.loads(READY_PATH.read_text(encoding="utf-8"))
ready["renderSpecSha256"] = spec_sha
normalization = ready.setdefault("rendererNormalization", {})
normalization["scene7CardTitleWrap"] = scene7_repair
normalization["scene8VerificationLaneRepair"] = scene8_repair
READY_PATH.write_text(json.dumps(ready, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
report["normalizedRenderSpecSha256"] = spec_sha
report["scene7CardTitleWrap"] = scene7_repair
report["scene8VerificationLaneRepair"] = scene8_repair
REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

package = PACKAGE_PATH.read_text(encoding="utf-8")

def replace_in_beat(package_text: str, beat_id: str, old: str, new: str) -> str:
    marker = f"- **{beat_id}**"
    start = package_text.index(marker)
    bounds = [
        value
        for value in [
            package_text.find("\n- **", start + len(marker)),
            package_text.find("\n### 完成ナレーション", start),
        ]
        if value >= 0
    ]
    if not bounds:
        raise SystemExit(f"episode package {beat_id} boundary not found")
    end = min(bounds)
    block = package_text[start:end]
    if old not in block:
        raise SystemExit(f"episode package field not found in {beat_id}: {old}")
    block = block.replace(old, new, 1)
    return package_text[:start] + block + package_text[end:]

package = replace_in_beat(
    package,
    "scene-07-beat-002",
    "  - 視聴者向けテキスト：半導体：採用証拠の差 / NASDAQ：大型テック安も重なる / Dow +0.5%の混合相場",
    "  - 視聴者向けテキスト：仮説を支える｜半導体：採用証拠の差 / 断定を弱める｜NASDAQ：大型テック安も重なる / 断定を弱める｜Dow +0.5%の混合相場",
)
package = replace_in_beat(
    package,
    "scene-08-beat-001",
    "  - 視聴者向けテキスト：大型顧客の獲得 / 粗利率・供給制約 / SOXXへの広がり",
    "  - 視聴者向けテキスト：AMD側｜大型顧客の獲得 / AMD側｜粗利率・供給制約 / 市場側｜SOXXへの広がり",
)
PACKAGE_PATH.write_text(package, encoding="utf-8")
package_sha = hashlib.sha256(package.encode("utf-8")).hexdigest()

ready = json.loads(READY_PATH.read_text(encoding="utf-8"))
ready["renderSpecSha256"] = spec_sha
ready["episodePackageSha256"] = package_sha
READY_PATH.write_text(json.dumps(ready, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

print(json.dumps({"status": "patched", "renderSpecSha256": spec_sha, "episodePackageSha256": package_sha, "scene7Repair": scene7_repair, "scene8Repair": scene8_repair}, ensure_ascii=False))
