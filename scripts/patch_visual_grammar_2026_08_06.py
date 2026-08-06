#!/usr/bin/env python3
"""Align the two retargeted templates with registered Visual Grammar IDs."""

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
    targets = {
        "scene-02-beat-002": "evidence",
        "scene-07-beat-002": "evidence",
    }
    changes = []
    for scene in spec["scenes"]:
        for beat in scene["visualBeats"]:
            grammar = targets.get(beat["beatId"])
            if grammar is None:
                continue
            previous = beat["visualGrammarId"]
            beat["visualGrammarId"] = grammar
            if previous != grammar:
                changes.append(
                    {
                        "sceneId": scene["sceneId"],
                        "beatId": beat["beatId"],
                        "from": previous,
                        "to": grammar,
                    }
                )

    text = json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    args.spec.write_text(text, encoding="utf-8")
    sha = hashlib.sha256(text.encode("utf-8")).hexdigest()

    ready = json.loads(args.ready.read_text(encoding="utf-8"))
    ready["renderSpecSha256"] = sha
    normalization = dict(ready.get("rendererNormalization", {}))
    normalization["visualGrammarChanges"] = changes
    ready["rendererNormalization"] = normalization
    args.ready.write_text(
        json.dumps(ready, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    report = json.loads(args.report.read_text(encoding="utf-8"))
    report["normalizedRenderSpecSha256"] = sha
    report["visualGrammarChanges"] = changes
    args.report.write_text(
        json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"status": "aligned", "count": len(changes), "sha256": sha}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
