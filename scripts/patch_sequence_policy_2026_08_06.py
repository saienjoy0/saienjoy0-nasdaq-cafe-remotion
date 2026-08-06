#!/usr/bin/env python3
"""Resolve Beat sequencePolicy from the already-declared Visual Events.

No event, object, narration, or visible text is added or removed. The script
only makes the policy agree with the existing show-event coverage.
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
    changes: list[dict[str, object]] = []

    for scene in spec["scenes"]:
        chunk_order = {
            chunk["chunkId"]: index
            for index, chunk in enumerate(scene["narrationChunks"])
        }
        for beat in scene["visualBeats"]:
            start = chunk_order[beat["startChunkId"]]
            end = chunk_order[beat["endChunkId"]]
            show_targets = {
                event["targetId"]
                for event in scene["visualEvents"]
                if event.get("action") == "show"
                and event.get("targetId") in beat["objectIds"]
                and start <= chunk_order[event["atChunkId"]] <= end
            }
            object_ids = set(beat["objectIds"])
            if not object_ids:
                resolved = "static"
            elif show_targets == object_ids:
                resolved = "explicit"
            else:
                resolved = "object-order-fallback"

            previous = beat.get("sequencePolicy")
            beat["sequencePolicy"] = resolved
            if previous != resolved:
                changes.append(
                    {
                        "sceneId": scene["sceneId"],
                        "beatId": beat["beatId"],
                        "from": previous,
                        "to": resolved,
                        "objectIds": beat["objectIds"],
                        "showTargetIds": sorted(show_targets),
                    }
                )

    text = json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    args.spec.write_text(text, encoding="utf-8")
    spec_sha = hashlib.sha256(text.encode("utf-8")).hexdigest()

    ready = json.loads(args.ready.read_text(encoding="utf-8"))
    ready["renderSpecSha256"] = spec_sha
    normalization = dict(ready.get("rendererNormalization", {}))
    normalization.update(
        {
            "sequencePolicyResolved": True,
            "sequencePolicyChangeCount": len(changes),
            "visualEventsChanged": False,
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
            "sequencePolicyResolved": True,
            "sequencePolicyChanges": changes,
            "visualEventsChanged": False,
        }
    )
    args.report.write_text(
        json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "status": "resolved",
                "renderSpecSha256": spec_sha,
                "changeCount": len(changes),
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
