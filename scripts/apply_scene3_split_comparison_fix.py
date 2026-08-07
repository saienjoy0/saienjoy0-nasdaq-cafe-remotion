#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from pathlib import Path

SPEC_PATH = Path("render-specs/2026-08-06/render_spec.json")
READY_PATH = Path("render-specs/2026-08-06/production_ready.json")
PACKAGE_PATH = Path("episode-packages/2026-08-06/episode_package_2026-08-06.md")
REPORT_PATH = Path("preview-status/2026-08-06/normalization_report.json")
BEAT_ID = "scene-03-beat-002"
CARD_ID = "scene-03-card-002"
EXPECTED_TTS = "b4743df29c22902365d06a7a7a548a41131fe806a2a67ac75431198dc9c59509"

spec = json.loads(SPEC_PATH.read_text(encoding="utf-8"))
scene = next(scene for scene in spec["scenes"] if scene["sceneId"] == "scene-03")
beat = next(beat for beat in scene["visualBeats"] if beat["beatId"] == BEAT_ID)
card = next(card for card in scene["cards"] if card["cardId"] == CARD_ID)

if beat["visualGrammarId"] != "contradiction":
    raise SystemExit(f"unexpected grammar: {beat['visualGrammarId']}")
if beat["visualTemplate"] != "opening-contradiction":
    raise SystemExit(f"unexpected template: {beat['visualTemplate']}")
if beat["templateConfig"]["variant"] != "default":
    raise SystemExit(f"unexpected variant: {beat['templateConfig']['variant']}")

expected_values = ["会社見通し 130億ドル", "市場予想 125.2億ドル", "粗利率 56%"]
card_values = [line["value"] for line in card["lines"]]
if card_values != expected_values:
    raise SystemExit(f"unexpected Scene 3 card values: {card_values}")
if beat.get("viewerTexts") != expected_values:
    raise SystemExit(f"unexpected Scene 3 viewerTexts: {beat.get('viewerTexts')}")

before = {
    "visualGrammarId": beat["visualGrammarId"],
    "visualTemplate": beat["visualTemplate"],
    "variant": beat["templateConfig"]["variant"],
    "viewerTexts": beat.get("viewerTexts", []),
    "objectIds": beat.get("objectIds", []),
    "laneLabels": beat["templateConfig"].get("laneLabels", []),
}

# Scene 3 Beat 1 already occupies the metric-board appearance for 14.885 s.
# Making Beat 2 another metric board creates a measured 29.098 s appearance
# run, exceeding the 28 s production gate. The existing Scene 3 card contains
# exactly the same three facts, so reuse it as a two-lane tailwind/headwind
# board: strong revenue outlook is the tailwind; flat gross margin is the
# headwind. No narration, number, source, causal claim, or TTS input changes.
beat["visualGrammarId"] = "evidence"
beat["visualTemplate"] = "tailwind-headwind"
beat["templateConfig"]["variant"] = "two-lane"
beat["templateConfig"]["laneLabels"] = ["追い風", "向かい風"]
beat["templateConfig"]["comparisonBasis"] = "売上見通しの強さと粗利率の慎重材料"
beat["templateConfig"]["displayOrder"] = [CARD_ID]
beat["objectIds"] = [CARD_ID]
beat["viewerTexts"] = [
    "追い風｜会社見通し 130億ドル",
    "追い風｜市場予想 125.2億ドル",
    "向かい風｜粗利率 56%",
]

after = {
    "visualGrammarId": beat["visualGrammarId"],
    "visualTemplate": beat["visualTemplate"],
    "variant": beat["templateConfig"]["variant"],
    "viewerTexts": beat.get("viewerTexts", []),
    "objectIds": beat.get("objectIds", []),
    "laneLabels": beat["templateConfig"].get("laneLabels", []),
}
for fact in expected_values:
    if not any(fact in text for text in after["viewerTexts"]):
        raise SystemExit(f"Scene 3 fact was lost from viewer text: {fact}")
if after["objectIds"] != [CARD_ID]:
    raise SystemExit("Scene 3 existing fact card was not selected")

encoded = json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
SPEC_PATH.write_text(encoded, encoding="utf-8")
spec_sha = hashlib.sha256(encoded.encode("utf-8")).hexdigest()

repair = {
    "status": "pending-validation",
    "beatId": BEAT_ID,
    "before": before,
    "after": after,
    "reason": "post-TTS measured timing showed Scene 3 metric-board would run 29.098 seconds; reuse the existing Q3 fact card as tailwind/headwind to preserve all three facts while breaking the same-appearance run",
    "measuredTimingBasis": {
        "scene03Beat01Ms": 14885,
        "scene03Beat02Ms": 14213,
        "combinedMetricBoardRunMs": 29098,
        "sameAppearanceRunMaxMs": 28000,
    },
    "narrationChanged": False,
    "captionsChanged": False,
    "numbersChanged": False,
    "sourcesChanged": False,
    "sceneOrderChanged": False,
    "ttsIdentityChanged": False,
    "viewerLaneLabelsChanged": True,
    "marketMeaningChanged": False,
}

ready = json.loads(READY_PATH.read_text(encoding="utf-8"))
actual_tts = ready.get("rendererNormalization", {}).get("ttsInputSha256After")
if actual_tts != EXPECTED_TTS:
    raise SystemExit(f"TTS identity mismatch: {actual_tts}")
ready["renderSpecSha256"] = spec_sha
ready.setdefault("rendererNormalization", {})["scene3LayoutCompatibilityRepair"] = repair
READY_PATH.write_text(json.dumps(ready, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
report["normalizedRenderSpecSha256"] = spec_sha
report["scene3LayoutCompatibilityRepair"] = repair
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
    raise SystemExit("episode package Scene 3 beat boundary not found")
end = min(bounds)
block = package[start:end]
for old, new in [
    ("  - Visual Grammar：contradiction / continuation", "  - Visual Grammar：evidence / continuation"),
    ("  - Visual Template ID：opening-contradiction", "  - Visual Template ID：tailwind-headwind"),
    ("  - Template Variant：default", "  - Template Variant：two-lane"),
    (
        "  - 視聴者向けテキスト：会社見通し 130億ドル / 市場予想 125.2億ドル / 粗利率 56%",
        "  - 視聴者向けテキスト：追い風｜会社見通し 130億ドル / 追い風｜市場予想 125.2億ドル / 向かい風｜粗利率 56%",
    ),
]:
    if old not in block:
        raise SystemExit(f"episode package field not found: {old}")
    block = block.replace(old, new, 1)
final_package = package[:start] + block + package[end:]
PACKAGE_PATH.write_text(final_package, encoding="utf-8")
package_sha = hashlib.sha256(final_package.encode("utf-8")).hexdigest()

ready = json.loads(READY_PATH.read_text(encoding="utf-8"))
ready["renderSpecSha256"] = spec_sha
ready["episodePackageSha256"] = package_sha
READY_PATH.write_text(json.dumps(ready, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

print(json.dumps({"status": "patched", "renderSpecSha256": spec_sha, "episodePackageSha256": package_sha, "repair": repair}, ensure_ascii=False))
