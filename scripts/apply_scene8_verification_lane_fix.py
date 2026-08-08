#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from pathlib import Path

SPEC_PATH = Path("render-specs/2026-08-06/render_spec.json")
READY_PATH = Path("render-specs/2026-08-06/production_ready.json")
PACKAGE_PATH = Path("episode-packages/2026-08-06/episode_package_2026-08-06.md")
REPORT_PATH = Path("preview-status/2026-08-06/normalization_report.json")
SCENE_ID = "scene-08"
BEAT_ID = "scene-08-beat-001"
BEFORE = ["大型顧客の獲得", "粗利率・供給制約", "SOXXへの広がり"]
LANES = ["AMD側", "市場側"]
AFTER = [
    "AMD側｜大型顧客の獲得",
    "AMD側｜粗利率・供給制約",
    "市場側｜SOXXへの広がり",
]

spec = json.loads(SPEC_PATH.read_text(encoding="utf-8"))
scene = next(scene for scene in spec["scenes"] if scene["sceneId"] == SCENE_ID)
beat = next(beat for beat in scene["visualBeats"] if beat["beatId"] == BEAT_ID)
if beat["visualTemplate"] != "verification-matrix":
    raise SystemExit(f"unexpected Scene 8 template: {beat['visualTemplate']}")
if beat.get("viewerTexts") != BEFORE:
    raise SystemExit(f"unexpected Scene 8 viewerTexts: {beat.get('viewerTexts')!r}")
if beat["templateConfig"].get("laneLabels") not in ([], None):
    raise SystemExit(f"unexpected Scene 8 laneLabels: {beat['templateConfig'].get('laneLabels')!r}")

beat["templateConfig"]["laneLabels"] = LANES
beat["viewerTexts"] = AFTER
for original in BEFORE:
    if not any(original in item for item in AFTER):
        raise SystemExit(f"Scene 8 verification axis was lost: {original}")
for label in LANES:
    if not any(item.startswith(f"{label}｜") for item in AFTER):
        raise SystemExit(f"Scene 8 lane has no prefixed item: {label}")

encoded = json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
SPEC_PATH.write_text(encoded, encoding="utf-8")
spec_sha = hashlib.sha256(encoded.encode("utf-8")).hexdigest()

repair = {
    "sceneId": SCENE_ID,
    "beatId": BEAT_ID,
    "before": {"laneLabels": [], "viewerTexts": BEFORE},
    "after": {"laneLabels": LANES, "viewerTexts": AFTER},
    "reason": "verification-matrix requires two conceptual lanes; the existing three verification axes naturally separate into AMD-specific evidence and market-breadth evidence",
    "narrationChanged": False,
    "captionsChanged": False,
    "numbersChanged": False,
    "sourcesChanged": False,
    "marketMeaningChanged": False,
}

ready = json.loads(READY_PATH.read_text(encoding="utf-8"))
ready["renderSpecSha256"] = spec_sha
ready.setdefault("rendererNormalization", {})["scene8VerificationLaneRepair"] = repair
READY_PATH.write_text(json.dumps(ready, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
report["normalizedRenderSpecSha256"] = spec_sha
report["scene8VerificationLaneRepair"] = repair
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
    raise SystemExit("episode package Scene 8 beat boundary not found")
end = min(bounds)
block = package[start:end]
old = "  - 視聴者向けテキスト：大型顧客の獲得 / 粗利率・供給制約 / SOXXへの広がり"
new = "  - 視聴者向けテキスト：AMD側｜大型顧客の獲得 / AMD側｜粗利率・供給制約 / 市場側｜SOXXへの広がり"
if old not in block:
    raise SystemExit("episode package Scene 8 viewer text field not found")
block = block.replace(old, new, 1)
final_package = package[:start] + block + package[end:]
PACKAGE_PATH.write_text(final_package, encoding="utf-8")
package_sha = hashlib.sha256(final_package.encode("utf-8")).hexdigest()

ready = json.loads(READY_PATH.read_text(encoding="utf-8"))
ready["renderSpecSha256"] = spec_sha
ready["episodePackageSha256"] = package_sha
READY_PATH.write_text(json.dumps(ready, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

print(json.dumps({"status": "patched", "renderSpecSha256": spec_sha, "episodePackageSha256": package_sha, "repair": repair}, ensure_ascii=False))
