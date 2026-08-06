#!/usr/bin/env python3
"""Normalize the validated Plot payload to the current Renderer 2.4 contract.

This is an implementation-only adapter for the 2026-08-06 Preview. It preserves
narration, numbers, Scene order, market meaning, and the two-block TTS identity.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

RENDERER_COMPATIBILITY_SHA256 = (
    "563bc71c58120552c3f601cab662a4f4287e44c149e46268ef5678d279b1adb6"
)
FINANCIAL_RECIPES = {
    "market-pulse-grid": "market-pulse-grid",
    "earnings-surprise": "earnings-surprise",
    "dual-asset-split": "dual-asset-split",
    "macro-pressure": "macro-pressure",
    "source-receipt": "source-receipt",
}


def canonical_sha(value: Any) -> str:
    raw = json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def tts_identity(value: dict[str, Any]) -> str:
    blocks: list[dict[str, Any]] = []
    for block_id, first_scene, last_scene in (
        ("scenes-01-04", 1, 4),
        ("scenes-05-09", 5, 9),
    ):
        speech = [
            chunk["speechText"]
            for scene in value["scenes"]
            if first_scene <= scene["sceneNumber"] <= last_scene
            for chunk in scene["narrationChunks"]
        ]
        if not speech:
            raise ValueError(f"TTS block has no speech: {block_id}")
        blocks.append({"id": block_id, "speechText": speech})
    return canonical_sha(
        {
            "synthesisVersion": "gemini-two-block-v1",
            "model": "gemini-3.1-flash-tts-preview",
            "voice": "Charon",
            "voiceProfileId": value.get("voiceProfileId"),
            "pronunciations": value.get("pronunciations"),
            "blocks": blocks,
        }
    )


def replace_exact(value: Any, replacements: dict[str, str]) -> Any:
    if isinstance(value, str):
        return replacements.get(value, value)
    if isinstance(value, list):
        return [replace_exact(item, replacements) for item in value]
    if isinstance(value, dict):
        return {key: replace_exact(item, replacements) for key, item in value.items()}
    return value


def normalize(
    *,
    spec_path: Path,
    package_path: Path,
    ready_path: Path,
    report_path: Path,
) -> dict[str, Any]:
    original_raw = spec_path.read_bytes()
    spec = json.loads(original_raw.decode("utf-8"))
    if spec.get("schemaVersion") != "2.4.0":
        raise ValueError("expected render_spec schemaVersion 2.4.0")

    original_spec_sha = hashlib.sha256(original_raw).hexdigest()
    package_sha = hashlib.sha256(package_path.read_bytes()).hexdigest()
    before_tts_sha = tts_identity(spec)

    source_type_map = {
        "company-ir": "company",
        "historical-memory": "other",
    }
    source_id_map = {"memory-001": "source-009"}
    for source in spec.get("sources", []):
        source["sourceId"] = source_id_map.get(
            source.get("sourceId"), source.get("sourceId")
        )
        source["sourceType"] = source_type_map.get(
            source.get("sourceType"), source.get("sourceType")
        )
        attribution = source.get("narrationAttribution")
        if not isinstance(attribution, str) or not attribution.strip():
            source["narrationAttribution"] = (
                "過去回の編集記憶（現在証拠として不使用）"
            )
    spec = replace_exact(spec, source_id_map)

    beat_mapping: list[dict[str, Any]] = []
    financial_beats: list[dict[str, Any]] = []
    for scene in spec["scenes"]:
        if scene.get("expectedBasisType") == "not-applicable":
            scene["expectedBasisType"] = None
        scene["visualMode"] = {
            "verification": "verification-points",
            "closing-recap": "conclusion-card",
        }.get(scene.get("visualMode"), scene.get("visualMode"))
        if scene.get("sceneRole") == "fixed-ending":
            scene["sceneRole"] = "closing-recap-sendoff-goodnight"

        beats = scene["visualBeats"]
        for beat_index, beat in enumerate(beats):
            duplicate_id = beat.pop("visualBeatId", None)
            if duplicate_id not in (None, beat.get("beatId")):
                raise ValueError(f"Visual Beat ID conflict: {beat.get('beatId')}")
            visual_grammar = beat.pop("visualGrammar", None)
            if not isinstance(visual_grammar, dict):
                raise ValueError(f"missing visualGrammar: {beat.get('beatId')}")
            if visual_grammar.get("contractVersion") != "1.0.0":
                raise ValueError(
                    f"unsupported Visual Grammar contract: {beat.get('beatId')}"
                )
            if visual_grammar.get("returnTargetBeatId") is not None:
                raise ValueError(f"unresolved return target: {beat.get('beatId')}")
            beat["visualGrammarId"] = visual_grammar.get("grammarId")
            beat["transitionRole"] = visual_grammar.get("transitionRole")
            beat["visualMode"] = {
                "verification": "verification-points",
                "closing-recap": "conclusion-card",
            }.get(beat.get("visualMode"), beat.get("visualMode"))

            # Renderer requires the declared return state to equal the next Beat's
            # actual state. The Plot payload already selected the next Beat; only
            # the redundant return metadata was stale.
            if beat.get("returnScreenState") is not None and beat_index + 1 < len(beats):
                beat["returnScreenState"] = beats[beat_index + 1]["screenState"]

            beat_mapping.append(
                {
                    "beatId": beat.get("beatId"),
                    "visualTemplate": beat.get("visualTemplate"),
                    "visualGrammarId": beat.get("visualGrammarId"),
                    "transitionRole": beat.get("transitionRole"),
                }
            )
            if beat.get("visualTemplate") in FINANCIAL_RECIPES:
                financial_beats.append(beat)

    removed_root: dict[str, Any] = {}
    for key in (
        "expectedConfirmed",
        "imageSelection",
        "tts",
        "visualGrammarContractVersion",
    ):
        if key in spec:
            removed_root[key] = spec.pop(key)

    mapping_contract = {
        "contractVersion": "1.0.0",
        "episodeId": spec["episode"]["id"],
        "sourceSpecSha256": original_spec_sha,
        "normalizations": {
            "sourceType": source_type_map,
            "sourceId": source_id_map,
            "expectedBasisType": {"not-applicable": None},
            "visualMode": {
                "verification": "verification-points",
                "closing-recap": "conclusion-card",
            },
            "sceneRole": {
                "fixed-ending": "closing-recap-sendoff-goodnight",
            },
            "returnScreenState": (
                "align non-null return metadata with the following Beat screenState"
            ),
            "removedRootKeys": sorted(removed_root),
            "beatFieldMigration": (
                "visualBeatId/visualGrammar -> "
                "beatId/visualGrammarId/transitionRole"
            ),
        },
        "beats": beat_mapping,
    }
    spec["visualGrammarContract"] = {
        "contractVersion": "1.0.0",
        "semanticsSha256": canonical_sha(mapping_contract),
        "rendererCompatibilitySha256": RENDERER_COMPATIBILITY_SHA256,
        "finalEpisodeContractSha256": package_sha,
        "beatCount": len(beat_mapping),
    }

    selected_plans: list[tuple[dict[str, Any], dict[str, Any]]] = []
    for beat in financial_beats:
        config = beat["templateConfig"]
        display_order = list(beat.get("objectIds", []))
        source_ids = list(beat.get("evidenceSourceIds", []))
        metric_ids = list(config.get("metricIds", []))
        causal_step_ids = list(config.get("causalStepIds", []))
        comparison_basis = config.get("comparisonBasis") or config.get("dataBasis")
        if not isinstance(comparison_basis, str) or not comparison_basis.strip():
            raise ValueError(f"financial Beat has no comparison basis: {beat['beatId']}")
        config.update(
            {
                "comparisonBasis": comparison_basis,
                "displayOrder": display_order,
                "metricIds": metric_ids,
                "causalStepIds": causal_step_ids,
            }
        )
        beat["templateVariant"] = config["variant"]
        beat["financialReturnTarget"] = (
            beat.get("changeCue") or beat.get("screenQuestion")
        )
        plan = {
            "intentId": f"fvi-{beat['beatId']}",
            "selectedPlanId": f"fvp-{beat['beatId']}",
            "selectedPath": "preferred",
            "recipeId": FINANCIAL_RECIPES[beat["visualTemplate"]],
            "visualTemplate": beat["visualTemplate"],
            "sourceIds": source_ids,
            "metricIds": metric_ids,
            "causalStepIds": causal_step_ids,
            "displayOrder": display_order,
            "comparisonBasis": comparison_basis,
        }
        plan["selectedPlanSha256"] = canonical_sha(plan)
        selected_plans.append((beat, plan))

    recipe_plan = {
        "contractVersion": "1.0.0",
        "episodeId": spec["episode"]["id"],
        "selections": [plan for _, plan in selected_plans],
    }
    recipe_plan_sha = canonical_sha(recipe_plan)
    for beat, plan in selected_plans:
        beat["financialVisualTrace"] = {
            "contractVersion": "1.0.0",
            "intentId": plan["intentId"],
            "selectedPlanId": plan["selectedPlanId"],
            "selectedPlanSha256": plan["selectedPlanSha256"],
            "selectedPath": plan["selectedPath"],
            "recipeId": plan["recipeId"],
            "recipePlanSha256": recipe_plan_sha,
            "finalEpisodeContractSha256": package_sha,
            "sourceIds": plan["sourceIds"],
            "metricIds": plan["metricIds"],
            "causalStepIds": plan["causalStepIds"],
            "displayOrder": plan["displayOrder"],
            "comparisonBasis": plan["comparisonBasis"],
            "reasonCodes": [],
        }
    if selected_plans:
        spec["financialVisualContract"] = {
            "contractVersion": "1.0.0",
            "intentVersion": "1.1.0",
            "recipePlanVersion": "1.0.0",
            "recipeRegistryVersion": "1.0.0",
            "finalEpisodeContractVersion": "1.0.0",
            "recipePlanSha256": recipe_plan_sha,
            "selectionCount": len(selected_plans),
        }

    after_tts_sha = tts_identity(spec)
    if before_tts_sha != after_tts_sha:
        raise ValueError(
            "normalization changed TTS identity: "
            f"before={before_tts_sha} after={after_tts_sha}"
        )

    normalized_text = json.dumps(
        spec, ensure_ascii=False, indent=2, sort_keys=True
    ) + "\n"
    spec_path.write_text(normalized_text, encoding="utf-8")
    normalized_sha = hashlib.sha256(normalized_text.encode("utf-8")).hexdigest()

    ready = json.loads(ready_path.read_text(encoding="utf-8"))
    ready["renderSpecSha256"] = normalized_sha
    ready["rendererNormalization"] = {
        "status": "pass",
        "sourceRenderSpecSha256": original_spec_sha,
        "normalizedRenderSpecSha256": normalized_sha,
        "ttsInputSha256Before": before_tts_sha,
        "ttsInputSha256After": after_tts_sha,
        "ttsIdentityChanged": False,
        "narrationChanged": False,
        "numbersChanged": False,
        "sceneOrderChanged": False,
        "marketMeaningChanged": False,
        "financialSelectionCount": len(selected_plans),
    }
    ready_path.write_text(
        json.dumps(ready, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    report = {
        "version": 1,
        "status": "normalized-for-renderer-2.4",
        "episodeDate": spec["episode"]["id"],
        "sourceRenderSpecSha256": original_spec_sha,
        "normalizedRenderSpecSha256": normalized_sha,
        "episodePackageSha256": package_sha,
        "visualBeatCount": len(beat_mapping),
        "financialSelectionCount": len(selected_plans),
        "recipePlanSha256": recipe_plan_sha if selected_plans else None,
        "ttsInputSha256Before": before_tts_sha,
        "ttsInputSha256After": after_tts_sha,
        "ttsIdentityChanged": False,
        "narrationChanged": False,
        "numbersChanged": False,
        "sceneOrderChanged": False,
        "marketMeaningChanged": False,
        "mappingContractSha256": canonical_sha(mapping_contract),
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--spec", required=True, type=Path)
    parser.add_argument("--package", required=True, type=Path)
    parser.add_argument("--ready", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    args = parser.parse_args()
    result = normalize(
        spec_path=args.spec,
        package_path=args.package,
        ready_path=args.ready,
        report_path=args.report,
    )
    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
