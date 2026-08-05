#!/usr/bin/env python3
"""Generate the shared financial render_spec 2.3.0 acceptance fixture."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "render-specs" / "2026-07-31" / "render_spec.json"
MATRIX = ROOT / "contracts" / "financial_visual_compatibility.json"
OUT_DIR = ROOT / "shared-fixtures" / "financial-visual-2.3"
OUT_SPEC = OUT_DIR / "render_spec.json"
OUT_MANIFEST = OUT_DIR / "fixture_manifest.json"
TECHNICAL_DATE = "2099-02-02"
SHA_A = "a" * 64
SHA_B = "b" * 64
SHA_C = "c" * 64
EVENT_ID = re.compile(r"^event-(\d{3})$")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def make_number(number_id: str, label: str, value: str, numeric: float, tone: str) -> dict[str, Any]:
    return {
        "numberId": number_id,
        "label": label,
        "value": value,
        "numericValue": numeric,
        "precision": 1,
        "unit": "billion USD",
        "comparison": "AWS revenue, technical fixture",
        "tone": tone,
    }


def remove_replaced_beat_events(scene: dict[str, Any], beat: dict[str, Any]) -> None:
    chunk_ids = [chunk["chunkId"] for chunk in scene.get("narrationChunks", [])]
    chunk_index = {chunk_id: index for index, chunk_id in enumerate(chunk_ids)}
    start_index = chunk_index[beat["startChunkId"]]
    end_index = chunk_index[beat["endChunkId"]]
    replaced_ids = set(beat.get("objectIds", []))
    scene["visualEvents"] = [
        event
        for event in scene.get("visualEvents", [])
        if not (
            event.get("targetId") in replaced_ids
            and event.get("atChunkId") in chunk_index
            and start_index <= chunk_index[event["atChunkId"]] <= end_index
        )
    ]


def resolve_explicit_show_events(spec: dict[str, Any]) -> None:
    """Make every explicit Beat executable without changing its object order."""
    used_numbers: set[int] = set()
    for scene in spec.get("scenes", []):
        for event in scene.get("visualEvents", []):
            match = EVENT_ID.fullmatch(str(event.get("eventId", "")))
            if match:
                used_numbers.add(int(match.group(1)))
    next_number = max(used_numbers, default=0) + 1

    for scene in spec.get("scenes", []):
        chunks = scene.get("narrationChunks", [])
        chunk_index = {chunk["chunkId"]: index for index, chunk in enumerate(chunks)}
        events = scene.setdefault("visualEvents", [])
        for beat in scene.get("visualBeats", []):
            if beat.get("sequencePolicy") != "explicit":
                continue
            start_index = chunk_index[beat["startChunkId"]]
            end_index = chunk_index[beat["endChunkId"]]
            shown = {
                event.get("targetId")
                for event in events
                if event.get("action") == "show"
                and event.get("targetId")
                and event.get("atChunkId") in chunk_index
                and start_index <= chunk_index[event["atChunkId"]] <= end_index
            }
            for order, object_id in enumerate(beat.get("objectIds", [])):
                if object_id in shown:
                    continue
                while next_number in used_numbers:
                    next_number += 1
                if next_number > 999:
                    raise SystemExit("event ID space exhausted while resolving explicit sequence")
                events.append(
                    {
                        "eventId": f"event-{next_number:03d}",
                        "atChunkId": beat["startChunkId"],
                        "timing": "chunk-start",
                        "action": "show",
                        "targetId": object_id,
                        "offsetMs": min(order * 120, 9_000),
                        "expression": None,
                    }
                )
                used_numbers.add(next_number)
                next_number += 1


def generate() -> tuple[str, str]:
    spec = json.loads(SOURCE.read_text(encoding="utf-8"))
    matrix = json.loads(MATRIX.read_text(encoding="utf-8"))
    if matrix.get("matrixId") != "financial-visual-compat-2026-08":
        raise SystemExit("unexpected compatibility matrix")

    spec["schemaVersion"] = "2.3.0"
    spec["episode"]["id"] = TECHNICAL_DATE
    spec["episode"]["targetDate"] = TECHNICAL_DATE
    spec["episode"]["marketSession"] = "TECHNICAL ACCEPTANCE"
    spec["financialVisualContract"] = {
        "contractVersion": "1.0.0",
        "intentVersion": "1.1.0",
        "recipePlanVersion": "1.0.0",
        "recipeRegistryVersion": "1.0.0",
        "finalEpisodeContractVersion": "1.0.0",
        "recipePlanSha256": SHA_A,
        "selectionCount": 1,
    }

    scene = next(item for item in spec["scenes"] if item["sceneId"] == "scene-04")
    beat = scene["visualBeats"][0]
    remove_replaced_beat_events(scene, beat)
    number_ids = ["fvu-aws-expected", "fvu-aws-actual", "fvu-aws-gap"]
    scene["numbers"] = [item for item in scene["numbers"] if item["numberId"] not in number_ids]
    scene["numbers"].extend([
        make_number(number_ids[0], "EXPECTED", "$42.3B", 42.3, "neutral"),
        make_number(number_ids[1], "ACTUAL", "$43.0B", 43.0, "positive"),
        make_number(number_ids[2], "GAP", "+$0.7B", 0.7, "emphasis"),
    ])

    scene["visualMode"] = "number-comparison"
    beat["beatId"] = "vb-04-02"
    beat["primaryFunction"] = "Compare"
    beat["screenState"] = "Chart"
    beat["visualMode"] = "number-comparison"
    beat["visualTemplate"] = "earnings-surprise"
    beat["templateVariant"] = "zero-baseline"
    beat["templateConfig"] = {
        "variant": "zero-baseline",
        "comparisonBasis": "AWS revenue, same entity, period, currency, and unit",
        "dataBasis": "financial-recipe-plan",
        "nodeOrder": [],
        "laneLabels": [],
        "outcomeNodeId": None,
        "displayOrder": number_ids,
        "metricIds": number_ids,
        "causalStepIds": [],
        "highlightObjectIds": [number_ids[2]],
    }
    beat["sequencePolicy"] = "explicit"
    beat["finalHoldMs"] = 900
    beat["contentType"] = "financial-data"
    beat["screenQuestion"] = "予想を上回っても、市場が見た差は何か"
    beat["primaryElement"] = "AWS revenue gap"
    beat["viewerTexts"] = ["Expected $42.3B", "Actual $43.0B", "Gap +$0.7B"]
    beat["changeCue"] = beat["narrationStartCue"]
    beat["objectIds"] = number_ids
    beat["assetPlacementIds"] = []
    beat["assetState"] = "not-required"
    beat["returnScreenState"] = None
    beat["fallback"] = None
    beat["financialReturnTarget"] = "return-to-fox-analysis"
    beat["financialVisualTrace"] = {
        "contractVersion": "1.0.0",
        "intentId": "fvi-aws-expectation-gap",
        "selectedPlanId": "fvp-aws-gap-preferred",
        "selectedPlanSha256": SHA_B,
        "selectedPath": "preferred",
        "recipeId": "earnings-surprise",
        "recipePlanSha256": SHA_A,
        "finalEpisodeContractSha256": SHA_C,
        "sourceIds": beat["evidenceSourceIds"],
        "metricIds": number_ids,
        "causalStepIds": [],
        "displayOrder": number_ids,
        "comparisonBasis": "AWS revenue, same entity, period, currency, and unit",
        "reasonCodes": [],
    }
    beat.pop("shots", None)

    resolve_explicit_show_events(spec)
    write_json(OUT_SPEC, spec)
    spec_sha = sha256(OUT_SPEC)
    matrix_sha = sha256(MATRIX)
    manifest = {
        "fixtureVersion": "1.0.0",
        "fixtureId": "financial-visual-2.3-earnings-surprise",
        "compatibilityMatrixId": matrix["matrixId"],
        "renderSpecVersion": "2.3.0",
        "financialVisualTraceVersion": "1.0.0",
        "financialTemplateRegistryVersion": "1.0.0",
        "selectedTemplate": "earnings-surprise",
        "selectedSceneId": "scene-04",
        "selectedVisualBeatId": "vb-04-02",
        "renderSpecSha256": spec_sha,
        "compatibilityMatrixSha256": matrix_sha,
        "sourceFixtureSha256": sha256(SOURCE),
    }
    write_json(OUT_MANIFEST, manifest)
    return spec_sha, matrix_sha


if __name__ == "__main__":
    spec_sha, matrix_sha = generate()
    print(json.dumps({"renderSpecSha256": spec_sha, "compatibilityMatrixSha256": matrix_sha}, indent=2))
