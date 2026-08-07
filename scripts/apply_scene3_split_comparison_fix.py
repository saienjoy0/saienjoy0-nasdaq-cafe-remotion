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
EXPECTED_TTS = "b4743df29c22902365d06a7a7a548a41131fe806a2a67ac75431198dc9c59509"

spec = json.loads(SPEC_PATH.read_text(encoding="utf-8"))
beat = next(
    beat
    for scene in spec["scenes"]
    for beat in scene["visualBeats"]
    if beat["beatId"] == BEAT_ID
)
if beat["visualGrammarId"] != "contradiction":
    raise SystemExit(f"unexpected grammar: {beat['visualGrammarId']}")
if beat["visualTemplate"] != "opening-contradiction":
    raise SystemExit(f"unexpected template: {beat['visualTemplate']}")
if beat["templateConfig"]["variant"] != "default":
    raise SystemExit(f"unexpected variant: {beat['templateConfig']['variant']}")

before = {
    "visualGrammarId": beat["visualGrammarId"],
    "visualTemplate": beat["visualTemplate"],
    "variant": beat["templateConfig"]["variant"],
    "viewerTexts": beat.get("viewerTexts", []),
    "objectIds": beat.get("objectIds", []),
}
# This beat displays two revenue values and a gross-margin percentage. The
# registered mixed-unit board is metric-comparison-board, whose compatible
# grammar is evidence. This restores the pre-diversity-repair semantic pair.
beat["visualGrammarId"] = "evidence"
beat["visualTemplate"] = "metric-comparison-board"
beat["templateConfig"]["variant"] = "default"
after = {
    "visualGrammarId": beat["visualGrammarId"],
    "visualTemplate": beat["visualTemplate"],
    "variant": beat["templateConfig"]["variant"],
    "viewerTexts": beat.get("viewerTexts", []),
    "objectIds": beat.get("objectIds", []),
}
if before["viewerTexts"] != after["viewerTexts"] or before["objectIds"] != after["objectIds"]:
    raise SystemExit("Scene 3 viewer content changed")

encoded = json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
SPEC_PATH.write_text(encoded, encoding="utf-8")
spec_sha = hashlib.sha256(encoded.encode("utf-8")).hexdigest()

repair = {
    "status": "pending-validation",
    "beatId": BEAT_ID,
    "before": before,
    "after": after,
    "reason": "Scene 3 presents mixed-unit evidence (revenue outlook, consensus, gross margin); evidence + metric-comparison-board is the registered compatible pair and preserves all values",
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
    ("  - Visual Template ID：opening-contradiction", "  - Visual Template ID：metric-comparison-board"),
]:
    if old not in block:
        raise SystemExit(f"episode package field not found: {old}")
    block = block.replace(old, new, 1)
final_package = package[:start] + block + package[end:]
PACKAGE_PATH.write_text(final_package, encoding="utf-8")
package_sha = hashlib.sha256(final_package.encode("utf-8")).hexdigest()

# Keep the production-ready manifest hashes aligned with the exact files that
# will be committed. Preserve all renderer normalization evidence.
ready = json.loads(READY_PATH.read_text(encoding="utf-8"))
ready["renderSpecSha256"] = spec_sha
ready["episodePackageSha256"] = package_sha
READY_PATH.write_text(json.dumps(ready, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

print(json.dumps({"status": "patched", "renderSpecSha256": spec_sha, "episodePackageSha256": package_sha, "repair": repair}, ensure_ascii=False))
