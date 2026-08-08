#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from pathlib import Path

SPEC_PATH = Path("render-specs/2026-08-06/render_spec.json")
READY_PATH = Path("render-specs/2026-08-06/production_ready.json")
REPORT_PATH = Path("preview-status/2026-08-06/normalization_report.json")
SCENE_ID = "scene-07"
CARD_ID = "scene-07-card-001"
BEFORE = "NVIDIA・AMD・Alphabet比較"
AFTER = "NVIDIA・AMD・\nAlphabet比較"

spec = json.loads(SPEC_PATH.read_text(encoding="utf-8"))
scene = next(scene for scene in spec["scenes"] if scene["sceneId"] == SCENE_ID)
card = next(card for card in scene["cards"] if card["cardId"] == CARD_ID)
if card["title"] != BEFORE:
    raise SystemExit(f"unexpected Scene 7 card title: {card['title']!r}")

card["title"] = AFTER
if "".join(AFTER.splitlines()) != BEFORE:
    raise SystemExit("Scene 7 title wrap changed visible wording")
if any(len(line) > 18 for line in AFTER.splitlines()):
    raise SystemExit("Scene 7 title wrap still exceeds 18-character line limit")

encoded = json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
SPEC_PATH.write_text(encoded, encoding="utf-8")
spec_sha = hashlib.sha256(encoded.encode("utf-8")).hexdigest()

repair = {
    "sceneId": SCENE_ID,
    "cardId": CARD_ID,
    "before": BEFORE,
    "after": AFTER,
    "reason": "exact public layout check requires card title lines to be 18 characters or fewer; insert only a line break",
    "wordingChanged": False,
    "narrationChanged": False,
    "captionsChanged": False,
    "numbersChanged": False,
    "sourcesChanged": False,
    "marketMeaningChanged": False,
}

ready = json.loads(READY_PATH.read_text(encoding="utf-8"))
ready["renderSpecSha256"] = spec_sha
ready.setdefault("rendererNormalization", {})["scene7CardTitleWrap"] = repair
READY_PATH.write_text(json.dumps(ready, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
report["normalizedRenderSpecSha256"] = spec_sha
report["scene7CardTitleWrap"] = repair
REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

print(json.dumps({"status": "wrapped", "renderSpecSha256": spec_sha, "repair": repair}, ensure_ascii=False))
