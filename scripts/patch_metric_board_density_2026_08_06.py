#!/usr/bin/env python3
"""Deduplicate the formal Number objects selected by Scene 3 metric boards.

Two adapter stages promoted the same three source lines under different IDs.
Keep the three Number objects that carry numericValue and preserve the original
metric-comparison-board. No metric text or numeric value is removed.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

BEAT_IDS = {"scene-03-beat-001", "scene-03-beat-002"}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--spec", required=True, type=Path)
    parser.add_argument("--ready", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    args = parser.parse_args()

    spec = json.loads(args.spec.read_text(encoding="utf-8"))
    changes = []
    for scene in spec["scenes"]:
        numbers = {
            number["numberId"]: number
            for number in scene.get("numbers", [])
        }
        for beat in scene["visualBeats"]:
            if beat["beatId"] not in BEAT_IDS:
                continue
            numeric_ids = [
                object_id
                for object_id in beat["objectIds"]
                if object_id in numbers
                and numbers[object_id].get("numericValue") is not None
            ]
            if len(numeric_ids) != 3:
                raise ValueError(
                    f"Scene 3 metric board requires exactly three numeric metrics: "
                    f"{beat['beatId']} got {len(numeric_ids)}"
                )
            previous_template = beat["visualTemplate"]
            previous_objects = list(beat["objectIds"])
            beat["visualTemplate"] = "metric-comparison-board"
            beat["templateConfig"]["variant"] = "default"
            beat["objectIds"] = numeric_ids
            beat["templateConfig"]["displayOrder"] = list(numeric_ids)
            changes.append(
                {
                    "sceneId": scene["sceneId"],
                    "beatId": beat["beatId"],
                    "fromTemplate": previous_template,
                    "toTemplate": "metric-comparison-board",
                    "previousObjectIds": previous_objects,
                    "resolvedObjectIds": list(numeric_ids),
                    "selectedNumberCount": len(numeric_ids),
                    "sourceMetricCount": 3,
                    "metricTextRemoved": False,
                    "metricNumbersRemoved": False,
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
            "scene3MetricDuplicatesResolved": True,
            "scene3MetricDeduplicationChanges": changes,
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
    report["scene3MetricDuplicatesResolved"] = True
    report["scene3MetricDeduplicationChanges"] = changes
    report["metricTextRemoved"] = False
    report["metricNumbersRemoved"] = False
    args.report.write_text(
        json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"status": "deduplicated", "count": len(changes), "sha256": sha}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
