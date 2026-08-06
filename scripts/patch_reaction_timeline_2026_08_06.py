#!/usr/bin/env python3
"""Bind Scene 6 reaction-timeline precision to the existing verified evidence."""

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
    scene = next(item for item in spec["scenes"] if item["sceneId"] == "scene-06")
    beat = next(
        item
        for item in scene["visualBeats"]
        if item["visualTemplate"] == "event-reaction-timeline"
    )
    if beat["objectIds"] != ["scene-06-card-001"]:
        raise ValueError("unexpected Scene 6 reaction timeline object order")
    beat["templateConfig"]["variant"] = "official-time-plus-close"
    beat["templateConfig"]["reactionTimeline"] = {
        "precision": "official-time-plus-close",
        "eventOrderIds": list(beat["objectIds"]),
        "seriesObjectIds": [],
    }

    text = json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    args.spec.write_text(text, encoding="utf-8")
    spec_sha = hashlib.sha256(text.encode("utf-8")).hexdigest()

    ready = json.loads(args.ready.read_text(encoding="utf-8"))
    ready["renderSpecSha256"] = spec_sha
    normalization = dict(ready.get("rendererNormalization", {}))
    normalization.update(
        {
            "reactionTimelinePrecision": "official-time-plus-close",
            "reactionTimelineSeriesInvented": False,
        }
    )
    ready["rendererNormalization"] = normalization
    args.ready.write_text(
        json.dumps(ready, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    report = json.loads(args.report.read_text(encoding="utf-8"))
    report.update(
        {
            "normalizedRenderSpecSha256": spec_sha,
            "reactionTimelinePrecision": "official-time-plus-close",
            "reactionTimelineEventOrderIds": list(beat["objectIds"]),
            "reactionTimelineSeriesObjectIds": [],
            "reactionTimelineSeriesInvented": False,
        }
    )
    args.report.write_text(
        json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"renderSpecSha256": spec_sha, "status": "bound"}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
