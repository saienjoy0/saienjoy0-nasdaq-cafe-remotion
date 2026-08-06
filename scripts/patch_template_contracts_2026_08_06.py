#!/usr/bin/env python3
"""Align all 2026-08-06 Visual Beats with registered Renderer templates.

The source package expressed many graphics as generic cards. This adapter
promotes the exact existing strings into the Renderer object types required by
the selected visual template. It does not rewrite narration, labels, values,
Scene order, or market conclusions.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Any


def canonical_sha(value: Any) -> str:
    return hashlib.sha256(
        json.dumps(
            value,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
    ).hexdigest()


def split_metric(text: str) -> tuple[str, str, float | None, int | None, str]:
    stripped = text.strip()
    if " " in stripped:
        label, visible = stripped.rsplit(" ", 1)
    else:
        label, visible = stripped, stripped
    match = re.search(r"([+-]?\d+(?:\.\d+)?)(.*)$", visible)
    if not match:
        return label, visible, None, None, ""
    numeric = float(match.group(1))
    decimals = len(match.group(1).split(".", 1)[1]) if "." in match.group(1) else 0
    unit = match.group(2)
    return label, visible, numeric, decimals, unit


def ensure_numbers_from_card(
    *,
    scene: dict[str, Any],
    beat: dict[str, Any],
    card_id: str,
    prefix: str,
    remove_card_from_selection: bool,
) -> list[str]:
    card = next(card for card in scene["cards"] if card["cardId"] == card_id)
    numbers = scene.setdefault("numbers", [])
    existing = {number["numberId"] for number in numbers}
    ids: list[str] = []
    for index, line in enumerate(card["lines"], start=1):
        number_id = f"{prefix}-number-{index:02d}"
        label, value, numeric, precision, unit = split_metric(line["value"])
        if number_id not in existing:
            number = {
                "numberId": number_id,
                "label": label,
                "value": value,
                "unit": unit,
                "comparison": None,
                "tone": line["tone"],
            }
            if numeric is not None:
                number["numericValue"] = numeric
                number["precision"] = precision
            numbers.append(number)
            existing.add(number_id)
        ids.append(number_id)
    if remove_card_from_selection:
        beat["objectIds"] = [
            object_id for object_id in beat["objectIds"] if object_id != card_id
        ]
    beat["objectIds"] = list(dict.fromkeys([*beat["objectIds"], *ids]))
    return ids


def retarget_show_event(
    *, scene: dict[str, Any], old_target: str, new_target: str
) -> None:
    candidates = [
        event
        for event in scene["visualEvents"]
        if event.get("action") == "show" and event.get("targetId") == old_target
    ]
    if not candidates:
        raise ValueError(f"missing show event for {old_target}")
    candidates[0]["targetId"] = new_target


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
    change_log: list[dict[str, Any]] = []
    scenes = {scene["sceneId"]: scene for scene in spec["scenes"]}

    # Scene 2: revenue and return have unlike units, so use a generic metric
    # comparison rather than pretending they are two stock-return bars.
    scene = scenes["scene-02"]
    beat = scene["visualBeats"][1]
    card_id = "scene-02-card-002"
    number_ids = ensure_numbers_from_card(
        scene=scene,
        beat=beat,
        card_id=card_id,
        prefix=beat["beatId"],
        remove_card_from_selection=True,
    )
    retarget_show_event(scene=scene, old_target=card_id, new_target=number_ids[0])
    beat["visualTemplate"] = "metric-comparison-board"
    beat["visualMode"] = "number-comparison"
    beat["templateConfig"]["variant"] = "default"
    change_log.append({"beatId": beat["beatId"], "template": "metric-comparison-board"})

    # Scene 3: both boards already contain exact metric strings.
    for beat, card_id in zip(
        scenes["scene-03"]["visualBeats"],
        ("scene-03-card-001", "scene-03-card-002"),
        strict=True,
    ):
        ids = ensure_numbers_from_card(
            scene=scenes["scene-03"],
            beat=beat,
            card_id=card_id,
            prefix=beat["beatId"],
            remove_card_from_selection=True,
        )
        retarget_show_event(
            scene=scenes["scene-03"], old_target=card_id, new_target=ids[0]
        )

    # Scene 5: promote the exact three causal lines into a node chain.
    scene = scenes["scene-05"]
    beat = scene["visualBeats"][1]
    card_id = "scene-05-card-002"
    card = next(card for card in scene["cards"] if card["cardId"] == card_id)
    node_ids = [f"scene-05-node-{index:03d}" for index in range(1, 4)]
    arrow_ids = [f"scene-05-arrow-{index:03d}" for index in range(1, 3)]
    scene["nodes"] = [
        {"nodeId": node_id, "label": line["value"]}
        for node_id, line in zip(node_ids, card["lines"], strict=True)
    ]
    scene["arrows"] = [
        {
            "arrowId": arrow_ids[0],
            "fromNodeId": node_ids[0],
            "toNodeId": node_ids[1],
            "label": "",
        },
        {
            "arrowId": arrow_ids[1],
            "fromNodeId": node_ids[1],
            "toNodeId": node_ids[2],
            "label": "",
        },
    ]
    beat["objectIds"] = [
        node_ids[0], node_ids[1], arrow_ids[0], node_ids[2], arrow_ids[1]
    ]
    beat["templateConfig"]["variant"] = "left-to-right"
    beat["templateConfig"]["nodeOrder"] = node_ids
    beat["templateConfig"]["outcomeNodeId"] = node_ids[-1]
    retarget_show_event(scene=scene, old_target=card_id, new_target=node_ids[0])
    change_log.append({"beatId": beat["beatId"], "promotedCausalNodes": 3})

    # Scene 6 market grid: three same-unit percentage values.
    scene = scenes["scene-06"]
    beat = scene["visualBeats"][1]
    card_id = "scene-06-card-002"
    ids = ensure_numbers_from_card(
        scene=scene,
        beat=beat,
        card_id=card_id,
        prefix=beat["beatId"],
        remove_card_from_selection=True,
    )
    retarget_show_event(scene=scene, old_target=card_id, new_target=ids[0])
    beat["templateConfig"]["variant"] = "grid"

    # Scene 7 first Beat: true same-unit stock-return bars.
    scene = scenes["scene-07"]
    beat = scene["visualBeats"][0]
    card_id = "scene-07-card-001"
    ids = ensure_numbers_from_card(
        scene=scene,
        beat=beat,
        card_id=card_id,
        prefix=beat["beatId"],
        remove_card_from_selection=True,
    )
    retarget_show_event(scene=scene, old_target=card_id, new_target=ids[0])
    beat["templateConfig"]["variant"] = "center-zero"

    # Scene 7 second Beat is a two-sided causal boundary, not two numeric assets.
    beat = scene["visualBeats"][1]
    beat["visualTemplate"] = "tailwind-headwind"
    beat["templateConfig"]["variant"] = "two-lane"
    beat["objectIds"] = ["scene-07-card-002"]
    beat.pop("templateVariant", None)
    beat.pop("financialReturnTarget", None)
    beat.pop("financialVisualTrace", None)
    change_log.append({"beatId": beat["beatId"], "template": "tailwind-headwind"})

    # Scene 8 verification matrix uses the registered strengthen/weaken variant.
    beat = scenes["scene-08"]["visualBeats"][0]
    beat["templateConfig"]["variant"] = "strengthen-vs-weaken"

    recipe_sha = rebuild_financial_contract(spec)
    text = json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    args.spec.write_text(text, encoding="utf-8")
    spec_sha = hashlib.sha256(text.encode("utf-8")).hexdigest()

    ready = json.loads(args.ready.read_text(encoding="utf-8"))
    ready["renderSpecSha256"] = spec_sha
    normalization = dict(ready.get("rendererNormalization", {}))
    normalization.update(
        {
            "templateContractsAligned": True,
            "templateContractChanges": change_log,
            "financialRecipePlanSha256": recipe_sha,
            "visibleTextChanged": False,
            "visibleNumbersChanged": False,
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
            "templateContractsAligned": True,
            "templateContractChanges": change_log,
            "financialRecipePlanSha256": recipe_sha,
            "visibleTextChanged": False,
            "visibleNumbersChanged": False,
        }
    )
    args.report.write_text(
        json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "status": "aligned",
                "renderSpecSha256": spec_sha,
                "changeCount": len(change_log),
                "financialRecipePlanSha256": recipe_sha,
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
