#!/usr/bin/env python3
"""Apply structural Renderer 2.4 adaptations to the normalized 2026-08-06 spec.

The adapter only promotes existing display strings into formal objects, aligns
redundant control metadata, and recomputes deterministic Financial Visual hashes.
It does not alter narration, numerical text, Scene order, or market meaning.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from copy import deepcopy
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


def adapt(*, spec_path: Path, ready_path: Path, report_path: Path) -> dict[str, Any]:
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    promoted_numbers: list[dict[str, str]] = []
    promoted_gap_cards: list[dict[str, str]] = []

    # Promote exact card-line metric strings to formal Number objects.
    for scene in spec["scenes"]:
        cards = {card["cardId"]: card for card in scene.get("cards", [])}
        numbers = scene.setdefault("numbers", [])
        existing_ids = {item["numberId"] for item in numbers}
        for beat in scene["visualBeats"]:
            if beat.get("visualMode") != "number-comparison":
                continue
            referenced_cards = [
                cards[item]
                for item in beat.get("objectIds", [])
                if item in cards
            ]
            promoted_ids: list[str] = []
            for card_index, card in enumerate(referenced_cards, start=1):
                for line_index, line in enumerate(card["lines"], start=1):
                    number_id = (
                        f"{beat['beatId']}-number-"
                        f"{card_index:02d}-{line_index:02d}"
                    )
                    if number_id not in existing_ids:
                        text = line["value"].strip()
                        if " " in text:
                            label, value = text.rsplit(" ", 1)
                        else:
                            label, value = card["title"], text
                        numbers.append(
                            {
                                "numberId": number_id,
                                "label": label,
                                "value": value,
                                "unit": "",
                                "comparison": None,
                                "tone": line["tone"],
                            }
                        )
                        existing_ids.add(number_id)
                        promoted_numbers.append(
                            {
                                "sceneId": scene["sceneId"],
                                "beatId": beat["beatId"],
                                "sourceCardId": card["cardId"],
                                "sourceLine": line["value"],
                                "numberId": number_id,
                            }
                        )
                    promoted_ids.append(number_id)
            if len(promoted_ids) < 2:
                raise ValueError(
                    "number-comparison Beat has fewer than two promoted numbers: "
                    f"{beat['beatId']}"
                )
            beat["objectIds"] = list(
                dict.fromkeys([*beat["objectIds"], *promoted_ids])
            )

    # Promote the existing three Expected/Actual/Gap lines into role cards.
    scene4 = next(
        scene for scene in spec["scenes"] if scene["sceneId"] == "scene-04"
    )
    beat1, beat2 = scene4["visualBeats"]
    source_card = next(
        card
        for card in scene4["cards"]
        if card["cardId"] in beat1["objectIds"]
    )
    if len(source_card["lines"]) != 3:
        raise ValueError(
            "Scene 4 Expected/Actual/Gap source card must contain three lines"
        )
    roles = ("expected", "actual", "gap")
    role_cards: list[dict[str, Any]] = []
    for role, line in zip(roles, source_card["lines"], strict=True):
        card = {
            "cardId": f"scene-04-card-{role}",
            "role": role,
            "title": role.capitalize(),
            "lines": [deepcopy(line)],
        }
        role_cards.append(card)
        promoted_gap_cards.append(
            {
                "role": role,
                "sourceLine": line["value"],
                "cardId": card["cardId"],
            }
        )
    scene4["cards"] = role_cards
    beat1["objectIds"] = [card["cardId"] for card in role_cards]
    beat2["visualMode"] = "text-focus"
    beat2["objectIds"] = []

    event_template = deepcopy(scene4["visualEvents"][0])
    events: list[dict[str, Any]] = []
    for event_id, card in zip(
        ("event-007", "event-008", "event-019"),
        role_cards,
        strict=True,
    ):
        event = deepcopy(event_template)
        event["eventId"] = event_id
        event["atChunkId"] = beat1["startChunkId"]
        event["targetId"] = card["cardId"]
        events.append(event)
    scene4["visualEvents"] = events

    # Scene 9 has no following Scene, so its transition is a zero-duration none.
    scene9 = next(
        scene for scene in spec["scenes"] if scene["sceneId"] == "scene-09"
    )
    scene9["transition"] = {"type": "none", "durationMs": 0}

    # Rebind Financial Visual plans after Number object promotion.
    financial_pairs: list[tuple[dict[str, Any], dict[str, Any]]] = []
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
            financial_pairs.append((trace, plan))

    recipe_plan = {
        "contractVersion": "1.0.0",
        "episodeId": spec["episode"]["id"],
        "selections": [plan for _, plan in financial_pairs],
    }
    recipe_plan_sha = canonical_sha(recipe_plan)
    for trace, _ in financial_pairs:
        trace["recipePlanSha256"] = recipe_plan_sha
    if financial_pairs:
        spec["financialVisualContract"]["recipePlanSha256"] = recipe_plan_sha
        spec["financialVisualContract"]["selectionCount"] = len(financial_pairs)

    normalized_text = json.dumps(
        spec, ensure_ascii=False, indent=2, sort_keys=True
    ) + "\n"
    spec_path.write_text(normalized_text, encoding="utf-8")
    spec_sha = hashlib.sha256(normalized_text.encode("utf-8")).hexdigest()

    ready = json.loads(ready_path.read_text(encoding="utf-8"))
    ready["renderSpecSha256"] = spec_sha
    normalization = dict(ready.get("rendererNormalization", {}))
    normalization.update(
        {
            "promotedNumberObjectCount": len(promoted_numbers),
            "promotedExpectedActualGapCardCount": len(promoted_gap_cards),
            "numberTextChanged": False,
            "expectedActualGapTextChanged": False,
            "scene9TransitionNormalized": True,
            "financialRecipePlanSha256": recipe_plan_sha,
        }
    )
    ready["rendererNormalization"] = normalization
    ready_path.write_text(
        json.dumps(ready, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    report = json.loads(report_path.read_text(encoding="utf-8"))
    report.update(
        {
            "normalizedRenderSpecSha256": spec_sha,
            "promotedNumberObjectCount": len(promoted_numbers),
            "promotedNumbers": promoted_numbers,
            "promotedExpectedActualGapCardCount": len(promoted_gap_cards),
            "promotedExpectedActualGapCards": promoted_gap_cards,
            "numberTextChanged": False,
            "expectedActualGapTextChanged": False,
            "scene9TransitionNormalized": True,
            "financialRecipePlanSha256": recipe_plan_sha,
        }
    )
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return {
        "renderSpecSha256": spec_sha,
        "promotedNumberObjectCount": len(promoted_numbers),
        "promotedExpectedActualGapCardCount": len(promoted_gap_cards),
        "financialTraceCount": len(financial_pairs),
        "scene9TransitionNormalized": True,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--spec", required=True, type=Path)
    parser.add_argument("--ready", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    args = parser.parse_args()
    result = adapt(
        spec_path=args.spec,
        ready_path=args.ready,
        report_path=args.report,
    )
    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
