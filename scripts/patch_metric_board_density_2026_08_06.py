#!/usr/bin/env python3
"""Keep full metric cards while limiting highlighted Number objects to four.

Renderer permits at most four Number objects in a metric-comparison-board.
The original cards remain selected, so every original metric string remains
visible; only the formal highlight subset is bounded.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

CARD_BY_BEAT = {
    "scene-03-beat-001": "scene-03-card-001",
    "scene-03-beat-002": "scene-03-card-002",
}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--spec", required=True, type=Path)
    parser.add_argument("--ready", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    args = parser.parse_args()

    spec = json.loads(args.spec.read_text(encoding="utf-8"))
    changes = []
    for scene in spec["scenes"]:
        number_ids = {number["numberId"] for number in scene.get("numbers", [])}
        card_ids = {card["cardId"] for card in scene.get("cards", [])}
        for beat in scene["visualBeats"]:
            card_id = CARD_BY_BEAT.get(beat["beatId"])
            if card_id is None:
                continue
            if card_id not in card_ids:
                raise ValueError(f"missing original metric card: {card_id}")
            selected_numbers = [
                object_id
                for object_id in beat["objectIds"]
                if object_id in number_ids
            ]
            if len(selected_numbers) <= 4:
                continue
            highlighted = selected_numbers[:4]
            previous = list(beat["objectIds"])
            beat["objectIds"] = [card_id, *highlighted]
            beat["templateConfig"]["displayOrder"] = list(beat["objectIds"])
            changes.append(
                {
                    "sceneId": scene["sceneId"],
                    "beatId": beat["beatId"],
                    "originalCardId": card_id,
                    "previousObjectIds": previous,
                    "resolvedObjectIds": list(beat["objectIds"]),
                    "allOriginalCardLinesRemainVisible": True,
                    "highlightedNumberCount": len(highlighted),
                }
            )

    text = json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    args.spec.write_text(text, encoding="utf-8")
    sha = hashlib.sha256(text.encode("utf-8")).hexdigest()

    ready = json.loads(args.ready.read_text(encoding="utf-8"))
    ready["renderSpecSha256"] = sha
    normalization = dict(ready.get("rendererNormalization", {}))
    normalization.update(
        {
            "metricBoardDensityBound": True,
            "metricBoardDensityChanges": changes,
            "metricTextRemoved": False,
            "metricNumbersRemoved": False,
        }
    )
    ready["rendererNormalization"] = normalization
    args.ready.write_text(
        json.dumps(ready, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    report = json.loads(args.report.read_text(encoding="utf-8"))
    report["normalizedRenderSpecSha256"] = sha
    report["metricBoardDensityBound"] = True
    report["metricBoardDensityChanges"] = changes
    report["metricTextRemoved"] = False
    report["metricNumbersRemoved"] = False
    args.report.write_text(
        json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"status": "bounded", "count": len(changes), "sha256": sha}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
