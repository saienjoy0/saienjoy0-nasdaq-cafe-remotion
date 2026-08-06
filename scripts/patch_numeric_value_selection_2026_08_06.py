#!/usr/bin/env python3
"""Keep only formal numeric Number objects on numeric Renderer templates.

Earlier adapters preserved duplicate display-only Number objects alongside the
same metrics with numericValue. This removes only those duplicate selections;
visible labels and values are unchanged because the numeric objects carry the
same source strings.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

NUMERIC_TEMPLATES = {
    "metric-comparison-board",
    "market-pulse-grid",
    "earnings-surprise",
    "diverging-stock-bars",
    "split-comparison",
    "focus-matrix",
}


def canonical_sha(value: Any) -> str:
    return hashlib.sha256(
        json.dumps(
            value,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
    ).hexdigest()


def rebuild_financial_contract(spec: dict[str, Any]) -> str | None:
    pairs: list[tuple[dict[str, Any], dict[str, Any]]] = []
    for scene in spec["scenes"]:
        for beat in scene["visualBeats"]:
            trace = beat.get("financialVisualTrace")
            if not trace:
                continue
            display_order = list(beat["objectIds"])
            beat["templateConfig"]["displayOrder"] = display_order
            trace["displayOrder"] = display_order
            plan = {
                "intentId": trace["intentId"],
                "selectedPlanId": trace["selectedPlanId"],
                "selectedPath": trace["selectedPath"],
                "recipeId": trace["recipeId"],
                "visualTemplate": beat["visualTemplate"],
                "sourceIds": trace["sourceIds"],
                "metricIds": trace["metricIds"],
                "causalStepIds": trace["causalStepIds"],
                "displayOrder": display_order,
                "comparisonBasis": trace["comparisonBasis"],
            }
            trace["selectedPlanSha256"] = canonical_sha(plan)
            pairs.append((trace, plan))
    if not pairs:
        spec.pop("financialVisualContract", None)
        return None
    recipe_plan = {
        "contractVersion": "1.0.0",
        "episodeId": spec["episode"]["id"],
        "selections": [plan for _, plan in pairs],
    }
    recipe_sha = canonical_sha(recipe_plan)
    for trace, _ in pairs:
        trace["recipePlanSha256"] = recipe_sha
    spec["financialVisualContract"]["recipePlanSha256"] = recipe_sha
    spec["financialVisualContract"]["selectionCount"] = len(pairs)
    return recipe_sha


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--spec", required=True, type=Path)
    parser.add_argument("--ready", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    args = parser.parse_args()

    spec = json.loads(args.spec.read_text(encoding="utf-8"))
    changes: list[dict[str, Any]] = []

    for scene in spec["scenes"]:
        numbers = {
            number["numberId"]: number
            for number in scene.get("numbers", [])
        }
        for beat in scene["visualBeats"]:
            if beat["visualTemplate"] not in NUMERIC_TEMPLATES:
                continue
            previous = list(beat["objectIds"])
            resolved = [
                object_id
                for object_id in previous
                if object_id not in numbers
                or numbers[object_id].get("numericValue") is not None
            ]
            if resolved == previous:
                continue
            beat["objectIds"] = resolved
            beat["templateConfig"]["displayOrder"] = list(resolved)
            changes.append(
                {
                    "sceneId": scene["sceneId"],
                    "beatId": beat["beatId"],
                    "visualTemplate": beat["visualTemplate"],
                    "previousObjectIds": previous,
                    "resolvedObjectIds": resolved,
                    "removedDuplicateNumberIds": [
                        object_id
                        for object_id in previous
                        if object_id in numbers
                        and numbers[object_id].get("numericValue") is None
                    ],
                    "visibleMetricContentChanged": False,
                }
            )

    recipe_sha = rebuild_financial_contract(spec)
    text = json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    args.spec.write_text(text, encoding="utf-8")
    sha = hashlib.sha256(text.encode("utf-8")).hexdigest()

    ready = json.loads(args.ready.read_text(encoding="utf-8"))
    ready["renderSpecSha256"] = sha
    normalization = dict(ready.get("rendererNormalization", {}))
    normalization.update(
        {
            "duplicateNonNumericSelectionsRemoved": True,
            "numericSelectionChanges": changes,
            "visibleMetricContentChanged": False,
            "financialRecipePlanSha256": recipe_sha,
        }
    )
    ready["rendererNormalization"] = normalization
    args.ready.write_text(
        json.dumps(ready, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    report = json.loads(args.report.read_text(encoding="utf-8"))
    report["normalizedRenderSpecSha256"] = sha
    report["duplicateNonNumericSelectionsRemoved"] = True
    report["numericSelectionChanges"] = changes
    report["visibleMetricContentChanged"] = False
    report["financialRecipePlanSha256"] = recipe_sha
    args.report.write_text(
        json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "status": "deduplicated",
                "changeCount": len(changes),
                "renderSpecSha256": sha,
                "financialRecipePlanSha256": recipe_sha,
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
