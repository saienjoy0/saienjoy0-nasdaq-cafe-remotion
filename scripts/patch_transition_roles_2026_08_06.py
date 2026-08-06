#!/usr/bin/env python3
"""Align major-shift metadata with actual Renderer appearance changes.

Only transitionRole metadata is adjusted. Templates, objects, text, narration,
numbers, expressions, shots, and Scene order remain unchanged.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


def normalize(value: str) -> str:
    return "".join(value.split())


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--spec", required=True, type=Path)
    parser.add_argument("--ready", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--compatibility", required=True, type=Path)
    args = parser.parse_args()

    spec = json.loads(args.spec.read_text(encoding="utf-8"))
    compatibility = json.loads(args.compatibility.read_text(encoding="utf-8"))
    by_template = {
        entry["visualTemplateId"]: entry
        for entry in compatibility["templates"]
    }

    def appearance(beat: dict[str, Any]) -> dict[str, str]:
        entry = by_template[beat["visualTemplate"]]
        variant = beat["templateConfig"]["variant"]
        override = next(
            (
                item
                for item in entry.get("variantOverrides", [])
                if item["variant"] == variant
            ),
            None,
        )
        source = override or entry
        return {
            "appearanceClass": source["appearanceClass"],
            "dominantSurface": source["dominantSurface"],
        }

    flattened = [
        (scene, beat)
        for scene in spec["scenes"]
        for beat in scene["visualBeats"]
    ]
    previous: dict[str, str] | None = None
    changes: list[dict[str, Any]] = []

    for index, (scene, beat) in enumerate(flattened):
        current = appearance(beat)
        previous_role = beat["transitionRole"]
        resolved_role = previous_role

        if index == len(flattened) - 1:
            resolved_role = "closing"
        elif previous_role == "major-shift":
            physically_different = (
                previous is None
                or current["appearanceClass"] != previous["appearanceClass"]
                or current["dominantSurface"] != previous["dominantSurface"]
            )
            motion_valid = True
            shots = beat.get("shots") or []
            if shots:
                first_shot = shots[0]
                motion_valid = first_shot.get("transitionIn") in {
                    "hard-cut",
                    "reframe-shared-element",
                }
                expression_change = beat.get("expressionChange")
                if motion_valid and expression_change is not None:
                    expression_valid = (
                        first_shot.get("foxExpression") == expression_change
                    )
                    start_cue = normalize(first_shot.get("startCue") or "")
                    change_cue = normalize(beat.get("changeCue") or "")
                    cue_valid = bool(start_cue) and (
                        start_cue in change_cue or change_cue in start_cue
                    )
                    motion_valid = expression_valid and cue_valid
            if not physically_different or not motion_valid:
                resolved_role = "continuation"

        beat["transitionRole"] = resolved_role
        if previous_role != resolved_role:
            changes.append(
                {
                    "sceneId": scene["sceneId"],
                    "beatId": beat["beatId"],
                    "from": previous_role,
                    "to": resolved_role,
                    "appearanceClass": current["appearanceClass"],
                    "dominantSurface": current["dominantSurface"],
                }
            )
        previous = current

    text = json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    args.spec.write_text(text, encoding="utf-8")
    sha = hashlib.sha256(text.encode("utf-8")).hexdigest()

    ready = json.loads(args.ready.read_text(encoding="utf-8"))
    ready["renderSpecSha256"] = sha
    normalization = dict(ready.get("rendererNormalization", {}))
    normalization.update(
        {
            "transitionRolesPhysical": True,
            "transitionRoleChanges": changes,
            "visibleContentChanged": False,
        }
    )
    ready["rendererNormalization"] = normalization
    args.ready.write_text(
        json.dumps(ready, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    report = json.loads(args.report.read_text(encoding="utf-8"))
    report["normalizedRenderSpecSha256"] = sha
    report["transitionRolesPhysical"] = True
    report["transitionRoleChanges"] = changes
    report["visibleContentChangedByTransitionRepair"] = False
    args.report.write_text(
        json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "status": "aligned",
                "count": len(changes),
                "sha256": sha,
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
