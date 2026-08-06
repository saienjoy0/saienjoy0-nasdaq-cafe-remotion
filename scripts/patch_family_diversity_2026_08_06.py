#!/usr/bin/env python3
"""Separate the Scene 2 contradiction card from Scene 3 metric boards.

Scene 2 compares a positive earnings signal with a negative stock reaction,
which is a two-force card rather than a pure metric board. The existing card
and its exact two lines are reused unchanged.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--spec", required=True, type=Path)
    parser.add_argument("--ready", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    args = parser.parse_args()

    spec = json.loads(args.spec.read_text(encoding="utf-8"))
    scene = next(item for item in spec["scenes"] if item["sceneId"] == "scene-02")
    beat = next(item for item in scene["visualBeats"] if item["beatId"] == "scene-02-beat-002")
    card_id = "scene-02-card-002"
    if not any(card["cardId"] == card_id for card in scene["cards"]):
        raise ValueError("Scene 2 contradiction card is missing")

    previous = {
        "visualTemplate": beat["visualTemplate"],
        "visualMode": beat["visualMode"],
        "visualGrammarId": beat["visualGrammarId"],
        "objectIds": list(beat["objectIds"]),
    }
    beat["visualTemplate"] = "tailwind-headwind"
    beat["visualMode"] = "text-focus"
    beat["visualGrammarId"] = "evidence"
    beat["objectIds"] = [card_id]
    beat["templateConfig"]["variant"] = "two-lane"
    beat["templateConfig"]["displayOrder"] = [card_id]
    beat["templateConfig"]["laneLabels"] = [
        "Q2売上 115.4億ドル",
        "AMD -7.04%",
    ]
    beat.pop("financialVisualTrace", None)
    beat.pop("financialReturnTarget", None)

    show_events = [
        event
        for event in scene["visualEvents"]
        if event.get("action") == "show"
        and event.get("atChunkId") == beat["startChunkId"]
    ]
    if not show_events:
        raise ValueError("Scene 2 contradiction Beat has no show event")
    show_events[0]["targetId"] = card_id

    text = json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    args.spec.write_text(text, encoding="utf-8")
    sha = hashlib.sha256(text.encode("utf-8")).hexdigest()

    change = {
        "sceneId": scene["sceneId"],
        "beatId": beat["beatId"],
        "previous": previous,
        "resolved": {
            "visualTemplate": beat["visualTemplate"],
            "visualMode": beat["visualMode"],
            "visualGrammarId": beat["visualGrammarId"],
            "objectIds": list(beat["objectIds"]),
        },
        "visibleCardTextChanged": False,
        "narrationChanged": False,
        "numbersChanged": False,
        "marketMeaningChanged": False,
    }

    ready = json.loads(args.ready.read_text(encoding="utf-8"))
    ready["renderSpecSha256"] = sha
    normalization = dict(ready.get("rendererNormalization", {}))
    normalization["visualFamilyDiversityRepair"] = change
    ready["rendererNormalization"] = normalization
    args.ready.write_text(
        json.dumps(ready, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    report = json.loads(args.report.read_text(encoding="utf-8"))
    report["normalizedRenderSpecSha256"] = sha
    report["visualFamilyDiversityRepair"] = change
    args.report.write_text(
        json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"status": "repaired", "sha256": sha}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
