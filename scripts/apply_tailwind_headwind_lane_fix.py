#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from pathlib import Path

SPEC_PATH = Path("render-specs/2026-08-06/render_spec.json")
READY_PATH = Path("render-specs/2026-08-06/production_ready.json")
PACKAGE_PATH = Path("episode-packages/2026-08-06/episode_package_2026-08-06.md")
REPORT_PATH = Path("preview-status/2026-08-06/normalization_report.json")
BEAT_ID = "scene-02-beat-002"
EXPECTED_TTS = "b4743df29c22902365d06a7a7a548a41131fe806a2a67ac75431198dc9c59509"

spec = json.loads(SPEC_PATH.read_text(encoding="utf-8"))
beat = next(
    beat
    for scene in spec["scenes"]
    for beat in scene["visualBeats"]
    if beat["beatId"] == BEAT_ID
)
if beat["visualTemplate"] != "tailwind-headwind":
    raise SystemExit(f"unexpected template: {beat['visualTemplate']}")
if beat["templateConfig"]["variant"] != "two-lane":
    raise SystemExit(f"unexpected variant: {beat['templateConfig']['variant']}")
if beat["viewerTexts"] != ["Q2売上 115.4億ドル", "AMD -7.04%"]:
    raise SystemExit(f"unexpected viewerTexts: {beat['viewerTexts']}")

before = {
    "laneLabels": beat["templateConfig"]["laneLabels"],
    "viewerTexts": beat["viewerTexts"],
    "visualGrammarId": beat["visualGrammarId"],
    "visualTemplate": beat["visualTemplate"],
    "variant": beat["templateConfig"]["variant"],
    "objectIds": beat["objectIds"],
}
beat["templateConfig"]["laneLabels"] = ["追い風", "向かい風"]
beat["viewerTexts"] = [
    "追い風｜Q2売上 115.4億ドル",
    "向かい風｜AMD -7.04%",
]
after = {
    "laneLabels": beat["templateConfig"]["laneLabels"],
    "viewerTexts": beat["viewerTexts"],
    "visualGrammarId": beat["visualGrammarId"],
    "visualTemplate": beat["visualTemplate"],
    "variant": beat["templateConfig"]["variant"],
    "objectIds": beat["objectIds"],
}
if before["objectIds"] != after["objectIds"]:
    raise SystemExit("objectIds changed")

encoded = json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
SPEC_PATH.write_text(encoded, encoding="utf-8")
spec_sha = hashlib.sha256(encoded.encode("utf-8")).hexdigest()

repair = {
    "status": "pending-validation",
    "beatId": BEAT_ID,
    "before": before,
    "after": after,
    "reason": "tailwind-headwind uses conceptual lane headers and preserves both card-line facts",
    "narrationChanged": False,
    "captionsChanged": False,
    "numbersChanged": False,
    "sourcesChanged": False,
    "sceneOrderChanged": False,
    "ttsIdentityChanged": False,
}

ready = json.loads(READY_PATH.read_text(encoding="utf-8"))
actual_tts = ready.get("rendererNormalization", {}).get("ttsInputSha256After")
if actual_tts != EXPECTED_TTS:
    raise SystemExit(f"TTS identity mismatch: {actual_tts}")
ready["renderSpecSha256"] = spec_sha
ready.setdefault("rendererNormalization", {})["tailwindHeadwindLaneRepair"] = repair
READY_PATH.write_text(
    json.dumps(ready, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
    encoding="utf-8",
)

report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
report["normalizedRenderSpecSha256"] = spec_sha
report["tailwindHeadwindLaneRepair"] = repair
REPORT_PATH.write_text(
    json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
    encoding="utf-8",
)

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
    raise SystemExit("episode package beat boundary not found")
end = min(bounds)
block = package[start:end]
for old, new in [
    ("  - Visual Grammar：comparison / continuation", "  - Visual Grammar：evidence / continuation"),
    ("  - Visual Template ID：diverging-stock-bars", "  - Visual Template ID：tailwind-headwind"),
    ("  - Template Variant：default", "  - Template Variant：two-lane"),
    (
        "  - 視聴者向けテキスト：Q2売上 115.4億ドル / AMD -7.04%",
        "  - 視聴者向けテキスト：追い風｜Q2売上 115.4億ドル / 向かい風｜AMD -7.04%",
    ),
]:
    if old not in block:
        raise SystemExit(f"episode package field not found: {old}")
    block = block.replace(old, new, 1)
PACKAGE_PATH.write_text(package[:start] + block + package[end:], encoding="utf-8")

print(json.dumps({"status": "patched", "renderSpecSha256": spec_sha, "repair": repair}, ensure_ascii=False))
