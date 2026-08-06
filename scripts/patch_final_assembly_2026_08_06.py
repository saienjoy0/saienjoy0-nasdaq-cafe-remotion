#!/usr/bin/env python3
"""Bind the unchanged Scene 9 recap card to the mandatory final-assembly template."""

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
    scene = next(item for item in spec["scenes"] if item["sceneId"] == "scene-09")
    beat = scene["visualBeats"][-1]
    previous = {
        "visualTemplate": beat["visualTemplate"],
        "variant": beat["templateConfig"]["variant"],
        "objectIds": list(beat["objectIds"]),
    }
    beat["visualTemplate"] = "final-assembly"
    beat["templateConfig"]["variant"] = "default"
    beat["templateConfig"]["displayOrder"] = list(beat["objectIds"])
    beat["templateVariant"] = "default"
    beat["transitionRole"] = "closing"

    text = json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    args.spec.write_text(text, encoding="utf-8")
    sha = hashlib.sha256(text.encode("utf-8")).hexdigest()

    change = {
        "sceneId": scene["sceneId"],
        "beatId": beat["beatId"],
        "previous": previous,
        "resolved": {
            "visualTemplate": beat["visualTemplate"],
            "variant": beat["templateConfig"]["variant"],
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
    normalization["finalAssemblyRepair"] = change
    ready["rendererNormalization"] = normalization
    args.ready.write_text(
        json.dumps(ready, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    report = json.loads(args.report.read_text(encoding="utf-8"))
    report["normalizedRenderSpecSha256"] = sha
    report["finalAssemblyRepair"] = change
    args.report.write_text(
        json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"status": "bound", "sha256": sha}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
